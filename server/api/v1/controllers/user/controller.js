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
import { contactUsServices } from "../../services/contactUs";
const { createContactUs, getAllContactUs, viewContactUs } = contactUsServices;
import config from "config";
const axios = require("axios");
const setuClient = axios.create({
  baseURL: config.get("SETU_BASE_URL"),
  headers: {
    "x-client-id": config.get("SETU_CLIENT_ID"),
    "x-client-secret": config.get("SETU_CLIENT_SECRET"),
    "Content-Type": "application/json",
  },
});

import {
  kycServices
} from "../../services/kycRequests";
const {
  createKyc,
  getKyc,
  updateKyc,
  kycAggSearch
} = kycServices;
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
      type: Joi.string().required(),
    };

    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
      const {
        email,
        mobileNumber,
        password,
        type
      } = validatedBody;

      /** ================= AT LEAST ONE REQUIRED ================= */
      if (!email && !mobileNumber) {
        throw apiError.badRequest("Email or mobile number is required");
      }

      if (email) {
        validatedBody.email = email.toLowerCase();
      }
      let typeEnum =["signup","login"]

      if(typeEnum.includes(validatedBody.type.toLowerCase())===false){
        throw apiError.badRequest("Invalid type value");
      }

let orConditions = [];

if (email) {
  orConditions.push({ email });
}

if (mobileNumber) {
  orConditions.push({ mobileNumber });
}

let qry={
  status: { $ne: status.DELETE },
  userType: userType.USER,
  ...(orConditions.length > 0 && { $or: orConditions })
}

/** ================= USER EXISTS CHECK ================= */
let userInfo = await findUser(qry);


      if (userInfo) {
        if (userInfo.otpVerified === true) {
          if (userInfo.status === status.BLOCK) {
            throw apiError.conflict(responseMessage.BLOCK_USER_EMAIL_BY_ADMIN);
          }

        }
      }

      if(type === "signup" && userInfo){
        throw apiError.conflict("User already exists");
      }else if(type === "login" && !userInfo){
        throw apiError.badRequest("User does not exist");
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
        // await commonFunction.sendEmailOtp(
        //   validatedBody.email,
        //   validatedBody.otp,
        //   validatedBody.firstName
        // );
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

      var token = await commonFunction.getToken({
        _id: result._id,
        email: result.email,
        userType: result.userType,
      });
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,        // 🔥 required
        sameSite: "none",    // 🔥 required
        path: "/",
        maxAge: 24 * 60 * 60 * 1000
      });





      let results = {
        _id: result._id,
        email: result.email,
        userType: result.userType,
        token : token
      };
await createNotification({
        userId: result._id,
        title: type === "signup" ? "Welcome to our platform!" : "Welcome back!",
        message: `You have successfully ${type === "signup" ? "signed up" : "logged in"}.`, 
})
      return res.json(
        new response(results, "OTP sent successfully. Please verify first.")
      );

    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
 * @swagger
 * /user/logout:
 *   post:
 *     tags:
 *       - USER
 *     description: Logout user (clear auth cookie)
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Returns logout success message
 */
