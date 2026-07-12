const express = require("express");
const router = express.Router();
const adminMiddleware = require("../../middlewares/adminMiddleware");
const { devOnly, requireBootstrapSecret } = require("../../middlewares/security");
const { adminLimiter } = require("../../middlewares/rateLimiter");

const {
    addAdmin,
    approveTicket,
    rejectTicket,
    makeTicketStatusPending,
    getAllUsersByAdmin
} = require("./admin.methods");

const {
    getAdminDashboardV2,
    getPendingTicketsV2,
    getRecentRegistrationsV2,
    getUpcomingEventsV2,
} = require("./dashboard.methods")

const { addEmployee } = require("./employee.add");
const { deleteEmployee } = require("./employee.delete");
const { editEmployee } = require("./employee.edit");
// Placeholder route for admin API
const { printByAdmin } = require("./admin.print");
router.use("/admin", adminLimiter);

router.get("/admin", (req, res) => {
    res.send("Admin API is working");
});

router.post("/admin/add", requireBootstrapSecret, addAdmin);

router.get("/admin/dashboard", adminMiddleware, getAdminDashboardV2);

router.get("/admin/dashboard2", adminMiddleware, getAdminDashboardV2);

router.post("/admin/approve-ticket", adminMiddleware, approveTicket);

router.post("/admin/reject-ticket", adminMiddleware, rejectTicket);

router.post("/admin/tickets/pending", devOnly, adminMiddleware, makeTicketStatusPending);

router.get("/admin/pending-tickets", adminMiddleware, getPendingTicketsV2);

router.get("/admin/recent-registrations", adminMiddleware, getRecentRegistrationsV2);

router.get("/admin/upcoming-events", adminMiddleware, getUpcomingEventsV2);

router.get("/admin/users", adminMiddleware, getAllUsersByAdmin);

router.post("/admin/add-employee", adminMiddleware, addEmployee);

router.post("/thermal-prints", adminMiddleware, printByAdmin);

router.delete("/admin/delete-employee", adminMiddleware, deleteEmployee);

router.patch("/admin/edit-employee", adminMiddleware, editEmployee);

module.exports = router;