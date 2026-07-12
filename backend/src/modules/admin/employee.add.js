const bcrypt = require("bcrypt");
const User = require("../user/user.model");
const GenRes = require("../../utils/router/GenRes");

const addEmployee = async (req, res) => {
    const url = req.url;
    try {
        const { fullName, email, password } = req.body;

        if (!fullName) {
            const err = GenRes(
                400,
                null,
                { message: "Missing field: fullName" },
                "Full name is required",
                url
            );
            return res.status(err.status).json(err);
        }

        if (!email) {
            const err = GenRes(
                400,
                null,
                { message: "Missing field: email" },
                "Email is required",
                url
            );
            return res.status(err.status).json(err);
        }

        if (!password) {
            const err = GenRes(
                400,
                null,
                { message: "Missing field: password" },
                "Password is required",
                url
            );
            return res.status(err.status).json(err);
        }
        const normalizedEmail = email.toLowerCase();
        const userExist = await User.findOne({ email: normalizedEmail });

        if (userExist) {
            const err = GenRes(
                409,
                null,
                { message: "Duplicate Error. CODE = 11000" },
                "This email already exists",
                url
            );
            return res.status(err.status).json(err);
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const newUser = new User({
            email: normalizedEmail,
            name: fullName,
            passwordHash,
            isVerified: true,
            role: "employee",
        });

        await newUser.save();
        const userResponse = {
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt
        };
        req.user = newUser;
        return res.status(201).json(GenRes(201, userResponse, null, "Employee added successfully", req.url));
    }
    catch (error) {
        const response = GenRes(
            500,
            null,
            { error: "Internal Server Error" },
            "500 | Internal Server Error",
            req.url
        );
        return res.status(500).json(response);
    }
}

module.exports = { addEmployee };
