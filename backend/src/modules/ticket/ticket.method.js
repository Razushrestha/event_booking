const fs = require("fs");
const path = require("path");

const escapeRegex = require("../../utils/escapeRegex");
const GenRes = require('../../utils/router/GenRes');
const Ticket = require('./ticket.model');
const Event = require('../event/event.model');
const { generateQRCode } = require("../../utils/ticket/generateQR");
const { sendTicketConfirmationEmail } = require("../../utils/ticket/sendEmail");
const { compressImage } = require('../../utils/compressImages');

const getAllUserTickets = async (req, res) => {
    try {
        const requestedUser = req.user;
        const userId = requestedUser.userId;
        if (!requestedUser) {
            return res.status(401).json(GenRes(401, null, null, "Unauthorized"), req.url);
        }

        // Fetch tickets for the user
        const userTickets = await Ticket.find({ userId: userId });

        if (!userTickets || userTickets.length === 0) {
            return res.status(200).json(GenRes(200, [], null, "No tickets found for this user"), req.url);
        }

        return res.status(200).json(GenRes(200, userTickets, null, "Tickets retrieved successfully", req.url));
    } catch (error) {
        console.error("Error retrieving user tickets:", error);
        return res.status(500).json(GenRes(500, null, error.message, "Error retrieving tickets", req.url));
    }
}

