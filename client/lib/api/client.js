const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
export class ApiError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}
export async function apiRequest(endpoint, options = {}) {
    const headers = {
        "Content-Type": "application/json",
    };
    // Attach auth token if it exists
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            ...headers,
            ...options.headers,
        },
    });
    const json = await response.json();
    if (!json.success) {
        throw new ApiError(json.error || "Something went wrong", response.status);
    }
    return json.data;
}
