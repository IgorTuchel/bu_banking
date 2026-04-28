import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import "./styles/variables.css";
import "./styles/global.css";

import { AuthProvider } from "./context/AuthContext";

import { AccountProvider } from "./context/AccountContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AccountProvider>
          <App />
        </AccountProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
