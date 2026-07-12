const express = require('express');
const router = express.Router();
const User = require('../user/user.model'); // Adjust path to your user model


// Update organization details
const updateOrganization = async (req, res) => {
    try {
        // Query user by userId (UUID) instead of _id
        const user = await User.findOne({ userId: req.user.userId });
        if (!user) {
            return res.status(404).json({
                status: 404,
                success: false,
                data: null,
                error: "User not found",
                message: "User not found",
                timestamp: new Date().toISOString()
            }, req.url);
        }

        if (user.role !== "organization") {
            return res.status(403).json({
                status: 403,
                success: false,
                data: null,
                error: "User is not an organization",
                message: "Only organization users can update organization details",
                timestamp: new Date().toISOString()
            }, req.url);
        }

        const {
            name,
            email,
            phone,
            address,
            vatNumber,
            panNumber,
            logo,
            contactPersonName,
            contactPersonNumber,
            contactPersonEmail
        } = req.body;

        // Check if the request body is empty
        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({
                status: 400,
                success: false,
                data: null,
                error: "Request body cannot be empty",
                message: "At least one field must be provided to update",
                timestamp: new Date().toISOString()
            }, req.url);
        }

        // Check for email uniqueness if email is provided and different
        if (email && email.toLowerCase() !== user.email.toLowerCase()) {
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(400).json({
                    status: 400,
                    success: false,
                    data: null,
                    error: "Email already in use",
                    message: "Email is already registered",
                    timestamp: new Date().toISOString()
                }, req.url);
            }
            user.email = email.toLowerCase();
        }

        // Check for phone uniqueness if phone is provided and different
        if (phone && phone !== user.phone) {
            const existingUser = await User.findOne({ phone });
            if (existingUser) {
                return res.status(400).json({
                    status: 400,
                    success: false,
                    data: null,
                    error: "Phone number already in use",
                    message: "Phone number is already registered",
                    timestamp: new Date().toISOString()
                }, req.url);
            }
            user.phone = phone;
        }

        // Update fields if provided
        if (typeof name !== 'undefined') user.name = name;
        if (typeof address !== 'undefined') user.organizationDetails.address = address;
        if (typeof vatNumber !== 'undefined') user.organizationDetails.vatNumber = vatNumber;
        if (typeof panNumber !== 'undefined') user.organizationDetails.panNumber = panNumber;
        if (typeof logo !== 'undefined') user.organizationDetails.logo = logo;
        if (typeof contactPersonName !== 'undefined') user.organizationDetails.contactPerson.name = contactPersonName;
        if (typeof contactPersonNumber !== 'undefined') user.organizationDetails.contactPerson.phone = contactPersonNumber;
        if (typeof contactPersonEmail !== 'undefined') user.organizationDetails.contactPerson.email = contactPersonEmail;

        await user.save();

        return res.status(200).json({
            status: 200,
            success: true,
            data: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                phone: user.phone,
                organizationDetails: {
                    address: user.organizationDetails.address,
                    vatNumber: user.organizationDetails.vatNumber,
                    panNumber: user.organizationDetails.panNumber,
                    logo: user.organizationDetails.logo,
                    contactPersonName: user.organizationDetails.contactPerson.name,
                    contactPersonNumber: user.organizationDetails.contactPerson.phone,
                    contactPersonEmail: user.organizationDetails.contactPerson.email
                }
            },
            error: null,
            message: "Organization details updated successfully",
            timestamp: new Date().toISOString()
        }, req.url);
    } catch (error) {
        console.error("Error in updateOrganization:", error);
        return res.status(500).json({
            status: 500,
            success: false,
            data: null,
            error: error.message,
            message: "Failed to update organization details",
            timestamp: new Date().toISOString()
        }, req.url);
    }
};


module.exports = { updateOrganization }