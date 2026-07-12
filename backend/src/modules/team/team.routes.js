const express = require('express');
const multer = require("multer");
const router = express.Router();

const { getAllTeamMembers, addTeamMember, updateTeamMember, deleteTeamMember } = require('./team.methods');
const authMiddleware = require('../../middlewares/authMiddleware');
const adminMiddleware = require('../../middlewares/adminMiddleware');

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

// Placeholder route for team API
router.get('/our-team', getAllTeamMembers);
router.post('/our-team', adminMiddleware, upload.fields([{ name: 'photo', maxCount: 1 }]), handleMulterError, addTeamMember);
router.put('/our-team/:teamId', adminMiddleware, upload.fields([{ name: 'photo', maxCount: 1 }]), handleMulterError, updateTeamMember);
router.delete('/our-team/:teamId', adminMiddleware, deleteTeamMember);

module.exports = router;