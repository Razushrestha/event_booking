const GenRes = require("../../utils/router/GenRes");
const Discount = require("./discount.model");

const viewDiscounts = async (req, res) => {
    try{
        const discounts = await Discount.find().sort({ createdAt: -1 });
        return res.status(200).json(GenRes(200, discounts, null, "Discounts fetched successfully"), req.url);
    }
    catch(err) {
        return res.status(500).json(GenRes(500, null, err, "Failed to fetch discounts"), req.url);
    }
}

const checkDiscountCode = async (req, res) => {
    try {
        const { code } = req.body;

        if (!code || typeof code !== 'string' || code.trim().length === 0) {
            return res.status(400).json(GenRes(400, null, "Invalid discount code", "Discount code is required", req.url));
        }

        const discount = await Discount.findOne({ code: code.trim() });

        if (!discount) {
            return res.status(404).json(GenRes(404, null, "Discount not found", "No discount found with the provided code", req.url));
        }

        return res.status(200).json(GenRes(200, discount, null, "Discount found successfully", req.url));
    } catch (error) {
        return res.status(500).json(GenRes(500, null, error.message, "Failed to check discount code", req.url));
    }
}

module.exports = {
    viewDiscounts,
    checkDiscountCode
};
