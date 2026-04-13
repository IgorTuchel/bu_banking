import { usersData } from "../data/usersData";

export async function getCurrentUser() {
  // simulate API latency (optional but nice)
  await new Promise((resolve) => setTimeout(resolve, 100));

  return usersData[0]; // mock logged-in user
}