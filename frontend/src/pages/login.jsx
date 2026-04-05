import "./login.css";

export default function LoginPage() {
  return (
    <div className="page">
      <div className="card">
        <h1 className="title">Welcome Back</h1>
        <p className="subtitle">Sign in to your account</p>

        <form className="form">
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            className="input"
          />

          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            className="input"
          />

          <div className="row">
            <label className="checkboxLabel">
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" className="link">
              Forgot password?
            </a>
          </div>

          <button type="submit" className="button">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}
