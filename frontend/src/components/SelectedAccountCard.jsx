import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function SelectedAccountCard({ account }) {
  const [isRevealed, setIsRevealed] = useState(false);

  if (!account) {
    return null;
  }

  const isCredit = account.type === "credit";

  const detailLabel = isCredit ? "Card / Account No:" : "Account No:";
  const revealedNumber =
    account.accountNumber ?? account.maskedAccountNumber ?? "Unavailable";
  const hiddenNumber = account.maskedAccountNumber ?? "Unavailable";

  const primaryNumber = isRevealed ? revealedNumber : hiddenNumber;

  const secondaryValue = account.sortCode ?? "Unavailable";

  const displayType = useMemo(() => {
    if (!account.type) return "Account";
    return account.type.charAt(0).toUpperCase() + account.type.slice(1);
  }, [account.type]);

  return (
    <section className="selected-account-card">
      <div className="selected-account-card-top">
        <p className="selected-account-label">Currently viewing</p>
        <span className="selected-account-type">{displayType}</span>
      </div>

      <h2 className="selected-account-name">{account.name}</h2>

      <div className="selected-account-details">
        <p className="selected-account-detail">
          <span className="selected-account-detail-label">{detailLabel}</span>

          <span
            className={`selected-account-detail-reveal ${
              isRevealed ? "is-revealed" : ""
            }`}
          >
            {primaryNumber}
          </span>

          {account.accountNumber && (
            <button
              type="button"
              className="selected-account-eye-btn"
              onClick={() => setIsRevealed((prev) => !prev)}
              aria-label={
                isRevealed ? "Hide account number" : "Show account number"
              }
            >
              {isRevealed ? (
                <EyeOff size={18} strokeWidth={2.4} />
              ) : (
                <Eye size={18} strokeWidth={2.4} />
              )}
            </button>
          )}
        </p>

        <p className="selected-account-detail">
          <span className="selected-account-detail-label">Sort Code:</span>
          <span className="selected-account-detail-value">
            {secondaryValue}
          </span>
        </p>
      </div>
    </section>
  );
}

export default SelectedAccountCard;