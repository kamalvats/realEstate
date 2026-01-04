import Joi from "joi";
const speakeasy = require('speakeasy');
let qrcode = require('qrcode')
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import bcrypt from "bcryptjs";
import responseMessage from "../../../../../assets/responseMessage";
import commonFunction from "../../../../helper/util";
import status from "../../../../enums/status";
import userType from "../../../../enums/userType";
import {
  notificationServices
} from "../../services/notification";
const {
  createNotification,
  findNotification,
  updateNotification,
  multiUpdateNotification,
  notificationList,
  paginateNotification
} = notificationServices;

import {
  transactionServices
} from "../../services/transaction";
const {
  graphTransactionAggrigate,
  transactionCount,
  findTransactions
} = transactionServices;
import {
  userServices
} from "../../services/user";
import { create } from "../../../../models/static";
const {
  userCheck,
  checkUserExists,
  emailExist,
  createUser,
  userCount,
  findUser,
  findUserData,
  userFindList,
  updateUser,
  updateUserById,
  paginateSearch,
} = userServices;
import _ from "lodash";
import { activityServices } from "../../services/activity";
const { createActivity } = activityServices;
export class userController {

  /**
* @swagger
* /user/signup:
*   post:
*     tags:
*       - USER
*     description: signup
*     produces:
*       - application/json
*     parameters:
*       - name: signup
*         description: signup
*         in: body
*         required: true
*         schema:
*           $ref: '#/definitions/signup'
*     responses:
*       200:
*         description: Returns success message
*/
  async signup(req, res, next) {
    const validationSchema = {
      email: Joi.string().email().optional(),
      mobileNumber: Joi.string().optional(),
      referralCode: Joi.string().optional(),
      firstName: Joi.string().optional(),
      lastName: Joi.string().optional(),
      userName: Joi.string().optional(),
      password: Joi.string().allow("").optional(),
      confirmPassword: Joi.string().allow("").optional(),
    };

    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
      const {
        email,
        mobileNumber,
        password,
        confirmPassword,
      } = validatedBody;

      /** ================= AT LEAST ONE REQUIRED ================= */
      if (!email && !mobileNumber) {
        throw apiError.badRequest("Email or mobile number is required");
      }

      if (email) {
        validatedBody.email = email.toLowerCase();
      }

      /** ================= PASSWORD CHECK ================= */
      if (password !== confirmPassword) {
        throw apiError.conflict(responseMessage.PWD_NOT_MATCH);
      }

      /** ================= USER EXISTS CHECK ================= */
      let userInfo = await checkUserExists(email, mobileNumber);

      if (userInfo) {
        if (userInfo.otpVerified === true) {
          if (userInfo.status === status.BLOCK) {
            throw apiError.conflict(responseMessage.BLOCK_USER_EMAIL_BY_ADMIN);
          }
          throw apiError.conflict("User already exists");
        }
      }


      /** ================= OTP SETUP ================= */
      validatedBody.otp = "123456";
      // validatedBody.otp = await commonFunction.getOTP();
      validatedBody.otpExpireTime = new Date().getTime() + 300000;
      validatedBody.userType = userType.USER;

      if (password) {
        validatedBody.password = bcrypt.hashSync(password);
      }

      /** ================= SEND OTP ================= */
      if (email) {
        await commonFunction.sendEmailOtp(
          validatedBody.email,
          validatedBody.otp,
          validatedBody.firstName
        );
      }

      if (mobileNumber) {
        // Hook SMS service here
        // await commonFunction.sendMobileOtp(mobileNumber, validatedBody.otp);
      }

      /** ================= CREATE / UPDATE USER ================= */
      let result;
      if (userInfo) {
        result = await updateUser(
          { _id: userInfo._id },
          validatedBody
        );
      } else {
        result = await createUser(validatedBody);
      }

      result = _.omit(
        JSON.parse(JSON.stringify(result)),
        ["otp", "password", "base64", "secretGoogle", "emailotp2FA", "withdrawOtp"]
      );

      return res.json(new response(result, responseMessage.USER_CREATED));

    } catch (error) {
      console.log(error);
      return next(error);
    }
  }


  /**
   * @swagger
   * /user/login:
   *   post:
   *     tags:
   *       - USER
   *     description: login with email and password
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: login
   *         description: login
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/login'
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async login(req, res, next) {
    var validationSchema = {
      email: Joi.string().required(),
      password: Joi.string().required(),
    };
    try {
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      var results;

      var validatedBody = await Joi.validate(req.body, validationSchema);
      const {
        email,
        password
      } = validatedBody;
      let userResult = await findUser({
        email: email,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (!userResult.password) {
        throw apiError.notFound(responseMessage.RESET_PASSWORD);
      }
      if (userResult.status == status.BLOCK) {
        throw apiError.badRequest(responseMessage.BLOCK_BY_ADMIN);
      }
      if (userResult.status == status.DELETE) {
        throw apiError.badRequest(responseMessage.DELETE_BY_ADMIN);
      }
      var obj = {}

      if (userResult.otpVerified === false) {

        obj.otp = await commonFunction.getOTP(),
          obj.otpExpireTime = new Date().getTime() + 300000
        var result = await updateUser({
          _id: userResult._id,
        },
          obj
        )

        await commonFunction.sendEmailOtp(result.email, obj.otp, result.firstName);
        return res.json(new response({ otpVerified: false }, responseMessage.USER_CREATED));


      }

      if (!bcrypt.compareSync(password, userResult.password)) {
        throw apiError.conflict(responseMessage.INCORRECT_LOGIN);
      } else {
        var token = await commonFunction.getToken({
          _id: userResult._id,
          email: userResult.email,
          userType: userResult.userType,
        });
        results = {
          _id: userResult._id,
          email: email,
          userType: userResult.userType,
          token: token,
        };
      }
      return res.json(new response(results, responseMessage.LOGIN));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/uploadFile:
   *   post:
   *     tags:
   *       - UPLOAD-FILE
   *     description: uploadFile
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: uploaded_file
   *         description: uploaded_file
   *         in: formData
   *         type: file
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async uploadFile(req, res, next) {
    try {
      const {
        files
      } = req;
      console.log("fffffffff", files)
      if (files.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      const imageFiles = await commonFunction.getImageUrl(files);

      if (imageFiles) {
        let obj = {
          secure_url: imageFiles,
          original_filename: files[0].filename,
        };
        return res.json(new response(obj, responseMessage.UPLOAD_SUCCESS));
      }
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/getProfile:
   *   get:
   *     tags:
   *       - USER
   *     description: get his own profile details with getProfile API
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async getProfile(req, res, next) {
    try {
      let adminResult = await findUser({
        userType: userType.ADMIN,
        status: {
          $ne: status.DELETE,
        },
      });
      if (!adminResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let userResult = await findUser({
        _id: req.userId,
        status: {
          $ne: status.DELETE,
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      userResult = _.omit(JSON.parse(JSON.stringify(userResult)), ["otp", "password", "base64", "secretGoogle", "emailotp2FA", "withdrawOtp", "password"])
      return res.json(new response(userResult, responseMessage.USER_DETAILS));
    } catch (error) {
      return next(error);
    }
  }


  /**
   * @swagger
   * /user/graphDWUser:
   *   get:
   *     tags:
   *       - USER
   *     description: graphData User
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: data
   *         description: data
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async graphDWUser(req, res, next) {
    try {
      const user = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.ADMIN
        },
        status: status.ACTIVE
      });
      if (!user) throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      var m_names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

      var currentDay = new Date();
      let weekDataRes = []
      var daysOfWeek = [];
      let yearDataRes = []
      if (req.query.data == "MONTH" || req.query.data == "DAYS") {
        let days = 0
        if (req.query.data == 'MONTH') {
          days = 30
        } else {
          days = 60
        }
        var weekDate = new Date(new Date().getTime() - ((24 * Number(days)) * 60 * 60 * 1000));
        for (var d = new Date(weekDate); d <= currentDay; d.setDate(d.getDate() + 1)) {
          daysOfWeek.push(new Date(d));
        }

        for (let i = 0; i < daysOfWeek.length; i++) {
          let startTime = new Date(new Date(daysOfWeek[i]).toISOString().slice(0, 10))
          let lastTime = new Date(new Date(daysOfWeek[i]).toISOString().slice(0, 10) + 'T23:59:59.999Z');
          let [buy, withdraw, rejected] = await Promise.all([
            findTransactions({
              $and: [{
                createdAt: {
                  $gte: new Date(startTime)
                }
              },
              {
                createdAt: {
                  $lte: new Date(lastTime)
                }
              },
              {
                userId: user._id
              },
              {
                transactionType: "BUY"
              },
              {
                status: 'APPROVE'
              }
              ]
            }),
            findTransactions({
              $and: [{
                createdAt: {
                  $gte: new Date(startTime)
                }
              },
              {
                createdAt: {
                  $lte: new Date(lastTime)
                }
              },
              {
                userId: user._id
              },
              {
                transactionType: "WITHDRAW"
              },
              {
                status: 'APPROVE'
              }
              ]
            }),
            findTransactions({
              $and: [{
                createdAt: {
                  $gte: new Date(startTime)
                }
              },
              {
                createdAt: {
                  $lte: new Date(lastTime)
                }
              },
              {
                userId: user._id
              },
              {
                transactionType: "WITHDRAW"
              },
              {
                status: 'REJECT'
              }
              ]
            })
          ])
          let buyAmount = 0
          let withdrawAmount = 0
          let rejectedAmount = 0
          if (buy.length != 0) {
            buyAmount = buy.map(o => o.amount).reduce((a, c) => {
              return Number(a) + Number(c)
            });
          }
          if (withdraw.length != 0) {
            withdrawAmount = withdraw.map(o => o.amount).reduce((a, c) => {
              return Number(a) + Number(c)
            });
          }
          if (rejected.length != 0) {
            rejectedAmount = rejected.map(o => o.amount).reduce((a, c) => {
              return Number(a) + Number(c)
            });
          }
          let objDb = {
            buy: buyAmount,
            withdraw: withdrawAmount,
            rejected: rejectedAmount,
            date: daysOfWeek[i],
          }
          weekDataRes.push(objDb);
        }
        return res.json(new response(weekDataRes, responseMessage.DATA_FOUND));
      } else {
        for (let i = 0; i < 12; i++) {
          let dataRes = new Date().setMonth((new Date().getMonth() - i));
          var startTime = new Date(new Date(dataRes).getFullYear(), new Date(dataRes).getMonth(), 1);
          var lastTime = new Date(new Date(dataRes).getFullYear(), new Date(dataRes).getMonth() + 1, 0);
          let [buy, withdraw, rejected] = await Promise.all([
            findTransactions({
              $and: [{
                createdAt: {
                  $gte: new Date(startTime)
                }
              },
              {
                createdAt: {
                  $lte: new Date(lastTime)
                }
              },
              {
                userId: user._id
              },
              {
                transactionType: "BUY"
              },
              {
                status: 'APPROVE'
              }
              ]
            }),
            findTransactions({
              $and: [{
                createdAt: {
                  $gte: new Date(startTime)
                }
              },
              {
                createdAt: {
                  $lte: new Date(lastTime)
                }
              },
              {
                userId: user._id
              },
              {
                transactionType: "WITHDRAW"
              },
              {
                status: 'APPROVE'
              }
              ]
            }), findTransactions({
              $and: [{
                createdAt: {
                  $gte: new Date(startTime)
                }
              },
              {
                createdAt: {
                  $lte: new Date(lastTime)
                }
              },
              {
                userId: user._id
              },
              {
                transactionType: "WITHDRAW"
              },
              {
                status: 'REJECT'
              }
              ]
            })
          ])
          let buyAmount = 0
          let withdrawAmount = 0
          let rejectedAmount = 0
          if (buy.length != 0) {
            buyAmount = buy.map(o => o.amount).reduce((a, c) => {
              return Number(a) + Number(c)
            });
          }
          if (withdraw.length != 0) {
            withdrawAmount = withdraw.map(o => o.amount).reduce((a, c) => {
              return Number(a) + Number(c)
            });
          }
          if (rejected.length != 0) {
            rejectedAmount = rejected.map(o => o.amount).reduce((a, c) => {
              return Number(a) + Number(c)
            });
          }
          let objDb = {
            buy: buyAmount,
            withdraw: withdrawAmount,
            rejected: rejectedAmount,
            month: new Date(dataRes).getMonth() + 1,
            year: new Date(dataRes).getFullYear(),
            monthName: m_names[new Date(dataRes).getMonth()]
          }
          yearDataRes.push(objDb)

        }
        return res.json(new response(yearDataRes.reverse(), responseMessage.DATA_FOUND));
      }
    } catch (error) {
      return next(error);
    }
  }


  /**
   * @swagger
   * /user/deleteAccount:
   *   delete:
   *     tags:
   *       - USER MANAGEMENT
   *     description: deleteAccount
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: userId
   *         description: userId
   *         in: query
   *         required: true
   *       - name: reason
   *         description: reason
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async deleteAccount(req, res, next) {
    const validationSchema = {
      userId: Joi.string().required(),
      reason: Joi.string().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      let activeRes = await updateUser({
        _id: userResult._id
      }, {
        status: status.DELETE
      });
      return res.json(
        new response(activeRes, "Account deleted successfully")
      );

    } catch (error) {
      return next(error);
    }
  }


  /**
* @swagger
* /user/sendOtp:
*   post:
*     tags:
*       - USER
*     description: resend otp by user on plateform when he resend otp
*     produces:
*       - application/json
*     parameters:
*       - name: token
*         description: token
*         in: header
*         required: true
*       - name: email
*         description: email 
*         in: formData
*         required: false
*       - name: mobile
*         description: mobile 
*         in: formData
*         required: false
*     responses:
*       200:
*         description: OTP send successfully.
*       404:
*         description: This user does not exist.
*       500:
*         description: Internal Server Error
*       501:
*         description: Something went wrong!
*/
  async sendOtp(req, res, next) {
    var validationSchema = {
      email: Joi.string().optional(),
      mobile: Joi.string().optional(),
    };
    try {
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      var validatedBody = await Joi.validate(req.body, validationSchema);
      const {
        email,
        mobile
      } = validatedBody;
      if(!mobile && !email){
        throw apiError.badRequest("Please enter email or mobile number");
      }
      var userResult = await findUser({
        _id: req.userId,
        status: status.ACTIVE
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      } else {
        var otp = await commonFunction.getOTP();
        var newOtp = otp;
        var time = Date.now() + 180000;
        if(mobile){

        }else{
          await commonFunction.sendEmailOtp(email, otp, userResult.walletAddress);
        }
        var updateResult = await updateUser({
          _id: userResult._id,
        }, {
          $set: {
            otp: newOtp,
            otpExpireTime: time,
          },
        });
        updateResult = _.omit(JSON.parse(JSON.stringify(updateResult)), ["otp", "password", "base64", "secretGoogle", "emailotp2FA", "withdrawOtp", "password"])

        return res.json(new response(updateResult, responseMessage.OTP_SEND));
      }
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }
  /**
* @swagger
* /user/verifyOTP:
*   patch:
*     tags:
*       - USER
*     description: verifyOTP
*     produces:
*       - application/json
*     parameters:
*       - name: token
*         description: token
*         in: header
*         required: true
*       - name: otp
*         description: otp 
*         in: formData
*         required: true
*     responses:
*       200:
*         description: Returns success message
*/
  async verifyOTP(req, res, next) {
    var validationSchema = {
      otp: Joi.string().required(),
    };
    try {
      var validatedBody = await Joi.validate(req.body, validationSchema);
      const {
        email,
        otp,
      } = validatedBody;


      var userResult = await findUserData({
        _id: req.userId,
        status: status.ACTIVE
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      if (new Date().getTime() > userResult.otpExpireTime) {
        throw apiError.badRequest(responseMessage.OTP_EXPIRED);
      }
      if (userResult.otp != otp) {
        throw apiError.badRequest(responseMessage.INCORRECT_OTP);
      }
      var updateResult = await updateUser({
        _id: userResult._id,
      }, {
        otpVerified: true,
      });


      var token = await commonFunction.getToken({
        _id: updateResult._id,
        email: updateResult.email,
        mobileNumber: updateResult.mobileNumber,
        userType: updateResult.userType,
      });
      var obj = {
        _id: updateResult._id,
        name: updateResult.name,
        email: updateResult.email,
        countryCode: updateResult.countryCode,
        mobileNumber: updateResult.mobileNumber,
        otpVerified: true,
        token: token,
      };
      return res.json(new response(obj, responseMessage.OTP_VERIFY));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

    /**
   * @swagger
   * /user/resendOtp:
   *   post:
   *     tags:
   *       - USER
   *     description: resend otp by user on plateform when he resend otp
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: resendOtp
   *         description: resendOtp
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/resendOtp'
   *     responses:
   *       200:
   *         description: OTP send successfully.
   *       404:
   *         description: This user does not exist.
   *       500:
   *         description: Internal Server Error
   *       501:
   *         description: Something went wrong!
   */
  async resendOtp(req, res, next) {
    var validationSchema = {
      email: Joi.string().optional(),
      mobileNumber: Joi.string().optional(),
    };
    try {
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      var validatedBody = await Joi.validate(req.body, validationSchema);
      const {
        email,
        mobileNumber
      } = validatedBody;
       let userResult = await checkUserExists(email, mobileNumber);
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      } else {
        var otp = await commonFunction.getOTP();
        var newOtp = otp;
        var time = Date.now() + 180000;
        await commonFunction.sendEmailOtp(userResult.email, otp, userResult.firstName);
        var updateResult = await updateUser({
          _id: userResult._id,
        }, {
          $set: {
            otp: newOtp,
            otpExpireTime: time,
          },
        });
        updateResult = _.omit(JSON.parse(JSON.stringify(updateResult)), ["otp", "password", "base64", "secretGoogle", "emailotp2FA", "withdrawOtp", "password"])

        return res.json(new response(updateResult, responseMessage.OTP_SEND));
      }
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }


}
export default new userController();