import React from "react";
import { apiFetch } from "../api";

type EmployeeDashboardData = {
  jobsCompleted: number
  totalAssignedJobs: number

  dailyRevenue: number
  weeklyRevenue: number
  monthlyRevenue: number
  yearlyRevenue: number
  lifetimeRevenue: number

  totalHoursWorked: number

  totalPayrollPaid: number
  payRunsCompleted: number
};

export default function EmployeeDashboardPage() {
  const [dashboard, setDashboard] =
    React.useState<EmployeeDashboardData | null>(null);

  const [loading, setLoading] =
    React.useState(true);

  const [error, setError] =
    React.useState("");

  React.useEffect(() => {
    apiFetch<{ dashboard: EmployeeDashboardData }>(
      "/api/employee-dashboard/me"
    )
      .then((data) => {
        setDashboard(data.dashboard);
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load dashboard"
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <section className="panel">
        <h2 className="panelTitle">
          My Dashboard
        </h2>
        <div className="listCard">
          Loading dashboard...
        </div>
      </section>
    );
  }

  if (error || !dashboard) {
    return (
      <section className="panel">
        <h2 className="panelTitle">
          My Dashboard
        </h2>
        <div className="errorBox">
          {error || "Dashboard unavailable"}
        </div>
      </section>
    );
  }

  return (
    <div className="pageGrid">

      <section className="panel">
        <h2 className="panelTitle">
          My Revenue Performance
        </h2>

        <div className="statsGrid">

          <div className="statCard">
            <div className="statLabel">
              Today
            </div>
            <div className="statValue">
              ${dashboard.dailyRevenue.toFixed(2)}
            </div>
          </div>

          <div className="statCard">
            <div className="statLabel">
              This Week
            </div>
            <div className="statValue">
              ${dashboard.weeklyRevenue.toFixed(2)}
            </div>
          </div>

          <div className="statCard">
            <div className="statLabel">
              This Month
            </div>
            <div className="statValue">
              ${dashboard.monthlyRevenue.toFixed(2)}
            </div>
          </div>

          <div className="statCard">
            <div className="statLabel">
              This Year
            </div>
            <div className="statValue">
              ${dashboard.yearlyRevenue.toFixed(2)}
            </div>
          </div>

          <div className="statCard">
            <div className="statLabel">
              Lifetime
            </div>
            <div className="statValue">
              ${dashboard.lifetimeRevenue.toFixed(2)}
            </div>
          </div>

        </div>
      </section>

      <section className="panel">
        <h2 className="panelTitle">
          Work Performance
        </h2>

        <div className="statsGrid">

          <div className="statCard">
            <div className="statLabel">
              Jobs Completed
            </div>
            <div className="statValue">
              {dashboard.jobsCompleted}
            </div>
          </div>

          <div className="statCard">
            <div className="statLabel">
              Assigned Jobs
            </div>
            <div className="statValue">
              {dashboard.totalAssignedJobs}
            </div>
          </div>

          <div className="statCard">
            <div className="statLabel">
              Hours Worked
            </div>
            <div className="statValue">
              {dashboard.totalHoursWorked.toFixed(2)}
            </div>
          </div>

        </div>
      </section>

      <section className="panel">
        <h2 className="panelTitle">
          Payroll Progress
        </h2>

        <div className="statsGrid">

          <div className="statCard">
            <div className="statLabel">
              Total Paid
            </div>
            <div className="statValue">
              ${dashboard.totalPayrollPaid.toFixed(2)}
            </div>
          </div>

          <div className="statCard">
            <div className="statLabel">
              Pay Runs
            </div>
            <div className="statValue">
              {dashboard.payRunsCompleted}
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
