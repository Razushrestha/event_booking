const mongoose = require('mongoose');

const PrintedTicketSchema = new mongoose.Schema({
    ticketId: { type: String, required: true },
    printedAt: { type: Date, default: Date.now },
    name: { type: String, required: true },
    email: { type: String },
    eventId: { type: String },
    eventName: { type: String, required: true },
    qr: { type: String },
});

module.exports = mongoose.model("PrintedTicket", PrintedTicketSchema);