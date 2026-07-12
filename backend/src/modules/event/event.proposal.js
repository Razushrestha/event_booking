const GenRes = require("../../utils/router/GenRes");
const Event = require("./event.model");
const fs = require("fs");
const path = require("path");


const addProposal = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userDetails = req.user; // From middleware

        // 1. Validate eventId
        if (!eventId) {
            return res.status(400).json(GenRes(400, null, null, "Event ID is required", req.url));
        }

        // 2. Validate proposal file
        if (!req.file) {
            console.error(`[addProposal] No file uploaded for eventId: ${eventId}`);
            return res.status(400).json(GenRes(400, null, null, "Proposal file is required", req.url));
        }

        const proposalFile = req.file;

        // 3. Validate file type (multer already checks, but double-check)
        if (proposalFile.mimetype !== "application/pdf") {
            return res.status(400).json(GenRes(400, null, null, "Only PDF files are allowed", req.url));
        }

        // 4. Find the event
        const event = await Event.findOne({ eventId });
        if (!event) {
            return res.status(404).json(GenRes(404, null, null, "Event not found", req.url));
        }

        // 5. If proposal exists, delegate to editProposal
        if (event.proposal) {
            return await editProposal(req, res);
        }

        // 6. Save proposal to disk
        const uploadsDir = path.join(__dirname, "..", "..", "..", "uploads", "proposals");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const originalName = proposalFile.originalname.replace(/\s+/g, '_');
        const fileName = `${Date.now()}_${originalName}`;
        const filePath = path.join(uploadsDir, fileName);

        // 7. Ensure filePath is not a directory
        if (fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory()) {
            return res.status(400).json(GenRes(400, null, null, `Expected file path but found a directory at: ${filePath}`, req.url));
        }

        // 8. Save the file
        fs.writeFileSync(filePath, proposalFile.buffer);
        const proposalPath = `/uploads/proposals/${fileName}`;

        // 9. Update event with proposal path
        event.proposal = proposalPath;
        await event.save();

        // 10. Prepare response
        return res.status(201).json(GenRes(201, { success: true, proposal: event.proposal }, null, "Proposal added successfully", req.url));
    } catch (err) {
        console.error(`[addProposal] Error for eventId ${req.params.eventId}:`, err.message);
        return res.status(500).json(GenRes(500, null, err.message, "Internal server error", req.url));
    }
};


const editProposal = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userDetails = req.user; // From middleware

        // 1. Validate eventId
        if (!eventId) {
            return res.status(400).json(GenRes(400, null, null, "Event ID is required", req.url));
        }

        // 2. Validate proposal file
        if (!req.file) {
            console.error(`[editProposal] No file uploaded for eventId: ${eventId}`);
            return res.status(400).json(GenRes(400, null, null, "Proposal file is required", req.url));
        }

        const proposalFile = req.file;

        // 3. Validate file type
        if (proposalFile.mimetype !== "application/pdf") {
            return res.status(400).json(GenRes(400, null, null, "Only PDF files are allowed", req.url));
        }

        // 4. Find the event
        const event = await Event.findOne({ eventId });
        if (!event) {
            return res.status(404).json(GenRes(404, null, null, "Event not found", req.url));
        }

        // 5. Ensure proposal exists
        if (!event.proposal) {
            return res.status(400).json(GenRes(400, null, null, "No existing proposal to edit. Use addProposal to create one.", req.url));
        }

        // 6. Delete existing proposal file
        const oldProposalPath = path.join(__dirname, '..', '..', '..', event.proposal);
        if (fs.existsSync(oldProposalPath) && !fs.lstatSync(oldProposalPath).isDirectory()) {
            fs.unlinkSync(oldProposalPath);
        }

        // 7. Save new proposal to disk
        const uploadsDir = path.join(__dirname, "..", "..", "..", "uploads", "proposals");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const originalName = proposalFile.originalname.replace(/\s+/g, '_');
        const fileName = `${Date.now()}_${originalName}`;
        const filePath = path.join(uploadsDir, fileName);

        // 8. Ensure filePath is not a directory
        if (fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory()) {
            return res.status(400).json(GenRes(400, null, null, `Expected file path but found a directory at: ${filePath}`, req.url));
        }

        // 9. Save the file
        fs.writeFileSync(filePath, proposalFile.buffer);
        const proposalPath = `/uploads/proposals/${fileName}`;

        // 10. Update event with new proposal path
        event.proposal = proposalPath;
        await event.save();

        // 11. Prepare response
        return res.status(200).json(GenRes(200, { success: true, proposal: event.proposal }, null, "Proposal updated successfully", req.url));
    } catch (err) {
        console.error(`[editProposal] Error for eventId ${req.params.eventId}:`, err.message);
        return res.status(500).json(GenRes(500, null, err.message, "Internal server error", req.url));
    }
};


const deleteProposal = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userDetails = req.user; // From middleware

        // 1. Validate required fields
        if (!eventId) {
            return res.status(400).json(GenRes(400, null, null, "Event ID is required", req.url));
        }

        // 2. Find the event
        const event = await Event.findOne({ eventId });
        if (!event) {
            return res.status(404).json(GenRes(404, null, null, "Event not found", req.url));
        }

        // 3. Check if proposal exists
        if (!event.proposal) {
            return res.status(400).json(GenRes(400, null, null, "No proposal found for this event", req.url));
        }

        // 4. Delete the proposal file
        const filePath = path.join(__dirname, "..", "..", "..", event.proposal);
        if (fs.existsSync(filePath) && !fs.lstatSync(filePath).isDirectory()) {
            fs.unlinkSync(filePath);
        }

        // 5. Remove proposal from event
        event.proposal = null;
        await event.save();

        // 6. Prepare response
        return res.status(200).json(GenRes(200, null, null, "Proposal deleted successfully", req.url));
    } catch (err) {
        console.error("Error deleting proposal:", err);
        return res.status(500).json(GenRes(500, null, err.message, "Internal server error", req.url));
    }
};

module.exports = {
    addProposal,
    editProposal,
    deleteProposal
};