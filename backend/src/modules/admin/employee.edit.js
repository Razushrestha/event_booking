const bcrypt = require("bcrypt");
const User = require("../user/user.model");
const GenRes = require("../../utils/router/GenRes");

// Edit employee details (admin only)
const editEmployee = async (req, res) => {
    try {
        const { userId, fullName, email, password } = req.body;
        if (!userId) return res.status(400).json(GenRes(400, null, null, "User ID is required", req.url));

        const user = await User.findOne({ userId: userId });
        if (!user || user.role !== "employee") return res.status(404).json(GenRes(404, null, null, "Employee not found", req.url));

        if (email) {
            const normalizedEmail = email.toLowerCase();
            if (normalizedEmail !== user.email) {
                const emailExists = await User.findOne({ email: normalizedEmail });
                if (emailExists) return res.status(409).json(GenRes(409, null, null, "This email already exists", req.url));
                user.email = normalizedEmail;
            }
        }

        if (fullName) user.name = fullName;
        if (password) user.passwordHash = await bcrypt.hash(password, 10);

        await user.save();

        const userResponse = {
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        return res.status(200).json(GenRes(200, userResponse, null, "Employee updated successfully", req.url));
    } catch (error) {
        return res.status(500).json(GenRes(500, null, error, "Internal Server Error", req.url));
    }
};

module.exports = { editEmployee };