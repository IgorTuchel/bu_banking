import { useEffect, useState } from "react";
import "./support.css";

import FaqItem from "../components/FaqItem";
import Skeleton from "../components/Skeleton";
import faqData from "../data/faqData";

function HelpSupport() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <main className="home-page help-support-page">
        <header className="dashboard-header">
          <h1>Help & Support</h1>
          <p>
            Get answers quickly, explore common questions, or chat with support.
          </p>
        </header>

        <section
          className="selected-account-card support-hero-card"
          style={{ pointerEvents: "none" }}
          aria-hidden="true"
        >
          <div className="selected-account-card-top">
            <Skeleton width="120px" height="0.9rem" />
            <Skeleton width="100px" height="1.8rem" />
          </div>

          <Skeleton width="260px" height="1.8rem" />
          <Skeleton width="90%" height="0.95rem" />
          <Skeleton width="75%" height="0.95rem" />
          <Skeleton
            width="140px"
            height="2.8rem"
            style={{ marginTop: "0.5rem" }}
          />
        </section>

        <section className="summary-grid">
          {[...Array(3)].map((_, index) => (
            <article key={index} className="summary-card">
              <Skeleton width="110px" height="0.9rem" />
              <Skeleton
                width="90px"
                height="1.6rem"
                style={{ marginTop: "0.8rem" }}
              />
            </article>
          ))}
        </section>

        <section className="home-content-grid support-content-grid">
          <div className="transactions-section">
            <div className="section-header">
              <h2>Frequently Asked Questions</h2>
            </div>

            <div className="faq-list">
              {[...Array(6)].map((_, index) => (
                <article key={index} className="faq-item">
                  <div className="faq-question-button" aria-hidden="true">
                    <Skeleton width="75%" height="1rem" />
                    <Skeleton width="20px" height="20px" />
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="notifications-section">
            <div className="section-header">
              <h2>Other Ways to Get Help</h2>
            </div>

            <div className="notifications-list">
              {[...Array(3)].map((_, index) => (
                <article key={index} className="notification-card">
                  <Skeleton width="140px" height="1rem" />
                  <Skeleton
                    width="100%"
                    height="0.9rem"
                    style={{ marginTop: "0.75rem" }}
                  />
                  <Skeleton
                    width="85%"
                    height="0.9rem"
                    style={{ marginTop: "0.5rem" }}
                  />
                </article>
              ))}
            </div>
          </aside>
        </section>
      </main>
    );
  }

  return (
    <main className="home-page help-support-page">
      <header className="dashboard-header">
        <h1>Help & Support</h1>
        <p>
          Get answers quickly, explore common questions, or chat with support.
        </p>
      </header>

      <section className="selected-account-card support-hero-card">
        <div className="selected-account-card-top">
          <span className="selected-account-label">AI Assistant</span>
          <span className="selected-account-type">Coming Soon</span>
        </div>

        <h2 className="selected-account-name">Need help with your account?</h2>
        <p className="support-hero-text">
          Our future AI assistant will help answer common questions, guide you
          through app features, and direct you to the right support options.
        </p>

        <div className="chat-cta-wrapper">
          <button type="button" className="chat-cta-button">
            Start Chat
          </button>
        </div>
      </section>

      <section className="summary-grid">
        <article className="summary-card">
          <h3>Support Status</h3>
          <p>Online</p>
        </article>

        <article className="summary-card">
          <h3>FAQ Articles</h3>
          <p>10</p>
        </article>

        <article className="summary-card">
          <h3>Average Reply</h3>
          <p>&lt; 5 min</p>
        </article>
      </section>

      <section className="home-content-grid support-content-grid">
        <div className="transactions-section">
          <div className="section-header">
            <h2>Frequently Asked Questions</h2>
          </div>

          <div className="faq-list">
            {faqData.map((item) => (
              <FaqItem
                key={item.id}
                question={item.question}
                answer={item.answer}
              />
            ))}
          </div>
        </div>

        <aside className="notifications-section">
          <div className="section-header">
            <h2>Other Ways to Get Help</h2>
          </div>

          <div className="notifications-list">
            <article className="notification-card">
              <p className="transaction-name">Message Support</p>
              <p className="transaction-date">
                Send a secure message for account-related help.
              </p>
            </article>

            <article className="notification-card">
              <p className="transaction-name">Call Us</p>
              <p className="transaction-date">
                Speak to a support advisor during service hours.
              </p>
            </article>

            <article className="notification-card">
              <p className="transaction-name">Security Help</p>
              <p className="transaction-date">
                Get urgent help with suspicious activity or account access.
              </p>
            </article>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default HelpSupport;
