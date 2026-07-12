const jwt = require("jsonwebtoken");

function getJwtSecret() {
  const secret = process.env.JWT_SECRET_KEY;

  if (!secret) {
    throw new Error("JWT_SECRET_KEY is not configured");
  }

  return secret;
}

const checkJwt = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getJwtSecret(), (err, decoded) => {
      if (err) {
        reject(new Error("Token verification failed"));
      } else {
        resolve(decoded);
      }
    });
  });
};

module.exports = {
  checkJwt,
};
