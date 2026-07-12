const GenRes = require('../../utils/router/GenRes');
const Ticket = require('./ticket.model');
const PrintingState = require('../print/printState.model');
const { thermalPrint } = require('../print/print.websocket');
const { defaultPrintFormat } = require('../print/print.format');

const getTicketInfoById = async (req, res) => {
    try {
        const requestedUser = req.user;
        const userId = requestedUser?.userId;
        const ticketId = req.params.ticketId;

        if (!requestedUser) {
            return res.status(401).json(GenRes(401, null, null, "Unauthorized", req.url));
        }

        const isAdmin = requestedUser.role === 'admin' || requestedUser.role === 'employee';
        const ticketQuery = isAdmin ? { ticketId } : { ticketId, userId };

        const ticket = await Ticket.findOne(ticketQuery);
        if (!ticket) {
            return res.status(404).json(GenRes(404, null, null, "Ticket not found", req.url));
        }

        // Clone features
        const features = [...(ticket.ticketInfo.features || [])];
        if (ticket.attendeeImage) {
            features.push({
                name: "attendeeImage",
                value: ticket.attendeeImage,
                status: true,
            });
        }

        const entryFeature = features.find(f => f.name === "Entry");

        // === ENTRY + PRINTING ===
        if (entryFeature && entryFeature.status === false) {
            entryFeature.status = true;
            await ticket.save();

            const state = await PrintingState.findOne();
            const printingEnabled = state?.enabled ?? false;

            if (!printingEnabled) {
                return res.status(200).json(
                    GenRes(200, features, null, "Entry done. Printing is disabled.", req.url)
                );
            }

            const qrData = `ACREATEDBY:EVENTSOLUTION+TICKETID:${String(ticketId).toUpperCase()}`;
            const ticketData = {
                name: ticket.name,
                eventName: ticket.eventName,
                email: ticket.email,
                number: ticket.number,
                ticketId: ticket.ticketId,
                ticketInfo: ticket.ticketInfo,
            };

            const tspl = defaultPrintFormat(qrData, ticketData);
            const printResult = await thermalPrint(tspl, req);

            let message = "";
            if (printResult.success) {
                message = "Entry done. QR added to print queue.";
            } else if (printResult.suppressed) {
                message = "Entry done. Print suppressed (recent duplicate).";
            } else if (printResult.reason === "no_clients") {
                message = "Entry done. No printer connected.";
            } else {
                message = "Entry done. Print failed.";
            }

            return res.status(200).json(
                GenRes(200, features, null, message, req.url)
            );
        }

        // === NO ENTRY UPDATE ===
        if (features.length === 1) {
            return res.status(200).json(
                GenRes(200, features, null, "No features available", req.url)
            );
        }

        return res.status(200).json(
            GenRes(200, features.slice(1), null, "Ticket features retrieved successfully", req.url)
        );
    } catch (error) {
        console.error("Error in getTicketInfoById:", error.message);
        return res.status(500).json(
            GenRes(500, null, error, "Error processing ticket", req.url)
        );
    }
};

module.exports = { getTicketInfoById };