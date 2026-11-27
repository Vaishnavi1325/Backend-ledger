const { z } = require('zod');

/**
 * Validation schemas for authentication routes.
 * .strict() rejects any unknown fields in the request body.
 */

// POST /api/auth/register
const registerSchema = z.object({
    name: z
        .string("Name is required")
        .trim()
        .min(1, "Name cannot be empty"),
    email: z
        .string("Email is required")
        .email("A valid email is required")
        .trim()
        .toLowerCase(),
    password: z
        .string("Password is required")
        .min(6, "Password must be at least 6 characters")
}).strict();

// POST /api/auth/login
const loginSchema = z.object({
    email: z
        .string("Email is required")
        .email("A valid email is required")
        .trim()
        .toLowerCase(),
    password: z
        .string("Password is required")
        .min(1, "Password cannot be empty")
}).strict();

// PATCH /api/auth/change-password
const changePasswordSchema = z.object({
    currentPassword: z
        .string("Current password is required")
        .min(1, "Current password cannot be empty"),
    newPassword: z
        .string("New password is required")
        .min(6, "New password must be at least 6 characters")
}).strict();

// POST /api/auth/send-otp
const sendOtpSchema = z.object({
    email: z
        .string("Email is required")
        .email("A valid email is required")
        .trim()
        .toLowerCase(),
    purpose: z.enum(["REGISTRATION", "LOGIN", "FORGOT_PASSWORD"], {
        errorMap: () => ({ message: "Purpose must be REGISTRATION, LOGIN, or FORGOT_PASSWORD" })
    })
}).strict();

// POST /api/auth/verify-otp-login
const verifyOtpLoginSchema = z.object({
    email: z
        .string("Email is required")
        .email("A valid email is required")
        .trim()
        .toLowerCase(),
    otp: z
        .string("OTP is required")
        .length(6, "OTP must be exactly 6 digits")
        .regex(/^\d{6}$/, "OTP must consist of 6 digits")
}).strict();

// POST /api/auth/register-with-otp
const registerWithOtpSchema = z.object({
    name: z
        .string("Name is required")
        .trim()
        .min(1, "Name cannot be empty"),
    email: z
        .string("Email is required")
        .email("A valid email is required")
        .trim()
        .toLowerCase(),
    password: z
        .string("Password is required")
        .min(6, "Password must be at least 6 characters"),
    otp: z
        .string("OTP is required")
        .length(6, "OTP must be exactly 6 digits")
        .regex(/^\d{6}$/, "OTP must consist of 6 digits")
}).strict();

// POST /api/auth/forgot-password
const forgotPasswordSchema = z.object({
    email: z
        .string("Email is required")
        .email("A valid email is required")
        .trim()
        .toLowerCase()
}).strict();

// POST /api/auth/reset-password
const resetPasswordSchema = z.object({
    email: z
        .string("Email is required")
        .email("A valid email is required")
        .trim()
        .toLowerCase(),
    otp: z
        .string("OTP is required")
        .length(6, "OTP must be exactly 6 digits")
        .regex(/^\d{6}$/, "OTP must consist of 6 digits"),
    newPassword: z
        .string("New password is required")
        .min(6, "New password must be at least 6 characters")
}).strict();

module.exports = {
    registerSchema,
    loginSchema,
    changePasswordSchema,
    sendOtpSchema,
    verifyOtpLoginSchema,
    registerWithOtpSchema,
    forgotPasswordSchema,
    resetPasswordSchema
};
