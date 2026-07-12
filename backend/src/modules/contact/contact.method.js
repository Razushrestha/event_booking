const GenRes = require('../../utils/router/GenRes');
const Contact = require('./contact.model');
const { v4: uuidv4 } = require('uuid');

const createContact = async (req, res) => {
    try {
        console.log(req.body)
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json(GenRes(400, null, null, "Name, email and message are required"), req.url);
        }

        const newContact = new Contact({
            contactId: uuidv4(),
            name,
            number: req.body.number || null,
            email,
            message
        });

        await newContact.save();

        return res.status(201).json(GenRes(201, newContact, null, "Contact form submitted successfully", req.url));
    } catch (err) {
        return res.status(500).json(GenRes(500, null, err, err.message, req.url));
    }
}

const getAllContactsByAdmin = async (req, res) => {
    try {
        const requestedUser = req.user;

        if (!requestedUser) {
            return res
                .status(401)
                .json(GenRes(401, null, null, "Unauthorized", req.url));
        }

        const allContacts = await Contact.find();

        if (!allContacts || allContacts.length === 0) {
            return res
                .status(404)
                .json(GenRes(404, null, null, "No contact forms submitted", req.url));
        }

        return res
            .status(200)
            .json(GenRes(200, allContacts, null, "All contacts retrieved successfully", req.url));
    } catch (error) {
        return res
            .status(500)
            .json(GenRes(500, null, error, "Error retrieving contacts", req.url));
    }
};

const deleteContact = async (req, res) => {
    try {
        const requestedUser = req.user;
        const { contactId } = req.params;

        if (!requestedUser) {
            return res
                .status(401)
                .json(GenRes(401, null, null, "Unauthorized", req.url));
        }

        if(requestedUser.role !== 'admin') {
            return res
                .status(403)
                .json(GenRes(403, null, null, "Forbidden: Admin access required", req.url));
        }

        const contactToDelete = await Contact.findOne({ contactId });

        if (!contactToDelete) {
            return res
                .status(404)
                .json(GenRes(404, null, null, "Contact not found", req.url));
        }

        // Delete the contact
        await Contact.deleteOne({ contactId });
        return res
            .status(200)
            .json(GenRes(200, null, null, "Contact deleted successfully", req.url));
    } catch (error) {
        return res
            .status(500)
            .json(GenRes(500, null, error, "Error deleting contact", req.url));
    }
}

module.exports = {
    createContact,
    getAllContactsByAdmin,
    deleteContact
}