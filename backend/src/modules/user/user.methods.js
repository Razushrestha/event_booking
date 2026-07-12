const GenRes = require("../../utils/router/GenRes");
const User = require("./user.model");
const { passwordHashFunction } = require("../../utils/auth/hash");
const bcrypt = require("bcryptjs");
const { sendEmail } = require("../../utils/booking/sendEmail");

const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;
        const requestedUser = req.user;

        if (!requestedUser) {
            return res.status(404).json(GenRes(404, null, null, "User not found"), req.url);
        }
        if (!requestedUser.email) {
            return res.status(400).json(GenRes(400, null, null, "User email is required"), req.url);
        }
        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json(GenRes(400, null, null, "Old password, new password, and confirmation are required"), req.url);
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json(GenRes(400, null, null, "New password and confirmation do not match"), req.url);
        }

        const user = await User.findOne({ email: requestedUser.email.toLowerCase() });

        if (!user) {
            return res.status(404).json(GenRes(404, null, null, "User not found"), req.url);
        }

        const isSamePassword = await bcrypt.compare(
            newPassword,
            user?.passwordHash
        );

        if (isSamePassword) {
            return res.status(400).json(GenRes(400, null, null, "New password cannot be the same as the old password"), req.url);
        }

        const isCorrectPassword = await bcrypt.compare(
            oldPassword,
            user?.passwordHash
        );
        if (!isCorrectPassword) {
            return res.status(401).json(GenRes(401, null, null, "Old password is incorrect"), req.url);
        }

        user.passwordHash = await passwordHashFunction(newPassword);

        await user.save();

        return res.status(200).json(GenRes(200, null, null, "Password changed successfully"), req.url);
    } catch (err) {
        return res.status(500).json(GenRes(500, null, err, err.message), req.url);
    }
}

const getUserDetailByUser = async (req, res) => {
    try {
        const requestedUser = req.user;
        if (!requestedUser || !requestedUser.email) {
            return res.status(400).json(GenRes(400, null, null, "Email is required"), req.url);
        }

        let user = await User.findOne({ email: requestedUser.email.toLowerCase() });

        if (user) {
            user = user.toObject();
            delete user.passwordHash;
            delete user.code;
            delete user.expiry;
            delete user.codeAttemptCount;
            delete user._id;
            delete user.__v;
        }
        if (!user) {
            return res.status(404).json(GenRes(404, null, null, "User not found"), req.url);
        }

        return res.status(200).json(GenRes(200, user, null, "User details retrieved successfully"), req.url);
    } catch (err) {
        return res.status(500).json(GenRes(500, null, err, err.message), req.url);
    }
}

const updateUser = async (req, res) => {
    try {
        const { email, name, phone } = req.body;
        const requestedUser = req.user;
        var emailExists, phoneExists;
        if (!email && !name && !phone) {
            return res.status(400).json(GenRes(400, null, null, "Email, name and phone or required"), req.url);
        }

        const user = await User.findOne({ email: requestedUser.email.toLowerCase() });

        if (!user) {
            return res.status(404).json(GenRes(404, null, null, "User not found"), req.url);
        }

        //check if email or number is already in use
        if (email) {
            emailExists = await User.findOne({ email: email.toLowerCase() });
        }
        if (phone) {
            phoneExists = await User.findOne({ phone });
        }
        if (emailExists && emailExists.userId !== user.userId) {
            return res.status(409).json(GenRes(409, null, null, "Email already in use"), req.url);
        }
        if (phoneExists && phoneExists.userId !== user.userId) {
            return res.status(409).json(GenRes(409, null, null, "Phone number already in use"), req.url);
        }

        //update user details
        user.email = email ? email.toLowerCase() : user.email;
        user.name = name;
        user.phone = phone;
        console.log(user);
        await user.save();

        return res.status(200).json(GenRes(200, null, null, "User updated successfully"), req.url);
    } catch (err) {
        return res.status(500).json(GenRes(500, null, err, err.message), req.url);
    }
}


// Function that sends OTP to user via email upon register or password reset
const sendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json(GenRes(400, null, null, "Email is required"), req.url);
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json(GenRes(404, null, null, "User not found"), req.url);
        }
        if (user.isVerified) {
            return res.status(400).json(GenRes(400, null, null, "User is already verified"), req.url);
        }

        // Generate OTP code and expiry time
        const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
        const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
        const hashedCode = await passwordHashFunction(code);
        user.code = hashedCode;
        user.expiry = expiry;
        user.codeAttemptCount = 0; // Reset code attempt count
        await user.save();
        console.log("User code:", code);

        // Prepare email content
        const subject = "Verify Your Email Address";
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>Email Verification</h2>
                <p>Hello ${user.name || 'User'},</p>
                <p>Please use the following One-Time Password (OTP) to verify your email address:</p>
                <h3 style="background: #f0f0f0; padding: 10px; text-align: center; letter-spacing: 2px;">${code}</h3>
                <p>This code is valid for 5 minutes. Do not share it with anyone.</p>
                <p>If you did not request this, please ignore this email.</p>
                <p>Best regards,<br>EventSolutions</p>
            </div>
        `;
        const text = `Hello ${user.name || 'User'},\n\nPlease use the following OTP to verify your email address: ${code}\n\nThis code is valid for 5 minutes. Do not share it with anyone.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nYour App Team`;

        // Send the verification email
        await sendEmail({
            to: email,
            subject,
            html,
            text
        });

        return res.status(200).json(GenRes(200, null, null, "Verification email sent successfully"), req.url);
    } catch (error) {
        console.error("Error in sendVerificationEmail:", error);
        return res.status(500).json(GenRes(500, null, null, "Failed to send verification email"), req.url);
    }
};

const verifyEmailCode = async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json(GenRes(400, null, null, "Email and code are required"), req.url);
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !user.code || !user.expiry) {
            return res.status(404).json(GenRes(404, null, null, "User not found or code not set"), req.url);
        }

        if (user.expiry < new Date()) {
            user.code = null;
            user.expiry = null;
            user.codeAttemptCount = 0;
            await user.save();
            return res.status(410).json(GenRes(410, null, null, "OTP expired. Please request a new one."), req.url);
        }

        if (user.codeAttemptCount >= 25) {
            user.code = null;
            user.expiry = null;
            user.codeAttemptCount = 0;
            await user.save();
            return res.status(429).json(GenRes(429, null, null, "Too many attempts. Please request a new code."), req.url);
        }

        const isCodeValid = await bcrypt.compare(code.toString(), user.code);
        if (!isCodeValid) {
            user.codeAttemptCount += 1;
            await user.save();
            return res.status(401).json(GenRes(401, null, null, "Invalid code"), req.url);
        }

        user.isVerified = true;
        user.code = null;
        user.expiry = null;
        user.codeAttemptCount = 0;
        await user.save();

        return res.status(200).json(GenRes(200, null, null, "Email verified successfully"), req.url);
    } catch (error) {
        console.error("Error in verifyEmailCode:", error);
        return res.status(500).json(GenRes(500, null, error.message, "Failed to verify email code"), req.url);
    }
};

module.exports = {
    changePassword,
    updateUser,
    getUserDetailByUser,
    sendVerificationEmail,
    verifyEmailCode
}