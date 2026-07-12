const express = require("express");
const router = express.Router();
const adminMiddleware = require("../../middlewares/adminMiddleware");
const employeeMiddleware = require("../../middlewares/employeeMiddleware");
const { togglePrinting, triggerPrint, printTspl } = require("./print.websocket");

router.get("/print", (req, res) => {
  res.status(200).send("Print route is working");
});

router.get("/toggle-printing", adminMiddleware, togglePrinting);
router.post("/trigger-print", employeeMiddleware, express.json(), triggerPrint);
router.post("/print-tspl", employeeMiddleware, express.json(), printTspl);

module.exports = router;
