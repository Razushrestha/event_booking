const GenRes = require("../../utils/router/GenRes");
const Event = require("./event.model");
const fs = require("fs");
const path = require("path");
const { compressImage } = require('../../utils/compressImages');
function isValidTimeFormat(value) {
    // Regular expression for HH:mm format (24-hour)
    const timeFormat = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeFormat.test(value);
}

const getAllEvents = async (req, res) => {
    try {
        const {
            sortBy = 'closest',
            search = '',
            status = '',
            entryType = '',
            page = 1,
            limit = 12
        } = req.query;

        // Validate sortBy
        const validSorts = ['closest', 'furthest', 'newest', 'oldest', 'alphabetical'];
        if (!validSorts.includes(sortBy)) {
            return res.status(400).json(
                GenRes(400, null, null, "Invalid sortBy value. Use: closest, furthest, newest, oldest, alphabetical", req.url)
            );
        }

        // Validate status
        const validStatuses = ['', 'upcoming', 'ongoing', 'past'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json(
                GenRes(400, null, null, "Invalid status value. Use: upcoming, ongoing, past", req.url)
            );
        }

        // Validate entryType
        const validEntryTypes = ['', 'Free', 'Paid'];
        if (entryType && !validEntryTypes.includes(entryType)) {
            return res.status(400).json(
                GenRes(400, null, null, "Invalid entryType value. Use: Free, Paid", req.url)
            );
        }

        // Validate pagination
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);

        if (isNaN(pageNumber) || pageNumber < 1) {
            return res.status(400).json(
                GenRes(400, null, null, "Invalid page number. Must be a positive integer.", req.url)
            );
        }

        if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 50) {
            return res.status(400).json(
                GenRes(400, null, null, "Invalid limit. Must be between 1 and 50.", req.url)
            );
        }

        // Build base query - only show public events
        let baseQuery = {}; // public: any (no filter)

        // Add search functionality
        if (search.trim()) {
            const searchRegex = { $regex: search.trim(), $options: 'i' };
            baseQuery.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { location: searchRegex },
                { organizer: searchRegex },
                { eventType: searchRegex }
            ];
        }

        // Add entry type filter
        if (entryType) {
            baseQuery.entryType = entryType;
        }

        // Add status-based time filtering
        const now = new Date();
        if (status === 'upcoming') {
            baseQuery.startDateTime = { $gt: now };
        } else if (status === 'ongoing') {
            baseQuery.startDateTime = { $lte: now };
            baseQuery.endDateTime = { $gte: now };
        } else if (status === 'past') {
            baseQuery.endDateTime = { $lt: now };
        }

        // Map sortBy to MongoDB sort criteria
        const sortCriteria = {
            closest: { startDateTime: 1 }, // Closest events first
            furthest: { startDateTime: -1 }, // Furthest events first
            newest: { createdAt: -1 }, // Most recently created
            oldest: { createdAt: 1 }, // Oldest created first
            alphabetical: { title: 1 } // A-Z by title
        }[sortBy];

        // Calculate pagination
        const skip = (pageNumber - 1) * limitNumber;

        // Get total count for the current filters
        const totalCount = await Event.countDocuments(baseQuery);

        // If no events found, return empty result
        if (totalCount === 0) {
            const emptyResponse = {
                events: [],
                pagination: {
                    currentPage: pageNumber,
                    totalPages: 0,
                    totalCount: 0,
                    limit: limitNumber,
                    hasNext: false,
                    hasPrev: false,
                    nextPage: null,
                    prevPage: null
                },
                filters: {
                    search: search.trim(),
                    status,
                    entryType,
                    sortBy
                }
            };
            return res.status(200).json(
                GenRes(200, emptyResponse, null, "No events found matching the criteria", req.url)
            );
        }

        // Get events with pagination and sorting
        const events = await Event.find(baseQuery)
            .sort(sortCriteria)
            .skip(skip)
            .limit(limitNumber)
            .select('eventId title description location organizer startDateTime endDateTime eventType poster entryType createdAt updatedAt');

        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / limitNumber);
        const pagination = {
            currentPage: pageNumber,
            totalPages,
            totalCount,
            limit: limitNumber,
            hasNext: pageNumber < totalPages,
            hasPrev: pageNumber > 1,
            nextPage: pageNumber < totalPages ? pageNumber + 1 : null,
            prevPage: pageNumber > 1 ? pageNumber - 1 : null
        };

        // Prepare response data
        const responseData = {
            events,
            pagination,
            filters: {
                search: search.trim(),
                status,
                entryType,
                sortBy
            }
        };

        return res.status(200).json(
            GenRes(200, responseData, null, "Events fetched successfully", req.url)
        );

    } catch (err) {
        console.error('Error in getAllEvents:', err);
        return res.status(500).json(
            GenRes(500, null, err, err?.message || "Failed to fetch events", req.url)
        );
    }
};

