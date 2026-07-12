const Booking = require("../booking/booking.model.js");
const GenRes = require("../../utils/router/GenRes.js");
const { sendDiscountAppliedEmail } = require('../../utils/booking/sendEmail.js');
const { formatCurrency } = require("../../utils/formatCurrency");

const giveDiscount = async (req, res) => {
    const { bookingId, discountAmount } = req.body;

    // 1. Validate required fields
    if (!bookingId || discountAmount === undefined) {
        return res.status(400).json(GenRes(400, null, null, "Booking ID and discount amount are required", req.url));
    }
    // 3. Validate discountAmount is a number and positive
    if (isNaN(discountAmount) || discountAmount < 0) {
        return res.status(400).json(GenRes(400, null, null, "Discount amount must be a positive number", req.url));
    }

    try {
        // 4. Find the booking
        const booking = await Booking.findOne({ bookingId });
        if (!booking) {
            return res.status(404).json(GenRes(404, null, null, "Booking not found", req.url));
        }

        // 5. Check booking status
        if (booking.status === "cancelled") {
            return res.status(400).json(GenRes(400, null, null, "Cannot apply discount to cancelled booking", req.url));
        }
        if (booking.status === "completed") {
            return res.status(400).json(GenRes(400, null, null, "Cannot apply discount to completed booking", req.url));
        }

        // 6. Validate totalAmount exists
        if (booking.totalAmount === undefined || booking.totalAmount <= 0) {
            return res.status(400).json(GenRes(400, null, null, "Invalid total amount in booking", req.url));
        }

        // 7. Validate discountAmount is not greater than totalAmount
        if (discountAmount > booking.totalAmount) {
            return res.status(400).json(GenRes(400, null, null, "Discount amount cannot exceed total amount", req.url));
        }

        // 8. Calculate new total and validate remaining amount
        const newTotalAmount = booking.totalAmount - discountAmount;
        const totalCompletedPayments = booking.payments
            .filter(p => p.status === "completed")
            .reduce((sum, p) => sum + p.amount, 0);

        if (newTotalAmount < totalCompletedPayments) {
            return res.status(400).json(GenRes(400, null, null, "Discount would result in negative remaining amount after completed payments", req.url));
        }

        // 9. Update booking
        booking.totalAmount = newTotalAmount;
        booking.pendingAmount = newTotalAmount - totalCompletedPayments;
        booking.paymentStatus = booking.pendingAmount <= 0 ? "paid" : booking.pendingAmount === newTotalAmount ? "unpaid" : "remaining";
        booking.status = booking.pendingAmount <= 0 ? "completed" : booking.status;
        
        // 10. Save the updated booking
        await booking.save();

        // 11. Prepare email recipients
        const emails = [
            booking.businessInfo.email,
            booking.contactPerson?.email
        ].filter(email => email);

        // 12. Send discount applied email
        if (emails.length > 0) {
            try {
                await sendDiscountAppliedEmail(booking, discountAmount, emails);
            } catch (emailError) {
                console.error("Failed to send discount email:", emailError);
                // Continue with success response even if email fails
            }
        }

        // 13. Prepare response
        return res.status(200).json(GenRes(200, booking, null, `Discount of ${formatCurrency(discountAmount)} applied successfully`, req.url));
    } catch (error) {
        console.error("Error applying discount:", error);
        return res.status(500).json(GenRes(500, null, null, "Internal server error", req.url));
    }
};

module.exports = {
    giveDiscount,
};