async logout(req, res, next) {
  try {
    // ✅ clear cookie (same config as you set in signup)
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,        // must match
      sameSite: "none",    // must match
      path: "/",
    });

    return res.json(
      new response({}, "Logout successful ✅")
    );
  } catch (error) {
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
      password: Joi.string().optional(),
    };
    try {

      var results;

      var validatedBody = await Joi.validate(req.body, validationSchema);
      const {
        email,
        password
      } = validatedBody;
      let userResult = await findUser({
        $or: [{ email: email }, { mobileNumber: email }]
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
      if (!mobile && !email) {
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
        if (mobile) {

        } else {
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


      // var token = await commonFunction.getToken({
      //   _id: updateResult._id,
      //   email: updateResult.email,
      //   mobileNumber: updateResult.mobileNumber,
      //   userType: updateResult.userType,
      // });
      var obj = {
        _id: updateResult._id,
        name: updateResult.name,
        email: updateResult.email,
        countryCode: updateResult.countryCode,
        mobileNumber: updateResult.mobileNumber,
        otpVerified: true,
        // token: token,
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

  /**
   * @swagger
   * /user/pan/create:
   *   post:
   *     tags:
   *       - USER
   *     description: createPanKyc
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: pan
   *         description: pan
   *         in: query
   *         required: true
   *       - name: name
   *         description: name
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async createPanKyc(req, res, next) {
    try {
      let userData = await findUserData({ _id: req.userId });
      if (!userData) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let alreadyApplied = await getKyc({ status: "PENDING" });
      if (alreadyApplied) {
        throw apiError.badRequest("You have already applied for kyc");
      }
      // const referenceId = `user_${Date.now()}`;

      // const response = await setuClient.post("/api/kyc/pan", {
      //   reference_id: referenceId,
      //   redirect_url: "https://your-frontend.com/kyc-success",
      //   callback_url: "https://your-backend.com/api/v1/user/webhook/setu",
      // });

      await createKyc({  pan: req.query.pan, name: req.query.name });
      return res.json(
        new response({  }, "success")
      );
    } catch (error) {
      return next(error);
    }
  }


  async setuWebhook(req, res, next) {
    try {
      const payload = req.body;

      /*
        payload example:
        {
          reference_id,
          status: "SUCCESS" | "FAILED",
          pan,
          name
        }
      */
      let kycStatus = "PENDING";
      if (payload.status === "SUCCESS") {
        console.log("✅ PAN VERIFIED:", payload.pan);
        kycStatus = "APPROVED";
        // DB update -> kyc_status = VERIFIED
      } else {
        console.log("❌ KYC FAILED:", payload.reference_id);
        kycStatus = "REJECTED";
        // DB update -> kyc_status = REJECTED
      }
      await updateKyc({ referenceId: payload.reference_id }, { status: kycStatus });
      return res.json(
        new response({ received: true }, "success")
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/pan/status/:referenceId:
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
   *       - name: params
   *         description: params
   *         in: header
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async checkKycStatus(req, res, next) {
    try {
      const { referenceId } = req.params;

      const response = await setuClient.get(
        `/api/kyc / status / ${referenceId}`
      );
      return res.json(
        new response(response.data, "success")
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
     * @swagger
     * /user/kycList:
     *   get:
     *     tags:
     *       - USER
     *     description: get kycList
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: fromDate
     *         description: fromDate
     *         in: query
     *         required: false
     *       - name: toDate
     *         description: toDate
     *         in: query
     *         required: false
     *       - name: page
     *         description: page
     *         in: query
     *         required: false
     *       - name: limit
     *         description: limit
     *         in: query
     *         required: false
     *       - name: referenceId
     *         description: referenceId
     *         in: query
     *         required: false
     *       - name: status
     *         description: status
     *         in: query
     *         required: false
     *       - name: pan
     *         description: pan
     *         in: query
     *         required: false
     *       - name: search
     *         description: search
     *         in: query
     *         required: false
     *       - name: name
     *         description: name
     *         in: query
     *         required: false
     *       - name: userId
     *         description: userId
     *         in: query
     *         required: false
     *     responses:
     *       200:
     *         description: Data found successfully.
     *       404:
     *         description: Data not found.
     *       500:
     *         description: Internal Server Error
     *       501:
     *         description: Something went wrong!
     */

  async kycList(req, res, next) {
    const validationSchema = {
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
      referenceId: Joi.string().optional(),
      status: Joi.string().optional(),
      search: Joi.string().optional(),
      pan: Joi.string().optional(),
      name: Joi.string().optional(),
      userId: Joi.string().optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        status: {
          $ne: status.DELETE
        },
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      if (userResult.userType == "USER") {
        validatedBody.userId = userResult._id;
      }

      let kycData = await kycAggSearch(validatedBody);
      if (kycData.docs.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      return res.json(
        new response(kycData, responseMessage.DATA_FOUND)
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
     * @swagger
     * /user/editProfile:
     *   put:
     *     tags:
     *       - USER
     *     description: editProfile
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: firstName
     *         description: firstName
     *         in: formData
     *         required: false
     *       - name: lastName
     *         description: lastName
     *         in: formData
     *         required: false
     *       - name: email
     *         description: email
     *         in: formData
     *         required: false
     *       - name: address
     *         description: address
     *         in: formData
     *         required: false
     *       - name: budgetStart
     *         description: budgetStart
     *         in: formData
     *         required: false
     *       - name: budgetEnd
     *         description: budgetEnd
     *         in: formData
     *         required: false
     *       - name: preferredArea
     *         description: preferredArea
     *         in: formData
     *         required: false
     *       - name: profileImage
     *         description: profileImage
     *         in: formData
     *         required: false
     *     responses:
     *       200:
     *         description: Returns success message
     */
  async editProfile(req, res, next) {
    const validationSchema = {
      firstName: Joi.string().optional(),
      lastName: Joi.string().optional(),
      preferredArea: Joi.string().optional(),
      budgetStart: Joi.number().optional(),
      budgetEnd: Joi.number().optional(),
      email: Joi.string().optional(),
      address: Joi.string().optional(),
      profileImage: Joi.string().optional(),
    };
    try {
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      const validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({
        _id: req.userId,

        status: {
          $ne: status.DELETE,
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var result = await updateUser({
        _id: userResult._id,
      },
        validatedBody
      );
      return res.json(new response(result, responseMessage.USER_UPDATED));
    } catch (error) {
      return next(error);
    }
  }

  /**
 * @swagger
 * /user/contact-us:
 *   post:
 *     tags:
 *       - CONTACT US
 *     description: contactUs
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: name
 *         description: name
 *         in: formData
 *         required: true
 *       - name: email
 *         description: email
 *         in: formData
 *         required: true
 *       - name: mobileNumber
 *         description: mobileNumber
 *         in: formData
 *         required: false
 *       - name: message
 *         description: message
 *         in: formData
 *         required: true
 *     responses:
 *       200:
 *         description: Contact-Us data Saved successfully
 */

  async contactUs(req, res, next) {
    let validationSchema = {
      name: Joi.string().required(),
      email: Joi.string().optional(),
      mobileNumber: Joi.string().optional(),
      message: Joi.string().required(),
    }
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);

      var adminResult = await findUser({
        userType: userType.ADMIN,
        status: status.ACTIVE
      })
      if (!adminResult) {
        throw apiError.notFound("Admin not found");
      }


      var result = await createContactUs(validatedBody);
      // await commonFunction.sendMailContactus("support@arbique.com", validatedBody.name, validatedBody.email, validatedBody.message, validatedBody.mobileNumber,)
      // await commonFunction.sendMailContactusUser(validatedBody.email, validatedBody.name, validatedBody.message)
      return res.json(new response(result, responseMessage.CONTACT_US));
    } catch (error) {
      return next(error);
    }
  }


}
export default new userController();