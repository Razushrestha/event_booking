require("dotenv").config();

const requiredVars = ["MONGO_URI", "JWT_SECRET_KEY", "JWT_REFRESH_SECRET", "PORT"];

function validateEnv() {
  const missing = requiredVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }

  if (process.env.NODE_ENV === "production" && process.env.JWT_SECRET_KEY.length < 16) {
    console.error("JWT_SECRET_KEY must be at least 16 characters in production.");
    process.exit(1);
  }

  if (process.env.NODE_ENV === "production" && !process.env.FRONTEND_URL) {
    console.error("FRONTEND_URL is required in production.");
    process.exit(1);
  }
}

function getAllowedOrigins() {
  const origins = new Set();

  if (process.env.FRONTEND_URL) {
    origins.add(process.env.FRONTEND_URL);
  }

  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:5173");
    origins.add("http://127.0.0.1:5173");
  }

  return Array.from(origins);
}

module.exports = {
  validateEnv,
  getAllowedOrigins,
  isProduction: process.env.NODE_ENV === "production",
};
