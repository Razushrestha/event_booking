const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

const generateQRCode = async (text, ticketId) => {
    try {
        const qrDirectory = path.join(__dirname, "..", "..", "..", "uploads", "qr");
        const filePath = path.join(qrDirectory, `${ticketId}.png`);

        if (!fs.existsSync(qrDirectory)) {
            fs.mkdirSync(qrDirectory, { recursive: true });
        }

        // If a directory with the same name exists as filePath, throw error
        if (fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory()) {
            throw new Error(`Expected file path but found a directory at: ${filePath}`);
        }
        ticketId = String(ticketId).toUpperCase();
        // ✅ Preserve lowercase ticketId in QR content
        const qrText = `CREATEDBY:EVENTSOLUTION+TICKETID:${ticketId}`;
        console.log('QR Code Text:', qrText);

        // Generate QR code
        await QRCode.toFile(filePath, qrText, {
            errorCorrectionLevel: 'H',
            type: 'png',
            scale: 7,
            margin: 1,
        });
        ticketId = String(ticketId).toLowerCase(); // Convert ticketId to lowercase for consistency

        if (!fs.existsSync(filePath)) {
            throw new Error('QR code file not found after generation');
        }

        // Return relative path for serving via Express or static middleware
        return "/uploads/qr/" + ticketId + ".png";
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw new Error('Failed to generate QR code');
    }
};

module.exports = {
    generateQRCode
};
