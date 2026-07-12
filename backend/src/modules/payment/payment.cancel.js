const Booking = require('../booking/booking.model.js');
const GenRes = require("../../utils/router/GenRes.js");
const { sendPaymentFailedEmail } = require('../../utils/booking/sendEmail.js');

const paymentFailed = async (req, res) => {
    try {
        const { bookingId, paymentId, failedNote } = req.body;

        // 1. Validate required fields
        if (!bookingId || !paymentId || !failedNote) {
            return res
                .status(400)
                .json(GenRes(400, null, null, "Missing bookingId, paymentId, or failedNote", req.url));
        }

        // 2. Find the booking
        const booking = await Booking.findOne({ bookingId });
        if (!booking) {
            return res
                .status(404)
                .json(GenRes(404, null, null, "Booking not found", req.url));
        }

        // 3. Check if booking is already cancelled or completed
        if (booking.status === "cancelled") {
            return res
                .status(400)
                .json(GenRes(400, null, null, "Booking is cancelled", req.url));
        }
        if (booking.status === "completed") {
            return res
                .status(400)
                .json(GenRes(400, null, null, "Booking is already completed", req.url));
        }

        // 4. Find the payment within the booking
        const payment = booking.payments.find(p => p.paymentId === paymentId);
        if (!payment) {
            return res
                .status(404)
                .json(GenRes(404, null, null, "Payment not found", req.url));
        }

        // 5. Check if payment is already processed (completed, failed, or rejected)
        if (payment.status !== "pending") {
            return res
                .status(400)
                .json(GenRes(400, null, null, `Payment is already ${payment.status}`, req.url));
        }

        // 6. Update payment status to failed
        payment.status = "failed";
        payment.failedNote = failedNote; // Store the reason for failure

        // 7. Recalculate pending amount and update payment status
        const totalCompletedPayments = booking.payments
            .filter(p => p.status === "completed")
            .reduce((sum, p) => sum + p.amount, 0);
        booking.pendingAmount = booking.totalAmount - totalCompletedPayments;
        booking.paymentStatus = booking.pendingAmount <= 0 ? "paid" : booking.pendingAmount === booking.totalAmount ? "unpaid" : "remaining";

        // 8. Check if booking is on hold and if hold has expired
        if (booking.isHold && booking.holdExpiry) {
            const now = new Date();
            const holdExpiry = new Date(booking.holdExpiry);
            if (now > holdExpiry) {
                booking.status = "cancelled";
                booking.bookingCancelReason = "Hold expired and payment failed";
                booking.isHold = false;
                booking.holdExpiry = null;
            }
        }

        // 9. Prepare email recipients
        const emails = [
            booking.businessInfo.email,
            booking.contactPerson?.email
        ].filter(email => email); // Remove undefined or null emails

        // 10. Send payment failed email
        await sendPaymentFailedEmail(booking, paymentId, emails, failedNote);

        // 11. Save the updated booking
        await booking.save();

        // 12. Prepare response message
        const responseMessage = booking.status === "cancelled"
            ? `Payment marked as failed. Booking cancelled due to expired hold and failed payment.`
            : `Payment marked as failed. Notification sent to ${emails.join(", ")}.`;

        return res
            .status(200)
            .json(GenRes(200, booking, null, responseMessage, req.url));
    } catch (error) {
        console.error("Error processing payment failure:", error);
        return res
            .status(500)
            .json(GenRes(500, null, null, "Internal server error", req.url));
    }
};

module.exports = { paymentFailed };