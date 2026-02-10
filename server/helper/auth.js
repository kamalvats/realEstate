import config from "config";
import jwt from "jsonwebtoken";
import userModel from "../models/user";
import apiError from './apiError';
import responseMessage from '../../assets/responseMessage';

module.exports = {
  async verifyToken(req, res, next) {
  try {
    console.log("Verifying token...",req.cookies.token,req.cookies,req.headers.token);
    const token =
      req.cookies.token ||
      req.headers.token

    if (!token) {
      return next(apiError.unauthorized(responseMessage.NO_TOKEN));
    }

    const decoded = jwt.verify(token, config.get("jwtsecret"));

    const user = await userModel.findById(decoded._id);

    if (!user) {
      return next(apiError.notFound(responseMessage.USER_NOT_FOUND));
    }

    if (user.status === "BLOCK") {
      return next(apiError.forbidden(responseMessage.BLOCK_BY_ADMIN));
    }

    if (user.status === "DELETE") {
      return next(apiError.unauthorized(responseMessage.DELETE_BY_ADMIN));
    }

    req.userId = user._id;
    req.userDetails = user;

    next();
  } catch (error) {
    return next(apiError.unauthorized(error.message));
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