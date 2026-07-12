const { checkJwt } = require("../utils/auth/jwt");
const GenRes = require("../utils/router/GenRes");
const User = require("../modules/user/user.model");
const buildAuthUser = require("../utils/auth/buildAuthUser");

const authMiddleware = async (req, res, next) => {
  const requestId = req.headers["x-request-id"] || Math.random().toString(36).slice(2, 11);
  const token = req.headers.authorization?.split(" ")[1];

  try {
    if (!token) {
      return res.status(401).json(GenRes(401, null, new Error("No token provided"), "Unauthorized", req.url));
    }

    const decoded = await checkJwt(token);
    const user = await User.findOne({ email: decoded.email.toLowerCase() });

    if (!user) {
      return res.status(404).json(GenRes(404, null, new Error("User not found"), "User not found", req.url));
    }

    req.user = buildAuthUser(user, decoded);
    req.requestId = requestId;
    next();
  } catch (err) {
    return res.status(401).json(GenRes(401, null, err, "Invalid token", req.url));
  }
};

module.exports = authMiddleware;
