const { checkJwt } = require("../utils/auth/jwt");
const GenRes = require("../utils/router/GenRes");
const User = require("../modules/user/user.model");
const buildAuthUser = require("../utils/auth/buildAuthUser");

const organizationMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json(GenRes(401, false, new Error("No token provided"), "Unauthorized", req.url));
  }

  try {
    const decoded = await checkJwt(token);
    const user = await User.findOne({ email: decoded.email.toLowerCase() });

    if (!user || user.role !== "organization") {
      return res.status(403).json(
        GenRes(403, null, new Error("Forbidden"), "Only organizations can access this resource", req.url)
      );
    }

    req.user = buildAuthUser(user, decoded);
    next();
  } catch (err) {
    return res.status(401).json(GenRes(401, null, err, "Invalid token", req.url));
  }
};

module.exports = organizationMiddleware;