const getLandingPageData = async (req, res) => {
    try {
        const now = new Date();

        // Define category icons once
        const categoryIcons = {
            Concerts: "music",
            Concert: "music",
            Movies: "film",
            Theater: "drama",
            Sports: "trophy",
            Workshops: "book-open",
            Online: "monitor",
            Conference: "presentation",
            Exhibition: "gallery",
            Festival: "party-popper",
            Wellness: "heart",
            Community: "users",
            Other: "calendar"
        };

        // Optimize featured event query with single aggregation pipeline
        const featuredEventPipeline = [
            {
                $facet: {
                    // Try earliest upcoming own event first (from current date onwards)
                    earliestUpcomingOwnEvent: [
                        { $match: { startDateTime: { $gte: now }, ownEvent: true } },
                        { $sort: { startDateTime: 1 } },
                        { $limit: 1 }
                    ],
                    // Fallback: earliest upcoming event from any organizer
                    earliestUpcomingEvent: [
                        { $match: { startDateTime: { $gte: now } } },
                        { $sort: { startDateTime: 1 } },
                        { $limit: 1 }
                    ]
                }
            },
            {
                $project: {
                    selectedEvent: {
                        $cond: {
                            if: { $gt: [{ $size: "$earliestUpcomingOwnEvent" }, 0] },
                            then: { $arrayElemAt: ["$earliestUpcomingOwnEvent", 0] },
                            else: { $arrayElemAt: ["$earliestUpcomingEvent", 0] }
                        }
                    }
                }
            },
            {
                $replaceRoot: { newRoot: "$selectedEvent" }
            },
            {
                $project: {
                    eventId: 1,
                    title: 1,
                    eventType: 1,
                    location: 1,
                    description: 1,
                    startDateTime: 1,
                    poster: 1,
                    entryType: 1,
                    ownEvent: 1,
                    ticketTiers: 1
                }
            }
        ];

        // Single aggregation to get upcoming events with type counts
        const upcomingEventsPipeline = [
            { $match: { startDateTime: { $gte: now } } },
            {
                $facet: {
                    // Get upcoming events (limited to 4, sorted by date)
                    upcomingEvents: [
                        { $sort: { startDateTime: 1 } },
                        { $limit: 4 },
                        {
                            $project: {
                                eventId: 1,
                                title: 1,
                                eventType: 1,
                                startDateTime: 1,
                                location: 1,
                                ticketTiers: 1,
                                poster: 1,
                                entryType: 1,
                                ownEvent: 1
                            }
                        }
                    ],
                    // Count event types for categories
                    eventTypeCounts: [
                        {
                            $group: {
                                _id: { $ifNull: ["$eventType", "Other"] },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { count: -1 } } // Sort by count descending
                    ]
                }
            }
        ];

        // Execute both queries in parallel for better performance
        const [featuredEventResult, upcomingEventsResult] = await Promise.all([
            Event.aggregate(featuredEventPipeline),
            Event.aggregate(upcomingEventsPipeline)
        ]);

        // Extract results
        const featuredEventObj = featuredEventResult[0] || null;
        const { upcomingEvents = [], eventTypeCounts = [] } = upcomingEventsResult[0] || {};

        // console.log('Featured Event:', featuredEventObj); // Debug log

        // Process categories from aggregation results
        const categories = eventTypeCounts.map(({ _id: name, count }) => ({
            name,
            icon: categoryIcons[name] || categoryIcons.Other,
            count: `${count} Event${count !== 1 ? 's' : ''}`
        }));

        // Helper function to calculate price label
        const calculatePriceLabel = (event) => {
            if (event.entryType !== "paid") {
                return "Free Entry";
            }

            if (!event.ownEvent) {
                return "Paid Event";
            }

            if (Array.isArray(event.ticketTiers) && event.ticketTiers.length > 0) {
                const validPrices = event.ticketTiers
                    .map(tier => parseFloat(tier.price))
                    .filter(price => !isNaN(price));

                if (validPrices.length === 0) {
                    return "Paid Event";
                }

                const minPrice = Math.min(...validPrices);
                return minPrice === 0 ? "Free Entry" : `From Rs${minPrice}`;
            }

            return "Paid Event";
        };

        // Build response data
        const landingPageData = {
            featuredEvent: featuredEventObj ? {
                eventId: featuredEventObj.eventId,
                title: featuredEventObj.title,
                type: featuredEventObj.eventType,
                date: featuredEventObj.startDateTime.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                }),
                location: featuredEventObj.location,
                description: featuredEventObj.description,
                poster: featuredEventObj.poster || null,
                price: calculatePriceLabel(featuredEventObj)
            } : null,
            upcomingEvents: upcomingEvents.map(event => ({
                eventId: event.eventId,
                title: event.title,
                type: event.eventType,
                date: event.startDateTime.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                }),
                location: event.location,
                price: calculatePriceLabel(event),
                image: `bg-gradient-to-r from-${(event.eventType?.toLowerCase() || 'other')}-400 to-${(event.eventType?.toLowerCase() || 'other')}-500`,
                poster: event.poster || null
            })),
            categories
        };

        return res.status(200).json({
            status: 200,
            data: landingPageData,
            error: null,
            message: "Landing page data fetched successfully",
            path: req.url
        });

    } catch (err) {
        console.error('Error in getLandingPageData:', err);

        // Return error response in same format
        return res.status(500).json({
            status: 500,
            data: null,
            error: err.message || "Internal server error",
            message: "Failed to fetch landing page data",
            path: req.url
        });
    }
};
const getEventById = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findOne({ eventId });
        if (!event) {
            return res.status(404).json(GenRes(404, null, null, "Event not found", req.url));
        }
        return res.status(200).json(GenRes(200, event, null, "Event fetched successfully", req.url));
    } catch (err) {
        return res.status(500).json(GenRes(500, null, err, err?.message, req.url));
    }
}

