const Booking = require("./booking.model");
const Stall = require("../stall/stall.model");
const { generateBookingQRCode } = require("../../utils/booking/generateQR");
const { sendBookingConfirmationEmail } = require("../../utils/booking/sendEmail");
const GenRes = require("../../utils/router/GenRes");
/**
 * Approve booking after payment validation
 * @param {string} bookingId - The booking ID to approve
 * @param {string} adminId - ID of the admin approving the booking
 * @returns {Object} Success response with booking details
 */

const approveBooking = async (req, res) => {
    const { bookingId } = req.params;
    const adminId = req.user?.id;

    try {
        // Find the booking
        const booking = await Booking.findOne({ bookingId });
        if (!booking) {
            return res.status(404).json(GenRes(404, null, null, "Booking not found", req.url));
        }

        // Check if booking is pending
        if (booking.status !== "pending") {
            return res
                .status(400)
                .json(GenRes(400, null, null, "Booking is not in pending status", req.url));
        }

        // Validate all stalls in stallInfo
        if (!booking.stallInfo || booking.stallInfo.length === 0) {
            return res
                .status(400)
                .json(GenRes(400, null, null, "No stalls found in booking", req.url));
        }

        // Check each stall's existence and availability
        for (const stall of booking.stallInfo) {
            console.log(stall)
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
        }

        // Update booking
        booking.status = "confirmed";
        // Update all payments to completed
        if (booking.payments && booking.payments.length > 0) {
            booking.payments.forEach(payment => {
                payment.status = "completed";
            });
        }
        await booking.save();

        // Update all stalls' status to booked
        try {
            for (const stall of booking.stallInfo) {
                await Stall.findOneAndUpdate(
                    { stallId: stall.stallId },
                    { status: "booked" },
                    { new: true }
                );
            }
        } catch (stallError) {
            // Rollback booking status if stall update fails
            booking.status = "pending";
            booking.paymentStatus = "unpaid";
            booking.approvedAt = undefined;
            if (booking.payments && booking.payments.length > 0) {
                booking.payments.forEach(payment => {
                    payment.status = "pending";
                });
            }
            await booking.save();
            return res
                .status(500)
                .json(GenRes(500, null, stallError, "Error updating stall statuses", req.url));
        }

        // Generate QR Code
        if (booking.status === "completed" || booking.pendingAmount === 0) {
            const qrData = JSON.stringify({
                bookingId: booking.bookingId,
                eventId: booking.eventId,
                stallIds: booking.stallInfo.map((stall) => stall.stallId),
                businessName: booking.businessInfo.name,
                status: booking.status,
                confirmedAt: booking.approvedAt.toISOString(),
            });

            const qrCodePath = await generateBookingQRCode(qrData, booking.bookingId);

            // Send confirmation email
            await sendBookingConfirmationEmail(booking, qrCodePath);
        }

        // Prepare response
        const responsePayload = {
            bookingId: booking.bookingId,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            qrCodePath,
            approvedAt: booking.approvedAt,
            stallInfo: booking.stallInfo,
        };

        return res
            .status(200)
            .json(GenRes(200, responsePayload, null, "Booking approved successfully", req.url));
    } catch (error) {
        return res.status(500).json(GenRes(500, null, error, error.message, req.url));
    }
};

module.exports = {
    approveBooking
};