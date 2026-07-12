const express = require('express');
const GenRes = require('../../utils/router/GenRes');
const { paymentApprove } = require('./payment.approve');
const multer = require("multer");
const { viewAllPayments, viewPaymentsByBookingId, viewPaymentByPaymentId, viewPaymentsByEventId, addPaymentForBooking } = require('./payment.methods');
const { paymentFailed } = require('./payment.cancel');
const { giveDiscount } = require('./payment.discount');
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|pdf)$/)) {
            return cb(new Error("Only image and PDF files are allowed!"), false);
        }
        cb(null, true);
    },
});

const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError || err) {
        return res
            .status(400)
            .json(GenRes(400, null, err, "File upload error", req.url));
    }
    next();
};


const authMiddleware = require('../../middlewares/authMiddleware');
const adminMiddleware = require('../../middlewares/adminMiddleware');
const router = express.Router();

router.post('/payments/approve', adminMiddleware, paymentApprove);
router.get('/payments', authMiddleware, viewAllPayments);
router.post('/payments/add', authMiddleware, upload.single("paymentProof"), handleMulterError, addPaymentForBooking);
router.get('/payments/booking/:bookingId', authMiddleware, viewPaymentsByBookingId);
router.post('/payments/cancel', adminMiddleware, paymentFailed);
router.get('/payments/payment/:paymentId', authMiddleware, viewPaymentByPaymentId);
router.get('/payments/event/:eventId', authMiddleware, viewPaymentsByEventId);
router.post('/payments/discount', adminMiddleware, giveDiscount);

module.exports = router;