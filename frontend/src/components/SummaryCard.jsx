function SummaryCard({ title, value }) {
  return (
    <article className="summary-card">
      <h3>{title}</h3>
      <p>{value}</p>
    </article>
  );
}

export default SummaryCard;