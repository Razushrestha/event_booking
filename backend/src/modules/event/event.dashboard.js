const GenRes = require("../../utils/router/GenRes");
const Event = require("./event.model");

const eventDashboard = async (req, res) => {
    try {
        const { sortBy = 'newest', search = '', page = 1 } = req.query;

        // Validate sortBy
        const validSorts = ['oldest', 'newest', 'startSoonest', 'startLatest'];
        if (!validSorts.includes(sortBy)) {
            return res
                .status(400)
                .json(GenRes(400, null, null, "Invalid sortBy value. Use: oldest, newest, startSoonest, startLatest", req.url));
        }

        // Validate page
        const pageNumber = parseInt(page, 10);
        if (isNaN(pageNumber) || pageNumber < 1) {
            return res
                .status(400)
                .json(GenRes(400, null, null, "Invalid page number. Must be a positive integer.", req.url));
        }

        // Map sortBy to MongoDB sort criteria
        const sortCriteria = {
            oldest: { createdAt: 1 },
            newest: { createdAt: -1 },
            startSoonest: { startDateTime: 1 },
            startLatest: { startDateTime: -1 }
        }[sortBy];

        // Build query for search
        const searchQuery = search
            ? { title: { $regex: search, $options: 'i' } }
            : {};

        // Get event counts for each status
        const statuses = ['upcoming', 'ongoing', 'past'];
        const now = new Date();
        const eventCountPromises = statuses.map(status => {
            let statusQuery;
            if (status === 'upcoming') {
                statusQuery = { startDateTime: { $gt: now } };
            } else if (status === 'ongoing') {
                statusQuery = {
                    startDateTime: { $lte: now },
                    endDateTime: { $gte: now }
                };
            } else {
                statusQuery = { endDateTime: { $lt: now } };
            }
            return Event.countDocuments({ ...searchQuery, ...statusQuery });
        });

        // Pagination settings
        const limit = 10;
        const skip = (pageNumber - 1) * limit;

        // Get total count for pagination
        const totalCount = await Event.countDocuments(searchQuery);

        // Get paginated events
        const recentEvents = await Event.find(searchQuery)
            .sort(sortCriteria)
            .skip(skip)
            .limit(limit)
            .select('eventId title startDateTime endDateTime location public ticketTiers createdAt');

        // Get all counts
        const [upcomingCount, ongoingCount, pastCount] = await Promise.all(eventCountPromises);
        const totalEvents = upcomingCount + ongoingCount + pastCount;

        // Create metrics object
        const metrics = {
            totalEvents,
            upcoming: upcomingCount,
            ongoing: ongoingCount,
            past: pastCount
        };

        // Create pagination object
        const totalPages = Math.ceil(totalCount / limit);
        const pagination = {
            currentPage: pageNumber,
            totalPages,
            totalCount,
            limit,
            hasNext: pageNumber < totalPages,
            hasPrev: pageNumber > 1,
            nextPage: pageNumber < totalPages ? pageNumber + 1 : null,
            prevPage: pageNumber > 1 ? pageNumber - 1 : null
        };

        // Create final response
        const responseData = {
            metrics,
            events: recentEvents,
            pagination
        };

        return res.status(200).json(
            GenRes(200, responseData, null, 'Event dashboard data fetched successfully', req.url)
        );
    } catch (error) {
        return res.status(500).json(
            GenRes(500, null, error, error.message, req.url)
        );
    }
};

module.exports = { eventDashboard };