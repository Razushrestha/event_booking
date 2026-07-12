const Ticket = require("../modules/ticket/ticket.model");
const Booking = require("../modules/booking/booking.model");
const Event = require("../modules/event/event.model");
const Stall = require("../modules/stall/stall.model");
const Discount = require("../modules/discount/discount.model");

async function ensureIndexes() {
  await Promise.all([
    Ticket.collection.createIndex({ status: 1, submittedAt: -1 }),
    Ticket.collection.createIndex({ eventId: 1, status: 1 }),
    Ticket.collection.createIndex({ userId: 1 }),
    Booking.collection.createIndex({ status: 1, createdAt: -1 }),
    Booking.collection.createIndex({ eventId: 1, status: 1 }),
    Booking.collection.createIndex({ userId: 1 }),
    Booking.collection.createIndex({ isHold: 1, holdExpiry: 1, status: 1 }),
    Event.collection.createIndex({ startDateTime: 1, public: 1 }),
    Event.collection.createIndex({ ownEvent: 1, startDateTime: 1 }),
    Stall.collection.createIndex({ eventId: 1, status: 1 }),
    Discount.collection.createIndex({ code: 1 }, { unique: true }),
  ]);
}

module.exports = ensureIndexes;