const addEvent = async (req, res) => {
    console.log("Adding event with body:", req.body);
    try {
        const {
            title,
            description,
            startDateTime,
            endDateTime,
            entryType,
            eventType,
            ticketTiers,
            location,
            googleMapUrl,
            organizer,
            organizerLogo,
            managedBy,
            managedByLogo,
            ownEvent,
            hasStalls,
            scheduleStart,
            scheduleEnd,
            registrationOpen,
            registrationClose,
            minimumPaymentPercent,
            ticketNeedsAttendeeImage,
            externalLink
        } = req.body;

        // Validate required fields
        if (!title || !description || !startDateTime) {
            return res.status(400).json(GenRes(400, null, null, "Missing required fields", req.url));
        }

        // Validate scheduleStart and scheduleEnd if provided
        if (scheduleStart && !isValidTimeFormat(scheduleStart)) {
            return res.status(400).json(GenRes(400, null, null, "Invalid scheduleStart format (use HH:mm)", req.url));
        }
        if (scheduleEnd && !isValidTimeFormat(scheduleEnd)) {
            return res.status(400).json(GenRes(400, null, null, "Invalid scheduleEnd format (use HH:mm)", req.url));
        }

        // Validate registrationOpen and registrationClose if hasStalls is true
        const parsedHasStalls = hasStalls !== undefined ? (typeof hasStalls === "string" ? hasStalls.toLowerCase() === "true" : Boolean(hasStalls)) : false;
        if (parsedHasStalls) {
            if (!registrationOpen || !registrationClose) {
                return res.status(400).json(GenRes(400, null, null, "registrationOpen and registrationClose are required when hasStalls is true", req.url));
            }
            const openDate = new Date(registrationOpen);
            const closeDate = new Date(registrationClose);
            if (isNaN(openDate.getTime()) || isNaN(closeDate.getTime())) {
                return res.status(400).json(GenRes(400, null, null, "Invalid date format for registrationOpen or registrationClose", req.url));
            }
            if (closeDate <= openDate) {
                return res.status(400).json(GenRes(400, null, null, "registrationClose must be after registrationOpen", req.url));
            }
            // Validate minimumPaymentPercent if provided
            const parsedMinimumPaymentPercent = minimumPaymentPercent !== undefined ? parseFloat(minimumPaymentPercent) : 0;
            if (isNaN(parsedMinimumPaymentPercent) || parsedMinimumPaymentPercent < 0 || parsedMinimumPaymentPercent > 100) {
                return res.status(400).json(GenRes(400, null, null, "Invalid minimumPaymentPercent: must be between 0 and 100", req.url));
            }
        }

        // Save poster to disk
        let poster = null;
        if (req.files?.poster?.[0]) {
            const posterFile = req.files.poster[0];
            const uploadsDir = path.join(__dirname, "..", "..", "..", "uploads", "poster");
            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

            posterFile.originalname = posterFile.originalname.replace(/\s+/g, '_');
            let finalBuffer = posterFile.buffer;
            let finalExt = path.extname(posterFile.originalname).slice(1).toLowerCase();
            if (posterFile.buffer) {
                try {
                    const compressionResult = await compressImage(posterFile.buffer, 85, 1080, 1080);
                    if (compressionResult?.buffer) {
                        finalBuffer = compressionResult.buffer;
                        finalExt = compressionResult.format === 'jpeg' ? 'jpg' : compressionResult.format;
                        console.log(`Poster image compressed: ${compressionResult.originalSize} -> ${compressionResult.compressedSize} bytes (${compressionResult.compressionRatio}% reduction)`);
                    } else {
                        console.warn("Poster compression returned no data. Using original image buffer.");
                    }
                } catch (err) {
                    console.error("Poster image compression failed:", err);
                    // Fallback to original image buffer
                }
            }
            const fileName = `${Date.now()}_${posterFile.originalname}`;
            const filePath = path.join(uploadsDir, fileName);
            fs.writeFileSync(filePath, finalBuffer);
            poster = `/uploads/poster/${fileName}`;
        }

        // Save organizerLogo to disk
        let savedOrganizerLogo = null;
        if (req.files?.organizerLogo?.[0]) {
            const logoFile = req.files.organizerLogo[0];
            const uploadsDir = path.join(__dirname, "..", "..", "..", "uploads", "organizers");
            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

            logoFile.originalname = logoFile.originalname.replace(/\s+/g, '_');
            let finalBuffer = logoFile.buffer;
            let finalExt = path.extname(logoFile.originalname).slice(1).toLowerCase();
            if (logoFile.buffer) {
                try {
                    const compressionResult = await compressImage(logoFile.buffer, 85, 1080, 1080);
                    if (compressionResult?.buffer) {
                        finalBuffer = compressionResult.buffer;
                        finalExt = compressionResult.format === 'jpeg' ? 'jpg' : compressionResult.format;
                        console.log(`Organizer logo image compressed: ${compressionResult.originalSize} -> ${compressionResult.compressedSize} bytes (${compressionResult.compressionRatio}% reduction)`);
                    } else {
                        console.warn("Organizer logo compression returned no data. Using original image buffer.");
                    }
                } catch (err) {
                    console.error("Organizer logo image compression failed:", err);
                    // Fallback to original image buffer
                }
            }
            const fileName = `${Date.now()}_${logoFile.originalname}`;
            const filePath = path.join(uploadsDir, fileName);
            fs.writeFileSync(filePath, finalBuffer);
            savedOrganizerLogo = `/uploads/organizers/${fileName}`;
        }

        // Save managedByLogo to disk
        let savedManagedByLogo = null;
        if (req.files?.managedByLogo?.[0]) {
            const logoFile = req.files.managedByLogo[0];
            const uploadsDir = path.join(__dirname, "..", "..", "..", "uploads", "managers");
            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

            logoFile.originalname = logoFile.originalname.replace(/\s+/g, '_');
            let finalBuffer = logoFile.buffer;
            let finalExt = path.extname(logoFile.originalname).slice(1).toLowerCase();
            if (logoFile.buffer) {
                try {
                    const compressionResult = await compressImage(logoFile.buffer, 85, 1080, 1080);
                    if (compressionResult?.buffer) {
                        finalBuffer = compressionResult.buffer;
                        finalExt = compressionResult.format === 'jpeg' ? 'jpg' : compressionResult.format;
                        console.log(`Managed by logo image compressed: ${compressionResult.originalSize} -> ${compressionResult.compressedSize} bytes (${compressionResult.compressionRatio}% reduction)`);
                    } else {
                        console.warn("Managed by logo compression returned no data. Using original image buffer.");
                    }
                } catch (err) {
                    console.error("Managed by logo image compression failed:", err);
                    // Fallback to original image buffer
                }
            }
            const fileName = `${Date.now()}_${logoFile.originalname}`;
            const filePath = path.join(uploadsDir, fileName);
            fs.writeFileSync(filePath, finalBuffer);
            savedManagedByLogo = `/uploads/managers/${fileName}`;
        }

        // Handle promo images
        let promoImages = [];
        if (req.files?.promoImages) {
            const uploadsDir = path.join(__dirname, "..", "..", "..", "uploads", "promos");
            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

            for (const file of req.files.promoImages) {
                file.originalname = file.originalname.replace(/\s+/g, '_');
                let finalBuffer = file.buffer;
                let finalExt = path.extname(file.originalname).slice(1).toLowerCase();
                if (file.buffer) {
                    try {
                        const compressionResult = await compressImage(file.buffer, 85, 1080, 1080);
                        if (compressionResult?.buffer) {
                            finalBuffer = compressionResult.buffer;
                            finalExt = compressionResult.format === 'jpeg' ? 'jpg' : compressionResult.format;
                            console.log(`Promo image compressed: ${compressionResult.originalSize} -> ${compressionResult.compressedSize} bytes (${compressionResult.compressionRatio}% reduction)`);
                        } else {
                            console.warn("Promo image compression returned no data. Using original image buffer.");
                        }
                    } catch (err) {
                        console.error("Promo image compression failed:", err);
                        // Fallback to original image buffer
                    }
                }
                const fileName = `${Date.now()}_${file.originalname}`;
                const filePath = path.join(uploadsDir, fileName);
                fs.writeFileSync(filePath, finalBuffer);
                promoImages.push(`/uploads/promos/${fileName}`);
            }
        }

        // Parse ticketTiers and handle entryType
        let parsedTicketTiers = [];
        const parsedOwnEvent = ownEvent !== undefined ? (typeof ownEvent === "string" ? ownEvent.toLowerCase() === "true" : Boolean(ownEvent)) : true;
        const parsedTicketNeedsAttendeeImage = ticketNeedsAttendeeImage !== undefined ? (typeof ticketNeedsAttendeeImage === "string" ? ticketNeedsAttendeeImage.toLowerCase() === "true" : Boolean(ticketNeedsAttendeeImage)) : false;
        if (parsedOwnEvent && entryType === 'free') {
            parsedTicketTiers = [{ name: "Free Entry", price: 0, listOfFeatures: [] }];
        } else if (parsedOwnEvent && ticketTiers) {
            try {
                parsedTicketTiers = typeof ticketTiers === "string" ? JSON.parse(ticketTiers) : ticketTiers;
                if (Array.isArray(parsedTicketTiers)) {
                    parsedTicketTiers = parsedTicketTiers.map(tier => ({
                        ...tier,
                        price: !isNaN(parseFloat(tier.price)) && tier.price != null ? parseFloat(tier.price) : 0
                    }));
                }
            } catch (err) {
                return res.status(400).json(GenRes(400, null, err, "Invalid ticketTiers format", req.url));
            }
        } else {
            parsedTicketTiers = [];
        }

        const newEvent = new Event({
            title,
            description,
            startDateTime,
            endDateTime,
            entryType,
            eventType,
            location,
            googleMapUrl,
            organizer,
            organizerLogo: savedOrganizerLogo,
            managedBy,
            managedByLogo: savedManagedByLogo,
            poster,
            promoImages,
            ownEvent: parsedOwnEvent,
            hasStalls: parsedHasStalls,
            scheduleStart,
            scheduleEnd,
            ticketTiers: parsedTicketTiers,
            registrationOpen: parsedHasStalls ? registrationOpen : null,
            registrationClose: parsedHasStalls ? registrationClose : null,
            ticketNeedsAttendeeImage: parsedTicketNeedsAttendeeImage,
            minimumPaymentPercent: parsedHasStalls ? parseFloat(minimumPaymentPercent) || 0 : 0,
            externalLink: externalLink || null  // ← SAVE IT
        });

        await newEvent.save();
        return res.status(201).json(GenRes(201, newEvent.title, null, "Event created successfully", req.url));
    } catch (err) {
        console.error('Error adding event:', err);
        return res.status(500).json(GenRes(500, null, err, err?.message, req.url));
    }
};

