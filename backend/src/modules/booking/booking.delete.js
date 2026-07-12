const GenRes = require("../../utils/router/GenRes.js");
const Booking = require("./booking.model.js");
const Stall = require("../stall/stall.model.js");
const fs = require("fs").promises;
const path = require("path");

const deleteBooking = async (req, res) => {
    const { bookingId } = req.params;

    try {
        // Find the booking by ID
        const booking = await Booking.findOne({ bookingId });
        if (!booking) {
            return res.status(404).json(
                GenRes(404, null, null, "No booking found of this ID", req.url)
            );
        }

        // Check if the booking belongs to the user or if the user is an admin
        if (req.user.role !== 'admin' && booking.userId !== req.user.userId) {
            return res.status(403).json(
                GenRes(403, null, null, "You do not have permission to delete this booking", req.url)
            );
        }

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

        // Collect paymentProof files to delete
        const filesToDelete = [];
        if (Array.isArray(booking.paymentProof)) {
            filesToDelete.push(...booking.paymentProof);
        }
        if (Array.isArray(booking.payments)) {
            booking.payments.forEach(payment => {
                if (payment.paymentProof) filesToDelete.push(payment.paymentProof);
            });
        }

        // Delete all collected files
        const deleteFilePromises = filesToDelete.map(async (filePath) => {
            try {
                const fullPath = path.join(__dirname, "..", "..", "..", filePath); // Adjust path as needed
                await fs.access(fullPath); // Check if file exists
                await fs.unlink(fullPath); // Delete the file
            } catch (err) {
                if (err.code !== 'ENOENT') { // Ignore "file not found" errors
                    console.error(`Error deleting file ${filePath}:`, err);
                }
            }
        });

        await Promise.all(deleteFilePromises);

        // Delete the booking
        await Booking.deleteOne({ bookingId });
        return res.status(200).json(
            GenRes(200, null, null, "Booking deleted successfully", req.url)
        );
    } catch (error) {
        console.error("Error deleting booking:", error);
        return res.status(500).json(
            GenRes(500, null, null, "Internal server error", req.url)
        );
    }
};

module.exports = {
    deleteBooking,
};