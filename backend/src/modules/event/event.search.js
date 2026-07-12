const Event = require("./event.model");
const GenRes = require("../../utils/router/GenRes");

const searchEvents = async (req, res) => {
    try {
        const { q, status } = req.query;

        if (!q || typeof q !== 'string' || q.trim().length === 0) {
            return res.status(400).json(GenRes(400, null, null, "Query parameter 'q' is required and must be a non-empty string", req.url));
        }

        console.log("Search query:", q);

        const searchQuery = q.trim();
        const now = new Date();

        // Build base query
        const query = {
            $or: [
                { title: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
                { location: { $regex: searchQuery, $options: 'i' } },
                { organizer: { $regex: searchQuery, $options: 'i' } },
                { eventType: { $regex: searchQuery, $options: 'i' } }
            ],
            public: true
        };

        // Add time-based filter if status is provided
        
        const events = await Event.find(query)
            .select('eventId title description location organizer startDateTime endDateTime eventType poster entryType');

        return res.status(200).json(GenRes(200, { events, count: events.length }, null, "Events searched successfully", req.url));
    } catch (err) {
        return res.status(500).json(GenRes(500, null, err, err?.message || "Failed to search events", req.url));
    }
};

module.exports = { searchEvents };
