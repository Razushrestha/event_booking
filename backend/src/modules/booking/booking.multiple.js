const GenRes = require("../../utils/router/GenRes");
const User = require("../user/user.model");
const Stall = require("../stall/stall.model");
const StallType = require("../stallType/stallType.model");
const Event = require("../event/event.model");
const Booking = require("./booking.model");
const Discount = require("../discount/discount.model");
const fs = require("fs");
const path = require("path");
const { sendHoldingEmail, sendBookingMadeEmail } = require("../../utils/booking/sendEmail");
const { compressImage } = require('../../utils/compressImages');

const createMultipleStallBooking = async (req, res) => {
    try {
        let { stallIds, paidAmount, paymentMethod, contactPersonName, contactPersonEmail, contactPersonNumber, discountCode } = req.body;

        if (typeof stallIds === "string") {
            try {
                // Try parsing as JSON if it’s a stringified array
                const parsed = JSON.parse(stallIds);
                if (Array.isArray(parsed)) {
                    stallIds = parsed;
                } else {
                    // If parsed is not an array, treat the original string as a single
                    stallId
                    stallIds = [stallIds];
                }
            } catch (e) {
                // If parsing fails, treat as a single stallId
                // console.log("Error parsing stallIds:", e);
                console.log("stallsIds is a string, treating as single stallId");
                stallIds = [stallIds];
            }
        }


        // 2. Set contactPerson object
        const contactPerson = {
            name: contactPersonName,
            email: contactPersonEmail,
            phone: contactPersonNumber,
        };

        const userDetails = req.user; // From middleware
        // console.log("User Details:", userDetails?.userId, userDetails);

        // 3. Validate required fields
        if (!stallIds || !Array.isArray(stallIds) || stallIds.length === 0 || !userDetails) {
            return res
                .status(400)
                .json(GenRes(400, false, null, "Missing required fields or stallIds must be a non-empty array", req.url));
        }

        // 4. Get user information for business details
        const user = await User.findOne({ userId: userDetails.userId });
        if (!user) {
            return res
                .status(404)
                .json(GenRes(404, null, null, "User not found", req.url));
        }

        // 5. Extract business info from user
        let businessInfo = {
            name: req.body.businessName || (user.organizationDetails?.name || user.name),
            phone: req.body.businessPhone || (user.organizationDetails?.contactPerson?.phone || user.phone),
            email: req.body.businessEmail || (user.organizationDetails?.contactPerson?.email || user.email)
        };
        // console.log("Business Info:", businessInfo);

        // Validate business info
        if (!businessInfo.name || !businessInfo.email) {
            return res
                .status(400)
                .json(GenRes(400, null, null, "User profile missing required business information", req.url));
        }

        // 6. Set contact person info (use provided or fallback to business info)
        const finalContactPerson = {
            name: contactPerson.name || businessInfo.name,
            phone: contactPerson.phone || businessInfo.phone,
            email: contactPerson.email || businessInfo.email,
        };

        // 7. Validate all stalls exist and get their details
        const stalls = await Stall.find({ stallId: { $in: stallIds } });
        // console.log("Stalls found:", stalls);
        if (stalls.length !== stallIds.length) {
            const foundStallIds = stalls.map(s => s.stallId);
            const missingStalls = stallIds.filter(id => !foundStallIds.includes(id));
            return res
                .status(404)
                .json(GenRes(404, null, null, `Stalls not found: ${missingStalls.join(', ')}`, req.url));
        }

        // 8. Check if all stalls belong to the same event
        const eventIds = [...new Set(stalls.map(s => s.eventId))];
        if (eventIds.length > 1) {
            return res
                .status(400)
                .json(GenRes(400, null, null, "All stalls must belong to the same event", req.url));
        }

        const eventId = eventIds[0];

        // 9. Get event details and check registration window
        const event = await Event.findOne({ eventId });
        if (!event) {
            return res
                .status(404)
                .json(GenRes(404, null, null, "Event not found", req.url));
        }

        // Check if booking is within registration period
        const now = new Date();
        if (event.registrationOpen && now < event.registrationOpen) {
            return res
                .status(400)
                .json(GenRes(400, null, null, "Registration has not opened yet", req.url));
        }

        if (event.registrationClose && now > event.registrationClose) {
            return res
                .status(400)
                .json(GenRes(400, null, null, "Registration has closed", req.url));
        }

        // 10. Check for existing bookings by the same user for any of these stalls
        const existingBookings = await Booking.find({
            stallId: { $in: stallIds },
            userId: userDetails.userId,
            status: { $in: ["pending", "confirmed"] },
        });

        if (existingBookings.length > 0) {
            const bookedStallIds = existingBookings.map(b => b.stallId);
            return res
                .status(400)
                .json(GenRes(400, null, null, `You already have bookings for stalls: ${bookedStallIds.join(', ')}`, req.url));
        }

        // 11. Check if any stalls are not available
        const unavailableStalls = stalls.filter(s => s.status !== "available");
        if (unavailableStalls.length > 0) {
            const unavailableStallIds = unavailableStalls.map(s => s.stallId);
            return res
                .status(400)
                .json(GenRes(400, null, `Stalls not available: ${unavailableStallIds.join(', ')}`, `Stalls not available: ${unavailableStallIds.join(', ')}`, req.url));
        }

        // 12. Get stall types for pricing
        const stallTypeIds = [...new Set(stalls.map(s => s.stallTypeId))];
        const stallTypes = await StallType.find({
            typeId: { $in: stallTypeIds },
            eventId: eventId,
        });

        const stallTypeMap = stallTypes.reduce((acc, type) => {
            acc[type.typeId] = type;
            return acc;
        }, {});

        // 13. Calculate total amount and prepare stall info
        let totalAmount = 0;
        const stallInfo = [];

        for (const stall of stalls) {
            const stallType = stallTypeMap[stall.stallTypeId];
            if (!stallType) {
                return res
                    .status(404)
                    .json(GenRes(404, null, null, `Stall type not found for stall ${stall.stallId}`, req.url));
            }

            const stallAmount = stallType.rate * stallType.sizeInSqFt;
            const upcharge = stallType.upchargeInPercent ? (stallAmount * stallType.upchargeInPercent / 100) : 0;
            const stallSemiFinalAmount = stallAmount + upcharge;
            // Stall tax rate is 13% VAT (fixed)
            const stallFinalAmount = stallSemiFinalAmount * 1.13;
            totalAmount += stallFinalAmount;
            totalAmount = parseFloat(totalAmount).toFixed(2);
            totalAmount = parseFloat(totalAmount); // Ensure totalAmount is a number
            if (discountCode) {
                const discount = await Discount.findOne({ code: discountCode });
                if (discount) {
                    // Apply discount
                    if (discount.percentage) {
                        const discountAmount = (totalAmount * discount.percentage) / 100;
                        totalAmount -= discountAmount;
                    } else if (discount.fixedAmount) {
                        totalAmount -= discount.fixedAmount;
                    }
                }
            }

            stallInfo.push({
                stallName: stall.stallName || stall.name, // Use stallName if available, else fallback to name
                stallType: stallType.name,
                stallId: stall.stallId,
                rate: stallType.rate,
                upchargeInPercent: stallType.upchargeInPercent || 0,
                sizeInSqFt: stallType.sizeInSqFt,
            });
        }

        // 14. Handle payment information and file upload
        let paymentsArray = [];
        let isHold = false; // Default to no hold since payment is required
        let paymentStatus = "unpaid";
        let pendingAmount = totalAmount;

        // Check if payment is included
        const hasPayment = paidAmount && paymentMethod && req.files?.paymentProof;
        if (!hasPayment) {
            return res
                .status(400)
                .json(GenRes(400, false, null, "Payment details (paidAmount, paymentMethod, paymentProof) are required", req.url));
        }

        // Validate payment amount
        const paidAmountNum = parseFloat(paidAmount);
        if (isNaN(paidAmountNum) || paidAmountNum <= 0) {
            return res
                .status(400)
                .json(GenRes(400, false, null, "Invalid paid amount: must be a positive number", req.url));
        }

        if (paidAmountNum > totalAmount + 3) { // Allow a small buffer for rounding errors
            return res
                .status(400)
                .json(GenRes(400, null, null, "Paid amount cannot exceed total amount", req.url));
        }

        // Handle payment proof file upload
        const uploadsDir = path.join(__dirname, "..", "..", "..", "uploads", "payments");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const files = Array.isArray(req.files.paymentProof) ? req.files.paymentProof : [req.files.paymentProof];
        let paymentProofUrl = null;

        if (files.length > 0) {
            const file = files[0];
            const sanitizedName = file.originalname.replace(/\s+/g, '_');
            const shortRandom = Math.random().toString(36).substring(2, 6);
            const fileNameBase = `${Date.now().toString().slice(-8)}_${shortRandom}_${sanitizedName.split('.')[0]}`;
            const defaultExt = path.extname(sanitizedName).replace('.', '') || 'jpg';
            let finalBuffer = file.buffer;
            let finalExt = defaultExt;

            if (file && file.buffer) {
                try {
                    const compressionResult = await compressImage(file.buffer, 85, 1080, 1080);
                    if (compressionResult?.buffer) {
                        finalBuffer = compressionResult.buffer;
                        finalExt = compressionResult.format === 'jpeg' ? 'jpg' : compressionResult.format;
                        console.log(`Payment proof image compressed: ${compressionResult.originalSize} -> ${compressionResult.compressedSize} bytes (${compressionResult.compressionRatio}% reduction)`);
                    } else {
                        console.warn("Compression returned no data. Using original image buffer.");
                    }
                } catch (err) {
                    console.error("Image compression failed:", err);
                    // Fallback to original image
                }
            }

            const fileName = `${fileNameBase}.${finalExt}`;
            const filePath = path.join(uploadsDir, fileName);
            fs.writeFileSync(filePath, finalBuffer);
            paymentProofUrl = `/uploads/payments/${fileName}`;
        } else {
            return res
                .status(400)
                .json(GenRes(400, false, null, "No payment proof file provided", req.url));
        }

        // Create payment record
        const paymentRecord = {
            paymentId: `payment_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            amount: paidAmountNum,
            paymentDate: new Date(),
            paymentProof: paymentProofUrl,
            paymentMethod: paymentMethod,
            status: "pending",
        };

        paymentsArray.push(paymentRecord);

        // Update payment status and pending amount
        pendingAmount = totalAmount - paidAmountNum;
        paymentStatus = paidAmountNum >= totalAmount ? "paid" : "remaining";

        // 15. Create booking for multiple stalls
        const newBooking = new Booking({
            eventId: eventId,
            eventName: event.title,
            stallInfo: stallInfo,
            userId: userDetails.userId,
            isHold: isHold,
            totalAmount: totalAmount,
            pendingAmount: pendingAmount,
            paymentStatus: paymentStatus,
            payments: paymentsArray,
            status: "pending",
            businessInfo: businessInfo,
            contactPerson: finalContactPerson,
        });

        await newBooking.save();

        // 16. Update all stalls status to hold
        await Stall.updateMany(
            { stallId: { $in: stallIds } },
            { status: "hold" }
        );

        // 17. Send booking confirmation email
        try {
            await sendBookingMadeEmail(newBooking, businessInfo.email, finalContactPerson.email);
        } catch (emailError) {
            console.error("Failed to send booking confirmation email, but booking created:", emailError);
            // Continue with success response even if email fails
        }

        // 18. Prepare response
        let responseMessage;
        if (paymentStatus === "paid") {
            responseMessage = "Booking created successfully with full payment. A confirmation email has been sent. Awaiting admin confirmation.";
        } else {
            responseMessage = `Booking created successfully with partial payment of $${paidAmountNum.toFixed(2)}. Remaining amount: $${pendingAmount.toFixed(2)}. A confirmation email has been sent. Awaiting admin confirmation.`;
        }

        return res
            .status(201)
            .json(GenRes(201, newBooking, null, responseMessage, req.url));
    } catch (err) {
        console.error("Multiple stall booking creation error:", err);
        return res
            .status(500)
            .json(GenRes(500, null, err, err?.message, req.url));
    }
};


const createMultipleStallHold = async (req, res) => {
    try {
        // console.log("Request Body:", req.body);
        let { stallIds, contactPersonName, contactPersonEmail, contactPersonNumber } = req.body;

        // 1. Parse stallIds if it's a string
        if (typeof stallIds === "string") {
            try {
                // Try parsing as JSON if it’s a stringified array
                const parsed = JSON.parse(stallIds);
                if (Array.isArray(parsed)) {
                    stallIds = parsed;
                } else {
                    // If parsed is not an array, treat the original string as a single
                    stallId
                    stallIds = [stallIds];
                }
            } catch (e) {
                // If parsing fails, treat as a single stallId
                console.error("Error parsing stallIds:", e);
                stallIds = [stallIds];
            }
        }
        const userDetails = req.user; // From middleware
        // console.log("User Details:", userDetails?.userId, userDetails);

        // 2. Validate required fields
        if (!stallIds || !Array.isArray(stallIds) || stallIds.length === 0 || !userDetails) {
            return res
                .status(400)
                .json(GenRes(400, false, null, "Missing required fields or stallIds must be a non-empty array", req.url));
        }

        // 3. Get user information for business details
        const user = await User.findOne({ userId: userDetails.userId });
        if (!user) {
            return res
                .status(404)
                .json(GenRes(404, null, null, "User not found", req.url));
        }

        // 4. Extract business info from user
        let businessInfo = {
            name: req.body.businessName || (user.organizationDetails?.name || user.name),
            phone: req.body.businessPhone || (user.organizationDetails?.contactPerson?.phone || user.phone),
            email: req.body.businessEmail || (user.organizationDetails?.contactPerson?.email || user.email)
        };
        // console.log("Business Info:", businessInfo);

        // Validate business info
        if (!businessInfo.name  || !businessInfo.email) {
            return res
                .status(400)
                .json(GenRes(400, null, null, "User profile missing required business information", req.url));
        }

        // 5. Set contact person info (use provided or fallback to business info)
        const finalContactPerson = {
            name: contactPersonName || businessInfo.name,
            phone: contactPersonNumber || businessInfo.phone,
            email: contactPersonEmail || businessInfo.email,
        };

        // 6. Validate all stalls exist and get their details
        const stalls = await Stall.find({ stallId: { $in: stallIds } });
        // console.log("Stalls found:", stalls);
        if (stalls.length !== stallIds.length) {
            const foundStallIds = stalls.map(s => s.stallId);
            const missingStalls = stallIds.filter(id => !foundStallIds.includes(id));
            return res
                .status(404)
                .json(GenRes(404, null, null, `Stalls not found: ${missingStalls.join(', ')}`, req.url));
        }

        // 7. Check if all stalls belong to the same event
        const eventIds = [...new Set(stalls.map(s => s.eventId))];
        if (eventIds.length > 1) {
            return res
                .status(400)
                .json(GenRes(400, null, null, "All stalls must belong to the same event", req.url));
        }

        const eventId = eventIds[0];

        // 8. Get event details and check registration window
        const event = await Event.findOne({ eventId });
        if (!event) {
            return res
                .status(404)
                .json(GenRes(404, null, null, "Event not found", req.url));
        }

        // Check if booking is within registration period
        const now = new Date();
        if (event.registrationOpen && now < event.registrationOpen) {
            return res
                .status(400)
                .json(GenRes(400, null, null, "Registration has not opened yet", req.url));
        }

        if (event.registrationClose && now > event.registrationClose) {
            return res
                .status(400)
                .json(GenRes(400, null, null, "Registration has closed", req.url));
        }

        // 9. Check for existing bookings by the same user for any of these stalls
        const existingBookings = await Booking.find({
            stallId: { $in: stallIds },
            userId: userDetails.userId,
            status: { $in: ["pending", "confirmed"] },
        });

        if (existingBookings.length > 0) {
            const bookedStallIds = existingBookings.map(b => b.stallId);
            return res
                .status(400)
                .json(GenRes(400, null, null, `You already have bookings for stalls: ${bookedStallIds.join(', ')}`, req.url));
        }

        // 10. Check if any stalls are not available
        const unavailableStalls = stalls.filter(s => s.status !== "available");
        if (unavailableStalls.length > 0) {
            const unavailableStallIds = unavailableStalls.map(s => s.stallId);
            return res
                .status(400)
                .json(GenRes(400, null, null, `Stalls not available: ${unavailableStallIds.join(', ')}`, req.url));
        }

        // 11. Get stall types for pricing
        const stallTypeIds = [...new Set(stalls.map(s => s.stallTypeId))];
        const stallTypes = await StallType.find({
            typeId: { $in: stallTypeIds },
            eventId: eventId,
        });

        const stallTypeMap = stallTypes.reduce((acc, type) => {
            acc[type.typeId] = type;
            return acc;
        }, {});

        // 12. Calculate total amount and prepare stall info
        let totalAmount = 0;
        const stallInfo = [];

        for (const stall of stalls) {
            const stallType = stallTypeMap[stall.stallTypeId];
            if (!stallType) {
                return res
                    .status(404)
                    .json(GenRes(404, null, null, `Stall type not found for stall ${stall.stallId}`, req.url));
            }

            const stallAmount = stallType.rate * stallType.sizeInSqFt;
            const upcharge = stallType.upchargeInPercent ? (stallAmount * stallType.upchargeInPercent / 100) : 0;
            const stallSemiFinalAmount = stallAmount + upcharge;
            // Stall tax rate is 13% VAT (fixed)
            const stallFinalAmount = stallSemiFinalAmount * 1.13;
            totalAmount += stallFinalAmount;
            totalAmount = parseFloat(totalAmount).toFixed(2);
            totalAmount = parseFloat(totalAmount); // Ensure totalAmount is a number
            // console.log(`Stall: ${stall.stallId}, Amount: ${stallFinalAmount}`);
            // console.log(`Type of total amount: ${typeof totalAmount}`);

            stallInfo.push({
                stallName: stall.name,
                stallType: stallType.name,
                stallId: stall.stallId,
                rate: stallType.rate,
                upchargeInPercent: stallType.upchargeInPercent || 0,
                sizeInSqFt: stallType.sizeInSqFt,
            });
        }

        // 13. Set hold parameters
        let isHold = true;
        let holdExpiry = null;
        let paymentStatus = "unpaid";
        let pendingAmount = totalAmount;

        // Set holdExpiry: use event.holdExpiryPeriod if present, else default to 3 days (in minutes)
        let holdExpiryMinutes = event.holdExpiryPeriod ? event.holdExpiryPeriod : 3 * 24 * 60; // 3 days
        holdExpiry = new Date(Date.now() + holdExpiryMinutes * 60 * 1000);

        // If registrationClose exists and holdExpiry exceeds registrationClose, set holdExpiry to registrationClose
        if (event.registrationClose && holdExpiry > event.registrationClose) {
            holdExpiry = new Date(event.registrationClose);
        }

        // 14. Create booking for multiple stalls
        const newBooking = new Booking({
            eventId: eventId,
            eventName: event.title,
            stallInfo: stallInfo,
            userId: userDetails.userId,
            isHold: isHold,
            holdExpiry: holdExpiry,
            totalAmount: totalAmount,
            pendingAmount: pendingAmount,
            paymentStatus: paymentStatus,
            businessInfo: businessInfo,
            contactPerson: finalContactPerson,
        });

        await newBooking.save();

        // 15. Update all stalls status to hold
        await Stall.updateMany(
            { stallId: { $in: stallIds } },
            { status: "hold" }
        );
        console.log(newBooking);
        // 16. Send hold confirmation email
        try {
            await sendHoldingEmail(newBooking, businessInfo.email, finalContactPerson.email, event.minimumPaymentPercent);
        } catch (emailError) {
            console.error("Failed to send hold confirmation email, but booking created:", emailError);
            // Continue with success response even if email fails
        }

        // 17. Prepare response
        const responseMessage = `Stalls held successfully. Hold expires at ${holdExpiry.toLocaleDateString()}. A confirmation email has been sent. Please complete at least 50% payment ($${(totalAmount * 0.5).toFixed(2)}) within 3 days to confirm booking.`;

        return res
            .status(201)
            .json(GenRes(201, newBooking, null, responseMessage, req.url));
    } catch (err) {
        console.error("Multiple stall hold creation error:", err);
        return res
            .status(500)
            .json(GenRes(500, null, err, err?.message, req.url));
    }
};




// ✅ Helper function to handle hold expiry cleanup
const cleanupExpiredHolds = async () => {
    try {
        const now = new Date();

        // Find all expired hold bookings
        const expiredHolds = await Booking.find({
            isHold: true,
            holdExpiry: { $lt: now },
            status: "pending"
        });

        if (expiredHolds.length > 0) {
            // Update expired bookings
            await Booking.updateMany(
                {
                    isHold: true,
                    holdExpiry: { $lt: now },
                    status: "pending"
                },
                {
                    status: "cancelled",
                    isHold: false,
                    bookingCancelReason: "Hold period expired"
                }
            );

            // Release stalls back to available
            const expiredStallIds = expiredHolds.flatMap(booking =>
                booking.stallInfo.map(info => info.stallId)
            );

            await Stall.updateMany(
                { stallId: { $in: expiredStallIds } },
                { status: "available" }
            );

            console.log(`Cleaned up ${expiredHolds.length} expired hold bookings`);
        }
    } catch (error) {
        console.error("Error cleaning up expired holds:", error);
    }
};

// ✅ Function to convert hold to confirmed booking (when payment is made)
const confirmHoldBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userDetails = req.user;

        const booking = await Booking.findOne({
            bookingId: bookingId,
            userId: userDetails.userId,
            isHold: true,
            status: "pending"
        });

        if (!booking) {
            return res
                .status(404)
                .json(GenRes(404, null, null, "Hold booking not found", req.url));
        }

        // Check if hold has expired
        if (booking.holdExpiry && new Date() > booking.holdExpiry) {
            return res
                .status(400)
                .json(GenRes(400, null, null, "Hold period has expired", req.url));
        }

        // Handle payment proof file upload
        let paymentProofArray = booking.paymentProof || [];

        if (req.files?.paymentProof) {
            const uploadsDir = path.join(
                __dirname,
                "..",
                "..",
                "..",
                "uploads",
                "payments"
            );

            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const files = Array.isArray(req.files.paymentProof) ? req.files.paymentProof : [req.files.paymentProof];

            for (const file of files) {
                file.originalname = file.originalname.replace(/\s+/g, '_');
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${file.originalname}`;
                const filePath = path.join(uploadsDir, fileName);

                fs.writeFileSync(filePath, file.buffer);
                paymentProofArray.push(`/uploads/payments/${fileName}`);
            }
        }

        // Update booking
        booking.isHold = false;
        booking.holdExpiry = undefined;
        booking.paymentProof = paymentProofArray;
        booking.paymentStatus = paymentProofArray.length > 0 ? "remaining" : "unpaid";

        await booking.save();

        return res
            .status(200)
            .json(
                GenRes(200, booking, null, "Hold booking confirmed successfully. Awaiting admin approval.", req.url)
            );

    } catch (err) {
        console.error("Confirm hold booking error:", err);
        return res.status(500).json(GenRes(500, null, err, err?.message, req.url));
    }
};

module.exports = {
    createMultipleStallBooking,
    createMultipleStallHold,
    cleanupExpiredHolds,
    confirmHoldBooking
};