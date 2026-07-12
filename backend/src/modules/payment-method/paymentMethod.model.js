const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const paymentMethodSchema = new mongoose.Schema(
    {
        paymentMethodId: { type: String, default: uuidv4, unique: true },
        name: { type: String, required: true }, // e.g., "Credit Card", "PayPal"
        image: { type: String, default: null }, // URL to payment method logo
    }
    ,
    { timestamps: true }
);

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);