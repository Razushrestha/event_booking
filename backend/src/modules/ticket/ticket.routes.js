const GenRes = require('../../utils/router/GenRes');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const adminMiddleware = require('../../middlewares/adminMiddleware');
const employeeMiddleware = require('../../middlewares/employeeMiddleware');
const { getAllUserTickets, registerTicket, getTicketById, getTicketsDashboardByAdmin, makeTicketStatusPending, getTicketsByEventId } = require('./ticket.method');
const { spotRegistrationByEmployee } = require('./ticket.spot');
const { deleteTicket } = require('./ticket.delete');
const { getTicketInfoById } = require('./ticket.info');
const { updateTicket, untickTicket } = require('./ticket.update');
const { exportTicketsToCSV } = require('./ticket.export');
const { reprintTicket } = require('./ticket.reprint');
router.get('/tickets', authMiddleware, getAllUserTickets);
// router.post('/register-tickets', authMiddleware, upload.single('paymentScreenshot'), registerTicket);

router.post(
    '/register-tickets',
    authMiddleware,
    upload.fields([
        { name: 'paymentScreenshot', maxCount: 1 },
        { name: 'attendeeImage', maxCount: 1 }
    ]),
    (err, req, res, next) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({
                status: 400,
                data: null,
                error: err.message,
                message: 'File upload error: ' + err.message,
                path: req.url
            });
        }
        next();
    },
    registerTicket
);

router.post(
    '/spot-registration',
    employeeMiddleware,
    upload.fields([
        { name: 'paymentScreenshot', maxCount: 1 }
    ]),
    (err, req, res, next) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({
                status: 400,
                data: null,
                error: err.message,
                message: 'File upload error: ' + err.message,
                path: req.url
            });
        }
        next();
    },
    spotRegistrationByEmployee
);


router.get('/tickets/:ticketId', authMiddleware, getTicketById);
router.get('/tickets/reprint/:ticketId', employeeMiddleware, reprintTicket);
router.get('/untick-tickets/:ticketId', untickTicket);
router.get('/admin/tickets', adminMiddleware, getTicketsDashboardByAdmin);
router.patch('/tickets/:ticketId', employeeMiddleware, updateTicket);
router.get("/tickets/info/:ticketId", employeeMiddleware, getTicketInfoById);
router.delete('/tickets/:ticketId', employeeMiddleware, deleteTicket);

router.get('/tickets/event/:eventId', adminMiddleware, getTicketsByEventId);

router.get('/tickets/export/:eventId', adminMiddleware, exportTicketsToCSV);

// router.post('/admin/tickets/pending', makeTicketStatusPending);
module.exports = router;