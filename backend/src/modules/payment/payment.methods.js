const Booking = require("../booking/booking.model.js");
const GenRes = require("../../utils/router/GenRes.js");
const path = require('path');
const fs = require('fs');

// View all payments (with optional filters for status or date range)
const viewAllPayments = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        const userDetails = req.user; // From middleware

        // Build query
        let query = {};
        // console.log("User Details:", userDetails);
        const isAdmin = userDetails && userDetails.role === "admin";
        if (userDetails && !isAdmin) {
            query.userId = userDetails.userId; // Restrict to user's bookings unless admin
        }
        // query.status = { $nin: ["cancelled", "completed"] }; // Exclude cancelled/completed bookings

        // Construct aggregation pipeline
        let pipeline = [
            { $match: query },
            { $unwind: "$payments" }, // Unwind payments array
            {
                $project: {
                    bookingId: "$bookingId",
                    eventId: "$eventId",
                    eventName: "$eventName",
                    userId: "$userId",
                    payment: "$payments",
                },
            },
        ];

        // Add filters for payment status or date range
        if (status) {
            pipeline.push({
                $match: { "payment.status": status },
            });
        }
        if (startDate || endDate) {
            const dateFilter = {};
            if (startDate) dateFilter.$gte = new Date(startDate);
            if (endDate) dateFilter.$lte = new Date(endDate);
            pipeline.push({
                $match: { "payment.paymentDate": dateFilter },
            });
        }

        const payments = await Booking.aggregate(pipeline);

        if (!payments || payments.length === 0) {
            return res
                .status(404)
                .json(GenRes(404, null, null, "No payments found", req.url));
        }

        return res
            .status(200)
            .json(GenRes(200, payments, null, "Payments retrieved successfully", req.url));
    } catch (error) {
        console.error("Error viewing all payments:", error);
        return res
            .status(500)
            .json(GenRes(500, null, null, "Internal server error", req.url));
    }
};

// View payments for a specific bookingId
const viewPaymentsByBookingId = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userDetails = req.user; // From middleware

        // Build query
        const isAdmin = userDetails && userDetails.role === "admin";
        let query = { bookingId };
        if (userDetails && !isAdmin) {
            query.userId = userDetails.userId; // Restrict to user's bookings unless admin
        }

        const booking = await Booking.findOne(query, {
            bookingId: 1,
            eventId: 1,
            eventName: 1,
            userId: 1,
            payments: 1,
            _id: 0,
        });

        if (!booking) {
            return res
                .status(404)
                .json(GenRes(404, null, null, "Booking or payments not found", req.url));
        }

        if (!booking.payments || booking.payments.length === 0) {
            return res
                .status(404)
                .json(GenRes(404, null, null, "No payments found for this booking", req.url));
        }

        const response = {
            bookingId: booking.bookingId,
            eventId: booking.eventId,
            eventName: booking.eventName,
            userId: booking.userId,
            payments: booking.payments,
        };

        return res
            .status(200)
            .json(GenRes(200, response, null, "Payments retrieved successfully", req.url));
    } catch (error) {
        console.error("Error viewing payments by bookingId:", error);
        return res
            .status(500)
            .json(GenRes(500, null, null, "Internal server error", req.url));
    }
};

// View a payment by paymentId
const viewPaymentByPaymentId = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const userDetails = req.user; // From middleware

        const isAdmin = userDetails && userDetails.role === "admin";
        // Build query
        let query = { "payments.paymentId": paymentId };
        if (userDetails && !isAdmin) {
            query.userId = userDetails.userId; // Restrict to user's bookings unless admin
        }

        const booking = await Booking.findOne(query, {
            bookingId: 1,
            eventId: 1,
            eventName: 1,
            userId: 1,
            payments: { $elemMatch: { paymentId } },
            _id: 0,
        });

        if (!booking || !booking.payments || booking.payments.length === 0) {
            return res
                .status(404)
                .json(GenRes(404, null, null, "Payment not found", req.url));
        }

        const response = {
            bookingId: booking.bookingId,
            eventId: booking.eventId,
            eventName: booking.eventName,
            userId: booking.userId,
            payment: booking.payments[0],
        };

        return res
            .status(200)
            .json(GenRes(200, response, null, "Payment retrieved successfully", req.url));
    } catch (error) {
        console.error("Error viewing payment by paymentId:", error);
        return res
            .status(500)
            .json(GenRes(500, null, null, "Internal server error", req.url));
    }
};

