import { apiRequest } from "./client";

export async function loginUser(email, password) {
    return apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
}

export async function registerUser(name, email, password) {
    return apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
    });
}

export async function logoutUser() {
    return apiRequest("/auth/logout", {
        method: "POST",
    });
}

export async function getProfile() {
    return apiRequest("/auth/me");
}

export async function changePassword(currentPassword, newPassword) {
    return apiRequest("/auth/change-password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
    });
}

/**
 * Request 6-digit OTP code sent to user's Gmail/email
 * @param {string} email
 * @param {'REGISTRATION'|'LOGIN'|'FORGOT_PASSWORD'} purpose
 */
export async function sendOtp(email, purpose) {
    return apiRequest("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ email, purpose }),
    });
}

/**
 * Sign in using 6-digit verification code sent to Gmail
 */
export async function verifyOtpLogin(email, otp) {
    return apiRequest("/auth/verify-otp-login", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
    });
}

/**
 * Register account with 6-digit Gmail verification code
 */
export async function registerWithOtp(name, email, password, otp) {
    return apiRequest("/auth/register-with-otp", {
        method: "POST",
        body: JSON.stringify({ name, email, password, otp }),
    });
}

/**
 * Send password reset OTP code to Gmail
 */
export async function forgotPassword(email) {
    return apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
    });
}

/**
 * Reset passcode/password using Gmail OTP verification code
 */
export async function resetPassword(email, otp, newPassword) {
    return apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, otp, newPassword }),
    });
}
