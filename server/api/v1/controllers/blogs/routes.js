import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";

export default Express.Router()

  /* ================= PUBLIC ================= */
  .get("/view", controller.viewBlog)
  .get("/list", controller.listBLOGSLP)

  /* ================= ADMIN ================= */
  .use(auth.verifyToken)

  .post("/admin/create", controller.createBlog)
  .get("/admin/list", controller.listBLOGS)
  .put("/admin/update", controller.updateBlog)
  .put("/admin/updateBlogStatus", controller.updateBlogStatus)
  .delete("/admin/delete", controller.deleteBlog);