const updateEvent = async (req, res) => {
    try {
        const {
            eventId,
            title,
            description,
            location,
            googleMapUrl,
            organizer,
            organizerLogo,
            managedBy,
            managedByLogo,
            public: publicStatus,
            startDateTime,
            entryType,
            eventType,
            endDateTime,
            ticketTiers,
            hasStalls,
            holdExpiryPeriod,
            minimumPaymentPercent,
            ownEvent,
            scheduleStart,
            scheduleEnd,
            registrationOpen,
            registrationClose,
            ticketNeedsAttendeeImage,
            externalLink
        } = req.body;

        // Validate eventId
        if (!eventId) {
            return res.status(400).json(GenRes(400, null, null, "Missing eventId", req.url));
        }

        // Find the existing event
        const event = await Event.findOne({ eventId });
        if (!event) {
            return res.status(404).json(GenRes(404, null, null, "Event not found", req.url));
        }

        // Validate scheduleStart and scheduleEnd if provided
        if (scheduleStart && !isValidTimeFormat(scheduleStart)) {
            return res.status(400).json(GenRes(400, null, null, "Invalid scheduleStart format (use HH:mm)", req.url));
        }
        if (scheduleEnd && !isValidTimeFormat(scheduleEnd)) {
            return res.status(400).json(GenRes(400, null, null, "Invalid scheduleEnd format (use HH:mm)", req.url));
        }

        // Validate registrationOpen and registrationClose if hasStalls is true
        const parsedHasStalls = hasStalls !== undefined ? (typeof hasStalls === "string" ? hasStalls.toLowerCase() === "true" : Boolean(hasStalls)) : event.hasStalls;
        if (parsedHasStalls) {
            if (!registrationOpen || !registrationClose) {
                return res.status(400).json(GenRes(400, null, null, "registrationOpen and registrationClose are required when hasStalls is true", req.url));
            }
            const openDate = new Date(registrationOpen);
            const closeDate = new Date(registrationClose);
            if (isNaN(openDate.getTime()) || isNaN(closeDate.getTime())) {
                return res.status(400).json(GenRes(400, null, null, "Invalid date format for registrationOpen or registrationClose", req.url));
            }
            if (closeDate <= openDate) {
                return res.status(400).json(GenRes(400, null, null, "registrationClose must be after registrationOpen", req.url));
            }
        }

        // Handle poster upload
        let poster = event.poster;
        if (req.files?.poster?.[0]) {
            if (poster) {
                const oldPosterPath = path.join(__dirname, '..', '..', '..', poster);
                if (fs.existsSync(oldPosterPath) && !fs.lstatSync(oldPosterPath).isDirectory()) {
                    fs.unlinkSync(oldPosterPath);
                }
            }

            const posterFile = req.files.poster[0];
            const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads', 'poster');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            posterFile.originalname = posterFile.originalname.replace(/\s+/g, '_');
            let finalBuffer = posterFile.buffer;
            let finalExt = path.extname(posterFile.originalname).slice(1).toLowerCase();
            if (posterFile.buffer) {
                try {
                    const compressionResult = await compressImage(posterFile.buffer, 85, 1080, 1080);
                    if (compressionResult?.buffer) {
                        finalBuffer = compressionResult.buffer;
                        finalExt = compressionResult.format === 'jpeg' ? 'jpg' : compressionResult.format;
                        console.log(`Poster image compressed: ${compressionResult.originalSize} -> ${compressionResult.compressedSize} bytes (${compressionResult.compressionRatio}% reduction)`);
                    } else {
                        console.warn("Poster compression returned no data. Using original image buffer.");
                    }
                } catch (err) {
                    console.error("Poster image compression failed:", err);
                    // Fallback to original image buffer
                }
            }
            const posterFileName = `${Date.now()}_${posterFile.originalname}`;
            const posterPath = path.join(uploadsDir, posterFileName);

            if (fs.existsSync(posterPath) && fs.lstatSync(posterPath).isDirectory()) {
                return res.status(400).json(GenRes(400, null, null, `Expected file path but found a directory at: ${posterPath}`, req.url));
            }

            fs.writeFileSync(posterPath, finalBuffer);
            poster = `/uploads/poster/${posterFileName}`;
        }

        // Handle organizerLogo upload
        let savedOrganizerLogo = event.organizerLogo;
        if (req.files?.organizerLogo?.[0]) {
            if (savedOrganizerLogo) {
                const oldOrganizerLogoPath = path.join(__dirname, '..', '..', '..', savedOrganizerLogo);
                if (fs.existsSync(oldOrganizerLogoPath) && !fs.lstatSync(oldOrganizerLogoPath).isDirectory()) {
                    fs.unlinkSync(oldOrganizerLogoPath);
                }
            }

            const organizerLogoFile = req.files.organizerLogo[0];
            const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads', 'organizers');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            organizerLogoFile.originalname = organizerLogoFile.originalname.replace(/\s+/g, '_');
            let finalBuffer = organizerLogoFile.buffer;
            let finalExt = path.extname(organizerLogoFile.originalname).slice(1).toLowerCase();
            if (organizerLogoFile.buffer) {
                try {
                    const compressionResult = await compressImage(organizerLogoFile.buffer, 85, 1080, 1080);
                    if (compressionResult?.buffer) {
                        finalBuffer = compressionResult.buffer;
                        finalExt = compressionResult.format === 'jpeg' ? 'jpg' : compressionResult.format;
                        console.log(`Organizer logo image compressed: ${compressionResult.originalSize} -> ${compressionResult.compressedSize} bytes (${compressionResult.compressionRatio}% reduction)`);
                    } else {
                        console.warn("Organizer logo compression returned no data. Using original image buffer.");
                    }
                } catch (err) {
                    console.error("Organizer logo image compression failed:", err);
                    // Fallback to original image buffer
                }
            }
            const organizerLogoFileName = `${Date.now()}_${organizerLogoFile.originalname}`;
            const organizerLogoPath = path.join(uploadsDir, organizerLogoFileName);

            if (fs.existsSync(organizerLogoPath) && fs.lstatSync(organizerLogoPath).isDirectory()) {
                return res.status(400).json(GenRes(400, null, null, `Expected file path but found a directory at: ${organizerLogoPath}`, req.url));
            }

            fs.writeFileSync(organizerLogoPath, finalBuffer);
            savedOrganizerLogo = `/uploads/organizers/${organizerLogoFileName}`;
        }

        // Handle managedByLogo upload
        let savedManagedByLogo = event.managedByLogo;
        if (req.files?.managedByLogo?.[0]) {
            if (savedManagedByLogo) {
                const oldManagedByLogoPath = path.join(__dirname, '..', '..', '..', savedManagedByLogo);
                if (fs.existsSync(oldManagedByLogoPath) && !fs.lstatSync(oldManagedByLogoPath).isDirectory()) {
                    fs.unlinkSync(oldManagedByLogoPath);
                }
            }

            const managedByLogoFile = req.files.managedByLogo[0];
            const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads', 'managers');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            managedByLogoFile.originalname = managedByLogoFile.originalname.replace(/\s+/g, '_');
            let finalBuffer = managedByLogoFile.buffer;
            let finalExt = path.extname(managedByLogoFile.originalname).slice(1).toLowerCase();
            if (managedByLogoFile.buffer) {
                try {
                    const compressionResult = await compressImage(managedByLogoFile.buffer, 85, 1080, 1080);
                    if (compressionResult?.buffer) {
                        finalBuffer = compressionResult.buffer;
                        finalExt = compressionResult.format === 'jpeg' ? 'jpg' : compressionResult.format;
                        console.log(`Managed by logo image compressed: ${compressionResult.originalSize} -> ${compressionResult.compressedSize} bytes (${compressionResult.compressionRatio}% reduction)`);
                    } else {
                        console.warn("Managed by logo compression returned no data. Using original image buffer.");
                    }
                } catch (err) {
                    console.error("Managed by logo image compression failed:", err);
                    // Fallback to original image buffer
                }
            }
            const managedByLogoFileName = `${Date.now()}_${managedByLogoFile.originalname}`;
            const managedByLogoPath = path.join(uploadsDir, managedByLogoFileName);

            if (fs.existsSync(managedByLogoPath) && fs.lstatSync(managedByLogoPath).isDirectory()) {
                return res.status(400).json(GenRes(400, null, null, `Expected file path but found a directory at: ${managedByLogoPath}`, req.url));
            }

            fs.writeFileSync(managedByLogoPath, finalBuffer);
            savedManagedByLogo = `/uploads/managers/${managedByLogoFileName}`;
        }

        // Handle promoImages upload
        let promoImages = event.promoImages;
        if (req.files?.promoImages) {
            if (promoImages.length > 0) {
                promoImages.forEach(image => {
                    const oldImagePath = path.join(__dirname, '..', '..', '..', image);
                    if (fs.existsSync(oldImagePath) && !fs.lstatSync(oldImagePath).isDirectory()) {
                        fs.unlinkSync(oldImagePath);
                    }
                });
            }

            const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads', 'promos');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            promoImages = await Promise.all(req.files.promoImages.map(async file => {
                file.originalname = file.originalname.replace(/\s+/g, '_');
                let finalBuffer = file.buffer;
                let finalExt = path.extname(file.originalname).slice(1).toLowerCase();
                if (file.buffer) {
                    try {
                        const compressionResult = await compressImage(file.buffer, 85, 1080, 1080);
                        if (compressionResult?.buffer) {
                            finalBuffer = compressionResult.buffer;
                            finalExt = compressionResult.format === 'jpeg' ? 'jpg' : compressionResult.format;
                            console.log(`Promo image compressed: ${compressionResult.originalSize} -> ${compressionResult.compressedSize} bytes (${compressionResult.compressionRatio}% reduction)`);
                        } else {
                            console.warn("Promo image compression returned no data. Using original image buffer.");
                        }
                    } catch (err) {
                        console.error("Promo image compression failed:", err);
                        // Fallback to original image buffer
                    }
                }
                const fileName = `${Date.now()}_${file.originalname}`;
                const filePath = path.join(uploadsDir, fileName);
                fs.writeFileSync(filePath, finalBuffer);
                return `/uploads/promos/${fileName}`;
            }));
        }

        // Handle floorPlans and floorPlan
        let floorPlans = event.floorPlans;
        let floorPlan = event.floorPlan;
        if (!parsedHasStalls) {
            if (floorPlans.length > 0) {
                floorPlans.forEach(image => {
                    const oldImagePath = path.join(__dirname, '..', '..', '..', image);
                    if (fs.existsSync(oldImagePath) && !fs.lstatSync(oldImagePath).isDirectory()) {
                        fs.unlinkSync(oldImagePath);
                    }
                });
            }
            if (floorPlan) {
                const oldFloorPlanPath = path.join(__dirname, '..', '..', '..', floorPlan);
                if (fs.existsSync(oldFloorPlanPath) && !fs.lstatSync(oldFloorPlanPath).isDirectory()) {
                    fs.unlinkSync(oldFloorPlanPath);
                }
            }
            floorPlans = [];
            floorPlan = null;
        } else if (req.files?.floorPlans || req.files?.floorPlan) {
            if (floorPlans.length > 0) {
                floorPlans.forEach(image => {
                    const oldImagePath = path.join(__dirname, '..', '..', '..', image);
                    if (fs.existsSync(oldImagePath) && !fs.lstatSync(oldImagePath).isDirectory()) {
                        fs.unlinkSync(oldImagePath);
                    }
                });
            }
            if (floorPlan && req.files?.floorPlan?.[0]) {
                const oldFloorPlanPath = path.join(__dirname, '..', '..', '..', floorPlan);
                if (fs.existsSync(oldFloorPlanPath) && !fs.lstatSync(oldFloorPlanPath).isDirectory()) {
                    fs.unlinkSync(oldFloorPlanPath);
                }
            }

            const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads', 'floorplans');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            floorPlans = [];

            if (req.files?.floorPlan?.[0]) {
                const floorPlanFile = req.files.floorPlan[0];
                floorPlanFile.originalname = floorPlanFile.originalname.replace(/\s+/g, '_');
                let finalBuffer = floorPlanFile.buffer;
                let finalExt = path.extname(floorPlanFile.originalname).slice(1).toLowerCase();
                if (floorPlanFile.buffer) {
                    try {
                        const compressionResult = await compressImage(floorPlanFile.buffer, 85, 1080, 1080);
                        if (compressionResult?.buffer) {
                            finalBuffer = compressionResult.buffer;
                            finalExt = compressionResult.format === 'jpeg' ? 'jpg' : compressionResult.format;
                            console.log(`Floor plan image compressed: ${compressionResult.originalSize} -> ${compressionResult.compressedSize} bytes (${compressionResult.compressionRatio}% reduction)`);
                        } else {
                            console.warn("Floor plan compression returned no data. Using original image buffer.");
                        }
                    } catch (err) {
                        console.error("Floor plan image compression failed:", err);
                        // Fallback to original image buffer
                    }
                }
                const fileName = `${Date.now()}_${floorPlanFile.originalname}`;
                const filePath = path.join(uploadsDir, fileName);

                if (fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory()) {
                    return res.status(400).json(GenRes(400, null, null, `Expected file path but found a directory at: ${filePath}`, req.url));
                }

                fs.writeFileSync(filePath, finalBuffer);
                floorPlan = `/uploads/floorplans/${fileName}`;
            }

            if (req.files?.floorPlans) {
                const newFloorPlans = await Promise.all(req.files.floorPlans.map(async file => {
                    file.originalname = file.originalname.replace(/\s+/g, '_');
                    let finalBuffer = file.buffer;
                    let finalExt = path.extname(file.originalname).slice(1).toLowerCase();
                    if (file.buffer) {
                        try {
                            const compressionResult = await compressImage(file.buffer, 85, 1080, 1080);
                            if (compressionResult?.buffer) {
                                finalBuffer = compressionResult.buffer;
                                finalExt = compressionResult.format === 'jpeg' ? 'jpg' : compressionResult.format;
                                console.log(`Floor plans image compressed: ${compressionResult.originalSize} -> ${compressionResult.compressedSize} bytes (${compressionResult.compressionRatio}% reduction)`);
                            } else {
                                console.warn("Floor plans compression returned no data. Using original image buffer.");
                            }
                        } catch (err) {
                            console.error("Floor plans image compression failed:", err);
                            // Fallback to original image buffer
                        }
                    }
                    const fileName = `${Date.now()}_${file.originalname}`;
                    const filePath = path.join(uploadsDir, fileName);
                    fs.writeFileSync(filePath, finalBuffer);
                    return `/uploads/floorplans/${fileName}`;
                }));
                floorPlans.push(...newFloorPlans);
            }
        }

        // Handle ticketTiers and entryType
        let parsedTicketTiers = event.ticketTiers;
        const parsedOwnEvent = ownEvent !== undefined ? (typeof ownEvent === "string" ? ownEvent.toLowerCase() === "true" : Boolean(ownEvent)) : event.ownEvent;
        const parsedTicketNeedsAttendeeImage = ticketNeedsAttendeeImage !== undefined ? (typeof ticketNeedsAttendeeImage === "string" ? ticketNeedsAttendeeImage.toLowerCase() === "true" : Boolean(ticketNeedsAttendeeImage)) : event.ticketNeedsAttendeeImage;
        const parsedEntryType = entryType || event.entryType;

        if (parsedOwnEvent) {
            if (parsedEntryType === 'free') {
                parsedTicketTiers = [{ name: "Free Entry", price: 0, listOfFeatures: [] }];
            } else if (ticketTiers) {
                try {
                    parsedTicketTiers = typeof ticketTiers === 'string' ? JSON.parse(ticketTiers) : ticketTiers;
                    parsedTicketTiers = parsedTicketTiers.map(tier => ({
                        ...tier,
                        price: !isNaN(parseFloat(tier.price)) && tier.price != null ? parseFloat(tier.price) : 0
                    }));
                } catch (err) {
                    return res.status(400).json(GenRes(400, null, err, 'Invalid ticketTiers format', req.url));
                }
            }
        } else {
            parsedTicketTiers = [];
        }

        const parsedPublic = publicStatus !== undefined ? Boolean(publicStatus) : event.public;
        const parsedHoldExpiryPeriod = holdExpiryPeriod !== undefined ? parseFloat(holdExpiryPeriod) : event.holdExpiryPeriod;
        const parsedMinimumPaymentPercent = minimumPaymentPercent !== undefined ? parseFloat(minimumPaymentPercent) : event.minimumPaymentPercent;

        if (parsedHoldExpiryPeriod !== undefined && (isNaN(parsedHoldExpiryPeriod) || parsedHoldExpiryPeriod < 0)) {
            return res.status(400).json(GenRes(400, null, null, 'Invalid holdExpiryPeriod: must be a non-negative number', req.url));
        }
        if (parsedMinimumPaymentPercent !== undefined && (isNaN(parsedMinimumPaymentPercent) || parsedMinimumPaymentPercent < 0 || parsedMinimumPaymentPercent > 100)) {
            return res.status(400).json(GenRes(400, null, null, 'Invalid minimumPaymentPercent: must be between 0 and 100', req.url));
        }

        // Prepare update data
        const updateData = {
            ...(title && { title }),
            ...(description && { description }),
            ...(location && { location }),
            ...(publicStatus !== undefined && { public: parsedPublic }),
            ...(startDateTime && { startDateTime }),
            ...(endDateTime && { endDateTime }),
            ...(entryType && { entryType: parsedEntryType }),
            ...(googleMapUrl && { googleMapUrl }),
            ...(organizer && { organizer }),
            ...(savedOrganizerLogo && { organizerLogo: savedOrganizerLogo }),
            ...(managedBy && { managedBy }),
            ...(savedManagedByLogo && { managedByLogo: savedManagedByLogo }),
            ...(eventType && { eventType }),
            ...(poster && { poster }),
            ...(promoImages.length > 0 && { promoImages }),
            ...(floorPlan && { floorPlan }),
            ...(floorPlans.length >= 0 && { floorPlans }),
            ticketTiers: parsedTicketTiers,
            ...(hasStalls !== undefined && { hasStalls: parsedHasStalls }),
            ...(holdExpiryPeriod !== undefined && { holdExpiryPeriod: parsedHoldExpiryPeriod }),
            ...(minimumPaymentPercent !== undefined && { minimumPaymentPercent: parsedMinimumPaymentPercent }),
            ...(ownEvent !== undefined && { ownEvent: parsedOwnEvent }),
            ...(scheduleStart && { scheduleStart }),
            ...(scheduleEnd && { scheduleEnd }),
            ...(registrationOpen && parsedHasStalls && { registrationOpen }),
            ...(registrationClose && parsedHasStalls && { registrationClose }),
            ticketNeedsAttendeeImage: parsedTicketNeedsAttendeeImage,
            ...(externalLink !== undefined && { externalLink: externalLink || null })  // ← UPDATE IT
        };

        // Update the event
        const updatedEvent = await Event.findOneAndUpdate(
            { eventId },
            updateData,
            { new: true }
        );

        if (!updatedEvent) {
            return res.status(404).json(GenRes(404, null, null, 'Event not found', req.url));
        }

        return res.status(200).json(GenRes(200, updatedEvent, null, 'Event updated successfully', req.url));
    } catch (err) {
        console.error('Error updating event:', err);
        return res.status(500).json(GenRes(500, null, err.message, 'Internal server error', req.url));
    }
};

