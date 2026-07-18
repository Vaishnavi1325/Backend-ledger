const express=require('express');
const authController=require('../controllers/auth.controller')
const validate=require('../middlewares/validate')
const catchAsync=require('../utils/catchAsync')
const authValidator=require('../validators/auth.validator')
const router=express.Router();

// Validate request body before reaching the controller
router.post('/register',validate(authValidator.registerSchema),catchAsync(authController.userRegisterController))
router.post('/login',validate(authValidator.loginSchema),catchAsync(authController.userLoginController))
router.post("/logout", catchAsync(authController.userLogoutController))
module.exports=router