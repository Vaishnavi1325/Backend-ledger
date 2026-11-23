const rateLimit = require('express-rate-limit');

/**
 * Authentication Rate Limiter
 * Limits login attempts to 15 per 15 minutes per IP to prevent brute-force credential stuffing.
 */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15,
    message: {
        success: false,
        data: null,
        error: "Too many login attempts. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test'
});

/**
 * Transaction Rate Limiter
 * Limits fund transfers to 60 per minute per IP to prevent automated transaction flooding.
 */
const transactionLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    message: {
        success: false,
        data: null,
        error: "Transaction rate limit exceeded. Please wait a moment before sending another transfer."
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test'
});

/**
 * General API Limiter
 * Broad safety limit of 300 requests per 15 minutes.
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: {
        success: false,
        data: null,
        error: "Too many requests from this IP. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test'
});

module.exports = {
    loginLimiter,
    transactionLimiter,
    generalLimiter
};
