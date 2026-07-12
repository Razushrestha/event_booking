const express = require('express');
const router = express.Router();
const GenRes = require("../../utils/router/GenRes");
const authMiddleware = require("../../middlewares/authMiddleware");
const adminMiddleware = require("../../middlewares/adminMiddleware");

const { addDiscount } = require('./discount.add');
const { viewDiscounts, checkDiscountCode } = require('./discount.methods');

router.post('/discount', adminMiddleware, addDiscount);
router.get('/discounts', viewDiscounts);
router.post('/discount/check', checkDiscountCode);

module.exports = router;