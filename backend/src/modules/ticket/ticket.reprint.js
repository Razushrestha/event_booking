const GenRes = require('../../utils/router/GenRes');
const Ticket = require('./ticket.model');
const { thermalPrint } = require('../print/print.websocket');
const { defaultPrintFormat } = require('../print/print.format');

const reprintTicket = async (req, res) => {
    try {
        const requestedUser = req.user;
        const { ticketId } = req.params;

        // Validate ticketId
        if (!ticketId) {
            console.log('reprintTicket - Missing ticketId');
            return res.status(400).json(GenRes(400, null, null, "ticketId is required", req.url));
        }

        // console.log('reprintTicket - ticketId:', ticketId, 'User role:', requestedUser?.role);

        // Query ticket based on user role
        let ticket;
        if (requestedUser.role === 'admin' || requestedUser.role === 'employee') {
            ticket = await Ticket.findOne({ ticketId });
        }
        if (!ticket) {
            console.log('reprintTicket - Ticket not found for ticketId:', ticketId);
            return res.status(404).json(GenRes(404, null, null, "Ticket not found", req.url));
        }
        const upperTicketId = String(ticketId).toUpperCase();
        const qrData = `ACREATEDBY:EVENTSOLUTION+TICKETID:${upperTicketId}`;
        const ticketData = {
            name: ticket.name,
            eventName: ticket.eventName,
            email: ticket.email,
            number: ticket.number,
            ticketId: ticket.ticketId,
            ticketInfo: ticket.ticketInfo
        };

        // Reprint the ticket
        console.log('reprintTicket - Preparing to print ticket:', ticketId);
        const tspl = defaultPrintFormat(qrData, ticketData);
        await thermalPrint(tspl, req, res);

        console.log('reprintTicket - Ticket reprint successful for ticketId:', ticketId);
        return res.status(200).json(GenRes(200, null, null, "Ticket reprint initiated", req.url));
    } catch (error) {
        console.error('reprintTicket - Error:', error.message, error.stack);
        return res.status(500).json(GenRes(500, null, error.message, "Error reprinting ticket", req.url));
    }
};

module.exports = { reprintTicket };