import LastLoginInfo from "./LastLoginInfo";

function DashboardHeader({ firstName, lastLogin }) {
  return (
    <section className="dashboard-header">
      <h1>Welcome back, {firstName}</h1>
      <p>Here is an overview of your account activity.</p>

      <LastLoginInfo
        timestamp={lastLogin.timestamp}
        location={lastLogin.location}
      />
    </section>
  );
}

export default DashboardHeader;