const GenRes = require("../../utils/router/GenRes");
const Discount = require("./discount.model");

const addDiscount = async (req, res) => {
    try {
        const {
            name,
            description,
            code,
            fixedAmount,
            percentage,
            startDateTime,
            endDateTime,
            applicableToEventId,
            applicableToStalls,
            applicableToTickets
        } = req.body;

        // Required field validations
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json(GenRes(400, null, null, "Name is required and must be a non-empty string", req.url));
        }

        if (!code || typeof code !== 'string' || code.trim().length === 0) {
            return res.status(400).json(GenRes(400, null, null, "Code is required and must be a non-empty string", req.url));
        }

        // Validate discount type (exactly one of fixedAmount or percentage must be provided)
        if ((fixedAmount === undefined && percentage === undefined) ||
            (fixedAmount !== undefined && percentage !== undefined)) {
            return res.status(400).json(GenRes(400, null, null, "Exactly one of fixedAmount or percentage must be provided", req.url));
        }

        if (fixedAmount !== undefined) {
            if (typeof fixedAmount !== 'number' || fixedAmount < 0) {
                return res.status(400).json(GenRes(400, null, null, "Fixed amount must be a non-negative number", req.url));
            }
        }

        if (percentage !== undefined) {
            if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
                return res.status(400).json(GenRes(400, null, null, "Percentage must be a number between 0 and 100", req.url));
            }
        }

        // Date validations and defaults
        let start = startDateTime ? new Date(startDateTime) : new Date();
        let end = endDateTime ? new Date(endDateTime) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

        // If startDateTime or endDateTime are invalid, return error
        if (isNaN(start.getTime())) {
            return res.status(400).json(GenRes(400, null, null, "Valid start date and time is required", req.url));
        }
        if (isNaN(end.getTime())) {
            return res.status(400).json(GenRes(400, null, null, "Valid end date and time is required", req.url));
        }

        if (start >= end) {
            return res.status(400).json(GenRes(400, null, null, "End date must be after start date", req.url));
        }
        if (start < new Date()) {
            return res.status(400).json(GenRes(400, null, null, "Start date cannot be in the past", req.url));
        }

        // Overwrite startDateTime and endDateTime with defaults if not provided
        req.body.startDateTime = start;
        req.body.endDateTime = end;

        // Applicability validation
        // if (typeof applicableToStalls !== 'boolean' || typeof applicableToTickets !== 'boolean') {
        //     return res.status(400).json(GenRes(400, null, null, "applicableToStalls and applicableToTickets must be boolean values", req.url));
        // }

        // Check for duplicate discount code
        const existingDiscount = await Discount.findOne({ code });
        if (existingDiscount) {
            return res.status(400).json(GenRes(400, null, null, "Discount code already exists", req.url));
        }

        // Create and save new discount
        // If applicableToStalls or applicableToTickets are not provided, default both to true
        const stalls = typeof applicableToStalls === 'boolean' ? applicableToStalls : true;
        const tickets = typeof applicableToTickets === 'boolean' ? applicableToTickets : true;

        const newDiscount = new Discount({
            name: name.trim(),
            description: description?.trim(),
            code: code.trim(),
            fixedAmount,
            percentage,
            startDateTime: start,
            endDateTime: end,
            applicableToEventId,
            applicableToStalls: stalls,
            applicableToTickets: tickets
        });
        await newDiscount.save();

        res.status(201).json(GenRes(201, newDiscount, null, "Discount added successfully", req.url));
    } catch (error) {
        console.error("Error adding discount:", error);
        res.status(500).json(GenRes(500, null, error.message, "Failed to add discount", req.url));
    }
}
module.exports = {
    addDiscount
};
