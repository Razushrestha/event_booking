const GenRes = require("../utils/router/GenRes");

function notFoundHandler(req, res) {
  return res.status(404).json(
    GenRes(404, null, new Error("Route not found"), "Route not found", req.originalUrl)
  );
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production" && status === 500
      ? "Internal server error"
      : err.message || "Internal server error";

  console.error(`[${req.method}] ${req.originalUrl}`, err);

  return res.status(status).json(
    GenRes(status, null, message, message, req.originalUrl)
  );
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
