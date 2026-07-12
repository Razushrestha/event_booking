const GenRes = require("../../utils/router/GenRes");
const Discount = require("./discount.model");

const cancelDiscount = async (req, res) => {
    try {
        const { discountId } = req.body;

        // Validate required fields
        if (!discountId) {
            return res.status(400).json(GenRes(400, null, null, "Discount ID is required", req.url));
        }

        // Find the discount
        const discount = await Discount.findOne({ discountId });
        if (!discount) {
            return res.status(404).json(GenRes(404, null, null, "Discount not found", req.url));
        }

        // Check if the discount is already cancelled
        if (discount.isCancelled) {
            return res.status(400).json(GenRes(400, null, null, "Discount is already cancelled", req.url));
        }

        // Cancel the discount
        discount.isCancelled = true;
        await discount.save();

        return res.status(200).json(GenRes(200, discount, null, "Discount cancelled successfully", req.url));
    }
    catch (error) {
        console.error("Error cancelling discount:", error);
        return res.status(500).json(GenRes(500, null, null, "Internal server error", req.url));
    }
}

module.exports = {
    cancelDiscount
};
