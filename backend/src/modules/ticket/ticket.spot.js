const fs = require("fs");
const path = require("path");

const GenRes = require('../../utils/router/GenRes');
const Ticket = require('./ticket.model');
const Event = require('../event/event.model');
const { generateQRCode } = require("../../utils/ticket/generateQR");
const { sendTicketConfirmationEmail } = require("../../utils/ticket/sendEmail");
const { compressImage } = require('../../utils/compressImages');
const { defaultPrintFormat } = require('../print/print.format')
const { thermalPrint } = require('../print/print.websocket');
const spotRegistrationByEmployee = async (req, res) => {
    try {
        console.log(req.body);
        // 1. Authentication check
        const requestedUser = req.user;
        if (!requestedUser) {
            return res.status(401).json(GenRes(401, null, null, 'Unauthorized access', req.url));
        }

        // 2. Extract and validate required fields
        const { eventId, number, email, tierName, name, note = '' } = req.body;
        if (!eventId || !email || !number || !tierName) {
            return res.status(400).json(GenRes(400, null, null, 'Missing required fields', req.url));
        }

        // 3. Find event and validate existence
        const event = await Event.findOne({ eventId });
        if (!event) {
            return res.status(404).json(GenRes(404, null, null, 'Event not found with provided eventId', req.url));
        }

        const start = new Date(event.startDateTime);
        const end = new Date(event.endDateTime);
        const spotOpenFrom = new Date(start.getTime() - 24 * 60 * 60 * 1000); // startDateTime - 1 day
        const now = new Date();
        if (now < spotOpenFrom || now > end) {
            return res.status(403).json(GenRes(403, null, null, 'Spot registration is not open at this time', req.url));
        }

        // 4. Find and validate ticket tier
        const ticketTier = event.ticketTiers.find(t => t.name.toLowerCase() === tierName.toLowerCase());
        if (!ticketTier) {
            return res.status(400).json(GenRes(400, null, null, 'Invalid tier name', req.url));
        }

        // 5. Handle payment screenshot validation
        const uploadedScreenshot = req.files?.paymentScreenshot?.[0];
        const isPaidTicket = ticketTier.price !== 0;

        if (isPaidTicket && (!uploadedScreenshot?.buffer || !uploadedScreenshot?.originalname)) {
            return res.status(400).json(GenRes(400, null, null, 'paymentScreenshot is required as a file', req.url));
        }

        if (uploadedScreenshot && !/\.(jpg|jpeg|png|gif|pdf|webp)$/i.test(uploadedScreenshot.originalname)) {
            return res.status(400).json(GenRes(400, null, null, 'Invalid file type for screenshot', req.url));
        }

        // 6. Determine ticket status
        const status = 'approved';

        // 7. Handle file upload if screenshot exists
        let relativeScreenshotPath = '';
        if (uploadedScreenshot) {
            const paymentDir = path.join(__dirname, "..", "..", "..", "uploads", "payment", eventId);
            if (!fs.existsSync(paymentDir)) {
                fs.mkdirSync(paymentDir, { recursive: true });
            }

            uploadedScreenshot.originalname = uploadedScreenshot.originalname.replace(/\s+/g, '_');
            const fileName = `screenshot_${Date.now()}_${uploadedScreenshot.originalname}`;
            const filePath = path.join(paymentDir, fileName);

            let fileBuffer = uploadedScreenshot.buffer;
            if (!fileBuffer) {
                return res.status(400).json(GenRes(400, null, null, 'File buffer missing from uploaded screenshot', req.url));
            }

            const isImage = /\.(jpg|jpeg|png|webp)$/i.test(uploadedScreenshot.originalname);
            if (isImage) {
                try {
                    const compressed = await compressImage(fileBuffer);
                    if (compressed?.data) {
                        fileBuffer = compressed.data;
                    } else {
                        console.warn('[Compression Warning] Compression returned no data. Saving original image.');
                    }
                } catch (err) {
                    console.error('[Compression Error]', err);
                    // Continue with original fileBuffer
                }
            }

            fs.writeFileSync(filePath, fileBuffer);
            relativeScreenshotPath = `/uploads/payment/${eventId}/${fileName}`;
        }

        // 8. Prepare ticket features
        const { price, listOfFeatures } = ticketTier;
        const featuresWithStatus = [
            { name: 'Entry', status: true },
            ...listOfFeatures.map(name => ({
                name,
                status: false
            }))
        ];

        // 9. Create and save new ticket
        const newTicket = new Ticket({
            userId: requestedUser.userId,
            eventId,
            eventName: event.title,
            number,
            name,
            email,
            status,
            ticketInfo: {
                tierName,
                price,
                features: featuresWithStatus
            },
            paymentScreenshot: relativeScreenshotPath,
            note
        });

        await newTicket.save();
        try {
            // 10. Generate QR code and save it
            const ticketData = {
                name: newTicket.name,
                eventName: newTicket.eventName,
                email: newTicket.email,
                number: newTicket.number,
                ticketId: newTicket.ticketId,
                ticketInfo: newTicket.ticketInfo
            };
            const qrData = `ACREATEDBY:EVENTSOLUTION+TICKETID:${String(newTicket.ticketId).toUpperCase()}`;


            const tspl = defaultPrintFormat(qrData, ticketData);
            await thermalPrint(tspl, req, res);

            return res.status(200).json(GenRes(200, [{ "Entry": false }], null, "Entry done. QR added to queue for printing", req.url));
        }
        catch (error) {
            console.error('[QR Generation Error]', error);
            // return res.status(500).json(GenRes(500, null, error.message, 'Error generating QR code', req.url));
        }
        // 11. Return success response for paid tickets
        return res.status(201).json(
            GenRes(201, newTicket, null, 'Ticket registered successfully', req.url)
        );

    } catch (error) {
        console.error('[Register Ticket Error]', error);
        return res.status(500).json(
            GenRes(500, null, error.message, 'Error registering ticket', req.url)
        );
    }
};

module.exports = {
    spotRegistrationByEmployee
};
