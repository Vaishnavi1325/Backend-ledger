const express = require('express');
const authController = require('../controllers/auth.controller')
const authMiddleware = require('../middlewares/auth.middleware')
const validate = require('../middlewares/validate')
const catchAsync = require('../utils/catchAsync')
const authValidator = require('../validators/auth.validator')
const { loginLimiter } = require('../middlewares/rateLimiter')
const router = express.Router();

// Public auth endpoints
router.post('/register', validate(authValidator.registerSchema), catchAsync(authController.userRegisterController))
router.post('/login', loginLimiter, validate(authValidator.loginSchema), catchAsync(authController.userLoginController))
router.post("/logout", catchAsync(authController.userLogoutController))

// Protected profile endpoints
router.get('/me', authMiddleware.authMiddleware, catchAsync(authController.getUserProfileController))
router.patch('/change-password', authMiddleware.authMiddleware, validate(authValidator.changePasswordSchema), catchAsync(authController.changePasswordController))

module.exports = router