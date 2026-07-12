const path = require("path");
const express = require("express");
const GenRes = require("./utils/router/GenRes");
const { notFoundHandler } = require("./middlewares/errorHandler");
const { serveProtectedUpload } = require("./middlewares/uploadAccess");
const users = require("./modules/user/user.routes.js");
const events = require("./modules/event/event.routes.js");
const admin = require("./modules/admin/admin.routes.js");
const tickets = require("./modules/ticket/ticket.routes.js");
const contact = require("./modules/contact/contact.route.js");
const services = require("./modules/service/service.routes.js");
const stalls = require("./modules/stall/stall.routes.js");
const bookings = require("./modules/booking/booking.routes.js");
const stallTypes = require("./modules/stallType/stallType.routes.js");
const organizations = require("./modules/organization/organization.routes.js");
const payments = require("./modules/payment/payment.routes.js");
const team = require("./modules/team/team.routes.js");
const discount = require("./modules/discount/discount.route.js");
const paymentsMethod = require("./modules/payment-method/paymentMethod.route.js");
const print = require("./modules/print/print.route.js");

const App = (app) => {
  app.get("/health", (req, res) => {
    res.status(200).json(
      GenRes(200, { status: "ok", uptime: process.uptime() }, null, "Healthy", req.originalUrl)
    );
  });

  app.use("/api/v1/", users, events, admin, tickets, contact, services, stalls, bookings, stallTypes, organizations, payments, team, discount, paymentsMethod, print);

  const uploadsPath = path.join(__dirname, "..", "uploads");
  app.use("/uploads", serveProtectedUpload(uploadsPath));

  app.use(notFoundHandler);
};

module.exports = App;
