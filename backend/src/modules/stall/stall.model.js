const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const stallSchema = new mongoose.Schema(
  {
    stallId: { type: String, default: uuidv4, unique: true },
    eventId: { type: String, required: true },
    name: { type: String, required: true },
    stallTypeId: { type: String, required: true },
    expiryDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["available", "hold", "booked"],
      default: "available",
    },
    images: [{ type: String }],
  },
  { timestamps: true }
);

stallSchema.pre("save", function (next) {
  if (!this.expiryDate) {
    const days = Math.floor(Math.random() * (3 - 2 + 1)) + 2;
    this.expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model("Stall", stallSchema);