const addFloorPlan = async (req, res) => {
    try {
        const { eventId } = req.params;

        if (!eventId) {
            return res.status(400).json(GenRes(400, null, null, "Missing eventId", req.url));
        }

        if (!req.file) {
            return res.status(400).json(GenRes(400, null, null, "No floor plan file provided", req.url));
        }

        const floorPlanFile = req.file;
        const uploadsDir = path.join(__dirname, "..", "..", "..", "uploads", "floorPlans");

        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        //removing spaces from original name
        floorPlanFile.originalname = floorPlanFile.originalname.replace(/\s+/g, '_');
        const floorPlanFileName = `${Date.now()}_${floorPlanFile.originalname}`;
        const floorPlanPath = path.join(uploadsDir, floorPlanFileName);

        if (fs.existsSync(floorPlanPath) && fs.lstatSync(floorPlanPath).isDirectory()) {
            throw new Error(`Expected file path but found a directory at: ${floorPlanPath}`);
        }

        fs.writeFileSync(floorPlanPath, floorPlanFile.buffer);
        const floorPlanUrl = `/uploads/floorPlans/${floorPlanFileName}`;

        const updatedEvent = await Event.findOneAndUpdate(
            { eventId },
            { floorPlan: floorPlanUrl },
            { new: true }
        );

        if (!updatedEvent) {
            return res.status(404).json(GenRes(404, null, null, "Event not found", req.url));
        }

        return res.status(200).json(GenRes(200, updatedEvent.floorPlan, null, "Floor plan added successfully", req.url));
    } catch (err) {
        console.error("Error adding floor plan:", err);
        return res.status(500).json(GenRes(500, null, err, err?.message, req.url));
    }
};

