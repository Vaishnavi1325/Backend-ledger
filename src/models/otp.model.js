const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required for OTP"],
        lowercase: true,
        trim: true,
        index: true
    },
    otp: {
        type: String,
        required: [true, "OTP is required"]
    },
    purpose: {
        type: String,
        enum: ['REGISTRATION', 'LOGIN', 'FORGOT_PASSWORD'],
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // MongoDB TTL index: documents expire automatically when expiresAt <= now
    }
}, {
    timestamps: true
});

otpSchema.index({ email: 1, purpose: 1 });

const otpModel = mongoose.model('otp', otpSchema);

module.exports = otpModel;
