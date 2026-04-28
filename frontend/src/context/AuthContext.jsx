import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  isLoggedIn,
  loginUser,
  logoutUser,
  getAccessToken,
  authenticatedFetch,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // Fetch the logged-in user's profile from the backend
  const loadUser = useCallback(async () => {
    if (!isLoggedIn()) {
      setAuthReady(true);
      return;
    }
    try {
      const res = await authenticatedFetch("http://127.0.0.1:8000/api/me/");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setAuthReady(true);
    }
  }, []);

  // Run once on mount to rehydrate session
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(
    async (credentials) => {
      await loginUser(credentials);
      await loadUser();
    },
    [loadUser],
  );

  const logout = useCallback(() => {
    logoutUser();
    setUser(null);
  }, []);

  const value = {
    user, // user object from /api/auth/user/ or null
    authReady, // false until initial session check completes
    isLoggedIn: Boolean(getAccessToken()),
    login,
    logout,
    reloadUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
