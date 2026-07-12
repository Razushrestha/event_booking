const GenRes = require("../../utils/router/GenRes");
const Event = require("./event.model");

const addTermsAndConditions = async (req, res) => {
    const { eventId } = req.params;
    try {
        const { termsAndConditions } = req.body;

        if (!termsAndConditions || typeof termsAndConditions !== 'string') {
            return res.status(400).json(GenRes(400, null, null, "Terms and conditions must be a non-empty string", req.url));
        }

        const event = await Event.findOneAndUpdate(
            { eventId },
            { termsAndConditions },
            { new: true, runValidators: true }
        );

        if (!event) {
            return res.status(404).json(GenRes(404, null, null, "Event not found", req.url));
        }

        return res.status(200).json(GenRes(200, event.termsAndConditions, null, "Terms and conditions updated successfully", req.url));
    } catch (error) {
        console.error(`[addTermsAndConditions] Error processing request for eventId: ${eventId}`, error);
        return res.status(500).json(GenRes(500, null, null, "Internal server error", req.url));
    }
};

const updateTermsAndConditions = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { termsAndConditions } = req.body;

        if (!termsAndConditions || typeof termsAndConditions !== 'string') {
            return res.status(400).json(GenRes(400, null, null, "Terms and conditions must be a non-empty string", req.url));
        }

        const event = await Event.findOneAndUpdate(
            { eventId },
            { termsAndConditions },
            { new: true, runValidators: true }
        );

        if (!event) {
            return res.status(404).json(GenRes(404, null, null, "Event not found", req.url));
        }

        return res.status(200).json(GenRes(200, event.termsAndConditions, null, "Terms and conditions updated successfully", req.url));
    } catch (error) {
        console.error(`[updateTermsAndConditions] Error processing request for eventId: ${eventId}`, error);
        return res.status(500).json(GenRes(500, null, null, "Internal server error", req.url));
    }
};

const getTermsAndConditions = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await Event.findOne({ eventId }).select('termsAndConditions');

        if (!event) {
            return res.status(404).json(GenRes(404, null, null, "Event not found", req.url));
        }

        if (!event.termsAndConditions) {
            return res.status(200).json(GenRes(200, '', null, "No terms and conditions set for this event", req.url));
        }

        return res.status(200).json(GenRes(200, event.termsAndConditions, null, "Terms and conditions retrieved successfully", req.url));
    } catch (error) {
        console.error(`[getTermsAndConditions] Error processing request for eventId: ${eventId}`, error);
        return res.status(500).json(GenRes(500, null, null, "Internal server error", req.url));
    }
};

module.exports = {
    addTermsAndConditions,
    updateTermsAndConditions,
    getTermsAndConditions
};