// View payments for a specific eventId
const viewPaymentsByEventId = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userDetails = req.user; // From middleware

        // Build query
        const isAdmin = userDetails && userDetails.role === "admin";
        let query = { eventId };
        if (userDetails && !isAdmin) {
            query.userId = userDetails.userId; // Restrict to user's bookings unless admin
        }

        const pipeline = [
            { $match: query },
            { $unwind: "$payments" }, // Unwind payments array
            {
                $project: {
                    bookingId: "$bookingId",
                    eventId: "$eventId",
                    eventName: "$eventName",
                    userId: "$userId",
                    payment: "$payments",
                },
            },
        ];

        const payments = await Booking.aggregate(pipeline);

        if (!payments || payments.length === 0) {
            return res
                .status(404)
                .json(GenRes(404, null, null, "No payments found for this event", req.url));
        }

        return res
            .status(200)
            .json(GenRes(200, payments, null, "Payments retrieved successfully", req.url));
    } catch (error) {
        console.error("Error viewing payments by eventId:", error);
        return res
            .status(500)
            .json(GenRes(500, null, null, "Internal server error", req.url));
    }
};

const addPaymentForBooking = async (req, res) => {
    try {
        const { bookingId, paidAmount, paymentMethod } = req.body;
        const userDetails = req.user; // From middleware

        // 1. Validate required fields
        if (!bookingId || !paidAmount || !paymentMethod || !req.file) {
            return res
                .status(400)
                .json(GenRes(400, false, null, "Missing required fields: bookingId, paidAmount, paymentMethod, or paymentProof", req.url));
        }

        // 2. Parse and validate paidAmount
        const paidAmountNum = parseFloat(paidAmount);
        if (isNaN(paidAmountNum) || paidAmountNum <= 0) {
            return res
                .status(400)
                .json(GenRes(400, false, null, "Invalid paid amount: must be a positive number", req.url));
        }

        // 3. Find the booking
        const query = { bookingId, userId: userDetails.userId }; // Restrict to user's bookings
        const booking = await Booking.findOne(query);
        if (!booking) {
            return res
                .status(404)
                .json(GenRes(404, null, null, "Booking not found or you are not authorized", req.url));
        }

        // 4. Check if booking is eligible for payment
        if (booking.status === "cancelled") {
            return res
                .status(400)
                .json(GenRes(400, null, null, "Cannot add payment to a cancelled booking", req.url));
        }
        if (booking.status === "completed") {
            return res
                .status(400)
                .json(GenRes(400, null, null, "Booking is already completed", req.url));
        }

        // 5. Validate paidAmount against pendingAmount
        if (paidAmountNum > booking.pendingAmount) {
            return res
                .status(400)
                .json(GenRes(400, null, null, `Paid amount (${paidAmountNum}) exceeds pending amount (${booking.pendingAmount})`, req.url));
        }

        // 6. Handle payment proof file upload (from multer)
        const uploadsDir = path.join(__dirname, "..", "..", "..", "uploads", "payments");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const file = req.file; // Single file from multer
        const originalName = file.originalname.replace(/\s+/g, '_');
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${originalName}`;
        const filePath = path.join(uploadsDir, fileName);

        try {
            fs.writeFileSync(filePath, file.buffer);
        } catch (err) {
            return res
                .status(400)
                .json(GenRes(400, false, err.message, "Failed to process payment proof file", req.url));
        }

        const paymentProofUrl = `/uploads/payments/${fileName}`;

        // 7. Create payment record
        const paymentRecord = {
            paymentId: `payment_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            amount: paidAmountNum,
            paymentDate: new Date(),
            paymentProof: paymentProofUrl,
            paymentMethod: paymentMethod,
            status: "pending",
        };

        // 8. Update booking
        booking.payments.push(paymentRecord);
        booking.pendingAmount = booking.totalAmount - booking.payments
            .filter(p => p.status === "completed")
            .reduce((sum, p) => sum + p.amount, 0); // Only count completed payments
        booking.paymentStatus = booking.pendingAmount <= 0 ? "paid" : "remaining";

        // 9. Check if 50% payment threshold is met for hold release
        const totalCompletedPayments = booking.payments
            .filter(p => p.status === "completed")
            .reduce((sum, p) => sum + p.amount, 0);
        const minimumPayment = booking.totalAmount * 0.5;
        if (booking.isHold && totalCompletedPayments + paidAmountNum >= minimumPayment) {
            booking.isHold = false;
            booking.holdExpiry = null;
        } else {
            booking.isHold = true; // Keep hold if payment is less than 50%
            booking.holdExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // Set hold expiry to 24 hours from now
        }

        // 10. Save the updated booking
        await booking.save();

        // 11. Prepare response
        const responseMessage = booking.paymentStatus === "paid"
            ? "Payment added successfully. Booking is fully paid, awaiting admin confirmation."
            : `Payment added successfully. Remaining amount: ${booking.pendingAmount}. Awaiting admin confirmation.`;

        return res
            .status(200)
            .json(GenRes(200, booking, null, responseMessage, req.url));
    } catch (err) {
        console.error("Error adding payment for booking:", err);
        return res
            .status(500)
            .json(GenRes(500, null, err.message, "Internal server error", req.url));
    }
};


module.exports = {
    viewAllPayments,
    viewPaymentsByBookingId,
    viewPaymentByPaymentId,
    viewPaymentsByEventId,
    addPaymentForBooking
};