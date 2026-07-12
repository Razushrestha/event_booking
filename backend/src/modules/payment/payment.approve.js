const Booking = require('../booking/booking.model.js');
const Stall = require('../stall/stall.model.js');
const GenRes = require("../../utils/router/GenRes.js");
const { generateBookingQRCode } = require('../../utils/booking/generateQR.js');
const { sendBookingConfirmationEmail } = require('../../utils/booking/sendEmail.js');

const paymentApprove = async (req, res) => {
    try {
        const { bookingId, paymentId } = req.body;

        // 1. Validate required fields
        if (!bookingId || !paymentId) {
            return res
                .status(400)
                .json(GenRes(400, null, null, "Missing bookingId or paymentId", req.url));
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

        // 5. Check if payment is already completed
        if (payment.status === "completed") {
            return res
                .status(400)
                .json(GenRes(400, null, null, "Payment already completed", req.url));
        }

        // 6. Validate stalls in stallInfo
        if (!booking.stallInfo || booking.stallInfo.length === 0) {
            return res
                .status(400)
                .json(GenRes(400, null, null, "No stalls found in booking", req.url));
        }

        // 7. Check each stall's existence and availability
        for (const stall of booking.stallInfo) {
            if (!stall.stallId) {
                return res
                    .status(400)
                    .json(GenRes(400, null, null, `Invalid stall data: missing stallId`, req.url));
            }

            const stallDoc = await Stall.findOne({ stallId: stall.stallId });
            if (!stallDoc) {
                return res
                    .status(404)
                    .json(GenRes(404, null, null, `Stall ${stall.stallName || stall.stallId} not found`, req.url));
            }
            if (stallDoc.status === "booked") {
                // Skip already booked stalls
                continue;
            }
            if (stallDoc.status !== "available" && stallDoc.status !== "hold") {
                return res
                    .status(400)
                    .json(
                        GenRes(
                            400,
                            null,
                            null,
                            `Stall ${stall.stallName || stall.stallId} is not available or on hold`,
                            req.url
                        )
                    );
            }
        }

        // 8. Store original booking state for rollback
        const originalBookingState = {
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            isHold: booking.isHold,
            holdExpiry: booking.holdExpiry,
            pendingAmount: booking.pendingAmount,
            paymentStatus: payment.status,
        };

        // 9. Update payment status to completed
        payment.status = "completed";

        // 10. Update hold status if booking is on hold
        if (booking.isHold) {
            booking.isHold = false;
            booking.holdExpiry = null;
        }

        // 11. Update booking status to confirmed
        booking.status = "confirmed";

        // 12. Recalculate pending amount and update payment status
        const totalCompletedPayments = booking.payments
            .filter(p => p.status === "completed")
            .reduce((sum, p) => sum + p.amount, 0);
        booking.pendingAmount = booking.totalAmount - totalCompletedPayments;
        booking.paymentStatus = booking.pendingAmount <= 0 ? "paid" : "remaining";
        booking.status = booking.pendingAmount <= 0 ? "completed" : "confirmed";
        if (booking.pendingAmount < 0) {
            booking.pendingAmount = 0; // Ensure pending amount is not negative
        }
        // 13. Save the updated booking
        await booking.save();

        // 14. Update all eligible stalls' status to booked
        try {
            for (const stall of booking.stallInfo) {
                const stallDoc = await Stall.findOne({ stallId: stall.stallId });
                if (stallDoc && stallDoc.status !== "booked") {
                    await Stall.findOneAndUpdate(
                        { stallId: stall.stallId },
                        { status: "booked" },
                        { new: true }
                    );
                }
            }
        } catch (stallError) {
            // Rollback booking changes
            booking.status = originalBookingState.status;
            booking.paymentStatus = originalBookingState.paymentStatus;
            booking.isHold = originalBookingState.isHold;
            booking.holdExpiry = originalBookingState.holdExpiry;
            booking.pendingAmount = originalBookingState.pendingAmount;
            payment.status = originalBookingState.paymentStatus;
            await booking.save();
            return res
                .status(500)
                .json(GenRes(500, null, stallError, "Error updating stall statuses", req.url));
        }

        // 15. Generate QR code and send email if fully paid
        if (booking.paymentStatus === "paid") {
            const qrData = JSON.stringify({
                bookingId: booking.bookingId,
                eventId: booking.eventId,
                stalls: booking.stallInfo.map(stall => ({
                    stallId: stall.stallId,
                    stallName: stall.stallName,
                })),
                businessName: booking.businessInfo.name,
                status: booking.status,
                confirmedAt: new Date().toISOString(),
            });

            const qrCodePath = await generateBookingQRCode(qrData, booking.bookingId);

            await sendBookingConfirmationEmail(booking, qrCodePath);
        }

        // 16. Prepare response message
        const responseMessage = booking.paymentStatus === "paid"
            ? "Payment approved successfully. Booking is fully paid and confirmed."
            : `Payment approved successfully. Booking confirmed. Remaining amount: ${booking.pendingAmount}.`;

        return res
            .status(200)
            .json(GenRes(200, booking, null, responseMessage, req.url));
    } catch (error) {
        console.error("Error approving payment:", error);
        return res
            .status(500)
            .json(GenRes(500, null, error, error.message, req.url));
    }
};

module.exports = { paymentApprove };