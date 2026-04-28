import { useNavigate } from "react-router-dom";
import "./notfound.css";

function NotFound() {
  const navigate = useNavigate();

  function handleGoHome() {
    const savedUser = localStorage.getItem("loggedInUser");

    if (savedUser) {
      navigate("/dashboard"); // logged in → dashboard
    } else {
      navigate("/"); // not logged in → landing page
    }
  }

  return (
    <main className="notfound-page">
      <section className="notfound-card">
        <span className="notfound-code">404</span>

        <h1>Page not found</h1>

        <p>
          The page you’re looking for doesn’t exist or may have been moved.
        </p>

        <button
          type="button"
          className="notfound-button"
          onClick={handleGoHome}
        >
          Back to Home
        </button>
      </section>
    </main>
  );
}

export default NotFound;