const express = require("express");
const router = express.Router();
const adminMiddleware = require("../../middlewares/adminMiddleware");
const {
  getAllStallTypes,
  getAllStallTypesByEventId,
  createStallType,
  updateStallType,
  deleteStallType,

} = require("./stallType.methods");

router.get("/stall-types", adminMiddleware, getAllStallTypes);
router.get("/stall-types/:eventId", adminMiddleware, getAllStallTypesByEventId);
router.post("/stall-types/:eventId", adminMiddleware, createStallType);
router.patch("/stall-types/:typeId", adminMiddleware, updateStallType);
router.delete("/stall-types/:typeId", adminMiddleware, deleteStallType);

module.exports = router;
