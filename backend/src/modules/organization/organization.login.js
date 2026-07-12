const { tokenGen } = require("../../utils/auth/tokenHandler");
const GenRes = require("../../utils/router/GenRes");
const Organization = require("./organization.model");
const bcrypt = require("bcryptjs");
const User = require("../user/user.model");
const { v4: uuidv4 } = require("uuid");
const { resolveGoogleIdentity } = require("../../utils/auth/verifyGoogleToken");

function sanitizeUser(user) {
    const obj = user.toObject();
    delete obj.signedIn;
    delete obj.passwordHash;
    delete obj.refreshToken;
    delete obj.code;
    delete obj.expiry;
    delete obj.codeAttemptCount;
    delete obj._id;
    delete obj.__v;
    return obj;
}

const loginOrganization = async (req, res) => {
    try {
        const email = req?.body?.email?.toLowerCase();
        const password = req?.body?.password;

        // 400
        if (!email || !password) {
            const response = GenRes(
                400,
                null,
                { error: "Email and Password is required!" },
                "400 | Email or password not Found",
                req?.url
            );
            return res.status(400).json(response);
        }

        // Fetch organization data
        const orgData = await Organization.findOne({ email });
        if (!orgData) {
            const response = GenRes(
                404,
                null,
                { error: "Organization not registered!" },
                "Organization not found",
                req?.url
            );
            return res.status(404).json(response);
        }

        // Check password
        const isCorrectPassword = await bcrypt.compare(
            password,
            orgData?.passwordHash
        );

        // Respond after checking password
        if (!isCorrectPassword) {
            const response = GenRes(
                401,
                null,
                { error: "Incorrect Credentials [PASSWORD DIDNT MATCH]" },
                "Incorrect Credentials",
                req?.url
            );
            return res.status(401).json(response);
        }

        // Generate token and respond
        const genData = {
            email: orgData?.email,
            name: orgData?.name,
            role: orgData?.role,
            organizationId: orgData?.organizationId?.toString(),
            phone: orgData?.phone,
        };

        const token = tokenGen(genData);
        genData.token = token;

        const response = GenRes(
            200,
            genData,
            null,
            "Login successful",
            req?.url
        );
        return res.status(200).json(response);
    } catch (err) {
        return res.status(500).json(GenRes(500, null, err, err.message), req.url);
    }
}

const OrgLoginWithGoogle = async (req, res) => {
    const url = req.url;
    try {
        const { fullName, email, uid, idToken } = req.body;

        // Validate required fields
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

        if (!uid) {
            const err = GenRes(
                400,
                null,
                { message: "Missing field: uid" },
                "Google UID is required",
                url
            );
            return res.status(err.status).json(err);
        }

        const identity = await resolveGoogleIdentity({ idToken, uid, email, fullName });
        const normalizedEmail = identity.email;
        const googleUid = identity.uid;
        const googleName = identity.fullName;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email: normalizedEmail }, { gId: googleUid }] });

        if (existingUser) {
            // User exists - proceed with login
            if (existingUser.role === "user") {
                const err = GenRes(
                    400,
                    null,
                    { message: "Email conflict" },
                    "Email is already in use as a user",
                    url
                );
                return res.status(err.status).json(err);
            }
            const genData = {
                email: existingUser.email,
                role: "organization",
                id: existingUser.userId?.toString(),
                date: new Date(),
            };

            const { refreshToken, accessToken } = tokenGen(genData);
            existingUser.refreshToken = refreshToken;
            await existingUser.save();

            const saveData = GenRes(200, sanitizeUser(existingUser), null, "Logged in with Google");
            return res.status(200).json({ ...saveData, accessToken, refreshToken });
        } else {
            // User doesn't exist - register new user
            const newUser = new User({
                userId: uuidv4(),
                gId: googleUid,
                email: normalizedEmail,
                name: googleName,
                isVerified: true, // Automatically verified for Google users
                phone: null, // Set to null as per schema
                passwordHash: "GOOGLE_AUTH", // Placeholder for required field
                role: "organization",
            });

            await newUser.save();

            // Generate tokens for the new user
            const genData = {
                email: newUser.email,
                role: newUser.role,
                isVerified: true,
                userId: newUser.userId?.toString(),
                date: new Date(),
            };

            const { refreshToken, accessToken } = tokenGen(genData);
            newUser.refreshToken = refreshToken;
            await newUser.save();

            const saveData = GenRes(201, sanitizeUser(newUser), null, "User registered and logged in with Google");
            return res.status(201).json({ ...saveData, accessToken, refreshToken });
        }
    } catch (error) {
        if (error.message?.includes("Google")) {
            const response = GenRes(401, null, { error: error.message }, "Google authentication failed", url);
            return res.status(401).json(response);
        }
        console.log("Catch block url:", url);
        console.error("Error in LoginWithGoogle:", error);
        const response = GenRes(500, null, error, error?.message, url);
        return res.status(500).json(response);
    }
};

module.exports = {
    loginOrganization,
    OrgLoginWithGoogle
};