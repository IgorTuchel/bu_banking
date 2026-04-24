import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";
import logo from "../assets/logo.png";

import {
  getRememberedUsername,
  isLoggedIn,
  loginUser,
} from "../services/authService";

function Login() {
  const navigate = useNavigate();

  const rememberedUsername = getRememberedUsername();

  const [formData, setFormData] = useState({
    username: rememberedUsername,
    password: "",
    rememberUser: Boolean(rememberedUsername),
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) {
      navigate("/dashboard");
    }
  }, [navigate]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const username = formData.username.trim();
    const password = formData.password;

    if (!username || !password) {
      setErrorMessage("Please enter your username and password.");
      return;
    }

    try {
      setErrorMessage("");
      setIsLoading(true);

      await loginUser({
        username,
        password,
        rememberUser: formData.rememberUser,
      });

      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      setErrorMessage("Invalid login details. Please check and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="login-portal-page">
      <header className="login-topbar">
        <div className="login-topbar-inner">
          <div className="login-brand">
            <div className="login-logo-wrapper">
              <img src={logo} alt="Aurix logo" className="login-logo" />
            </div>

            <div className="login-brand-text-group">
              <span className="login-brand-name">AURIX</span>
              <span className="login-brand-tagline">PRIVATE BANKING</span>
            </div>
          </div>

          <div className="login-security-box">
            <div className="login-security-title">
              You&apos;re logging into a secure site
            </div>
            <div className="login-security-subtext">
              Protected access for Aurix online banking
            </div>
          </div>
        </div>
      </header>

      <section className="login-main-section">
        <div className="login-content-grid">
          <div className="login-main-column">
            <header className="login-page-header">
              <h1>Login</h1>
              <p>Sign in to access your account, profile, and rewards.</p>
            </header>

            <form className="login-form-panel" onSubmit={handleSubmit}>
              <div className="login-field-block">
                <label htmlFor="username" className="login-label">
                  Username
                </label>

                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  className="login-text-input"
                  placeholder="Enter your username"
                  autoComplete="username"
                />
              </div>

              <div className="login-field-block">
                <label htmlFor="password" className="login-label">
                  Password
                </label>

                <div className="login-password-input-wrap">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    className="login-text-input"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="login-show-button"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <label className="login-checkbox-row">
                <input
                  type="checkbox"
                  name="rememberUser"
                  checked={formData.rememberUser}
                  onChange={handleChange}
                />
                <span>Remember my username</span>
              </label>

              {errorMessage ? (
                <p className="login-field-error">{errorMessage}</p>
              ) : null}

              <div className="login-divider" />

              <div className="login-actions-row">
                <button type="button" className="login-forgot-link">
                  Forgot your login details?
                </button>

                <button
                  type="submit"
                  className="login-submit-button"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Login"}
                </button>
              </div>
            </form>
          </div>

          <aside className="login-side-column">
            <div className="login-fscs-card">
              <div className="login-fscs-logo">FSCS</div>
              <div className="login-fscs-title">Protected</div>
              <p>
                Eligible deposits are protected up to the applicable limit under
                the Financial Services Compensation Scheme.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <footer className="login-bottom-bar">
        <div className="login-bottom-bar-inner">
          <span>Secure login portal</span>
          <span>Aurix Private Banking</span>
        </div>
      </footer>
    </main>
  );
}

export default Login;