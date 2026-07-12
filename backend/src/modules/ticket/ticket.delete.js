const GenRes = require('../../utils/router/GenRes');
const Ticket = require('./ticket.model');

const deleteTicket = async (req, res) => {
    try {
        const ticketId = req.params.ticketId;
        if (!ticketId) {
            return res.status(400).json(GenRes(400, null, null, "Ticket ID is required", req.url));
        }

        const deletedTicket = await Ticket.findOneAndDelete({ ticketId: ticketId });
        if (!deletedTicket) {
            return res.status(404).json(GenRes(404, null, null, "Ticket not found", req.url));
        }

        return res.status(200).json(GenRes(200, deletedTicket, null, "Ticket deleted successfully", req.url));
    } catch (error) {
        return res.status(500).json(GenRes(500, null, error.message, "Ticket deletion failed", req.url));
    }
}

module.exports = {
    deleteTicket
};