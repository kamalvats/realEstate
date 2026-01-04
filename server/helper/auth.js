import config from "config";
import jwt from "jsonwebtoken";
import userModel from "../models/user";
import apiError from './apiError';
import responseMessage from '../../assets/responseMessage';

module.exports = {
  async verifyToken(req, res, next) {
    try {
      if (req.headers.token) {
        const decodedToken = await jwt.verify(req.headers.token, config.get('jwtsecret'));
  
        if (decodedToken) {
          const result2 = await userModel.findOne({ _id: decodedToken._id });
  
          if (!result2) {
            return res.status(404).json({
              responseCode: 404,
              responseMessage: "USER NOT FOUND"
            });
          }
          if (result2.status === "BLOCK") {
            return res.status(403).json({
              responseCode: 403,
              responseMessage: "You have been blocked by admin."
            });
          } else if (result2.status === "DELETE") {
            return res.status(402).json({
              responseCode: 402,
              responseMessage: "Your account has been deleted by admin."
            });
          } else {
            req.userId = decodedToken._id;
            req.userDetails = decodedToken;
            next();
          }
        }
      } else {
        throw apiError.invalid(responseMessage.NO_TOKEN);
      }
    } catch (error) {
      console.log("error=>>", error);
    }
  }
,  

  verifyTokenBySocket: (token) => {
    return new Promise((resolve, reject) => {
      try {
        if (token) {
          jwt.verify(token, config.get('jwtsecret'), (err, result) => {
            if (err) {
              reject(apiError.unauthorized());
            }
            else {
              userModel.findOne({ _id: result.id }, (error, result2) => {
                if (error)
                  reject(apiError.internal(responseMessage.INTERNAL_ERROR));
                else if (!result2) {
                  reject(apiError.notFound(responseMessage.USER_NOT_FOUND));
                }
                else {
                  if (result2.status == "BLOCK") {
                    reject(apiError.forbidden(responseMessage.BLOCK_BY_ADMIN));
                  }
                  else if (result2.status == "DELETE") {
                    reject(apiError.unauthorized(responseMessage.DELETE_BY_ADMIN));
                  }
                  else {
                    resolve(result.id);
                  }
                }
              })
            }
          })
        } else {
          reject(apiError.badRequest(responseMessage.NO_TOKEN));
        }
      }
      catch (e) {
        reject(e);
      }
    })
  }

}