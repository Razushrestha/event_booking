const { sendEmail } = require("../../utils/booking/sendEmail.js");
const GenRes = require("../../utils/router/GenRes.js");
const Event = require("../event/event.model.js");
const Booking = require("./booking.model.js");
const Stall = require("../stall/stall.model.js");
const path = require("path");
const {sendBookingHoldReminderEmail} = require("../../utils/booking/sendEmail.js");
const bookingCancel = async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        const booking = await Booking.findOne({ bookingId });

        if (!booking) {
            return res
                .status(404)
                .json(GenRes(404, null, null, "Booking not found", req.url));
        }

        // 2. Check if booking is already cancelled or completed
        if (booking.status === "cancelled") {
            return res
                .status(400)
                .json(GenRes(400, null, null, "Booking already cancelled", req.url));
        }

        // Commented this out for testing reason uncomment this in production
        // if (booking.status === "confirmed") {
        //     return res
        //         .status(400)
        //         .json(GenRes(400, null, null, "Booking is confirmed and cannot be cancelled", req.url));
        // }

        // if (booking.status === "completed") {
        //     return res
        //         .status(400)
        //         .json(GenRes(400, null, null, "Booking already completed", req.url));
        // }

        // 3. Get all stall IDs from stallInfo
        // Collect unique stall IDs from booking.stallInfo and booking.stallId (if present)
        let stallIds = [];
        if (Array.isArray(booking.stallInfo)) {
            stallIds = booking.stallInfo.map(stall => stall.stallId);
        }
        if (booking.stallId && !stallIds.includes(booking.stallId)) {
            stallIds.push(booking.stallId);
        }
        // Remove duplicates just in case
        stallIds = [...new Set(stallIds)];
        if (!stallIds || stallIds.length === 0) {
            return res
                .status(400)
                .json(GenRes(400, null, null, "No stalls associated with this booking", req.url));
        }

        // 4. Validate all stalls exist
        const stalls = await Stall.find({ stallId: { $in: stallIds } });
        if (stalls.length !== stallIds.length) {
            const foundStallIds = stalls.map(s => s.stallId);
            const missingStalls = stallIds.filter(id => !foundStallIds.includes(id));
            return res
                .status(404)
                .json(GenRes(404, null, null, `Stalls not found: ${missingStalls.join(', ')}`, req.url));
        }

        // 5. Update booking and stall statuses
        booking.status = "cancelled";
        const cancellationReason = (req.body && typeof req.body.reason === 'string' && req.body.reason.trim() !== '')
            ? req.body.reason
            : "No reason provided";
        booking.bookingCancelReason = cancellationReason;

        // Update all stalls to available
        await Stall.updateMany(
            { stallId: { $in: stallIds } },
            { status: "available" }
        );

        await booking.save();

        // 6. Send cancellation email
        try {
            const stallDetails = booking.stallInfo
                .map(stall => `<p><strong>Stall:</strong> ${stall.stallName} (ID: ${stall.stallId})</p>`)
                .join('');

            const emailOptions = {
                to: [booking.businessInfo.email, booking.contactPerson?.email].filter(email => email && typeof email === "string"),
                subject: `Stall Hold Cancellation - ${booking.bookingId}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d32f2f;">Stall Hold Cancelled</h2>
            <p>Dear ${booking.businessInfo.name},</p>
            <p>We regret to inform you that your stalls hold has been cancelled.</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Booking Details:</h3>
              <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
              <p><strong>Business Name:</strong> ${booking.businessInfo.name}</p>
              <p><strong>Event Name:</strong> ${booking.eventName}</p>
              ${stallDetails}
              <p><strong>Cancellation Reason:</strong> ${cancellationReason}</p>
              <p><strong>Cancelled On:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <p>If you have any questions or concerns regarding this cancellation, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>EventSolutions</p>
          </div>
        `,
                text: `
          Stall Hold Cancelled
          
          Dear ${booking.businessInfo.name},
          
          We regret to inform you that your stalls hold has been cancelled.
          
          Booking Details:
          - Booking ID: ${booking.bookingId}
          - Business Name: ${booking.businessInfo.name}
          - Event Name: ${booking.eventName}
          ${booking.stallInfo.map(stall => `- Stall: ${stall.stallName} (ID: ${stall.stallId})`).join('\n')}
          - Cancellation Reason: ${cancellationReason}
          - Cancelled On: ${new Date().toLocaleDateString()}
          
          If you have any questions or concerns regarding this cancellation, please don't hesitate to contact us.
          
          Best regards,
          EventSolutions
        `
            };

            await sendEmail(emailOptions);
            console.log(`Cancellation email sent to ${booking.businessInfo.email}`);
        } catch (emailError) {
            console.error("Error sending cancellation email:", emailError);
            // Don't fail the entire operation if email fails
        }

        return res
            .status(200)
            .json(GenRes(200, booking, null, "Booking cancelled successfully", req.url));

    } catch (error) {
        console.error("Error cancelling booking:", error);
        return res
            .status(500)
            .json(GenRes(500, null, null, "Internal server error", req.url));
    }
};

