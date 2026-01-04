import Joi from "joi";
import _ from "lodash";
import config from "config";
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import responseMessage from "../../../../../assets/responseMessage";
import status from "../../../../enums/status";
import userType from "../../../../enums/userType";
import { userServices } from "../../services/user";
import { notificationServices } from "../../services/notification";
const { findUser } = userServices;
const {
  createNotification,
  findNotification,
  updateNotification,
  multiUpdateNotification,
  notificationList, paginateNotification
} = notificationServices;
import { activityServices } from "../../services/activity";
const {activityAggSearch } = activityServices;
export class notificationController {


  /**
   * @swagger
   * /notification/viewNotification/{_id}:
   *   get:
   *     tags:
   *       - NOTIFICATION MANAGEMENT
   *     description: viewNotification
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: _id
   *         description: _id
   *         in: path
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async viewNotification(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
    };
    try {
      const { _id } = await Joi.validate(req.params, validationSchema);
      let userResult = await findUser({ _id: req.userId });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var notificationResult = await findNotification({
        $or: [
          { userId: userResult._id },
          { userId: { $exists: false } }
        ],
        _id: _id,
        sendDate: { $lte: new Date() },
        status: { $ne: status.DELETE },
      });
      if (!notificationResult) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      return res.json(
        new response(notificationResult, responseMessage.DETAILS_FETCHED)
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /notification/deleteNotification:
   *   delete:
   *     tags:
   *       - NOTIFICATION MANAGEMENT
   *     description: deleteNotification
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: _id
   *         description: _id
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async deleteNotification(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
    };
    try {
      const { _id } = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({ _id: req.userId });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var notificationResult = await findNotification({
        _id: _id,
        $or: [
          { userId: userResult._id },
          // { userId: { $exists: false } },

        ],
        status: status.ACTIVE
      });
      if (!notificationResult) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      var result = await updateNotification(
        { _id: notificationResult._id },
        {
          $set:{status:"DELETE"},
        },
      );
      return res.json(new response(result, responseMessage.DELETE_SUCCESS));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /notification/listNotification:
   *   get:
   *     tags:
   *       - NOTIFICATION MANAGEMENT
   *     description: listNotification
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
   *         required: true
   *       - name: limit
   *         description: limit
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async listNotification(req, res, next) {
    try {
      let userResult = await findUser({ _id: req.userId });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
    let obj ={
      _id:userResult._id,
      page:req.query.page,
      limit:req.query.limit,
      createdAt:userResult.createdAt
    }
      let dataResults = await paginateNotification(obj);
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
 * /notification/readStatus:
 *   get:
 *     tags:
 *       - NOTIFICATION MANAGEMENT
 *     description: readStatus
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
  async readStatus(req, res, next) {
    try {
      let userResult = await findUser({ _id: req.userId });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let obj = {
        _id: userResult._id,
        read: true,
        createdAt:userResult.createdAt
      }
      let dataResults = await paginateNotification(obj);

      let status = dataResults.docs.length > 0;



      if (status) {
        return res.json(new response(status, responseMessage.DATA_FOUND));
      } else {
        return res.status(200).json({ status: false, message: responseMessage.DATA_NOT_FOUND });
      }
    } catch (error) {
      return next(error);
    }
  }



  /**
   * @swagger
   * /notification/readNotification:
   *   put:
   *     tags:
   *       - NOTIFICATION MANAGEMENT
   *     description: readNotification
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
  async readNotification(req, res, next) {
    try {
      let userResult = await findUser({ _id: req.userId });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var result = await multiUpdateNotification(
        {
          $or: [
            { userId: userResult._id },
            // { userId: { $exists: false } }
          ]
        },
        {
          $set: { isRead: true },
        },);
      return res.json(new response(result, responseMessage.DETAILS_FETCHED));
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /notification/clearNotification:
   *   delete:
   *     tags:
   *       - NOTIFICATION MANAGEMENT
   *     description: clearNotification
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
  async clearNotification(req, res, next) {
    try {
      let userResult = await findUser({
        _id: req.userId,
        userType: { $in: [userType.USER, userType.ADMIN, userType.SUBADMIN] },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let result = await multiUpdateNotification({
        $or: [
          { userId: userResult._id },
          // { userId: { $exists: false } }
        ]
      },
        {
         $set:{status:"DELETE"},
        },);

      return res.json(
        new response(result, responseMessage.NOTIFICATION_CLEAR)
      );

    } catch (error) {
      return next(error);
    }
  }

    /**
   * @swagger
   * /notification/listActivity:
   *   get:
   *     tags:
   *       - NOTIFICATION MANAGEMENT
   *     description: listActivity
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
   *       - name: limit
   *         description: limit
   *         in: query
   *         required: false
   *       - name: limit
   *         description: limit
   *         in: query
   *         required: false 
   *       - name: userId
   *         description: userId
   *         in: query
   *         required: false 
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async listActivity(req, res, next) {
    try {
      let userResult = await findUser({ _id: req.userId });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
    if(userResult.userType == "USER"){
      req.query.userId = userResult._id;
    }
      let obj = {
        ...req.query
    }
      let dataResults = await activityAggSearch(obj);
      if (dataResults.docs.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      return res.json(new response(dataResults, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }
}

export default new notificationController();
