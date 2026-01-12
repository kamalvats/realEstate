import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";

export default Express.Router()

  /* ================= PUBLIC ================= */
  .post("/create", controller.createLead)

  /* ================= ADMIN ================= */
  .use(auth.verifyToken)
  .post("/visit/create", controller.createLead)


  .get("/admin/view", controller.viewLead)
  .get("/list", controller.listLeads)
  .put("/admin/update", controller.updateLead)
  .put("/reSchedule", controller.reSchedule)
  // .delete("/admin/delete", controller.deleteLead);
