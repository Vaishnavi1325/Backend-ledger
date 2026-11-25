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
