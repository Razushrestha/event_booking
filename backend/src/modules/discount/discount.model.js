const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const discountSchema = new mongoose.Schema({
    discountId: { type: String, default: uuidv4, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    code: { type: String, required: true },
    fixedAmount: { type: Number, min: 0 },
    percentage: { type: Number, min: 0, max: 100 },
    maximumUsage: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    isCancelled: { type: Boolean, default: false },
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
    applicableToEventId: [{ type: String }],
    applicableToStalls: { type: Boolean, default: false },
    applicableToTickets: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Discount', discountSchema);
