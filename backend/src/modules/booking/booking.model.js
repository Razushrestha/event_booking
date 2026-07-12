const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, default: uuidv4, unique: true },
    eventId: { type: String, required: true },
    eventName: { type: String},
    stallInfo: [{
      stallName: { type: String },
      stallType: { type: String}, // e.g., food, merchandise, etc.
      stallId: { type: String},
      rate: { type: Number },
      sizeInSqFt: { type: Number },
      upchargeInPercent: { type: Number },
    }],
    stallId: { type: String },
    userId: { type: String, required: true },
    isHold: { type: Boolean, default: false },
    holdExpiry: { type: Date },
    totalAmount: { type: Number },
    pendingAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "remaining", "paid"],
      default: "unpaid",
    },
    bookingCancelReason: { type: String }, //if booking is cancelled, this will contain the reason
    qr: { type: String }, // QR code path
    paymentProof: [{ type: String }],
    payments: [{
      paymentId: { type: String, required: true },
      amount: { type: Number, required: true },
      paymentDate: { type: Date, default: Date.now },
      paymentProof: { type: String }, // Path to the payment proof file
      paymentMethod: { type: String, required: true }, // e.g., "credit_card", "bank_transfer", etc.
      failedNote: { type: String }, // Reason for payment failure, if any
      status: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending",
      },
    }],
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    businessInfo: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
    },
    contactPerson: {
      name: { type: String },
      phone: { type: String },
      email: { type: String },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
