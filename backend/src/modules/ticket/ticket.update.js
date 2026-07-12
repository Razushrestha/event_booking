const GenRes = require('../../utils/router/GenRes');
const Ticket = require('./ticket.model');

const untickTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;

        if (!ticketId || typeof ticketId !== 'string') {
            return res.status(400).json(GenRes(400, null, null, "Valid ticket ID is required", req.url));
        }

        // Find ticket by ticketId
        const ticket = await Ticket.findOne({ ticketId });
        if (!ticket) {
            return res.status(404).json(GenRes(404, null, null, "Ticket not found", req.url));
        }

        // Check if features exist
        if (
            ticket.ticketInfo &&
            Array.isArray(ticket.ticketInfo.features)
        ) {
            ticket.ticketInfo.features.forEach((feature) => {
                feature.status = false;
            });

            await ticket.save();
        }

        return res.status(200).json(GenRes(200, ticket, null, "All ticket features unticked", req.url));
    } catch (error) {
        return res.status(500).json(GenRes(500, null, error.message, "Error unticking ticket", req.url));
    }
}

const updateTicket = async (req, res) => {
    try {
        const { ticketId } = req.params; // Use ticketId as identifier
        const { featureName } = req.body; // Name of the feature to toggle

        // Validate ticketId
        if (!ticketId || typeof ticketId !== 'string') {
            return res.status(400).json(GenRes(400, null, null, "Valid ticket ID is required", req.url));
        }

        // Find ticket by ticketId
        const ticket = await Ticket.findOne({ ticketId });
        if (!ticket) {
            return res.status(404).json(GenRes(404, null, null, "Ticket not found", req.url));
        }

        // Check if ticket is approved
        if (ticket.status !== 'approved') {
            return res.status(403).json(GenRes(403, null, null, "Ticket is not approved", req.url));
        }

        // If no featureName provided, return ticketInfo.features
        if (!featureName) {
            return res.status(200).json(GenRes(200, ticket.ticketInfo.features, null, "Ticket features retrieved successfully", req.url));
        }

        // Validate featureName
        if (typeof featureName !== 'string' || featureName.trim().length === 0) {
            return res.status(400).json(GenRes(400, null, null, "Valid feature name is required", req.url));
        }

        // Find the feature in ticketInfo
        const feature = ticket.ticketInfo.features.find(f => f.name === featureName);
        if (!feature) {
            return res.status(404).json(GenRes(404, null, null, "Feature not found in ticket", req.url));
        }

        // Check if feature is already redeemed
        if (feature.status) {
            return res.status(400).json(GenRes(400, null, null, "Feature already redeemed", req.url));
        }

        // Toggle feature status to true
        feature.status = true;
        await ticket.save();

        return res.status(200).json(GenRes(200, ticket.ticketInfo.features, null, "Feature redeemed successfully", req.url));
    } catch (error) {
        return res.status(500).json(GenRes(500, null, error.message, "Error updating ticket", req.url));
    }
}

module.exports = {
    updateTicket,
    untickTicket
};