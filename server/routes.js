//v7 imports
import admin from "./api/v1/controllers/admin/routes";
import user from "./api/v1/controllers/user/routes";
import transaction from "./api/v1/controllers/transaction/routes";
import statics from "./api/v1/controllers/static/routes";
import notification from "./api/v1/controllers/notification/routes";
import property from "./api/v1/controllers/properties/routes";
import lead from "./api/v1/controllers/leads/routes";

/**
 *
 *
 * @export
 * @param {any} app
 */

export default function routes(app) {
  app.use("/api/v1/user", user);
  app.use("/api/v1/admin", admin);
  app.use("/api/v1/transaction", transaction);
  app.use("/api/v1/static", statics);
  app.use("/api/v1/notification", notification);
  app.use("/api/v1/property", property);
  app.use("/api/v1/lead", lead);


  return app;
}
