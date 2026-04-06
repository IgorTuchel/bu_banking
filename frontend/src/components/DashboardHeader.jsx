import LastLoginInfo from "./LastLoginInfo";

function DashboardHeader({ firstName, lastLogin }) {
  return (
    <section className="dashboard-header">
      <h1>Welcome back, {firstName}</h1>
      <p>Here is an overview of your account activity.</p>

      <LastLoginInfo
        date={lastLogin.date}
        time={lastLogin.time}
        location={lastLogin.location}
      />
    </section>
  );
}

export default DashboardHeader;