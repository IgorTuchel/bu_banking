import {
  userData,
  accounts,
  quickActions,
  notifications,
} from "../data/dashboardData";

export async function getDashboardData() {
  return Promise.resolve({
    user: userData,
    accounts,
    quickActions,
    notifications,
  });
}