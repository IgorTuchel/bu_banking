import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }) {
  const { isLoggedIn, authReady } = useAuth();

  if (!authReady) return null;

  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
