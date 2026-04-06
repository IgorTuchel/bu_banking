function getCardClass(title) {
  if (title.toLowerCase().includes("balance")) {
    return "summary-balance";
  }

  if (title.toLowerCase().includes("incoming")) {
    return "summary-incoming";
  }

  if (title.toLowerCase().includes("outgoing")) {
    return "summary-outgoing";
  }

  return "";
}

function SummaryCard({ title, value }) {
  const typeClass = getCardClass(title);

  return (
    <div className={`summary-card ${typeClass}`}>
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );
}

export default SummaryCard;