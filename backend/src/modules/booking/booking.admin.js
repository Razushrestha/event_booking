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

const createMultipleStallBookingByAdmin = async (req, res) => {
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
        const user = req.user;
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
        if (!businessInfo.name  || !businessInfo.email) {
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
        let bookingStatus;
        if (pendingAmount === 0) {
            bookingStatus = "completed";
        } else {
            bookingStatus = "confirmed";
        }

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
            status: bookingStatus,
            businessInfo: businessInfo,
            contactPerson: finalContactPerson,
        });

        await newBooking.save();

        // 16. Update all stalls status to hold
        await Stall.updateMany(
            { stallId: { $in: stallIds } },
            { status: "booked" }
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
            responseMessage = `Booking created successfully with partial payment of Rs${paidAmountNum.toFixed(2)}. Remaining amount: Rs${pendingAmount.toFixed(2)}. A confirmation email has been sent. Awaiting admin confirmation.`;
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
}

const holdMultipleStallByAdmin = async (req, res) => {
    try {

    }
    catch (err) {
        console.error("Error holding multiple stalls by admin:", err);
        return res
            .status(500)
            .json(GenRes(500, null, err, "Internal server error", req.url));
    }
}

module.exports = {
    createMultipleStallBookingByAdmin,
    holdMultipleStallByAdmin,
};