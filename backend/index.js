require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const http = require("http");
const { validateEnv, getAllowedOrigins } = require("./src/config/env");
const connectDB = require("./src/config/connectDB.js");
const App = require("./src/App");
const { apiLimiter, authLimiter } = require("./src/middlewares/rateLimiter");
const { errorHandler } = require("./src/middlewares/errorHandler");
const { setupWebSocket } = require("./src/modules/print/print.websocket");

validateEnv();

require("./src/utils/cronJobs");

const app = express();
const server = http.createServer(app);
const allowedOrigins = getAllowedOrigins();

app.set("trust proxy", 1);
app.locals.websocket = setupWebSocket(server);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(compression());
app.use(cors({
  origin(origin, callback) {
    if (process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }

    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api/v1/login", authLimiter);
app.use("/api/v1/register", authLimiter);
app.use("/api/v1/forget-password", authLimiter);
app.use("/api/v1", apiLimiter);

connectDB();

App(app);
app.use(errorHandler);

const port = Number(process.env.PORT) || 8000;

server.listen(port, () => {
  console.log(`EventSolution API running on port ${port}`);
});

function shutdown(signal) {
  console.log(`${signal} received. Shutting down gracefully...`);
  server.close(() => process.exit(0));
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
