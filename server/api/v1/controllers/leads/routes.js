import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";

export default Express.Router()

  /* ================= PUBLIC ================= */
  .post("/create", controller.createLead)

  /* ================= ADMIN ================= */
  .use(auth.verifyToken)

  .get("/admin/view", controller.viewLead)
  .get("/admin/list", controller.listLeads)
  .put("/admin/update", controller.updateLead)
  .delete("/admin/delete", controller.deleteLead);