const addFloorPlans = async (req, res) => {
    try {
        const { eventId } = req.params;
        if (!eventId) {
            return res.status(400).json(GenRes(400, null, null, "Missing eventId", req.url));
        }

        const existingUrls = req.body.existingUrls ? JSON.parse(req.body.existingUrls) : [];
        const replaceAll = req.body.replaceAll === 'true';

        const hasNewFiles = req.files && req.files.length > 0;
        const hasExistingUrls = existingUrls && existingUrls.length > 0;

        if (!hasNewFiles && !hasExistingUrls) {
            return res.status(400).json(GenRes(400, null, null, "No floor plan files or URLs provided", req.url));
        }

        const uploadsDir = path.join(__dirname, "..", "..", "..", "uploads", "floorPlans");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        let floorPlanUrls = [];

        if (hasNewFiles) {
            for (const file of req.files) {
                file.originalname = file.originalname.replace(/\s+/g, '_');
                const shortRandom = Math.random().toString(36).substring(2, 6);
                const baseName = file.originalname.split('.')[0];
                const fileExt = path.extname(file.originalname).toLowerCase();
                const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(fileExt);
                let fileName = `${Date.now().toString().slice(-8)}_${shortRandom}_${baseName}${fileExt}`;
                const filePath = path.join(uploadsDir, fileName);

                if (isImage) {
                    try {
                        const compressionResult = await compressImage(file.buffer, 92, 1920, 1920); // higher quality
                        const extFromFormat = compressionResult.format === 'jpeg' ? 'jpg' : compressionResult.format;
                        fileName = `${Date.now().toString().slice(-8)}_${shortRandom}_${baseName}.${extFromFormat}`;
                        const compressedPath = path.join(uploadsDir, fileName);
                        fs.writeFileSync(compressedPath, compressionResult.buffer);
                        floorPlanUrls.push(`/uploads/floorPlans/${fileName}`);

                        console.log(`Floor plan image compressed: ${compressionResult.originalSize} -> ${compressionResult.compressedSize} bytes`);
                    } catch (compressionError) {
                        console.warn(`Compression skipped for ${file.originalname} due to error:`, compressionError);
                        fs.writeFileSync(filePath, file.buffer);
                        floorPlanUrls.push(`/uploads/floorPlans/${fileName}`);
                    }
                } else {
                    fs.writeFileSync(filePath, file.buffer);
                    floorPlanUrls.push(`/uploads/floorPlans/${fileName}`);
                }
            }
        }

        if (hasExistingUrls) {
            floorPlanUrls = [...floorPlanUrls, ...existingUrls];
        }

        const updateOperation = replaceAll
            ? { floorPlans: floorPlanUrls }
            : { $push: { floorPlans: { $each: floorPlanUrls } } };

        const updatedEvent = await Event.findOneAndUpdate(
            { eventId },
            updateOperation,
            { new: true }
        );

        if (!updatedEvent) {
            return res.status(404).json(GenRes(404, null, null, "Event not found", req.url));
        }

        const message = replaceAll ? "Floor plans replaced successfully" : "Floor plans added successfully";
        return res.status(200).json(GenRes(200, updatedEvent.floorPlans, null, message, req.url));

    } catch (err) {
        console.error("Error adding floor plans:", err);
        return res.status(500).json(GenRes(500, null, err, err?.message, req.url));
    }
};

