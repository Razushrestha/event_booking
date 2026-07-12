const express = require('express');
const RegisterUser = require('./user.register');
const { LoginUser, LoginWithGoogle } = require('./user.login');
const { refreshAccessToken, logoutUser } = require('./user.refresh');
const { changePassword, updateUser, getUserDetailByUser, sendVerificationEmail, verifyEmailCode } = require('./user.methods');
const authMiddleware = require('../../middlewares/authMiddleware');
const { forgetPass, verifyCode } = require('../../utils/auth/changePass');
// const handleValidationErrors = require('../../middlewares/handleValidationErrors');
// const {
//     registerValidation,
//     loginValidation,
//     forgetPassValidation,
//     verifyCodeValidation
// } = require('./user.validate');

const SetPassword = require('./user.methods');
const router = express.Router();

// Placeholder route for user API
// router.get('/', (req, res) => {
//     res.send("helo");
// });

router.post('/register', RegisterUser, async (req, res, next) => {
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

router.post('/resend-verification', sendVerificationEmail);

// Route to verify email code
router.post('/verify-email', verifyEmailCode);


router.post('/login', LoginUser);
router.post('/login/google', LoginWithGoogle);
router.post('/refresh-token', refreshAccessToken);
router.post('/logout', authMiddleware, logoutUser);
router.post("/forget-password", forgetPass);
router.post("/verify-code", verifyCode);
router.post('/change-password', authMiddleware, changePassword);
router.post('/update-user', authMiddleware, updateUser);
router.get('/users/me', authMiddleware, getUserDetailByUser);

module.exports = router;