const { tokenGen } = require("../../utils/auth/tokenHandler");
const GenRes = require("../../utils/router/GenRes");
const User = require("./user.model");
const bcrypt = require("bcryptjs");
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

const LoginUser = async (req, res) => {
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

        //
        const userData = await User.findOne({ email });
        if (!userData) {
            const response = GenRes(
                404,
                null,
                { error: "User not registerred!" },
                "User not found",
                req?.url
            );
            return res.status(404).json(response);
        }

        // check if user is verified
        // Uncomment if you want to enforce user verification
        // if (!userData?.isVerified) {
        //     const response = GenRes(
        //         403,
        //         null,
        //         { error: "User is not verified!" },
        //         "User not verified",
        //         req?.url
        //     );
        //     return res.status(403).json(response);
        // }
        // check if user is signed in

        // check password
        const isCorrectPassword = await bcrypt.compare(
            password,
            userData?.passwordHash
        );

        //respond after check password
        if (!isCorrectPassword) {
            const response = GenRes(
                401,
                null,
                { error: "Incorrect Credentials [PASSWORD DIDNT MATCH]" },
                "Incorrect Credentaials",
                req?.url
            );
            return res.status(401).json(response);
        }


        const genData = {
            email: userData?.email,
            name: userData?.name,
            role: userData?.role,
            id: userData?.userId?.toString(),
            phone: userData?.phone,
            date: new Date(),
        };

        const { refreshToken, accessToken } = tokenGen(genData);
        userData.refreshToken = refreshToken;
        await userData.save();
        const saveData = GenRes(200, sanitizeUser(userData), null, "Logged in");
        return res.status(200).json({ ...saveData, accessToken, refreshToken });
    } catch (error) {
        const respones = GenRes(500, null, error, error?.message, req?.url);
        return res.status(500).json(respones);
    }
};

const LoginWithGoogle = async (req, res) => {
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
            if (existingUser.role === "organization") {
                const err = GenRes(
                    400,
                    null,
                    { message: "Email conflict" },
                    "Email is already in use as an organization",
                    url
                );
                return res.status(err.status).json(err);
            }
            const genData = {
                email: existingUser.email,
                role: existingUser.role,
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
                userId: uuidv4(), // Generate unique userId
                gId: googleUid, // Store Google UID in gId field
                email: normalizedEmail,
                name: googleName,
                isVerified: true, // Automatically verified for Google users
                phone: null, // Set to null as per schema
                passwordHash: "GOOGLE_AUTH", // Placeholder for required field
                role: "user"
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



module.exports = { LoginUser, LoginWithGoogle };