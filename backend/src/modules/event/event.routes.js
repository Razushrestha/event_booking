const multer = require("multer");
const express = require("express");
const path = require("path");
const router = express.Router();
const GenRes = require("../../utils/router/GenRes");

const authMiddleware = require("../../middlewares/authMiddleware");
const adminMiddleware = require("../../middlewares/adminMiddleware");

const {
    getAllEvents,
    getEventById,
    addEvent,
    updateEvent,
    ongoingEvents,
    upcomingEvents,
    pastEvents,
    addFloorPlan,
    addFloorPlans,
    getOtherEvents,
    getOwnEvents,
    getLandingPageData
} = require("./event.methods");
const { updateTermsAndConditions, getTermsAndConditions, addTermsAndConditions } = require("./event.terms");

const { searchEvents } = require("./event.search");

const { deleteEvent } = require("./event.delete");

const { eventDashboard } = require("./event.dashboard");

const {
    addProposal,
    editProposal,
    deleteProposal
} = require("./event.proposal");

// Configure multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /\.(jpg|jpeg|png|gif|pdf)$/i;
        if (!file.originalname.match(allowedTypes)) {
            return cb(new Error("Only image files and PDFs are allowed!"), false);
        }
        cb(null, true);
    },
});

const pdfupload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('Only PDF files are allowed'));
        }
        cb(null, true);
    }
});


// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError || err) {
        return res
            .status(400)
            .json(GenRes(400, null, err, "File upload error", req.url));
    }
    next();
};

// Routes

router.get("/", getLandingPageData);
router.get("/events", getAllEvents);
router.get("/events/ongoing", ongoingEvents);
router.get("/events/upcoming", upcomingEvents);
router.get("/events/past", pastEvents);
router.get("/events/:id", getEventById);
router.get("/other-events", getOtherEvents);
router.get("/own-events", getOwnEvents);
router.post(
    "/add-event",
    adminMiddleware,
    upload.fields([
        { name: "poster", maxCount: 1 },
        { name: "promoImages", maxCount: 5 },
        { name: "organizerLogo", maxCount: 1 },
        { name: "managedByLogo", maxCount: 1 }
    ]),
    handleMulterError,
    addEvent
);

router.get("/search", searchEvents);

router.patch(
    "/update-event",
    adminMiddleware,
    upload.fields([
        { name: "poster", maxCount: 1 },
        { name: "promoImages", maxCount: 5 },
        { name: "organizerLogo", maxCount: 1 },
        { name: "managedByLogo", maxCount: 1 }
    ]),
    handleMulterError,
    updateEvent
);

router.post(
    "/add-floor-plan/:eventId",
    adminMiddleware,
    upload.single("floorPlan"),
    handleMulterError,
    addFloorPlan
);

router.post(
    "/add-floor-plans/:eventId",
    adminMiddleware,
    upload.array("floorPlans", 10), // Allow up to 10 floor plans
    handleMulterError,
    addFloorPlans
);

router.post(
    "/add-proposal/:eventId",
    adminMiddleware,
    pdfupload.single("proposal"),
    handleMulterError,
    addProposal
);

router.patch(
    "/edit-proposal/:eventId",
    adminMiddleware,
    pdfupload.single("proposal"),
    handleMulterError,
    editProposal
);

router.delete(
    "/delete-proposal/:eventId/:proposalId",
    adminMiddleware,
    deleteProposal
);

router.delete("/admin/event/:id", adminMiddleware, deleteEvent);

router.get("/admin/events", adminMiddleware, eventDashboard);

router.get("/terms-and-conditions/:eventId", getTermsAndConditions);

router.post("/terms-and-conditions/:eventId",
    adminMiddleware,
    addTermsAndConditions
);

router.patch("/terms-and-conditions/:eventId",
    adminMiddleware,
    updateTermsAndConditions
);

module.exports = router;
