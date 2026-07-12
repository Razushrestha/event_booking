const cron = require("node-cron");

const { checkBookingHoldExpiry } = require("../modules/booking/booking.cancel"); // Adjust path
console.log("Starting cron job for booking hold expiry check");

// Run every hour
cron.schedule("0 * * * *", async () => {
    console.log(`[${new Date().toISOString()}] Running booking hold expiry check`);
    await checkBookingHoldExpiry();
});