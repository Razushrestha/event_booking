const mongoose = require("mongoose");
const ensureIndexes = require("./indexes");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("MONGO_URI is not set. Copy backend/.env.example to backend/.env and configure MongoDB.");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await ensureIndexes();
    console.log(`MongoDB connected: ${mongoose.connection.name}`);
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
