const userModel = require('../models/user.model');
const accountModel = require('../models/account.model');
const otpModel = require('../models/otp.model');
const jwt = require('jsonwebtoken');
const emailService = require('../services/email.service');
const tokenBlackListModel = require('../models/blackList.model');
const AppError = require('../utils/AppError');
const crypto = require('crypto');

// Creates the signed login token (JWT) for a user.
function generateAuthToken(userId) {
    return jwt.sign({ userId: userId }, process.env.JWT_SECRET, { expiresIn: "3d" });
}

/**
 * - User Register Controller
 * - POST /api/auth/register
 */
async function userRegisterController(req, res) {
    const { email, password, name } = req.body;

    const isExists = await userModel.findOne({ email });
    if (isExists) {
        throw new AppError("User already exists.", 409);
    }

    const user = await userModel.create({
        email,
        password,
        name
    });

    // Automatically create the initial default bank account for new user
    const accountNumber = await accountModel.generateUniqueAccountNumber();
    await accountModel.create({
        user: user._id,
        accountNumber,
        currency: "INR"
    });

    const token = generateAuthToken(user._id);
    res.cookie("token", token);

    res.status(201).json({
        success: true,
        data: {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            token
        },
        error: null
    });

    // Email is sent after response
    await emailService.sendregistrationEmail(user.email, user.name);
}

/**
 * - User Login Controller
 * - POST /api/auth/login
 */
async function userLoginController(req, res) {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
        throw new AppError("Email or password is invalid.", 401);
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
        throw new AppError("Email or password is invalid.", 401);
    }

    const token = generateAuthToken(user._id);
    res.cookie("token", token);

    res.status(200).json({
        success: true,
        data: {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            token
        },
        error: null
    });
}

/**
 * - User Logout Controller
 * - POST /api/auth/logout
 */
async function userLogoutController(req, res) {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (token) {
        const isAlreadyBlacklisted = await tokenBlackListModel.findOne({ token: token });
        if (!isAlreadyBlacklisted) {
            await tokenBlackListModel.create({ token: token });
        }
    }

    res.clearCookie("token");

    res.status(200).json({
        success: true,
        data: {
            message: "User logged out successfully"
        },
        error: null
    });
}

/**
 * - Get Current User Profile Controller
 * - GET /api/auth/me
 */
async function getUserProfileController(req, res) {
    const user = req.user;

    res.status(200).json({
        success: true,
        data: {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            }
        },
        error: null
    });
}

/**
 * - Change Password Controller
 * - PATCH /api/auth/change-password
 */
async function changePasswordController(req, res) {
    const { currentPassword, newPassword } = req.body;
    const user = await userModel.findById(req.user._id).select("+password");

    if (!user) {
        throw new AppError("User not found", 404);
    }

    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
        throw new AppError("Current password is incorrect.", 400);
    }

    if (currentPassword === newPassword) {
        throw new AppError("New password must be different from current password.", 400);
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
        success: true,
        data: {
            message: "Password changed successfully."
        },
        error: null
    });
}

/**
 * - Send OTP Controller (Gmail / Email OTP verification)
 * - POST /api/auth/send-otp
 */
