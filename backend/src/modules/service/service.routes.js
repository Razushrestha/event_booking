const express = require('express');
const multer = require('multer');
const adminMiddleware = require('../../middlewares/adminMiddleware');
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|webp|gif)$/)) {
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



const router = express.Router();

const {
    getAllServices,
    createService,
    editService,
    deleteService
} = require('./service.method');

router.get('/services', getAllServices);
router.post('/admin/services', adminMiddleware, upload.fields([{ name: 'image', maxCount: 1 }]), handleMulterError, createService);
router.patch('/admin/services/:serviceId', adminMiddleware, upload.fields([{ name: 'image', maxCount: 1 }]), handleMulterError, editService);
router.delete('/admin/services/:serviceId', adminMiddleware, deleteService);

module.exports = router;