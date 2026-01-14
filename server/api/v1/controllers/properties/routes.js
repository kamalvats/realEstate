import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";

export default Express.Router()

  /* ================= PUBLIC ================= */
  .get("/view", controller.viewProperty)
  .get("/list", controller.listPropertiesLP)

  /* ================= ADMIN ================= */
  .use(auth.verifyToken)

  .post("/admin/create", controller.createProperty)
  .get("/token/list", controller.listProperties)
  .put("/admin/update", controller.updateProperty)
  .put("/admin/updatePropertyStatus", controller.updatePropertyStatus)
  .delete("/admin/delete", controller.deleteProperty)
  .put("/likeUnlike", controller.likeUnlike)
  .post("/book",controller.createPaymentOrder)
  .get("/listLiked", controller.listPropertiesLiked)


