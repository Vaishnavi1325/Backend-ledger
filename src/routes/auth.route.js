const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate');
const catchAsync = require('../utils/catchAsync');
const authValidator = require('../validators/auth.validator');
const { loginLimiter } = require('../middlewares/rateLimiter');
const router = express.Router();

// Public auth endpoints
router.post('/register', validate(authValidator.registerSchema), catchAsync(authController.userRegisterController));
router.post('/login', loginLimiter, validate(authValidator.loginSchema), catchAsync(authController.userLoginController));
router.post('/logout', catchAsync(authController.userLogoutController));

// Gmail / Email OTP verification endpoints
router.post('/send-otp', validate(authValidator.sendOtpSchema), catchAsync(authController.sendOtpController));
router.post('/verify-otp-login', loginLimiter, validate(authValidator.verifyOtpLoginSchema), catchAsync(authController.verifyOtpLoginController));
router.post('/register-with-otp', validate(authValidator.registerWithOtpSchema), catchAsync(authController.registerWithOtpController));
router.post('/forgot-password', validate(authValidator.forgotPasswordSchema), catchAsync(authController.forgotPasswordController));
router.post('/reset-password', validate(authValidator.resetPasswordSchema), catchAsync(authController.resetPasswordController));

// Protected profile endpoints
router.get('/me', authMiddleware.authMiddleware, catchAsync(authController.getUserProfileController));
router.patch('/change-password', authMiddleware.authMiddleware, validate(authValidator.changePasswordSchema), catchAsync(authController.changePasswordController));

module.exports = router;