async function sendOtpController(req, res) {
    const { email, purpose } = req.body;

    const existingUser = await userModel.findOne({ email });

    if (purpose === "REGISTRATION" && existingUser) {
        throw new AppError("An account with this email already exists. Please sign in.", 409);
    }

    if ((purpose === "LOGIN" || purpose === "FORGOT_PASSWORD") && !existingUser) {
        throw new AppError("No account found associated with this email address.", 404);
    }

    // Generate secure 6-digit cryptographic OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Invalidate existing pending OTPs for this email and purpose
    await otpModel.deleteMany({ email, purpose });

    // Store new OTP with 10-minute validity
    await otpModel.create({
        email,
        otp,
        purpose,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    // Send email notification
    await emailService.sendOtpEmail(email, otp, purpose);

    res.status(200).json({
        success: true,
        data: {
            message: `Verification code sent successfully to ${email}.`,
            purpose
        },
        error: null
    });
}

/**
 * - Verify OTP Login Controller (Passwordless Gmail OTP Login)
 * - POST /api/auth/verify-otp-login
 */
async function verifyOtpLoginController(req, res) {
    const { email, otp } = req.body;

    const otpDoc = await otpModel.findOne({
        email,
        otp,
        purpose: "LOGIN",
        expiresAt: { $gt: new Date() }
    });

    if (!otpDoc) {
        throw new AppError("Invalid or expired verification code. Please request a new code.", 400);
    }

    const user = await userModel.findOne({ email });
    if (!user) {
        throw new AppError("User account not found.", 404);
    }

    // Invalidate consumed OTP
    await otpModel.deleteMany({ email, purpose: "LOGIN" });

    const token = generateAuthToken(user._id);
    res.cookie("token", token);

    res.status(200).json({
        success: true,
        data: {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            token
        },
        error: null
    });
}

/**
 * - Register With Verified Email OTP Controller
 * - POST /api/auth/register-with-otp
 */
async function registerWithOtpController(req, res) {
    const { name, email, password, otp } = req.body;

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
        throw new AppError("An account with this email already exists.", 409);
    }

    const otpDoc = await otpModel.findOne({
        email,
        otp,
        purpose: "REGISTRATION",
        expiresAt: { $gt: new Date() }
    });

    if (!otpDoc) {
        throw new AppError("Invalid or expired registration verification code.", 400);
    }

    // Invalidate OTP
    await otpModel.deleteMany({ email, purpose: "REGISTRATION" });

    const user = await userModel.create({
        email,
        password,
        name
    });

    // Automatically create primary bank account
    const accountNumber = await accountModel.generateUniqueAccountNumber();
    await accountModel.create({
        user: user._id,
        accountNumber,
        currency: "INR"
    });

    const token = generateAuthToken(user._id);
    res.cookie("token", token);

    res.status(201).json({
        success: true,
        data: {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            token
        },
        error: null
    });

    await emailService.sendregistrationEmail(user.email, user.name);
}

/**
 * - Forgot Password Controller (Generates and sends reset OTP to Gmail)
 * - POST /api/auth/forgot-password
 */
async function forgotPasswordController(req, res) {
    const { email } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
        throw new AppError("No account found associated with this email address.", 404);
    }

    const otp = crypto.randomInt(100000, 999999).toString();

    await otpModel.deleteMany({ email, purpose: "FORGOT_PASSWORD" });

    await otpModel.create({
        email,
        otp,
        purpose: "FORGOT_PASSWORD",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await emailService.sendOtpEmail(email, otp, "FORGOT_PASSWORD");

    res.status(200).json({
        success: true,
        data: {
            message: `Password reset verification code sent to ${email}.`
        },
        error: null
    });
}

/**
 * - Reset Password Controller (Verifies OTP and changes password)
 * - POST /api/auth/reset-password
 */
async function resetPasswordController(req, res) {
    const { email, otp, newPassword } = req.body;

    const otpDoc = await otpModel.findOne({
        email,
        otp,
        purpose: "FORGOT_PASSWORD",
        expiresAt: { $gt: new Date() }
    });

    if (!otpDoc) {
        throw new AppError("Invalid or expired verification code. Please request a new code.", 400);
    }

    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
        throw new AppError("User not found.", 404);
    }

    user.password = newPassword;
    await user.save();

    // Invalidate consumed OTP
    await otpModel.deleteMany({ email, purpose: "FORGOT_PASSWORD" });

    res.status(200).json({
        success: true,
        data: {
            message: "Password has been reset successfully. You can now log in with your new password."
        },
        error: null
    });
}

module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController,
    getUserProfileController,
    changePasswordController,
    sendOtpController,
    verifyOtpLoginController,
    registerWithOtpController,
    forgotPasswordController,
    resetPasswordController
};
