import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";
import upload from '../../../../helper/uploadHandler';



export default Express.Router()

    .post("/signup", controller.signup)
    .post('/login', controller.login)
    .post('/webhook/setu', controller.setuWebhook)

    .post('/contact-us', controller.contactUs)
    .use(auth.verifyToken)
    .post('/sendOtp', controller.sendOtp)
    .patch('/verifyOTP', controller.verifyOTP)
    .get('/graphDWUser', controller.graphDWUser)
    .get('/getProfile', controller.getProfile)
    .delete("/deleteAccount", controller.deleteAccount)
    .post('/pan/create', controller.createPanKyc)
    .get('/pan/status/:referenceId', controller.checkKycStatus)
    .get("/kycList", controller.kycList)
    .put("/editProfile", controller.editProfile)
    .use(upload.uploadFile)
    .post('/uploadFile', controller.uploadFile)