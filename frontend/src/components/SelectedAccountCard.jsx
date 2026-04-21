import { useState } from "react";

function SelectedAccountCard({ account }) {
  const [isRevealed, setIsRevealed] = useState(false);

  const accountNumber = isRevealed
    ? account.accountNumber
    : account.maskedAccountNumber;

  return (
    <section className="selected-account-card">
      <div className="selected-account-card-top">
        <p className="selected-account-label">Currently viewing</p>
        <span className="selected-account-type">{account.type}</span>
      </div>

      <h2 className="selected-account-name">{account.name}</h2>

      <div className="selected-account-details">
        {/* Account Number */}
        <p className="selected-account-detail">
          <span className="selected-account-detail-label">
            Account No:
          </span>

          <span
            className={`selected-account-detail-reveal ${
              isRevealed ? "is-revealed" : ""
            }`}
          >
            {accountNumber}
          </span>

          <button
            type="button"
            className="selected-account-eye-btn"
            onClick={() => setIsRevealed((prev) => !prev)}
            aria-label={
              isRevealed ? "Hide account number" : "Show account number"
            }
          >
            {isRevealed ? "🙈" : "👁"}
          </button>
        </p>

        {/* Sort Code */}
        <p className="selected-account-detail">
          <span className="selected-account-detail-label">
            Sort Code:
          </span>
          <span className="selected-account-detail-value">
            {account.sortCode}
          </span>
        </p>
      </div>
    </section>
  );
}

export default SelectedAccountCard;