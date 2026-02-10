import Joi from "joi";
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import bcrypt from "bcryptjs";
import responseMessage from "../../../../../assets/responseMessage";
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
  paginateNotification,
  deleteAllNotification
} = notificationServices;
import {
  userServices
} from "../../services/user";
const {
  userCheck,
  checkUserExists,
  emailExist,
  userCount,
  userCountGraph,
  createUser,
  findUser,
  findUserData,
  userFindList,
  updateUser,
  updateAll,
  updateUserById,
  paginateSearch,
  multiUpdateLockedBal
} = userServices;
import {
  transactionServices
} from "../../services/transaction";
const {
  transactionCount,
  findTransactions,
  createTransaction,
  updateManyTransaction,
  updateTransaction
} = transactionServices;
import commonFunction from "../../../../helper/util";
import _ from "lodash";
import { activityServices } from "../../services/activity";
const { createActivity } = activityServices;
import { createTransport } from "nodemailer";
export class adminController {
  /**
   * @swagger
   * /admin/login:
   *   post:
   *     tags:
   *       - ADMIN
   *     description: Admin login with email and Password
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
      var userResult = await findUser({
        $and: [{
          status: {
            $ne: status.DELETE
          }
        },
        {
          userType: {
            $ne: userType.USER
          }
        },
        {
          $or: [{
            mobileNumber: email
          }, {
            email: email
          }]
        },
        ],
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (!bcrypt.compareSync(password, userResult.password)) {
        throw apiError.conflict(responseMessage.INCORRECT_LOGIN);
      } else {

        var obj = {}
        //  obj.otp = await commonFunction.getOTP(),
         obj.otp = "123456",
          obj.otpExpireTime = new Date().getTime() + 300000
        var result = await updateUser({
          _id: userResult._id,
        },
          obj
        )

        // await commonFunction.sendEmailOtp(result.email, obj.otp, result.firstName);
        
        // var token = await commonFunction.getToken({
        //   _id: userResult._id,
        //   email: userResult.email,
        //   mobileNumber: userResult.mobileNumber,
        //   userType: userResult.userType,
        // });
        results = {
          _id: userResult._id,
          email: email,
          userType: userResult.userType,
          // token: token,
        };
      }
      //  res.cookie("token", token, {
      //   httpOnly: true,
      //   secure: true,        // 🔥 required
      //   sameSite: "none",    // 🔥 required
      //   path: "/",
      //   maxAge: 24 * 60 * 60 * 1000
      // });
      return res.json(new response(results, "Otp send to your email. Please verify and login."));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/getProfile:
   *   get:
   *     tags:
   *       - ADMIN
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
        _id: req.userId,
        userType: {
          $ne: userType.USER
        },
        status: {
          $ne: status.DELETE
        },
      });
      if (!adminResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      adminResult = _.omit(JSON.parse(JSON.stringify(adminResult)), ["otp", "password", "base64", "secretGoogle", "emailotp2FA", "withdrawOtp", "password"])

      return res.json(new response(adminResult, responseMessage.USER_DETAILS));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/editProfile:
   *   put:
   *     tags:
   *       - ADMIN
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
   *       - name: lowBalanceAlert
   *         description: lowBalanceAlert
   *         in: formData
   *         required: false
   *       - name: campaignEndAlert
   *         description: campaignEndAlert
   *         in: formData
   *         required: false
   *       - name: newCampaignAlert
   *         description: newCampaignAlert
   *         in: formData
   *         required: false
   *       - name: claimReminder
   *         description: claimReminder
   *         in: formData
   *         required: false
   *       - name: socialUpdates
   *         description: socialUpdates
   *         in: formData
   *         required: false
   *       - name: socialEmail
   *         description: socialEmail
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
      lowBalanceAlert: Joi.boolean().optional(),
      campaignEndAlert: Joi.boolean().optional(),
      newCampaignAlert: Joi.boolean().optional(),
      claimReminder: Joi.boolean().optional(),
      socialUpdates: Joi.boolean().optional(),
      socialEmail: Joi.boolean().optional(),
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
   * /admin/forgotPassword:
   *   post:
   *     tags:
   *       - ADMIN
   *     description: forgotPassword by ADMIN on plateform when he forgot password
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: forgotPassword
   *         description: forgotPassword
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/forgotPassword'
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async forgotPassword(req, res, next) {
    var validationSchema = {
      email: Joi.string().required(),
    };
    try {
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      var validatedBody = await Joi.validate(req.body, validationSchema);
      const {
        email
      } = validatedBody;
      var userResult = await findUser({
        $and: [{
          status: {
            $ne: status.DELETE
          }
        },
        {
          userType: {
            $ne: userType.USER
          },
        },
        {
          $or: [{
            mobileNumber: email
          }, {
            email: email
          }]
        },
        ],
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      } else {
        // var otp = commonFunction.getOTP();
        var otp = "123456"

        var newOtp = otp;
        var time = Date.now() + 180000;
        // await commonFunction.sendEmailForgotPassOtp(userResult.email, otp, userResult.firstName);
        var updateResult = await updateUser({
          _id: userResult._id
        }, {
          $set: {
            otp: newOtp,
            otpExpireTime: time
          }
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
   * /admin/verifyOTP:
   *   patch:
   *     tags:
   *       - ADMIN
   *     description: verifyOTP
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: verifyOTP
   *         description: verifyOTP
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/verifyOTP'
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
  async verifyOTP(req, res, next) {
    var validationSchema = {
      email: Joi.string().required(),
      otp: Joi.string().required(),
    };
    try {
      var validatedBody = await Joi.validate(req.body, validationSchema);
      const {
        email,
        otp
      } = validatedBody;
      let userResult = await findUser({
        email: email,
        userType: {
          $ne: userType.USER
        },
        status: status.ACTIVE
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      if (new Date().getTime() > userResult.otpExpireTime) {
        throw apiError.badRequest(responseMessage.OTP_EXPIRED);
      }


      // if (userResult.otp != otp) {
      //   throw apiError.badRequest(responseMessage.INCORRECT_OTP);
      // }
      var updateResult = await updateUser({
        _id: userResult._id
      }, {
        otpVerified: true
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
       res.cookie("token", token, {
        httpOnly: true,
        secure: true,        // 🔥 required
        sameSite: "none",    // 🔥 required
        path: "/",
        maxAge: 24 * 60 * 60 * 1000
      });
      return res.json(new response(obj, responseMessage.OTP_VERIFY));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/resendOtp:
   *   post:
   *     tags:
   *       - ADMIN
   *     description: resend otp by ADMIN on plateform when he resend otp
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
   *         description: Returns success message
   */
  async resendOtp(req, res, next) {
    var validationSchema = {
      email: Joi.string().required(),
    };
    try {
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      var validatedBody = await Joi.validate(req.body, validationSchema);
      const {
        email
      } = validatedBody;
      var userResult = await findUser({
        $and: [{
          status: {
            $ne: status.DELETE
          }
        },
        {
          userType: {
            $ne: userType.USER
          },
        },
        {
          // $or: [{
          //   mobileNumber: email
          // }, {
          //   email: email
          // }]
        },
        ],
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      } else {
        // var otp = commonFunction.getOTP();
        var otp = "123456"
        var newOtp = otp;
        var time = Date.now() + 180000;
        // await commonFunction.sendEmailForgotPassOtp(userResult.email, otp, userResult.firstName);
        var updateResult = await updateUser({
          _id: userResult._id
        }, {
          $set: {
            otp: newOtp,
            otpExpireTime: time
          }
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
   * /admin/changePassword:
   *   patch:
   *     tags:
   *       - ADMIN
   *     description: changePassword
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: changePassword
   *         description: changePassword
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/changePassword'
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async changePassword(req, res, next) {
    const validationSchema = {
      oldPassword: Joi.string().required(),
      newPassword: Joi.string().required(),
    };
    try {
      let validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER
        },
        status: {
          $ne: status.DELETE
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (!bcrypt.compareSync(validatedBody.oldPassword, userResult.password)) {
        throw apiError.badRequest(responseMessage.PWD_NOT_MATCH);
      }
      let updated = await updateUserById(userResult._id, {
        password: bcrypt.hashSync(validatedBody.newPassword),
      });
      updated = _.omit(JSON.parse(JSON.stringify(updated)), ["otp", "password", "base64", "secretGoogle", "emailotp2FA", "withdrawOtp", "password"])

      return res.json(new response(updated, responseMessage.PWD_CHANGED));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/resetPassword:
   *   post:
   *     tags:
   *       - ADMIN
   *     description: resetPassword
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: false
   *       - name: resetPassword
   *         description: resetPassword
   *         in: body
   *         required: false
   *         schema:
   *           $ref: '#/definitions/resetPassword'
   *     responses:
   *       200:
   *         description: Your password has been successfully changed.
   *       404:
   *         description: This user does not exist.
   *       422:
   *         description: Password not matched.
   *       500:
   *         description: Internal Server Error
   *       501:
   *         description: Something went wrong!
   */
  async resetPassword(req, res, next) {
    const validationSchema = {
      email: Joi.string().required(),
      password: Joi.string().required(),
      confirmPassword: Joi.string().required(),
    };
    try {
      const {
        email,
        password,
        confirmPassword
      } = await Joi.validate(
        req.body,
        validationSchema
      );
      var userResult = await findUser({
        email: email,
        userType: {
          $ne: userType.USER
        },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      } else {
        if (password == confirmPassword) {
          let update = await updateUser({
            _id: userResult._id
          }, {
            password: bcrypt.hashSync(password)
          });
          update = _.omit(JSON.parse(JSON.stringify(update)), ["otp", "password", "base64", "secretGoogle", "emailotp2FA", "withdrawOtp", "password"])
          // await commonFunction.sendEmailForPasswordResetSuccess(userResult.email, userResult.firstName);

          return res.json(new response(update, responseMessage.PWD_CHANGED));
        } else {
          throw apiError.notFound(responseMessage.PWD_NOT_MATCH);
        }
      }
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/userList:
   *   get:
   *     tags:
   *       - USER MANAGEMENT
   *     description: get his own profile details with userList API
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: search
   *         description: search
   *         in: query
   *         required: false
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
   *       - name: userType1
   *         description: userType1
   *         in: query
   *         required: false
   *       - name: status1
   *         description: status1
   *         in: query
   *         required: false
   *       - name: isKol
   *         description: isKol
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Users found successfully.
   *       404:
   *         description: Users not found.
   *       500:
   *         description: Internal Server Error
   *       501:
   *         description: Something went wrong!
   */
  async userList(req, res, next) {
    const validationSchema = {
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
      userType1: Joi.string().optional(),
      status1: Joi.string().optional(),
      isKol: Joi.string().optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);
      let adminResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER
        },
        status: status.ACTIVE,
      });
      if (!adminResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      // validatedBody.userType1 = userType.USER
      let userResult = await paginateSearch(validatedBody);
      if (userResult.docs.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      return res.json(new response(userResult, responseMessage.USERS_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/viewUser:
   *   get:
   *     tags:
   *       - USER MANAGEMENT
   *     description: get particular user data
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
   *     responses:
   *       200:
   *         description: User found successfully.
   *       404:
   *         description: User not found.
   *       500:
   *         description: Internal Server Error
   *       501:
   *         description: Something went wrong!
   */
  async viewUser(req, res, next) {
    const validationSchema = {
      userId: Joi.string().required(),
    };
    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);
      let adminResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER
        },
        status: status.ACTIVE,
      });
      if (!adminResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      let userResult = await findUser({
        _id: validatedBody.userId,
        userType: {
          $ne: userType.ADMIN
        },
        status: {
          $ne: status.DELETE
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
   * /admin/activeBlockUser:
   *   put:
   *     tags:
   *       - USER MANAGEMENT
   *     description: activeBlockUser
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
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async activeBlockUser(req, res, next) {
    const validationSchema = {
      userId: Joi.string().required(),
      reason: Joi.string().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER
        },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      var userInfo = await findUser({
        _id: validatedBody.userId,
        userType: {
          $ne: userType.ADMIN
        },
        status: {
          $ne: status.DELETE
        },
      });
      if (!userInfo) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (userInfo.status == status.ACTIVE) {
        let blockRes = await updateUser({
          _id: userInfo._id
        }, {
          status: status.BLOCK
        });

        // let sendMail = await commonFunction.sendMailForBlock(blockRes.email, blockRes.firstName, validatedBody.reason)
        let activityObj = {
          userId: userInfo._id,
          adminId: userResult._id,
          type: "BLOCK USER"
        }
        // await createAdminActivity(activityObj)
        return res.json(
          new response(blockRes, responseMessage.BLOCK_USER_BY_ADMIN)
        );
      } else {
        let activeRes = await updateUser({
          _id: userInfo._id
        }, {
          status: status.ACTIVE
        });

        // let sendMail = await commonFunction.sendMailForUnblock(activeRes.email, activeRes.firstName,)
        let activityObj = {
          userId: userInfo._id,
          adminId: userResult._id,
          type: "UNBLOCK USER"
        }
        // await createAdminActivity(activityObj)
        return res.json(
          new response(activeRes, responseMessage.UNBLOCK_USER_BY_ADMIN)
        );
      }
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/deleteUser:
   *   delete:
   *     tags:
   *       - USER MANAGEMENT
   *     description: deleteUser
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
  async deleteUser(req, res, next) {
    const validationSchema = {
      userId: Joi.string().required(),
      reason: Joi.string().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER
        },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      var userInfo = await findUser({
        _id: validatedBody.userId,
        userType: {
          $ne: userType.ADMIN
        },
        status: {
          $ne: status.DELETE
        },
      });
      if (!userInfo) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let activeRes = await updateUser({
        _id: userInfo._id
      }, {
        status: status.DELETE
      });
      validatedBody.reason = "Violation of Company Terms and Conditions"
      let activityObj = {
        userId: userInfo._id,
        adminId: userResult._id,
        type: "DELETE USER"
      }
      // await createAdminActivity(activityObj)
      // let sendMail = await commonFunction.sendMailForDelete(activeRes.email, activeRes.firstName)
      return res.json(
        new response(activeRes, responseMessage.DELETE_USER_BY_ADMIN)
      );

    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/editUserProfile:
   *   put:
   *     tags:
   *       - USER
   *     description: editUserProfile
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: profilePic
   *         description: profilePic
   *         in: formData
   *         required: false
   *       - name: bannerPic
   *         description: bannerPic
   *         in: formData
   *         required: false
   *       - name: email
   *         description: email
   *         in: formData
   *         required: false
   *       - name: userId
   *         description: userId
   *         in: formData
   *         required: false
   *       - name: wallet
   *         description: wallet
   *         in: formData
   *         required: false
   *       - name: firstName
   *         description: firstName
   *         in: formData
   *         required: false
   *       - name: lastName
   *         description: lastName
   *         in: formData
   *         required: false
   *       - name: userName
   *         description: userName
   *         in: formData
   *         required: false
   *       - name: bio
   *         description: bio
   *         in: formData
   *         required: false
   *       - name: email2FA
   *         description: email2FA
   *         in: formData
   *         required: false
   *       - name: google2FA
   *         description: google2FA
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async editUserProfile(req, res, next) {
    const validationSchema = {
      google2FA: Joi.boolean().optional(),
      email2FA: Joi.boolean().optional(),
      email: Joi.string().optional(),
      userId: Joi.string().optional(),
      firstName: Joi.string().optional(),
      wallet: Joi.string().allow("").optional(),
      lastName: Joi.string().optional(),
      userName: Joi.string().optional(),
      bio: Joi.string().allow("").optional(),
      profilePic: Joi.string().allow("").optional(),
      bannerPic: Joi.string().allow("").optional(),
    };
    try {
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      const validatedBody = await Joi.validate(req.body, validationSchema);

      let adminResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER
        },
        status: {
          $ne: status.DELETE,
        },
      });
      if (!adminResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let user = await findUser({
        _id: validatedBody.userId
      })
      if (!user) {
        throw apiError.conflict(responseMessage.EMAIL_EXIST);
      }

      if (validatedBody.profilePic) {
        validatedBody.profilePic = await commonFunction.getSecureUrl(
          validatedBody.profilePic
        );
      }
      if (validatedBody.bannerPic) {
        validatedBody.bannerPic = await commonFunction.getSecureUrl(
          validatedBody.bannerPic
        );
      }
      if (validatedBody.wallet != user.wallet) {
        let activityObj = {
          userId: user._id,
          adminId: adminResult._id,
          type: "WALLET UPDATE"
        }
        // await createAdminActivity(activityObj)
      }
      if (validatedBody.email2FA != user.email2FA) {
        let activityObj = {
          userId: user._id,
          adminId: adminResult._id,
          type: "email2FA UPDATE"
        }
        // await createAdminActivity(activityObj)
      }
      if (validatedBody.google2FA != user.google2FA) {
        let activityObj = {
          userId: user._id,
          adminId: adminResult._id,
          type: "google2FA UPDATE"
        }
        // await createAdminActivity(activityObj)
      }
      var result = await updateUserById({
        _id: user._id,
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
   * /admin/dashBoard:
   *   get:
   *     tags:
   *       - ADMIN
   *     description: activeBlockUser
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
  async dashBoard(req, res, next) {
    try {
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER
        },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }

      // let userCounts = await userCount({});

      let [totalUser, activeUser, blockUser, totalSubAdmin, activeSubAdmin, blockSubAdmin] = await Promise.all([
        userCountGraph({ status: { $ne: status.DELETE }, userType: userType.USER }),
        userCountGraph({ status: status.ACTIVE, userType: userType.USER }),
        userCountGraph({ status: status.BLOCK, userType: userType.USER }),
        // findUserCount({ status: { $ne: status.DELETE }, userType: userType.SUBADMIN }),
        // findUserCount({ status: status.ACTIVE, userType: userType.SUBADMIN }),
        // findUserCount({ status: status.BLOCK, userType: userType.SUBADMIN })
      ])
      let obj = {
        totalUser: totalUser,
        activeUser: activeUser,
        blockUser: blockUser,
        // totalSubAdmin: totalSubAdmin,
        // activeSubAdmin: activeSubAdmin,
        // blockSubAdmin: blockSubAdmin
      }

      return res.json(new response(obj, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/graphDW:
   *   get:
   *     tags:
   *       - ADMIN
   *     description: graphData
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: data
   *         description: data (MONTH/DAYS/YEARS)
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async graphDW(req, res, next) {
    try {
      const user = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER
        },
        status: status.ACTIVE
      });
      if (!user) throw apiError.notFound(responseMessage.USER_NOT_FOUND);

      var currentDay = new Date();
      var m_names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
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
            })
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




  //***********************SUBADMIN */

  /**
   * @swagger
   * /admin/addSubAdmin:
   *   post:
   *     tags:
   *       - SUBADMIN
   *     summary: add Subadmin
   *     description: addSubAdmin
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
   *         required: true
   *       - name: firstName
   *         description: firstName
   *         in: formData
   *         required: true
   *       - name: lastName
   *         description: lastName
   *         in: formData
   *         required: false
   *       - name: permissions
   *         description: Permissions 
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: SubAdmin created successfully
   */
  async addSubAdmin(req, res, next) {
    let validationSchema = {
      email: Joi.string().required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().optional(),
      permissions: Joi.array().optional()

    }
    try {
      let validatedBody = await Joi.validate(req.body, validationSchema);
      let adminResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER
        },
        status: status.ACTIVE,
      });

      if (!adminResult) throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      let userResult = await findUser({
        email: validatedBody.email,
        status: {
          $ne: status.DELETE
        }
      });
      if (userResult) {
        throw apiError.conflict(responseMessage.USER_ALREADY_EXIST)
      }
      let pass = await commonFunction.generateTempPassword()
      validatedBody.userType = userType.SUBADMIN
      validatedBody.password = bcrypt.hashSync(pass);
      validatedBody.otpVerified = true

      var result = await createUser(validatedBody)
      // let sendMail = await commonFunction.sendMailForSubAdmin(result.email, result.firstName, pass, adminResult.email)
      let obj = {
        userId: result._id,
        email: result.email,
        userType: result.userType,
        status: result.status,
        permission: result.permissions
      }
      let activityObj = {
        userId: result._id,
        adminId: adminResult._id,
        type: "ADD SUB_ADMIN"
      }
      // await createAdminActivity(activityObj)
      return res.json(new response(obj, responseMessage.SUBADMIN_ADDED));

    } catch (error) {
      return next(error);
    }
  }


  /**
   * @swagger
   * /admin/listSubAdmin:
   *   get:
   *     tags:
   *       - SUBADMIN
   *     description: listSubAdmin
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: status
   *         description: status i.e ACTIVE || BLOCK
   *         in: query
   *       - name: search
   *         description: search i.e by WalletAddress || email || mobileNumber || userName
   *         in: query
   *         required: false
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
   *         type: integer
   *         required: false
   *       - name: limit
   *         description: limit
   *         in: query
   *         type: integer
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async listSubAdmin(req, res, next) {
    const validationSchema = {
      status: Joi.string().optional(),
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER
        },
        status: status.ACTIVE,
      });
      if (userResult.length == 0) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      validatedBody.userType1 = userType.SUBADMIN
      let dataResults = await paginateSearch(validatedBody);
      if (dataResults.docs.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      return res.json(new response(dataResults, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/blockUnblockSubAdmin:
   *   put:
   *     tags:
   *       - SUBADMIN
   *     description: blockUnblockSubAdmin
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
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async blockUnblockSubAdmin(req, res, next) {
    const validationSchema = {
      userId: Joi.string().required(),
      reason: Joi.string().optional()
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER
        },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var userInfo = await findUser({
        _id: validatedBody.userId,
        status: {
          $ne: status.DELETE
        }
      });
      if (!userInfo) {
        throw apiError.notFound(responseMessage.US);
      }
      if (userInfo.status == status.ACTIVE) {
        let blockRes = await updateUser({
          _id: userInfo._id
        }, {
          status: status.BLOCK
        });
        let activityObj = {
          userId: userInfo._id,
          adminId: userResult._id,
          type: "BLOCK SUB_ADMIN"
        }
        // await createAdminActivity(activityObj)
        // let sendMail = await commonFunction.sendMailForBlock(blockRes.email, blockRes.firstName,)
        return res.json(new response(blockRes, responseMessage.BLOCK_BY_ADMIN));
      } else {
        let activeRes = await updateUser({
          _id: userInfo._id
        }, {
          status: status.ACTIVE
        });
        let activityObj = {
          userId: userInfo._id,
          adminId: userResult._id,
          type: "UNBLOCK SUB_ADMIN"
        }
        // await createAdminActivity(activityObj)
        // let sendMail = await commonFunction.sendMailForUnblock(activeRes.email, activeRes.firstName,)
        return res.json(new response(activeRes, responseMessage.UNBLOCK_BY_ADMIN));
      }

    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/deleteSubAdmin:
   *   delete:
   *     tags:
   *       - SUBADMIN
   *     description: deleteSubAdmin
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
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async deleteSubAdmin(req, res, next) {
    const validationSchema = {
      userId: Joi.string().required(),
      reason: Joi.string().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER
        },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      var userInfo = await findUser({
        _id: validatedBody.userId,
        userType: {
          $ne: userType.ADMIN
        },
        status: {
          $ne: status.DELETE
        },
      });
      if (!userInfo) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let activeRes = await updateUser({
        _id: userInfo._id
      }, {
        status: status.DELETE
      });
      validatedBody.reason = "Violation of Company Terms and Conditions"
      // let sendMail = await commonFunction.sendMailForDelete(activeRes.email, activeRes.firstName)
      let activityObj = {
        userId: userInfo._id,
        adminId: userResult._id,
        type: "DELETE SUB_ADMIN"
      }
      // await createAdminActivity(activityObj)
      return res.json(
        new response(activeRes, responseMessage.DELETE_USER_BY_ADMIN)
      );

    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/editProfileSubAdmin:
   *   put:
   *     tags:
   *       - ADMIN
   *     description: editProfileSubAdmin
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: profilePic
   *         description: profilePic
   *         in: formData
   *         required: false
   *       - name: id
   *         description: id
   *         in: formData
   *         required: true
   *       - name: email
   *         description: email
   *         in: formData
   *         required: true
   *       - name: firstName
   *         description: firstName
   *         in: formData
   *         required: true
   *       - name: lastName
   *         description: lastName
   *         in: formData
   *         required: true
   *       - name: permissions
   *         description: Permissions 
   *         in: formData
   *         required: true
   *         type: array
   *         items:
   *           type: string
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async editProfileSubAdmin(req, res, next) {
    const validationSchema = {
      email: Joi.string().optional(),
      firstName: Joi.string().optional(),
      lastName: Joi.string().optional(),
      profilePic: Joi.string().optional(),
      id: Joi.string().required(),
      permissions: Joi.array().required()
    };
    try {
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      const validatedBody = await Joi.validate(req.body, validationSchema);
      let adminResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER
        },
        status: {
          $ne: status.DELETE,
        },
      });
      if (!adminResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let userResult = await findUser({
        _id: validatedBody.id,
        userType: userType.SUBADMIN
      })

      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let userExist = await emailExist(validatedBody.email, userResult._id);

      if (userExist) {
        throw apiError.conflict(responseMessage.EMAIL_EXIST);
      }

      if (validatedBody.profilePic) {
        validatedBody.profilePic = await commonFunction.getSecureUrl(
          validatedBody.profilePic
        );
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
   * /admin/graphForUser:
   *   get:
   *     tags:
   *       - ADMIN
   *     description: graphForUser
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: data
   *         description: data (MONTH/DAYS/YEARS)
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async graphForUser(req, res, next) {
    try {
      const admin = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER
        },
        status: status.ACTIVE
      });
      if (!admin) throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      var currentDay = new Date();
      var m_names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
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
          let [totalUser] = await Promise.all([
            userCountGraph({
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
                otpVerified: true
              }
              ]
            }),
          ])
          let objDb = {
            totalUser: totalUser,
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
          let [totalUser] = await Promise.all([
            userCountGraph({
              $and: [{
                createdAt: {
                  $gte: new Date(startTime)
                }
              },
              {
                createdAt: {
                  $lte: new Date(lastTime)
                }
              }, {
                otpVerified: true
              }
              ]
            }),
          ])

          let objDb = {
            totalUser,
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
 * /admin/contact-us/reply/{id}:
 *   put:
 *     tags:
 *       - USER MANAGEMENT
 *     description: replyContactUs
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: token
 *         description: token
 *         in: header
 *         required: true
 *       - name: id
 *         description: id
 *         in: path
 *         required: true
 *       - name: message
 *         description: message
 *         in: query
 *         required: false
 *     responses:
 *       200:
 *         description: Returns success message
 */
    async replyContactUs(req, res, next) {
        const validationSchema = {
            id: Joi.string().required(),
            message: Joi.string().optional(),
        };
        try {
            let { id } = req.params
            const validatedBody = await Joi.validate({ id, ...req.query }, validationSchema);
            let adminResult = await findUser({
                _id: req.userId,
                userType: {
                    $ne: userType.USER
                },
                status: {
                    $ne: status.DELETE,
                },
            });
            if (!adminResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let contactResult = await findContactUs({
                _id: validatedBody.id,
                reply: false,
            });

            if (!contactResult) {
                throw apiError.unauthorized(responseMessage.CONTACT_NOT_FOUND);
            }

            let contactRes = await updateContactUs({
                _id: contactResult._id
            }, {
                reply: true,
                replyMsg: validatedBody.message,
                status: status.RESOLVED
            });

            // let sendMail = await commonFunction.sendMailReplyFromAdmin(contactRes.email, contactRes.name || "User", validatedBody.message, contactResult.message)

            return res.json(new response(contactRes, responseMessage.REPLY_SUCCESS));

        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /admin/contact-us:
     *   get:
     *     tags:
     *       - CONTACT US
     *     description: getContactUs
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: page
     *         description: page
     *         in: query
     *         required: false
     *       - name: search
     *         description: search
     *         in: query
     *         required: false
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
     *       - name: status
     *         description: status
     *         in: query
     *         required: false
     *       - name: reply
     *         description: reply(true/false)boolean
     *         in: query
     *         required: false
     *     responses:
     *       200:
     *         description: Data found successfully.
     */

    async getContactUs(req, res, next) {
        const validationSchema = {
            page: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
            limit: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
            search: Joi.string().optional(),
            fromDate: Joi.string().optional(),
            toDate: Joi.string().optional(),
            status: Joi.string().optional(),
            reply: Joi.string().optional(),
        };
        try {
            let validatedBody = await Joi.validate(req.query, validationSchema);
            let userResult = await findUser({
                _id: req.userId,
                userType: { $in: [userType.USER, userType.ADMIN, userType.SUBADMIN] },
                status: {
                    $ne: status.DELETE,
                },
            });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let adminRes = await getAllContactUs(validatedBody)

            if (adminRes.docs.length == 0) {
                return res.json(new response(responseMessage.CONTACT_NOT_FOUND));
            }
            return res.json(new response(adminRes, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }



}
export default new adminController();