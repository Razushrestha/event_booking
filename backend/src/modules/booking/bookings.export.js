const path = require('path');
const fs = require('fs');
const Booking = require('./booking.model'); // Adjust the path as necessary
const GenRes = require("../../utils/router/GenRes");
const csv = require("csv-writer");

// Simplified CSV Structure for Per-Event Bookings Export
const exportBookingsToCSV = async (req, res) => {
    try {
        const { eventId } = req.params; // Get eventId from URL params
        const { status, paymentStatus } = req.query;

        // Build query for filtering (eventId is required)
        let query = { eventId };
        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;

        // Fetch bookings for the specific event
        const bookings = await Booking.find(query)
            .sort({ createdAt: -1 })
            .lean();

        if (!bookings || bookings.length === 0) {
            return res.status(200).json(
                GenRes(200, [], null, "No bookings found for export", req.url)
            );
        }

        // Flatten data for CSV - each stall gets its own row
        const csvData = [];

        for (const booking of bookings) {
            // Handle bookings with stallInfo array (multiple stalls)
            if (booking.stallInfo && booking.stallInfo.length > 0) {
                for (let i = 0; i < booking.stallInfo.length; i++) {
                    const stall = booking.stallInfo[i];

                    // Calculate financial details
                    const baseAmount = stall.rate * stall.sizeInSqFt;
                    const upchargeAmount = baseAmount * (stall.upchargeInPercent / 100) || 0;
                    const subtotal = baseAmount + upchargeAmount;
                    const vatAmount = subtotal * 0.13; // 13% VAT
                    const finalAmount = subtotal + vatAmount;

                    // Create payments summary
                    const totalPaid = booking.payments
                        .filter(p => p.status === 'completed')
                        .reduce((sum, p) => sum + p.amount, 0);

                    const lastPaymentDate = booking.payments.length > 0
                        ? new Date(Math.max(...booking.payments.map(p => new Date(p.paymentDate)))).toLocaleDateString('en-US')
                        : '';

                    const paymentMethods = [...new Set(
                        booking.payments
                            .filter(p => p.status === 'completed')
                            .map(p => p.paymentMethod)
                    )].join(', ');

                    // Add row for this stall
                    csvData.push({
                        // Stall Information
                        stallName: stall.stallName || 'N/A',
                        stallType: stall.stallType || 'N/A',
                        stallSizeSqFt: stall.sizeInSqFt || 0,

                        // Booking Information
                        bookingId: booking.bookingId,
                        bookingStatus: booking.status,
                        isHold: booking.isHold ? 'Yes' : 'No',
                        holdExpiry: booking.holdExpiry ? new Date(booking.holdExpiry).toLocaleDateString('en-US') : '',
                        bookingDate: new Date(booking.createdAt).toLocaleDateString('en-US'),

                        // Business Information
                        businessName: booking.businessInfo.name,
                        businessPhone: booking.businessInfo.phone,
                        businessEmail: booking.businessInfo.email,

                        // Contact Person
                        contactPersonName: booking.contactPerson?.name || '',
                        contactPersonPhone: booking.contactPerson?.phone || '',
                        contactPersonEmail: booking.contactPerson?.email || '',

                        // Financial Details
                        baseRate: stall.rate || 0,
                        baseAmount: baseAmount.toFixed(2),
                        upchargePercent: stall.upchargeInPercent || 0,
                        upchargeAmount: upchargeAmount.toFixed(2),
                        subtotal: subtotal.toFixed(2),
                        vatAmount: vatAmount.toFixed(2),
                        finalAmount: finalAmount.toFixed(2),

                        // Payment Information
                        paymentStatus: booking.paymentStatus,
                        totalPaid: totalPaid.toFixed(2),
                        remainingAmount: (finalAmount - totalPaid).toFixed(2),

                        // Payment History Summary
                        totalPayments: booking.payments.length,
                        completedPayments: booking.payments.filter(p => p.status === 'completed').length,
                        lastPaymentDate: lastPaymentDate,
                        paymentMethods: paymentMethods,

                        // Additional Info
                        hasQR: booking.qr ? 'Yes' : 'No',
                        cancelReason: booking.bookingCancelReason || '',
                        multiStallBooking: booking.stallInfo.length > 1 ? 'Yes' : 'No'
                    });
                }
            } else {
                // Handle legacy bookings with single stallId
                const totalPaid = booking.payments
                    .filter(p => p.status === 'completed')
                    .reduce((sum, p) => sum + p.amount, 0);

                const lastPaymentDate = booking.payments.length > 0
                    ? new Date(Math.max(...booking.payments.map(p => new Date(p.paymentDate)))).toLocaleDateString('en-US')
                    : '';

                const paymentMethods = [...new Set(
                    booking.payments
                        .filter(p => p.status === 'completed')
                        .map(p => p.paymentMethod)
                )].join(', ');

                csvData.push({
                    // Stall Information
                    stallName: 'Legacy Booking',
                    stallType: 'N/A',
                    stallSizeSqFt: 0,

                    // Booking Information
                    bookingId: booking.bookingId,
                    bookingStatus: booking.status,
                    isHold: booking.isHold ? 'Yes' : 'No',
                    holdExpiry: booking.holdExpiry ? new Date(booking.holdExpiry).toLocaleDateString('en-US') : '',
                    bookingDate: new Date(booking.createdAt).toLocaleDateString('en-US'),

                    // Business Information
                    businessName: booking.businessInfo.name,
                    businessPhone: booking.businessInfo.phone,
                    businessEmail: booking.businessInfo.email,

                    // Contact Person
                    contactPersonName: booking.contactPerson?.name || '',
                    contactPersonPhone: booking.contactPerson?.phone || '',
                    contactPersonEmail: booking.contactPerson?.email || '',

                    // Financial Details
                    baseRate: 0,
                    baseAmount: '0.00',
                    upchargePercent: 0,
                    upchargeAmount: '0.00',
                    subtotal: (booking.totalAmount || 0).toFixed(2),
                    vatAmount: '0.00',
                    finalAmount: (booking.totalAmount || 0).toFixed(2),

                    // Payment Information
                    paymentStatus: booking.paymentStatus,
                    totalPaid: totalPaid.toFixed(2),
                    remainingAmount: ((booking.totalAmount || 0) - totalPaid).toFixed(2),

                    // Payment History Summary
                    totalPayments: booking.payments.length,
                    completedPayments: booking.payments.filter(p => p.status === 'completed').length,
                    lastPaymentDate: lastPaymentDate,
                    paymentMethods: paymentMethods,

                    // Additional Info
                    hasQR: booking.qr ? 'Yes' : 'No',
                    cancelReason: booking.bookingCancelReason || '',
                    multiStallBooking: 'No'
                });
            }
        }

        // Create CSV file
        // Fetch event name for filename
        const eventName = bookings[0]?.eventName || 'Event';
        const fileName = `Bookings_${eventName}_${Date.now()}.csv`;
        const filePath = path.join(process.cwd(), 'temp', fileName);

        // Ensure temp directory exists
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Define simplified CSV headers
        const csvWriter = csv.createObjectCsvWriter({
            path: filePath,
            header: [
                // Stall Information
                { id: 'stallName', title: 'Stall Name' },
                { id: 'stallType', title: 'Stall Type' },
                { id: 'stallSizeSqFt', title: 'Size (Sq Ft)' },

                // Booking Information
                { id: 'bookingId', title: 'Booking ID' },
                { id: 'bookingStatus', title: 'Status' },
                { id: 'bookingDate', title: 'Booking Date' },
                { id: 'isHold', title: 'Hold' },
                { id: 'holdExpiry', title: 'Hold Expiry' },

                // Business Information
                { id: 'businessName', title: 'Business Name' },
                { id: 'businessPhone', title: 'Business Phone' },
                { id: 'businessEmail', title: 'Business Email' },

                // Contact Person
                { id: 'contactPersonName', title: 'Contact Name' },
                { id: 'contactPersonPhone', title: 'Contact Phone' },
                { id: 'contactPersonEmail', title: 'Contact Email' },

                // Financial Details
                { id: 'baseRate', title: 'Rate/Sq Ft' },
                { id: 'baseAmount', title: 'Base Amount' },
                { id: 'upchargePercent', title: 'Upcharge %' },
                { id: 'upchargeAmount', title: 'Upcharge Amount' },
                { id: 'subtotal', title: 'Subtotal' },
                { id: 'vatAmount', title: 'VAT (13%)' },
                { id: 'finalAmount', title: 'Final Amount' },

                // Payment Information
                { id: 'paymentStatus', title: 'Payment Status' },
                { id: 'totalPaid', title: 'Total Paid' },
                { id: 'remainingAmount', title: 'Remaining' },
                { id: 'totalPayments', title: 'Total Payments' },
                { id: 'completedPayments', title: 'Completed Payments' },
                { id: 'lastPaymentDate', title: 'Last Payment' },
                { id: 'paymentMethods', title: 'Payment Methods' },

                // Additional Info
                { id: 'hasQR', title: 'QR Code' },
                { id: 'multiStallBooking', title: 'Multi-Stall' },
                { id: 'cancelReason', title: 'Cancel Reason' }
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
        console.error('Error exporting bookings to CSV:', err);
        return res.status(500).json(
            GenRes(500, null, err, err?.message || "Failed to export bookings", req.url)
        );
    }
};

module.exports = {
    exportBookingsToCSV
};