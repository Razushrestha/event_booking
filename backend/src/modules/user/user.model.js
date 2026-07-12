const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, default: uuidv4, unique: true },
    name: { type: String, required: false },
    isVerified: { type: Boolean, default: false },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    code: { type: String, required: false, default: null },
    expiry: { type: Date, required: false, default: null },
    phone: { type: String, required: false },
    gId: { type: String, required: false, unique: true, sparse: true },
    codeAttemptCount: { type: Number, default: 0 },
    role: {
      type: String,
      enum: ["admin", "user", "organization", "employee"],
      default: "user",
    },
    refreshToken: { type: String, default: null, select: false },
    organizationDetails: {
      address: { type: String },
      vatNumber: { type: String },
      panNumber: { type: String },
      contactPerson: {
        name: { type: String },
        phone: { type: String },
        email: { type: String },
      },
      logo: { type: String },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
