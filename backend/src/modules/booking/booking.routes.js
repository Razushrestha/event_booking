const express = require("express");
const router = express.Router();
const multer = require("multer");
const { devOnly } = require("../../middlewares/security");
const authMiddleware = require("../../middlewares/authMiddleware");
const adminMiddleware = require("../../middlewares/adminMiddleware");
const organizationMiddleware = require('../../middlewares/organizationMiddleware');
const GenRes = require("../../utils/router/GenRes");
const {
  createBooking,
  getUserBookings,
  getAllBookings,
  updateBookingStatus,
  getBookingByBookingId,
  getBookingByEventId,
  holdStall,
  getBookingDashboard,
} = require("./booking.methods");
const { deleteBooking } = require("./booking.delete");
const { bookingCancel, cancelAllBookings, deleteAllBookings } = require("./booking.cancel");
const { createMultipleStallBooking, createMultipleStallHold } = require("./booking.multiple");
const { createMultipleStallBookingByAdmin } = require("./booking.admin");
const { approveBooking } = require("./booking.approve");
const { exportBookingsToCSV, getBookingsCSVData } = require("./bookings.export");
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|pdf)$/)) {
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

router.post(
  "/bookings",
  authMiddleware,
  upload.fields([{ name: "paymentProof", maxCount: 1 }]),
  // createBooking
  // changed this to allow multiple stall booking as well as single stall booking
  handleMulterError,
  createMultipleStallBooking
);

router.post(
  "/bookings/multiple",
  organizationMiddleware,
  upload.fields([{ name: "paymentProof", maxCount: 1 }]),
  handleMulterError,
  createMultipleStallBooking
);

router.post(
  "/bookings/multiple/admin",
  adminMiddleware,
  upload.fields([{ name: "paymentProof", maxCount: 1 }]),
  handleMulterError,
  createMultipleStallBookingByAdmin
);

router.post("/bookings/multiple/hold", organizationMiddleware, createMultipleStallHold);

router.post("/bookings/approve/:bookingId", adminMiddleware, approveBooking);


router.post(
  "/bookings/cancel/:bookingId",
  authMiddleware,
  bookingCancel
);

router.post("/booking/cancel/all", devOnly, adminMiddleware, cancelAllBookings);

router.post("/bookings/hold", authMiddleware, holdStall);

router.get("/bookings/user", authMiddleware, getUserBookings);

router.get("/admin/bookings", adminMiddleware, getBookingDashboard);

router.get("/bookings/event/:eventId", adminMiddleware, getBookingByEventId);

// @TODO: Add adminMiddleware to this route
router.get(
  "/bookings/export/:eventId",
  adminMiddleware,
  exportBookingsToCSV
);

// router.get("/bookings/csv-data/:eventId",
//   adminMiddleware,
//   getBookingsCSVData
// );

router.get("/bookings/:bookingId", authMiddleware, getBookingByBookingId);

router.get("/bookings", adminMiddleware, getAllBookings);

router.delete("/bookings/:bookingId", authMiddleware, deleteBooking);

// this is test route to delete all bookings, use with caution
router.delete("/all-bookings", devOnly, adminMiddleware, deleteAllBookings);

router.patch(
  "/bookings/:bookingId/status",
  adminMiddleware,
  updateBookingStatus
);
router.patch(
  "/bookings/:bookingId/cancel",
  authMiddleware,
  async (req, res) => {
    req.body.status = "cancelled";
    await updateBookingStatus(req, res);
  }
);

module.exports = router;
