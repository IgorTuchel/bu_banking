function getCardClass(title) {
  const t = title.toLowerCase();

  // Primary / balance style
  if (
    t.includes("balance") ||
    t.includes("available credit") ||
    t.includes("savings")
  ) {
    return "summary-balance";
  }

  // Positive / incoming style
  if (
    t.includes("incoming") ||
    t.includes("interest earned")
  ) {
    return "summary-incoming";
  }

  // Negative / outgoing style
  if (
    t.includes("outgoing") ||
    t.includes("interest rate") ||
    t.includes("minimum payment") ||
    t.includes("credit limit")
  ) {
    return "summary-outgoing";
  }

  return "";
}

function SummaryCard({ title, value, note = "" }) {
  const typeClass = getCardClass(title);

  return (
    <article className={`summary-card ${typeClass}`}>
      <h3>{title}</h3>

      <p>{value}</p>

      {note && (
        <small className="summary-card-note">
          {note}
        </small>
      )}
    </article>
  );
}

export default SummaryCard;