const ongoingEvents = async (req, res) => {
    try {
        const currentDate = new Date();
        const events = await Event.find({
            startDateTime: { $lte: currentDate },
            endDateTime: { $gte: currentDate },
            // ownEvent: true
        }).sort({ startDateTime: 1 }); // Sort by earliest

        if (!events || events.length === 0) {
            return res.status(200).json(GenRes(200, [], null, "No ongoing events found", req.url));
        }

        return res.status(200).json(GenRes(200, events, null, "Ongoing events fetched successfully", req.url));
    } catch (err) {
        return res.status(500).json(GenRes(500, null, err, err?.message), req.url);
    }
}

const getOtherEvents = async (req, res) => {
    try {
        const currentDate = new Date();
        const events = await Event.find(
            {
                ownEvent: false,
                endDateTime: { $gt: currentDate }
            },
            'eventId title poster location startDateTime endDateTime'
        ).sort({ startDateTime: 1 }); // Sort by earliest

        return res.status(200).json(GenRes(200, events, null, "Other events fetched successfully", req.url));
    } catch (err) {
        console.error("[getOtherEvents] Error:", err.message);
        return res.status(500).json(GenRes(500, null, err.message, "Internal server error", req.url));
    }
};

const getOwnEvents = async (req, res) => {
    try {
        const currentDate = new Date();
        const events = await Event.find(
            {
                ownEvent: true,
                endDateTime: { $gt: currentDate }
            },
            'eventId title poster location startDateTime endDateTime ticketTiers'
        ).sort({ startDateTime: 1 }); // Sort by earliest

        return res.status(200).json(GenRes(200, events, null, "Own events fetched successfully", req.url));
    } catch (err) {
        console.error("[getOwnEvents] Error:", err.message);
        return res.status(500).json(GenRes(500, null, err.message, "Internal server error", req.url));
    }
};


