import React from "react";
import { apiFetch } from "../api";
import type { Invoice, Quote } from "../types";

type AdminDashboard = {
  clients: {
    total: number;
  };

  quotes: {
    total: number;
    accepted: number;
    sent: number;
    draft: number;
  };

  invoices: {
    total: number;
    paidCount: number;
    unpaidCount: number;
    paidTotal: number;
    unpaidTotal: number;
  };

  requests: {
    total: number;
    pending: number;
    reviewed: number;
    scheduled: number;
    declined: number;
  };

  expenses: {
    total: number;
    totalAmount: number;
    reimbursementPending: number;
  };

  mileage: {
    total: number;
    totalMiles: number;
    reimbursementTotal: number;
    pendingReimbursement: number;
  };

  recurring: {
    total: number;
    active: number;
    estimatedMonthlyRevenue: number;
  };

  payroll: {
    total: number;
    draft: number;
    approved: number;
    paidInRoll: number;
  };
};

export default function DashboardPage({
  quotes,
  invoices
}: {
  quotes?: Quote[];
  invoices?: Invoice[];
}) {
  const [dashboard, setDashboard] = React.useState<AdminDashboard | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    apiFetch<{ dashboard: AdminDashboard }>("/api/dashboard/admin")
      .then((data) => setDashboard(data.dashboard))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="panel">
        <h2 className="panelTitle">Dashboard</h2>
        <div className="listCard">Loading dashboard...</div>
      </section>
    );
  }

  if (error || !dashboard) {
    return (
      <section className="panel">
        <h2 className="panelTitle">Dashboard</h2>
        <div className="errorBox">{error || "Dashboard unavailable"}</div>
      </section>
    );
  }

  const profitEstimate =
    dashboard.invoices.paidTotal -
    dashboard.expenses.totalAmount -
    dashboard.mileage.reimbursementTotal;

  return (
    <div className="pageGrid">
      <section className="panel">
        <div className="panelHeader">
          <h2 className="panelTitle">NMD Admin Dashboard</h2>
        </div>

        <div className="statsGrid">
          <div className="statCard">
            <div className="statLabel">Paid Revenue</div>
            <div className="statValue">${dashboard.invoices.paidTotal.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Unpaid Invoices</div>
            <div className="statValue danger">${dashboard.invoices.unpaidTotal.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Estimated Profit After Expenses</div>
            <div className="statValue">${profitEstimate.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Estimated Monthly Recurring</div>
            <div className="statValue">${dashboard.recurring.estimatedMonthlyRevenue.toFixed(2)}</div>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="panelTitle">Sales Pipeline</h2>

        <div className="statsGrid">
          <div className="statCard">
            <div className="statLabel">Clients</div>
            <div className="statValue">{dashboard.clients.total}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Quotes Sent</div>
            <div className="statValue">{dashboard.quotes.sent}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Quotes Accepted</div>
            <div className="statValue">{dashboard.quotes.accepted}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">New Requests Pending</div>
            <div className="statValue">{dashboard.requests.pending}</div>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="panelTitle">Invoices</h2>

        <div className="statsGrid">
          <div className="statCard">
            <div className="statLabel">Invoices Total</div>
            <div className="statValue">{dashboard.invoices.total}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Invoices Paid</div>
            <div className="statValue">{dashboard.invoices.paidCount}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Invoices Unpaid</div>
            <div className="statValue danger">{dashboard.invoices.unpaidCount}</div>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="panelTitle">Expenses & Reimbursements</h2>

        <div className="statsGrid">
          <div className="statCard">
            <div className="statLabel">Expense Entries</div>
            <div className="statValue">{dashboard.expenses.total}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Total Expenses</div>
            <div className="statValue">${dashboard.expenses.totalAmount.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Mileage Miles</div>
            <div className="statValue">{dashboard.mileage.totalMiles.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Mileage Reimbursements</div>
            <div className="statValue">${dashboard.mileage.reimbursementTotal.toFixed(2)}</div>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="panelTitle">Operations</h2>

        <div className="statsGrid">
          <div className="statCard">
            <div className="statLabel">Recurring Active</div>
            <div className="statValue">{dashboard.recurring.active}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Payroll Drafts</div>
            <div className="statValue">{dashboard.payroll.draft}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Payroll Approved</div>
            <div className="statValue">{dashboard.payroll.approved}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Payroll Paid in Roll</div>
            <div className="statValue">{dashboard.payroll.paidInRoll}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
