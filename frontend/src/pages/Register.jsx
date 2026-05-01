import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./register.css";
import logo from "../assets/logo.png";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    dateOfBirth: "",
    phoneMobile: "",
    phoneHome: "",
    houseNumber: "",
    flatNumber: "",
    streetAddress: "",
    townCity: "",
    county: "",
    postcode: "",
    password: "",
    confirmPassword: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage("");
  }

  function validateForm() {
    const requiredFields = [
      ["firstName", "First name"],
      ["lastName", "Last name"],
      ["username", "Username"],
      ["email", "Email address"],
      ["dateOfBirth", "Date of birth"],
      ["phoneMobile", "Mobile phone"],
      ["houseNumber", "House number"],
      ["streetAddress", "Street address"],
      ["townCity", "Town / City"],
      ["postcode", "Postcode"],
      ["password", "Password"],
      ["confirmPassword", "Confirm password"],
    ];

    for (const [key, label] of requiredFields) {
      if (!formData[key].trim()) {
        return `${label} is required.`;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match.";
    }

    if (formData.password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setErrorMessage("");
      setIsLoading(true);

      const response = await fetch("http://localhost:8000/api/auth/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed. Please try again.");
      }

      navigate("/login");
    } catch (error) {
      setErrorMessage(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="register-portal-page">
      <header className="register-topbar">
        <div className="register-topbar-inner">
          <div className="register-brand">
            <div className="register-logo-wrapper">
              <img src={logo} alt="Aurix logo" className="register-logo" />
            </div>
            <div className="register-brand-text-group">
              <span className="register-brand-name">AURIX</span>
              <span className="register-brand-tagline">PRIVATE BANKING</span>
            </div>
          </div>

          <div className="register-security-box">
            <div className="register-security-title">
              You&apos;re opening a secure account
            </div>
            <div className="register-security-subtext">
              Protected registration for Aurix online banking
            </div>
          </div>
        </div>
      </header>

      <section className="register-main-section">
        <div className="register-content-grid">
          <div className="register-main-column">
            <header className="register-page-header">
              <h1>Create Account</h1>
              <p>
                Open your Aurix account to access banking, savings, and more.
              </p>
            </header>

            <form className="register-form-panel" onSubmit={handleSubmit}>
              <div className="register-field-row">
                <div className="register-field-block">
                  <label htmlFor="firstName" className="register-label">
                    First Name <span className="register-required">*</span>
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="register-text-input"
                    placeholder="First name"
                    autoComplete="given-name"
                  />
                </div>

                <div className="register-field-block">
                  <label htmlFor="lastName" className="register-label">
                    Last Name <span className="register-required">*</span>
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="register-text-input"
                    placeholder="Last name"
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div className="register-field-row">
                <div className="register-field-block">
                  <label htmlFor="username" className="register-label">
                    Username <span className="register-required">*</span>
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    className="register-text-input"
                    placeholder="Choose a username"
                    autoComplete="username"
                  />
                </div>

                <div className="register-field-block">
                  <label htmlFor="dateOfBirth" className="register-label">
                    Date of Birth <span className="register-required">*</span>
                  </label>
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="register-text-input"
                    autoComplete="bday"
                  />
                </div>
              </div>

              <div className="register-field-block">
                <label htmlFor="email" className="register-label">
                  Email Address <span className="register-required">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="register-text-input"
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>

              <div className="register-field-row">
                <div className="register-field-block">
                  <label htmlFor="phoneMobile" className="register-label">
                    Mobile Phone <span className="register-required">*</span>
                  </label>
                  <input
                    id="phoneMobile"
                    name="phoneMobile"
                    type="tel"
                    value={formData.phoneMobile}
                    onChange={handleChange}
                    className="register-text-input"
                    placeholder="Mobile phone"
                    autoComplete="tel"
                  />
                </div>

                <div className="register-field-block">
                  <label htmlFor="phoneHome" className="register-label">
                    Home Phone
                  </label>
                  <input
                    id="phoneHome"
                    name="phoneHome"
                    type="tel"
                    value={formData.phoneHome}
                    onChange={handleChange}
                    className="register-text-input"
                    placeholder="Optional"
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="register-divider" />

              <div className="register-field-row">
                <div className="register-field-block">
                  <label htmlFor="flatNumber" className="register-label">
                    Flat Number
                  </label>
                  <input
                    id="flatNumber"
                    name="flatNumber"
                    type="text"
                    value={formData.flatNumber}
                    onChange={handleChange}
                    className="register-text-input"
                    placeholder="Optional"
                  />
                </div>

                <div className="register-field-block">
                  <label htmlFor="houseNumber" className="register-label">
                    House Number <span className="register-required">*</span>
                  </label>
                  <input
                    id="houseNumber"
                    name="houseNumber"
                    type="text"
                    value={formData.houseNumber}
                    onChange={handleChange}
                    className="register-text-input"
                    placeholder="House number"
                  />
                </div>
              </div>

              <div className="register-field-block">
                <label htmlFor="streetAddress" className="register-label">
                  Street Address <span className="register-required">*</span>
                </label>
                <input
                  id="streetAddress"
                  name="streetAddress"
                  type="text"
                  value={formData.streetAddress}
                  onChange={handleChange}
                  className="register-text-input"
                  placeholder="Street address"
                  autoComplete="address-line1"
                />
              </div>

              <div className="register-field-row">
                <div className="register-field-block">
                  <label htmlFor="townCity" className="register-label">
                    Town / City <span className="register-required">*</span>
                  </label>
                  <input
                    id="townCity"
                    name="townCity"
                    type="text"
                    value={formData.townCity}
                    onChange={handleChange}
                    className="register-text-input"
                    placeholder="Town or city"
                    autoComplete="address-level2"
                  />
                </div>

                <div className="register-field-block">
                  <label htmlFor="county" className="register-label">
                    County
                  </label>
                  <input
                    id="county"
                    name="county"
                    type="text"
                    value={formData.county}
                    onChange={handleChange}
                    className="register-text-input"
                    placeholder="County"
                    autoComplete="address-level1"
                  />
                </div>
              </div>

              <div className="register-field-block">
                <label htmlFor="postcode" className="register-label">
                  Postcode <span className="register-required">*</span>
                </label>
                <input
                  id="postcode"
                  name="postcode"
                  type="text"
                  value={formData.postcode}
                  onChange={handleChange}
                  className="register-text-input"
                  placeholder="Postcode"
                  autoComplete="postal-code"
                />
              </div>

              <div className="register-divider" />

              <div className="register-field-block">
                <label htmlFor="password" className="register-label">
                  Password <span className="register-required">*</span>
                </label>
                <div className="register-password-input-wrap">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    className="register-text-input"
                    placeholder="Create a password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="register-show-button"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <span className="register-field-hint">
                  Minimum 8 characters
                </span>
              </div>

              <div className="register-field-block">
                <label htmlFor="confirmPassword" className="register-label">
                  Confirm Password <span className="register-required">*</span>
                </label>
                <div className="register-password-input-wrap">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="register-text-input"
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="register-show-button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {errorMessage ? (
                <p className="register-field-error">{errorMessage}</p>
              ) : null}

              <div className="register-divider" />

              <div className="register-actions-row">
                <button
                  type="button"
                  className="register-login-link"
                  onClick={() => navigate("/login")}
                >
                  Already have an account?
                </button>
                <button
                  type="submit"
                  className="register-submit-button"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>

          <aside className="register-side-column">
            <div className="register-fscs-card">
              <div className="register-fscs-logo">FSCS</div>
              <div className="register-fscs-title">Protected</div>
              <p>
                Eligible deposits are protected up to the applicable limit under
                the Financial Services Compensation Scheme.
              </p>
            </div>

            <div className="register-info-card">
              <div className="register-info-title">What you&apos;ll get</div>
              <ul className="register-info-list">
                <li>Current account with instant access</li>
                <li>Savings account with round-up feature</li>
                <li>Real-time transaction tracking</li>
                <li>Secure online banking portal</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <footer className="register-bottom-bar">
        <div className="register-bottom-bar-inner">
          <span>Secure registration portal</span>
          <span>Aurix Private Banking</span>
        </div>
      </footer>
    </main>
  );
}

export default Register;