const API_BASE = import.meta.env.VITE_API_BASE;

const ACCESS_TOKEN_KEY = "aurixAccessToken";
const REFRESH_TOKEN_KEY = "aurixRefreshToken";
const REMEMBERED_USERNAME_KEY = "aurixRememberedUsername";

function getCurrentLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          locationLabel: "Current device location",
        });
      },
      () => {
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      },
    );
  });
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getRememberedUsername() {
  return localStorage.getItem(REMEMBERED_USERNAME_KEY) ?? "";
}

export function isLoggedIn() {
  return Boolean(getAccessToken());
}

export function clearAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function logoutUser() {
  clearAuth();
}

export async function loginUser({ username, password, rememberUser }) {
  const location = await getCurrentLocation();

  const response = await fetch(`${API_BASE}/auth/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
      location,
    }),
  });

  if (!response.ok) {
    throw new Error("Invalid username or password.");
  }

  const data = await response.json();

  localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);

  if (rememberUser) {
    localStorage.setItem(REMEMBERED_USERNAME_KEY, username);
  } else {
    localStorage.removeItem(REMEMBERED_USERNAME_KEY);
  }

  return data;
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error("No refresh token available.");
  }

  const response = await fetch(`${API_BASE}/token/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh: refreshToken,
    }),
  });

  if (!response.ok) {
    clearAuth();
    throw new Error("Session expired.");
  }

  const data = await response.json();
  localStorage.setItem(ACCESS_TOKEN_KEY, data.access);

  return data.access;
}

export async function authenticatedFetch(url, options = {}) {
  const token = getAccessToken();

  let response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  if (response.status !== 401) {
    return response;
  }

  const newToken = await refreshAccessToken();

  response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      Authorization: `Bearer ${newToken}`,
    },
  });

  return response;
}