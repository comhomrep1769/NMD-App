import React from "react";
import { apiFetch } from "../api";
import type { Invoice } from "../types";

type LedgerResponse = {
  invoices: Array<
    Invoice & {
      createdAt: string;
    }
  >;
  summary: {
    paidTotal: number;
    unpaidTotal: number;
  };
};

export default function MyLedgerPage() {
  const [data, setData] = React.useState<LedgerResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    apiFetch<LedgerResponse>("/api/ledger/my")
      .then((res) => setData(res))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load ledger"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="panel">
      <h2 className="panelTitle">My Ledger</h2>

      {loading && <div className="listCard">Loading ledger...</div>}
      {error && <div className="errorBox">{error}</div>}

      {data && (
        <>
          <div className="statsGrid" style={{ marginTop: 16 }}>
            <div className="statCard">
              <div className="statLabel">Paid Total</div>
              <div className="statValue">${data.summary.paidTotal.toFixed(2)}</div>
            </div>

            <div className="statCard">
              <div className="statLabel">Unpaid Total</div>
              <div className="statValue danger">${data.summary.unpaidTotal.toFixed(2)}</div>
            </div>
          </div>

          <div className="responsiveTableWrap" style={{ marginTop: 18 }}>
            <table className="dataTable">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Job</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.invoiceNumber}</td>
                    <td>{invoice.clientName}</td>
                    <td>{invoice.jobName}</td>
                    <td>${invoice.total.toFixed(2)}</td>
                    <td>{invoice.status}</td>
                    <td>{new Date(invoice.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}

                {data.invoices.length === 0 && (
                  <tr>
                    <td colSpan={6}>No assigned invoice earnings yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
