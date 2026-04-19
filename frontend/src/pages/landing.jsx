import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "./landing.css";

function Landing() {
  const navigate = useNavigate();

  return (
    <main className="landing-page">
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="landing-brand">
            <div className="landing-logo-wrapper">
              <img src={logo} alt="Aurix logo" className="landing-logo" />
            </div>

            <div className="landing-brand-text-group">
              <span className="landing-brand-name">AURIX</span>
              <span className="landing-brand-tagline">PRIVATE BANKING</span>
            </div>
          </div>

          <div className="landing-header-actions">
            <button
              type="button"
              className="landing-header-button landing-header-button-secondary"
              onClick={() => navigate("/login")}
            >
              Login
            </button>

            <button
              type="button"
              className="landing-header-button landing-header-button-primary"
              onClick={() => navigate("/register")}
            >
              Register
            </button>
          </div>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-copy">
            <span className="landing-hero-kicker">Secure digital banking</span>
            <h1>Banking designed around clarity, security, and control.</h1>
            <p>
              Manage your accounts, track rewards, review transactions, and access
              support from a premium banking experience built for modern customers.
            </p>

            <div className="landing-hero-actions">
              <button
                type="button"
                className="landing-cta-button landing-cta-button-primary"
                onClick={() => navigate("/login")}
              >
                Login
              </button>

              <button
                type="button"
                className="landing-cta-button landing-cta-button-secondary"
                onClick={() => navigate("/register")}
              >
                Register
              </button>
            </div>
          </div>

          <div className="landing-hero-card">
            <div className="landing-hero-card-top">
              <span className="landing-hero-card-label">Aurix Overview</span>
              <span className="landing-hero-card-chip">Secure Access</span>
            </div>

            <h2>Everything in one place</h2>

            <div className="landing-feature-list">
              <div className="landing-feature-item">
                <span className="landing-feature-title">Accounts</span>
                <span className="landing-feature-text">
                  View balances and account summaries quickly.
                </span>
              </div>

              <div className="landing-feature-item">
                <span className="landing-feature-title">Rewards</span>
                <span className="landing-feature-text">
                  Activate and manage personalised reward offers.
                </span>
              </div>

              <div className="landing-feature-item">
                <span className="landing-feature-title">Support</span>
                <span className="landing-feature-text">
                  Get help fast through FAQs and future AI assistance.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-summary-section">
        <div className="landing-summary-grid">
          <article className="landing-summary-card">
            <h3>Protected Access</h3>
            <p>Built with secure login and private banking in mind.</p>
          </article>

          <article className="landing-summary-card">
            <h3>Rewards & Insights</h3>
            <p>Track cashback, offers, and account activity in one place.</p>
          </article>

          <article className="landing-summary-card">
            <h3>Support When Needed</h3>
            <p>Simple guidance, FAQs, and access to support tools.</p>
          </article>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <span>Aurix Private Banking</span>
          <span>Secure online banking experience</span>
        </div>
      </footer>
    </main>
  );
}

export default Landing;