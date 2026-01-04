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
  .get("/admin/list", controller.listProperties)
  .put("/admin/update", controller.updateProperty)
  .put("/admin/updatePropertyStatus", controller.updatePropertyStatus)
  .delete("/admin/delete", controller.deleteProperty);