const checkBookingHoldExpiry = async () => {
    try {
        console.log(`[${new Date().toISOString()}] Starting booking hold expiry check`);

        // Get current time in UTC
        const now = new Date();
        const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        // Find bookings that are on hold, not cancelled/completed, with holdExpiry
        const bookings = await Booking.find({
            isHold: true,
            holdExpiry: { $exists: true, $ne: null },
            status: { $nin: ["cancelled", "completed"] }
        }).lean();

        console.log(`Found ${bookings.length} bookings to check`);

        for (const booking of bookings) {
            try {
                const event = await Event.findOne({ eventId: booking.eventId });
                const holdExpiry = new Date(booking.holdExpiry);
                const timeDiff = holdExpiry.getTime() - now.getTime(); // Difference in milliseconds

                // Get unique email addresses
                const emails = [...new Set([
                    booking.businessInfo.email,
                    booking.contactPerson?.email
                ].filter(email => email && typeof email === "string"))];

                if (!emails.length) {
                    console.warn(`No valid emails for booking ${booking.bookingId}, skipping email actions`);
                    continue;
                }

                // Log stallInfo and stallId for debugging
                console.log(`Booking ${booking.bookingId} - stallInfo:`, booking.stallInfo, `stallId:`, booking.stallId);

                // Case 1: Hold expiry is within 24 hours
                if (timeDiff > 0 && timeDiff <= oneDayInMs) {
                    console.log(`Booking ${booking.bookingId} hold expiring soon: ${holdExpiry.toLocaleDateString()}`);
                    await sendBookingHoldReminderEmail(booking, emails, event.minimumPaymentPercent);
                }
                // Case 2: Hold expiry is past due
                else if (timeDiff <= 0) {
                    console.log(`Booking ${booking.bookingId} hold expired: ${holdExpiry.toLocaleDateString()}`);

                    // Update booking to cancelled
                    await Booking.updateOne(
                        { bookingId: booking.bookingId },
                        {
                            $set: {
                                status: "cancelled",
                                bookingCancelReason: `Hold expired on ${holdExpiry.toLocaleDateString()}`,
                                isHold: false,
                                holdExpiry: null
                            }
                        }
                    );

                    // Prepare stallIds for update
                    let stallIds = [];
                    if (Array.isArray(booking.stallInfo) && booking.stallInfo.length > 0) {
                        stallIds = booking.stallInfo
                            .filter(s => s && s.stallId) // Ensure stallId exists
                            .map(s => s.stallId);
                    } else if (booking.stallId) {
                        stallIds = [booking.stallId];
                    }

                    // Log stallIds to be updated
                    console.log(`Booking ${booking.bookingId} - Updating stalls: ${stallIds.length > 0 ? stallIds.join(", ") : "none"}`);

                    // Update associated stalls to available, if any
                    if (stallIds.length > 0) {
                        await Stall.updateMany(
                            { stallId: { $in: stallIds } },
                            { $set: { status: "available" } }
                        );
                    } else {
                        console.warn(`No valid stallIds found for booking ${booking.bookingId}, skipping stall update`);
                    }

                    // Send cancellation email
                    await sendBookingCancellationEmail(booking, emails);
                }
            } catch (error) {
                console.error(`Error processing booking ${booking.bookingId}:`, error);
                // Continue to next booking
            }
        }

        console.log(`[${new Date().toISOString()}] Completed booking hold expiry check`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Failed to check booking hold expiry:`, error);
    }
};

// This is a testing function to cancel all bookings. to be used only in development
const cancelAllBookings = async (req, res) => {
    try {
        console.log(`[${new Date().toISOString()}] Cancelling all bookings...`);

        // Find all bookings that are not cancelled or completed
        const bookings = await Booking.find({
            status: { $nin: ["cancelled", "completed"] }
        });

        if (bookings.length === 0) {
            console.log("No bookings to cancel.");
            return;
        }

        for (const booking of bookings) {
            try {
                booking.status = "cancelled";
                booking.bookingCancelReason = "Cancelled by admin";

                // Update all stalls to available
                let stallIds = [];
                if (Array.isArray(booking.stallInfo)) {
                    stallIds = booking.stallInfo.map(stall => stall.stallId);
                }
                if (booking.stallId && !stallIds.includes(booking.stallId)) {
                    stallIds.push(booking.stallId);
                }
                await Stall.updateMany(
                    { stallId: { $in: stallIds } },
                    { status: "available" }
                );

                await booking.save();
                console.log(`Cancelled booking ${booking.bookingId}`);
            } catch (error) {
                console.error(`Error cancelling booking ${booking.bookingId}:`, error);
            }
        }

        console.log(`[${new Date().toISOString()}] All bookings cancelled.`);
        res.status(200).json(GenRes(200, null, null, "All bookings cancelled successfully", "/admin/cancel-all-bookings"));
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Failed to cancel all bookings:`, error);
        return res.status(500).json(GenRes(500, null, error.message, "Failed to cancel all bookings", req.url));
    }
}

