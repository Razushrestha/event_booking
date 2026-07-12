const path = require('path');
const fs = require('fs');
const Ticket = require('./ticket.model'); // Adjust the path as necessary
const GenRes = require("../../utils/router/GenRes");
const csv = require("csv-writer");

const exportTicketsToCSV = async (req, res) => {
    try {
        const { eventId } = req.params; // Get eventId from URL params
        const { status } = req.query;

        // Build query for filtering (eventId is required)
        let query = { eventId };
        if (status) query.status = status;

        // Fetch tickets for the specific event
        const tickets = await Ticket.find(query)
            .sort({ submittedAt: -1 })
            .lean();

        if (!tickets || tickets.length === 0) {
            return res.status(200).json(
                GenRes(200, [], null, "No tickets found for export", req.url)
            );
        }

        // Get eventName for filename (using the first ticket's eventName)
        const eventName = tickets[0].eventName ? tickets[0].eventName.replace(/[^a-zA-Z0-9]/g, '_') : 'Event';

        // Flatten data for CSV
        const csvData = tickets.map(ticket => {
            // Flatten ticketInfo and features
            const features = ticket.ticketInfo?.features?.map(f => `${f.name}: ${f.status ? 'Yes' : 'No'}`).join(', ') || '';

            return {
                // Ticket Information
                ticketId: ticket.ticketId,
                name: ticket.name || 'N/A',
                eventName: ticket.eventName || 'N/A',
                userId: ticket.userId,
                number: ticket.number,
                email: ticket.email,

                // Ticket Info
                tierName: ticket.ticketInfo?.tierName || 'N/A',
                price: ticket.ticketInfo?.price?.toFixed(2) || '0.00',
                features: features,

                // Status and Metadata
                status: ticket.status,
                submittedAt: new Date(ticket.submittedAt).toLocaleDateString('en-US'),
                updatedAt: new Date(ticket.updatedAt).toLocaleDateString('en-US'),
                hasPaymentScreenshot: ticket.paymentScreenshot ? 'Yes' : 'No',
                hasQR: ticket.qr ? 'Yes' : 'No',
                note: ticket.note || ''
            };
        });

        // Create CSV file
        const fileName = `Tickets_${eventName}.csv`;
        const filePath = path.join(process.cwd(), 'temp', fileName);

        // Ensure temp directory exists
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Define CSV headers
        const csvWriter = csv.createObjectCsvWriter({
            path: filePath,
            header: [
                // Ticket Information
                { id: 'ticketId', title: 'Ticket ID' },
                { id: 'name', title: 'Name' },
                { id: 'eventName', title: 'Event Name' },
                { id: 'userId', title: 'User ID' },
                { id: 'number', title: 'Phone Number' },
                { id: 'email', title: 'Email' },

                // Ticket Info
                { id: 'tierName', title: 'Tier Name' },
                { id: 'price', title: 'Price' },
                { id: 'features', title: 'Features' },

                // Status and Metadata
                { id: 'status', title: 'Status' },
                { id: 'submittedAt', title: 'Submitted At' },
                { id: 'updatedAt', title: 'Updated At' },
                { id: 'hasPaymentScreenshot', title: 'Payment Screenshot' },
                { id: 'hasQR', title: 'QR Code' },
                { id: 'note', title: 'Note' }
            ]
        });

        // Write CSV file
        await csvWriter.writeRecords(csvData);

        // Set response headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        // Stream the file to response
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        // Clean up the temporary file after streaming
        fileStream.on('end', () => {
            fs.unlink(filePath, (err) => {
                if (err) console.error('Error deleting temp file:', err);
            });
        });

    } catch (err) {
        console.error('Error exporting tickets to CSV:', err);
        return res.status(500).json(
            GenRes(500, null, err, err?.message || "Failed to export tickets", req.url)
        );
    }
};

module.exports = {
    exportTicketsToCSV
};