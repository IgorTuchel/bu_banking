function DashboardHeader({ firstName }) {
  return (
    <section className="dashboard-header">
      <h1>Welcome back, {firstName}</h1>
      <p>Here is an overview of your account activity.</p>
    </section>
  );
}

export default DashboardHeader;