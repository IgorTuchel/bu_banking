const API_BASE = "http://127.0.0.1:8000/api";

export async function getCurrentUser() {
  const response = await fetch(`${API_BASE}/me/`);

  if (!response.ok) {
    throw new Error("Failed to fetch current user.");
  }

  return response.json();
}