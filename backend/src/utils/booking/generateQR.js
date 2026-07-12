const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

const generateBookingQRCode = async (text, bookingId) => {
    const qrDirectory = path.join(__dirname, "..", "..", "..", "uploads", "bookingqr");
    const filePath = path.join(qrDirectory, `${bookingId}.png`); // bookingId stays lowercase in filename

    try {
        // Step 1: Ensure QR directory exists
        if (!fs.existsSync(qrDirectory)) {
            fs.mkdirSync(qrDirectory, { recursive: true });
            console.log(`Created directory: ${qrDirectory}`);
        }

        // Step 2: Ensure filePath is not a directory
        if (fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory()) {
            const errMsg = `Expected a file at ${filePath} but found a directory.`;
            console.error(errMsg);
            throw new Error(errMsg);
        }

        // Step 3: Prepare QR text (uppercase bookingId, printable format)
        const qrText = `MADEBY:EVENTSOLUTION+BOOKINGID:${bookingId.toUpperCase()}+API:/booking/`;
        console.log('QR Code Text:', qrText);

        // Step 4: Generate QR code
        await QRCode.toFile(filePath, qrText, {
            errorCorrectionLevel: 'H',
            type: 'png',
            scale: 7,
            margin: 1,
        });
        console.log(`QR code generated at: ${filePath}`);

        // Step 5: Confirm QR code creation
        if (!fs.existsSync(filePath)) {
            const errMsg = `QR code file not found at expected path: ${filePath}`;
            console.error(errMsg);
            throw new Error(errMsg);
        }

        // Return the public-facing path
        return "/uploads/bookingqr/" + bookingId + ".png";
    } catch (error) {
        console.error('Error generating booking QR code:', error.message);
        console.error(error.stack);
        throw new Error(`Failed to generate booking QR code: ${error.message}`);
    }
};

module.exports = {
    generateBookingQRCode
};
