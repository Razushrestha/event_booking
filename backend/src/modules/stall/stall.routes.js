const express = require("express");
const router = express.Router();
const multer = require("multer");
const adminMiddleware = require("../../middlewares/adminMiddleware");
const {
  getAllStalls,
  getStallById,
  getStallByEventId,
  createStall,
  updateStall,
  deleteStall,
  getAvailableStalls,
  createMultipleStalls
} = require("./stall.methods");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

// Public routes
router.get("/stalls/available", getAvailableStalls);
router.get("/stalls/:stallId", getStallById);
router.get("/stalls/event/:eventId/", getStallByEventId);

// Admin routes
router.get("/stalls", adminMiddleware, getAllStalls);
router.post("/create-stalls", adminMiddleware, upload.array("images", 5), createStall);
router.post("/stalls/multiple", adminMiddleware, upload.array("images", 5), createMultipleStalls);
router.patch(
  "/stalls/:stallId",
  adminMiddleware,
  upload.array("images", 5),
  updateStall
);
router.delete("/stalls/:stallId", adminMiddleware, deleteStall);

module.exports = router;