const deleteAllBookings = async (req, res) => {
    try {
        console.log(`[${new Date().toISOString()}] Deleting all bookings...`);

        // 1. Retrieve all bookings to get payment proof file paths
        const bookings = await Booking.find({}).select('payments.paymentProof');

        // 2. Collect all payment proof file paths
        const filePaths = [];
        bookings.forEach(booking => {
            if (booking.payments && Array.isArray(booking.payments)) {
                booking.payments.forEach(payment => {
                    if (payment.paymentProof) {
                        // Convert relative path to absolute path
                        const absolutePath = path.join(__dirname, '..', '..', '..', payment.paymentProof);
                        filePaths.push(absolutePath);
                    }
                });
            }
        });

        // 3. Delete all payment proof files
        for (const filePath of filePaths) {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`[${new Date().toISOString()}] Deleted file: ${filePath}`);
                } else {
                    console.warn(`[${new Date().toISOString()}] File not found: ${filePath}`);
                }
            } catch (fileError) {
                console.error(`[${new Date().toISOString()}] Failed to delete file ${filePath}:`, fileError);
                // Continue deleting other files even if one fails
            }
        }

        // 4. Delete all bookings
        const result = await Booking.deleteMany({});
        console.log(`[${new Date().toISOString()}] Deleted ${result.deletedCount} bookings.`);

        // 5. Success response
        console.log(`[${new Date().toISOString()}] All bookings and associated files deleted.`);
        return res.status(200).json(
            GenRes(200, null, null, "All bookings and associated files deleted successfully", "/admin/delete-all-bookings")
        );
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Failed to delete all bookings:`, error);
        return res.status(500).json(
            GenRes(500, null, error, "Failed to delete bookings and associated files", "/admin/delete-all-bookings")
        );
    }
};

module.exports = {
    bookingCancel,
    checkBookingHoldExpiry,
    cancelAllBookings,
    deleteAllBookings
};
