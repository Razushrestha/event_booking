const path = require("path");
const fs = require("fs");
const { checkJwt } = require("../utils/auth/jwt");
const GenRes = require("../utils/router/GenRes");
const User = require("../modules/user/user.model");

const PUBLIC_UPLOAD_FOLDERS = new Set([
  "poster",
  "promos",
  "organizers",
  "managers",
  "floorplans",
  "floorPlans",
  "payment-methods",
  "services",
]);

const AUTHENTICATED_UPLOAD_FOLDERS = new Set(["qr", "bookingqr"]);
const STAFF_UPLOAD_FOLDERS = new Set(["payments", "proposals"]);

async function resolveUserFromRequest(req) {
  const headerToken = req.headers.authorization?.split(" ")[1];
  const queryToken = typeof req.query.token === "string" ? req.query.token : null;
  const token = headerToken || queryToken;

  if (!token) {
    return null;
  }

  try {
    const decoded = await checkJwt(token);
    const user = await User.findOne({ email: decoded.email.toLowerCase() });
    return user;
  } catch {
    return null;
  }
}

function isStaffRole(role) {
  return role === "admin" || role === "organization" || role === "employee";
}

async function authorizeUploadAccess(req, folder) {
  if (PUBLIC_UPLOAD_FOLDERS.has(folder)) {
    return true;
  }

  const user = await resolveUserFromRequest(req);

  if (!user) {
    return false;
  }

  if (STAFF_UPLOAD_FOLDERS.has(folder)) {
    return isStaffRole(user.role);
  }

  if (AUTHENTICATED_UPLOAD_FOLDERS.has(folder)) {
    return true;
  }

  return false;
}

function serveProtectedUpload(uploadsRoot) {
  return async (req, res, next) => {
    const relativePath = req.path.replace(/^\/+/, "");
    const folder = relativePath.split("/")[0];

    if (!folder) {
      return next();
    }

    const allowed = await authorizeUploadAccess(req, folder);

    if (!allowed) {
      return res.status(401).json(
        GenRes(401, null, new Error("Unauthorized file access"), "Unauthorized", req.originalUrl)
      );
    }

    const filePath = path.join(uploadsRoot, relativePath);
    const normalizedRoot = path.normalize(uploadsRoot + path.sep);
    const normalizedFile = path.normalize(filePath);

    if (!normalizedFile.startsWith(normalizedRoot)) {
      return res.status(400).json(
        GenRes(400, null, new Error("Invalid file path"), "Bad request", req.originalUrl)
      );
    }

    if (!fs.existsSync(normalizedFile) || !fs.statSync(normalizedFile).isFile()) {
      return next();
    }

    return res.sendFile(normalizedFile);
  };
}

module.exports = {
  PUBLIC_UPLOAD_FOLDERS,
  serveProtectedUpload,
};
