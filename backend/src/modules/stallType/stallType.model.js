const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const stallTypeSchema = new mongoose.Schema(
  {
    typeId: { type: String, default: uuidv4, unique: true },
    eventId: { type: String, required: true },
    name: { type: String, required: true, unique: true },
    sizeInSqFt: { type: Number, required: true },
    size: { type: String, required: true },
    upchargeInPercent: { type: Number },
    rate: { type: Number, required: true },
    location: { type: String },
    amenities: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("StallType", stallTypeSchema);
