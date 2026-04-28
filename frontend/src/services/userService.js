import { authenticatedFetch } from "./authService";

const API = "http://127.0.0.1:8000/api";

export async function getCurrentUser() {
  const res = await authenticatedFetch(`${API}/me/`);
  if (!res.ok) throw new Error("Failed to fetch user profile.");
  return res.json();
}
