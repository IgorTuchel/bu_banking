function QuickActions({ actions }) {
  return (
    <section className="quick-actions-section">
      <h2>Quick Actions</h2>
      <div className="quick-actions-grid">
        {actions.map((action) => (
          <button key={action.id} className="quick-action-button">
            {action.label}
          </button>
        ))}
      </div>
    </section>
  );
}

export default QuickActions;