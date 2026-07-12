const jwt = require("jsonwebtoken");

const tokenGen = (data) => {
  const refKey = process.env.JWT_REFRESH_SECRET;
  const accKey = process.env.JWT_SECRET_KEY;
  const userId = data.userId || data.id || data._id;

  const refreshToken = jwt.sign(
    { userId, email: data.email, phone: data.phone },
    refKey,
    { expiresIn: "30d" }
  );

  const accessToken = jwt.sign(
    {
      _id: userId,
      userId,
      email: data.email,
      phone: data.phone,
      role: data.role,
      name: data.name,
    },
    accKey,
    { expiresIn: "8h" }
  );

  return { refreshToken, accessToken };
};

module.exports = { tokenGen };
