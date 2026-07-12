const express = require('express');
const multer = require("multer");
const router = express.Router();

const authMiddleware = require('../../middlewares/authMiddleware');
const adminMiddleware = require('../../middlewares/adminMiddleware');

const { getAllPaymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod } = require('./paymentMethod.methods');

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error("Only image files are allowed!"), false);
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

router.get('/payment-methods', authMiddleware, getAllPaymentMethods);
router.post('/payment-methods', adminMiddleware, upload.fields([{ name: 'image', maxCount: 1 }]), handleMulterError, addPaymentMethod);
router.put('/payment-methods/:paymentMethodId', adminMiddleware, upload.fields([{ name: 'image', maxCount: 1 }]), handleMulterError, updatePaymentMethod);
router.delete('/payment-methods/:paymentMethodId', adminMiddleware, deletePaymentMethod);

module.exports = router;