const getTicketsDashboardByAdmin = async (req, res) => {
    try {
        // Extract pagination and filter parameters from the request
        const { page = 1, limit = 10, status, search, eventId } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        // Build query based on filters
        const query = {};
        if (status && status !== 'all') {
            query.status = status;
        }
        if (eventId) {
            query.eventId = eventId;
        }
        if (search) {
            const safeSearch = escapeRegex(search);
            query.$or = [
                { eventName: { $regex: safeSearch, $options: 'i' } },
                { 'ticketInfo.tierName': { $regex: safeSearch, $options: 'i' } },
                { name: { $regex: safeSearch, $options: 'i' } },
            ];
        }

        // Fetch tickets with pagination
        const tickets = await Ticket.find(query)
            .sort({ submittedAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('userId', 'name email')
            .select('ticketId userId name eventId eventName ticketInfo status submittedAt');

        // Count total tickets for pagination
        const totalCount = await Ticket.countDocuments(query);

        // Fetch ticket counts for metrics
        const ticketCountPromises = ['pending', 'approved', 'rejected'].map(status =>
            Ticket.countDocuments({ status })
        );
        const [pendingCount, approvedCount, rejectedCount] = await Promise.all(ticketCountPromises);

        // Event-wise ticket summary
        const ticketStats = await Ticket.aggregate([
            {
                $group: {
                    _id: '$eventId',
                    total: { $sum: 1 },
                    pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                    approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
                    rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
                },
            },
            {
                $lookup: {
                    from: 'events',
                    localField: '_id',
                    foreignField: 'eventId',
                    as: 'event',
                },
            },
            { $unwind: '$event' },
            {
                $project: {
                    eventId: '$_id',
                    eventName: '$event.title',
                    total: 1,
                    pending: 1,
                    approved: 1,
                    rejected: 1,
                    _id: 0,
                },
            },
        ]);

        // Calculate total revenue
        const totalRevenueAgg = await Ticket.aggregate([
            { $match: { status: 'approved' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$ticketInfo.price' },
                },
            },
        ]);
        const totalRevenue = totalRevenueAgg[0]?.totalRevenue || 0;

        // Build pagination metadata
        const totalPages = Math.ceil(totalCount / limitNum);
        const hasNext = pageNum < totalPages;
        const hasPrev = pageNum > 1;

        // Create the response data object
        const responseData = {
            tickets,
            eventTicketStats: ticketStats,
            metrics: {
                totalRevenue,
                totalTickets: totalCount,
                pending: pendingCount,
                approved: approvedCount,
                rejected: rejectedCount,
            },
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum,
                hasNext,
                hasPrev,
                nextPage: hasNext ? pageNum + 1 : null,
                prevPage: hasPrev ? pageNum - 1 : null,
            },
            filters: {
                status: status || null,
                eventId: eventId || null,
                search: search || null,
                startDate: null, // Add if needed
                endDate: null,   // Add if needed
                sortBy: 'submittedAt',
                sortOrder: 'desc',
            },
        };

        // Final Response
        const finalResponse = GenRes(200, responseData, null, 'Dashboard data fetched successfully', req.url);
        return res.status(200).json(finalResponse);
    } catch (error) {
        return res.status(500).json(GenRes(500, null, error.message, 'Dashboard fetch failed', req.url));
    }
};

const getTicketById = async (req, res) => {
    try {
        const requestedUser = req.user;
        const userId = requestedUser.userId;
        const ticketId = req.params.ticketId;
        console.log("Ticket ID:", ticketId);

        if (!requestedUser) {
            return res.status(401).json(GenRes(401, null, null, "Unauthorized", req.url));
        }
        // console.log(requestedUser);

        let ticket;

        if (requestedUser.role === 'admin') {
            console.log("Admin access, fetching ticket by ID without userId filter");
            ticket = await Ticket.findOne({ ticketId });
        } else {
            console.log("User access, fetching ticket by ID with userId filter");
            ticket = await Ticket.findOne({ ticketId, userId: requestedUser.userId });
        }

        if (!ticket) {
            return res.status(404).json(GenRes(404, null, null, "Ticket not found", req.url));
        }

        return res.status(200).json(GenRes(200, ticket, null, "Ticket retrieved successfully", req.url));
    } catch (error) {
        return res.status(500).json(GenRes(500, null, error, "Error retrieving ticket", req.url));
    }
};

const registerTicket = async (req, res) => {
    try {
        // 1. Authentication check
        const requestedUser = req.user;
        let attendeeImagePath = '';
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

        if (event.ticketNeedsAttendeeImage) {
            const attendeeImage = req.files?.attendeeImage?.[0];
            if (!attendeeImage?.buffer || !attendeeImage?.originalname) {
                return res.status(400).json(GenRes(400, null, null, 'attendeeImage is required as a file', req.url));
            }
            if (!/\.(jpg|jpeg|png|gif|pdf|webp)$/i.test(attendeeImage.originalname)) {
                return res.status(400).json(GenRes(400, null, null, 'Invalid file type for attendee image', req.url));
            }
            const attendeeDir = path.join(__dirname, "..", "..", "..", "uploads", "attendee", eventId);
            if (!fs.existsSync(attendeeDir)) {
                fs.mkdirSync(attendeeDir, { recursive: true });
            }

            attendeeImage.originalname = attendeeImage.originalname.replace(/\s+/g, '_');
            const fileName = `attendee_${Date.now()}_${attendeeImage.originalname}`;
            const filePath = path.join(attendeeDir, fileName);

            let fileBuffer = attendeeImage.buffer;
            if (!fileBuffer) {
                return res.status(400).json(GenRes(400, null, null, 'File buffer missing from uploaded attendee image', req.url));
            }
            const isImage = /\.(jpg|jpeg|png|webp)$/i.test(attendeeImage.originalname);
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
            attendeeImagePath = `/uploads/attendee/${eventId}/${fileName}`;
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
        const status = isPaidTicket ? undefined : 'approved';

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
            { name: 'Entry', status: false },
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
            attendeeImage: attendeeImagePath,
            ticketInfo: {
                tierName,
                price,
                features: featuresWithStatus
            },
            paymentScreenshot: relativeScreenshotPath,
            note
        });

        await newTicket.save();

        // 10. Handle free ticket approval (generate QR code)
        if (!isPaidTicket) {
            const url = await generateQRCode(JSON.stringify(newTicket), newTicket.ticketId);
            newTicket.qr = url;
            await newTicket.save();

            try {
                await sendTicketConfirmationEmail({
                    ticketId: newTicket.ticketId,
                    eventId: newTicket.eventId,
                    eventName: newTicket.eventName,
                    name: newTicket.name,
                    email: newTicket.email,
                    ticketInfo: newTicket.ticketInfo,
                    qr: newTicket.qr
                });
            } catch (emailError) {
                console.error('[Ticket Email Error]', emailError);
                return res.status(200).json(
                    GenRes(201, newTicket, null, 'Ticket approved successfully but email not sent to ' + newTicket.email, req.url)
                );
            }

            return res.status(200).json(
                GenRes(201, newTicket, null, 'Ticket approved successfully', req.url)
            );
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

const getTicketsByEventId = async (req, res) => {
    try {
        // Extract eventId, pagination, and filter parameters from the request
        const { eventId } = req.params;
        const { page = 1, limit = 10, status, search } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        // Build query based on eventId and filters
        const query = { eventId };
        if (status && status !== 'all') {
            query.status = status;
        }
        if (search) {
            query.$or = [
                { 'ticketInfo.tierName': { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
            ];
        }

        // Fetch tickets with pagination
        const tickets = await Ticket.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('userId', 'name email')
            .select('ticketId userId name eventId eventName ticketInfo status createdAt');

        // Count total tickets for pagination
        const totalCount = await Ticket.countDocuments(query);

        // Fetch ticket counts for metrics
        const ticketCountPromises = ['pending', 'approved', 'rejected'].map(status =>
            Ticket.countDocuments({ eventId, status })
        );
        const [pendingCount, approvedCount, rejectedCount] = await Promise.all(ticketCountPromises);

        // Calculate total revenue for the event
        const totalRevenueAgg = await Ticket.aggregate([
            { $match: { eventId, status: 'approved' } },
            { $unwind: '$ticketInfo' },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$ticketInfo.price' },
                },
            },
        ]);
        const totalRevenue = totalRevenueAgg[0]?.totalRevenue || 0;

        // Fetch event details
        const event = await Event.findOne({ eventId }).select('title description');

        // Build pagination metadata
        const totalPages = Math.ceil(totalCount / limitNum);
        const hasNext = pageNum < totalPages;
        const hasPrev = pageNum > 1;

        // Create the response data object
        const responseData = {
            tickets,
            eventDetails: {
                eventId,
                eventName: event?.title || '',
                description: event?.description || '',
            },
            metrics: {
                totalRevenue,
                totalTickets: totalCount,
                pending: pendingCount,
                approved: approvedCount,
                rejected: rejectedCount,
            },
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum,
                hasNext,
                hasPrev,
                nextPage: hasNext ? pageNum + 1 : null,
                prevPage: hasPrev ? pageNum - 1 : null,
            },
            filters: {
                status: status || null,
                search: search || null,
                sortBy: 'createdAt',
                sortOrder: 'desc',
            },
        };

        // Final Response
        const finalResponse = GenRes(200, responseData, null, `Tickets for event ${eventId} fetched successfully`, req.url);
        return res.status(200).json(finalResponse);
    } catch (error) {
        return res.status(500).json(GenRes(500, null, error.message, `Failed to fetch tickets for event ${eventId}`, req.url));
    }
};
module.exports = {
    getAllUserTickets,
    registerTicket,
    getTicketById,
    getTicketsDashboardByAdmin,
    getTicketsByEventId
}