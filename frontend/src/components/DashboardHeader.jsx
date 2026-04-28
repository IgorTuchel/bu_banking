import LastLoginInfo from "./LastLoginInfo";

function getGreeting() {
  const currentHour = new Date().getHours();

  if (currentHour < 12) {
    return "Good morning";
  }

  if (currentHour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function DashboardHeader({ firstName, lastLogin }) {
  const greeting = getGreeting();

  return (
    <section className="dashboard-header">
      <h1>
        {greeting}, {firstName}
      </h1>
      <p>Here is an overview of your account activity.</p>

      <LastLoginInfo timestamp={lastLogin} location={lastLogin?.location} />
    </section>
  );
}

export default DashboardHeader;
