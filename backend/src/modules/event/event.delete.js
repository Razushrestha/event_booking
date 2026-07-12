const GenRes = require("../../utils/router/GenRes");
const Event = require("./event.model");
const Bookings = require("../booking/booking.model");
const Tickets = require("../ticket/ticket.model");
const StallType = require("../stallType/stallType.model");
const Stall = require("../stall/stall.model");
const fs = require("fs").promises;
const path = require("path");

const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the event by eventId
        const event = await Event.findOne({ eventId: id });
        if (!event) {
            return res.status(404).json(GenRes(404, null, null, "Event not found", req.url));
        }

        // Collect all file paths to delete
        const filesToDelete = [];

        // Event-related files
        if (event.poster) filesToDelete.push(event.poster);
        if (event.floorPlan) filesToDelete.push(event.floorPlan);
        if (event.proposal) filesToDelete.push(event.proposal);
        if (event.promoImages && event.promoImages.length > 0) {
            filesToDelete.push(...event.promoImages);
        }
        if (event.floorPlans && event.floorPlans.length > 0) {
            filesToDelete.push(...event.floorPlans);
        }

        // Find all bookings related to the event
        const bookings = await Bookings.find({ eventId: id });
        for (const booking of bookings) {
            // Collect paymentProof and payments.paymentProof files
            if (booking.paymentProof && booking.paymentProof.length > 0) {
                filesToDelete.push(...booking.paymentProof);
            }
            if (booking.payments && booking.payments.length > 0) {
                const paymentProofs = booking.payments
                    .filter(payment => payment.paymentProof)
                    .map(payment => payment.paymentProof);
                filesToDelete.push(...paymentProofs);
            }
            // Collect QR code file
            if (booking.qr) filesToDelete.push(booking.qr);
        }

        // Find all tickets related to the event
        const tickets = await Tickets.find({ eventId: id });
        for (const ticket of tickets) {
            // Collect paymentScreenshot and QR code files
            if (ticket.paymentScreenshot) filesToDelete.push(ticket.paymentScreenshot);
            if (ticket.qr) filesToDelete.push(ticket.qr);
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

        // Delete related database records
        // Delete bookings
        await Bookings.deleteMany({ eventId: id });

        // Delete tickets
        await Tickets.deleteMany({ eventId: id });

        // Delete stalls and stall types
        await Stall.deleteMany({ eventId: id });
        await StallType.deleteMany({ eventId: id });

        // Delete the event
        await Event.deleteOne({ eventId: id });

        return res.status(200).json(GenRes(200, null, null, "Event and related data deleted successfully", req.url));
    } catch (error) {
        console.error("Error deleting event:", error);
        return res.status(500).json(GenRes(500, null, null, "Internal server error", req.url));
    }
};

module.exports = { deleteEvent };