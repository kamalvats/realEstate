import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";
import upload from '../../../../helper/uploadHandler';


export default Express.Router()

    .use(auth.verifyToken)
    
    .get('/viewNotification/:_id', controller.viewNotification)
    .delete('/deleteNotification', controller.deleteNotification)
    .put('/readNotification', controller.readNotification)
    .get('/listNotification', controller.listNotification)
    .get('/readStatus', controller.readStatus)
    .delete('/clearNotification', controller.clearNotification)
    .get("/listActivity", controller.listActivity)

    




