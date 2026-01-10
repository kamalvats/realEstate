import Express from "express";
import controller from "./controller";
import auth from '../../../../helper/auth'
import upload from '../../../../helper/uploadHandler';
export default Express.Router()

  .post('/login', controller.login)
  .post('/forgotPassword', controller.forgotPassword)
  .patch('/verifyOTP', controller.verifyOTP)
  .post('/resendOtp', controller.resendOtp)
  .post('/resetPassword', controller.resetPassword)

  .use(auth.verifyToken)
  .get('/getProfile', controller.getProfile)
  .patch('/changePassword', controller.changePassword)
  .get('/userList', controller.userList)
  .get('/viewUser', controller.viewUser)
  .put('/activeBlockUser', controller.activeBlockUser)
  .put('/editUserProfile', controller.editUserProfile)
  .delete('/deleteUser', controller.deleteUser)
  .get('/dashBoard', controller.dashBoard)
  .get('/graphDW', controller.graphDW)
  .post('/addSubAdmin', controller.addSubAdmin)
  .get('/listSubAdmin', controller.listSubAdmin)
  .put('/blockUnblockSubAdmin', controller.blockUnblockSubAdmin)
  .delete('/deleteSubAdmin', controller.deleteSubAdmin)
  .get('/graphForUser', controller.graphForUser)
      .put('/contact-us/reply/:id', controller.replyContactUs)
    .get('/contact-us', controller.getContactUs)
  .use(upload.uploadFile)
  .put('/editProfile', controller.editProfile)
  .put('/editProfileSubAdmin', controller.editProfileSubAdmin)







