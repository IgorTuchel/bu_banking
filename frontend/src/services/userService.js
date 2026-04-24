import { authenticatedFetch } from "./authService";

const API_BASE = "http://127.0.0.1:8000/api";

export async function getCurrentUser() {
  const response = await authenticatedFetch(`${API_BASE}/me/`);

  if (!response.ok) {
    throw new Error("Failed to fetch current user.");
  }

  const user = await response.json();

  return {
    ...user,
    lastLogin: user.lastLogin
      ? {
          timestamp: user.lastLogin,
          location: "Secure login",
        }
      : {
          timestamp: null,
          location: "Secure login",
        },
  };
}