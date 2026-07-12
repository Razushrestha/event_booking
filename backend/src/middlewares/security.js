const GenRes = require("../utils/router/GenRes");

function devOnly(req, res, next) {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json(
      GenRes(404, null, new Error("Not found"), "Not found", req.url)
    );
  }

  return next();
}

function requireBootstrapSecret(req, res, next) {
  const configuredSecret = process.env.ADMIN_BOOTSTRAP_SECRET;

  if (!configuredSecret) {
    return res.status(403).json(
      GenRes(
        403,
        null,
        new Error("Bootstrap disabled"),
        "Admin bootstrap is disabled",
        req.url
      )
    );
  }

  const providedSecret = req.headers["x-bootstrap-secret"];

  if (providedSecret !== configuredSecret) {
    return res.status(403).json(
      GenRes(403, null, new Error("Forbidden"), "Invalid bootstrap secret", req.url)
    );
  }

  return next();
}

module.exports = {
  devOnly,
  requireBootstrapSecret,
};
