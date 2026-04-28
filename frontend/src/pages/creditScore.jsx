import "./home.css";
import "./creditScore.css";

const creditData = {
  score: 742,
  maxScore: 999,
  rating: "Good",
  lastUpdated: "10 Apr 2026",
  change: "+12 pts this month",
  factors: [
    {
      id: 1,
      title: "On-time payments",
      status: "Strong",
      description: "Your recent payment history is positive and supports your score.",
    },
    {
      id: 2,
      title: "Credit utilisation",
      status: "Fair",
      description: "Your card balances are a little high compared with your available credit.",
    },
    {
      id: 3,
      title: "Credit age",
      status: "Strong",
      description: "Your average account age is helping build trust with lenders.",
    },
    {
      id: 4,
      title: "Recent applications",
      status: "Needs Attention",
      description: "A few recent credit checks may temporarily lower your score.",
    },
  ],
  history: [
    { month: "Nov", score: 701 },
    { month: "Dec", score: 708 },
    { month: "Jan", score: 716 },
    { month: "Feb", score: 724 },
    { month: "Mar", score: 730 },
    { month: "Apr", score: 742 },
  ],
  tips: [
    "Keep credit card balances below 30% of your available limit.",
    "Continue making all payments on time.",
    "Avoid multiple credit applications in a short period.",
    "Keep older accounts open where possible to support account age.",
  ],
};

function getScorePercentage(score, maxScore) {
  return (score / maxScore) * 100;
}

function getScoreBand(score) {
  if (score >= 881) return "Excellent";
  if (score >= 671) return "Good";
  if (score >= 561) return "Fair";
  if (score >= 441) return "Poor";
  return "Very Poor";
}

export default function CreditScore() {
  const scorePercentage = getScorePercentage(
    creditData.score,
    creditData.maxScore
  );

  const scoreBand = getScoreBand(creditData.score);

  return (
    <main className="home-page credit-score-page">
      <header className="dashboard-header">
        <h1>Credit Score</h1>
        <p>Review your score, understand what affects it, and track progress over time.</p>
      </header>

      <section className="summary-grid">
        <article className="summary-card summary-balance">
          <h3>Current Score</h3>
          <p>{creditData.score}</p>
        </article>

        <article className="summary-card summary-incoming">
          <h3>Rating</h3>
          <p>{creditData.rating}</p>
        </article>

        <article className="summary-card summary-outgoing">
          <h3>Last Updated</h3>
          <p>{creditData.lastUpdated}</p>
        </article>
      </section>

      <section className="credit-score-hero">
        <article className="selected-account-card credit-score-card">
          <div className="selected-account-card-top">
            <span className="selected-account-label">Credit profile overview</span>
            <span className="selected-account-type">{scoreBand}</span>
          </div>

          <h2 className="credit-score-value">{creditData.score}</h2>
          <p className="credit-score-max">out of {creditData.maxScore}</p>

          <div className="credit-score-progress-track">
            <div
              className="credit-score-progress-fill"
              style={{ width: `${scorePercentage}%` }}
            />
          </div>

          <p className="credit-score-change">{creditData.change}</p>
        </article>

        <article className="transactions-section credit-score-scale-card">
          <div className="section-header">
            <h2>Score Range</h2>
          </div>

          <div className="credit-score-scale">
            <div className="credit-score-scale-row">
              <span>Excellent</span>
              <span>881 - 999</span>
            </div>
            <div className="credit-score-scale-row credit-score-scale-active">
              <span>Good</span>
              <span>671 - 880</span>
            </div>
            <div className="credit-score-scale-row">
              <span>Fair</span>
              <span>561 - 670</span>
            </div>
            <div className="credit-score-scale-row">
              <span>Poor</span>
              <span>441 - 560</span>
            </div>
            <div className="credit-score-scale-row">
              <span>Very Poor</span>
              <span>0 - 440</span>
            </div>
          </div>
        </article>
      </section>

      <section className="credit-score-grid">
        <article className="transactions-section">
          <div className="section-header">
            <div>
              <h2>What’s Affecting Your Score</h2>
              <p className="transactions-subtext">
                Key areas that are currently influencing your credit profile.
              </p>
            </div>
          </div>

          <div className="credit-factors-list">
            {creditData.factors.map((factor) => (
              <div key={factor.id} className="credit-factor-card">
                <div className="credit-factor-top">
                  <div>
                    <p className="transaction-name">{factor.title}</p>
                    <p className="transaction-date">{factor.description}</p>
                  </div>

                  <span
                    className={`credit-factor-status ${
                      factor.status === "Strong"
                        ? "credit-factor-strong"
                        : factor.status === "Fair"
                        ? "credit-factor-fair"
                        : "credit-factor-attention"
                    }`}
                  >
                    {factor.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="transactions-section">
          <div className="section-header">
            <div>
              <h2>Score History</h2>
              <p className="transactions-subtext">
                Your recent score trend over the last few months.
              </p>
            </div>
          </div>

          <div className="score-history-list">
            {creditData.history.map((item) => (
              <div key={item.month} className="score-history-row">
                <div className="score-history-top">
                  <p className="transaction-name">{item.month}</p>
                  <p className="transaction-amount">{item.score}</p>
                </div>

                <div className="score-history-bar-track">
                  <div
                    className="score-history-bar-fill"
                    style={{ width: `${(item.score / creditData.maxScore) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="transactions-section">
        <div className="section-header">
          <div>
            <h2>Ways to Improve</h2>
            <p className="transactions-subtext">
              Small, consistent actions can strengthen your score over time.
            </p>
          </div>
        </div>

        <div className="credit-tips-list">
          {creditData.tips.map((tip, index) => (
            <div key={index} className="credit-tip-card">
              <div className="credit-tip-number">{index + 1}</div>
              <p>{tip}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}