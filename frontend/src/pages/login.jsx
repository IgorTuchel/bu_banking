import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./home.css";
import "./login.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("loggedInUser");
    if (user) {
      navigate("/profile");
    }
  }, [navigate]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!formData.email || !formData.password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    setTimeout(() => {
      const mockUser = {
        email: formData.email,
        firstName: "Alex",
      };

      localStorage.setItem("loggedInUser", JSON.stringify(mockUser));
      navigate("/profile");
    }, 800);
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <header className="dashboard-header">
          <h1>Login</h1>
          <p>Sign in to access your account, profile, and rewards.</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />
          </div>

          {errorMessage ? <p className="login-error">{errorMessage}</p> : null}

          <button
            type="submit"
            className="login-submit-button"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Login;