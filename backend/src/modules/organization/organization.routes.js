const express = require('express');

const router = express.Router();
const { registerOrganization } = require('./organization.register');
const { loginOrganization, OrgLoginWithGoogle } = require('./organization.login');
const authMiddleware = require('../../middlewares/authMiddleware');
const { updateOrganization } = require('./organization.update');
// const { getOrganizationDetailById } = require('./organization.methods');
const { sendVerificationEmail } = require('../user/user.methods');
router.post('/org/register', registerOrganization, async (req, res, next) => {
    try {
        // Assuming RegisterUser sets req.user to the created user
        const { email } = req.user || req.body;
        if (!email) {
            return res.status(400).json({ status: 400, message: "Email not found from registration" });
        }
        // Call sendVerificationEmail with the registered email
        req.body = { email }; // Pass email to sendVerificationEmail
        return await sendVerificationEmail(req, res);
    } catch (error) {
        console.error("Error sending verification email after registration:", error);
        return res.status(500).json({ status: 500, message: "Failed to send verification email" });
    }
});


router.post('/org/login', loginOrganization);
router.post('/org/login/google', OrgLoginWithGoogle);
router.patch('/org/update', authMiddleware, updateOrganization);

module.exports = router;