const upcomingEvents = async (req, res) => {
    try {
        const currentDate = new Date();
        const events = await Event.find({
            startDateTime: { $gt: currentDate },
            // ownEvent: true,
        }).sort({ startDateTime: 1 });

        if (!events || events.length === 0) {
            return res.status(200).json(GenRes(200, [], null, "No upcoming events found", req.url));
        }

        return res.status(200).json(GenRes(200, events, null, "Upcoming events fetched successfully", req.url));
    } catch (err) {
        return res.status(500).json(GenRes(500, null, err, err?.message), req.url);
    }
}

const pastEvents = async (req, res) => {
    try {
        const currentDate = new Date();
        const events = await Event.find({
            endDateTime: { $lt: currentDate }
        }).sort({ endDateTime: -1 }); // Sort by latest past events first

        if (!events || events.length === 0) {
            return res.status(200).json(GenRes(200, [], null, "No past events found", req.url));
        }

        return res.status(200).json(GenRes(200, events, null, "Past events fetched successfully", req.url));
    } catch (err) {
        return res.status(500).json(GenRes(500, null, err, err?.message), req.url);
    }
}

module.exports = {
    getAllEvents,
    getEventById,
    addEvent,
    updateEvent,
    ongoingEvents,
    upcomingEvents,
    pastEvents,
    addFloorPlan,
    addFloorPlans,
    getOtherEvents,
    getOwnEvents,
    getLandingPageData
};