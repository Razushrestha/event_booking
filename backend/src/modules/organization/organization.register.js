const bcrypt = require("bcrypt");
const GenRes = require("../../utils/router/GenRes");
const User = require("../user/user.model");

const registerOrganization = async (req, res, next) => {
    const url = req.url;
    try {
        const {
            name,
            password,
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

        // Validate required fields
        if (!name) {
            return res.status(400).json(GenRes(400, null, { message: "Missing field: name" }, "Organization name is required", url));
        }

        if (!email) {
            return res.status(400).json(GenRes(400, null, { message: "Missing field: email" }, "Organization email is required", url));
        }

        if (!password) {
            return res.status(400).json(GenRes(400, null, { message: "Missing field: password" }, "Password is required", url));
        }

        const normalizedEmail = email.toLowerCase();

        // Check for email uniqueness
        const userEmailExists = await User.findOne({ email: normalizedEmail });
        if (userEmailExists) {
            return res.status(409).json(GenRes(409, null, { message: "Duplicate Error. CODE = 11000" }, "This email already exists", url));
        }

        // Check for phone uniqueness if provided
        if (phone) {
            const phoneExists = await User.findOne({ phone });
            if (phoneExists) {
                return res.status(409).json(GenRes(409, null, { message: "Duplicate Error. CODE = 11000" }, "This phone number already exists", url));
            }
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // Create new user with organization details
        const newUser = new User({
            name,
            email: normalizedEmail,
            phone,
            passwordHash,
            role: "organization",
            organizationDetails: {
                address: address || undefined,
                vatNumber: vatNumber || undefined,
                panNumber: panNumber || undefined,
                logo: logo || undefined,
                contactPerson: {
                    name: contactPersonName || undefined,
                    phone: contactPersonNumber || undefined,
                    email: contactPersonEmail || undefined
                }
            }
        });

        await newUser.save();

        // Set req.user for sendVerificationEmail
        req.user = {
            userId: newUser.userId,
            email: newUser.email
        };

        // Call next() to trigger sendVerificationEmail in the router
        return next();
    } catch (error) {
        console.error("Error in registerOrganization:", error);
        return res.status(500).json(GenRes(500, null, error, error?.message, url));
    }
};

module.exports = { registerOrganization };
