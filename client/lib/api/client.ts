const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

// Matches the backend's consistent response format
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
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

  const json: ApiResponse<T> = await response.json();

  if (!json.success) {
    throw new ApiError(
      json.error || "Something went wrong",
      response.status
    );
  }

  return json.data as T;
}
