const jwt = require("jsonwebtoken");
const GenRes = require("../../utils/router/GenRes");
const User = require("./user.model");
const { tokenGen } = require("../../utils/auth/tokenHandler");

function sanitizeUser(user) {
  const obj = user.toObject();
  delete obj.signedIn;
  delete obj.passwordHash;
  delete obj.refreshToken;
  delete obj.code;
  delete obj.expiry;
  delete obj.codeAttemptCount;
  delete obj._id;
  delete obj.__v;
  return obj;
}

const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(400).json(
        GenRes(400, null, { error: "Refresh token is required" }, "Bad request", req.url)
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json(
        GenRes(401, null, { error: "Invalid refresh token" }, "Unauthorized", req.url)
      );
    }

    const user = await User.findOne({ email: decoded.email?.toLowerCase() }).select("+refreshToken");

    if (!user || !user.refreshToken || user.refreshToken !== refreshToken) {
      return res.status(401).json(
        GenRes(401, null, { error: "Refresh token revoked" }, "Unauthorized", req.url)
      );
    }

    const genData = {
      email: user.email,
      name: user.name,
      role: user.role,
      id: user.userId?.toString(),
      phone: user.phone,
      date: new Date(),
    };

    const tokens = tokenGen(genData);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return res.status(200).json({
      ...GenRes(200, sanitizeUser(user), null, "Token refreshed"),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    return res.status(500).json(GenRes(500, null, error, error?.message, req.url));
  }
};

const logoutUser = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email.toLowerCase() }).select("+refreshToken");

    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    return res.status(200).json(GenRes(200, null, null, "Logged out", req.url));
  } catch (error) {
    return res.status(500).json(GenRes(500, null, error, error?.message, req.url));
  }
};

module.exports = {
  refreshAccessToken,
  logoutUser,
};
