import Joi from "joi";
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import responseMessage from "../../../../../assets/responseMessage";
import status from "../../../../enums/status";
import userType from "../../../../enums/userType";
import { notificationServices } from "../../services/notification";
const {
  createNotification,
  findNotification,
  updateNotification,
  multiUpdateNotification,
  notificationList, paginateNotification
} = notificationServices;
import {
  userServices
} from "../../services/user";

const {
  findUser,
  findUserData,
  updateUser
} = userServices;

import {
  transactionServices
} from "../../services/transaction";

const {
  createTransaction,
  updateTransaction,
  findTransactions,
  getTransaction,
  transactionPaginateSearch,
  transactionCount
} = transactionServices;

export class transactionController {



  /**
   * @swagger
   * /transaction/transactionHistory:
   *   get:
   *     tags:
   *       - ADMIN_TRANSACTION_LIST
   *     description: get transaction list for particular user
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
   *       - name: limit
   *         description: limit
   *         in: query
   *         required: false
   *       - name: transactionType
   *         description: transactionType
   *         in: query
   *         required: false
   *       - name: status
   *         description: status
   *         in: query
   *         required: false
   *       - name: notEqual
   *         description: notEqual
   *         in: query
   *         required: false
   *       - name: isCompleted
   *         description: isCompleted
   *         in: query
   *         required: false
   *       - name: isClaimed
   *         description: isClaimed
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

  async transactionHistory(req, res, next) {
    const validationSchema = {
      userId: Joi.string().optional(),
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
      transactionType: Joi.string().optional(),
      status: Joi.string().optional(),
      notEqual: Joi.string().optional(),
      campaignId: Joi.string().optional(),
      isCompleted: Joi.boolean().optional(),
      isClaimed: Joi.boolean().optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);
      let adminResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE
      });
      if (!adminResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      let transactionHistory = await transactionPaginateSearch(validatedBody);
      if (transactionHistory.docs.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      if(validatedBody.transactionType && validatedBody.transactionType == "JOINED") {
        transactionHistory.docs = JSON.parse(JSON.stringify(transactionHistory.docs));
        for(let i = 0; i < transactionHistory.docs.length; i++) {
          if(transactionHistory.docs[i].isClaimed == true) {
            let claimedAmount = await getTransaction({userId: transactionHistory.docs[i].userId, transactionType: "CLAIMED",campaignId: transactionHistory.docs[i].campaignId});
            transactionHistory.docs[i].claimedAmountByUser = claimedAmount.amount
          }else {
            transactionHistory.docs[i].claimedAmountByUser = 0
          }
          let userData =await findUser({_id: transactionHistory.docs[i].userId});
          if(userData && userData.referredBy) {
            let refferedUser = await findUser({_id: userData.referredBy});
            if(refferedUser && refferedUser.userType == userType.USER) {
              transactionHistory.docs[i].referredBy = refferedUser.walletAddress;
            }else{
              transactionHistory.docs[i].referredBy = userData.referrerCode;
            }
          }else{
            transactionHistory.docs[i].referredBy ="-"
          }
        }
      }
      return res.json(
        new response(transactionHistory, responseMessage.DATA_FOUND)
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /transaction/viewTransactionHistory:
   *   get:
   *     tags:
   *       - ADMIN_TRANSACTION_LIST
   *     description: get transaction list for particular user
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: transactionId
   *         description: transactionId
   *         in: query
   *         required: true
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
  async viewTransactionHistory(req, res, next) {
    const validationSchema = {
      transactionId: Joi.string().optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);
      let adminResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE
      });
      if (!adminResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      let transactionHistory = await getTransaction({
        _id: validatedBody.transactionId,
      });
      if (!transactionHistory) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      return res.json(
        new response(transactionHistory, responseMessage.DATA_FOUND)
      );
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /transaction/transactionListUser:
   *   get:
   *     tags:
   *       - USER_Transaction
   *     description: get transaction list for  user
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
   *       - name: transactionType
   *         description: transactionType
   *         in: query
   *         required: false
   *       - name: status
   *         description: status
   *         in: query
   *         required: false
   *       - name: walletAddress
   *         description: walletAddress
   *         in: query
   *         required: false
   *       - name: search
   *         description: search
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

  async transactionListUser(req, res, next) {
    const validationSchema = {
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
      transactionType: Joi.string().optional(),
      status: Joi.string().optional(),
      search: Joi.string().optional(),
      campaignId: Joi.string().optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.ADMIN
        },
        status: {
          $ne: status.DELETE
        },
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      validatedBody.userId = userResult._id;
      if (validatedBody.transactionType == "JOINED") {
        validatedBody.isClaimed= false 
      }
      let transactionHistory = await transactionPaginateSearch(validatedBody);
      if (transactionHistory.docs.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      if (validatedBody.transactionType == "JOINED") {
        transactionHistory.docs = JSON.parse(JSON.stringify(transactionHistory.docs))
        for (let transaction of transactionHistory.docs) {
          let allTasks = await findTasks({ campaignId: transaction.campaignId, status: "Active" })
          let totalReward = allTasks.reduce((a, b) => a + b.reward, 0)
          let allVerifiedTasks = await transactionCount({ campaignId: transaction.campaignId, userId: userResult._id, transactionType: "VERIFIED" })
          transaction.allTasks = allTasks.length
          transaction.totalReward = totalReward
          transaction.allVerifiedTasks = allVerifiedTasks
        }

      }
      return res.json(
        new response(transactionHistory, responseMessage.DATA_FOUND)
      );
    } catch (error) {
      return next(error);
    }
  }
}
export default new transactionController();