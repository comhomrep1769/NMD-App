import React from "react";
import { apiFetch } from "../api";
import type { PayRun, PayRunItem } from "../types";

export default function PayrollPage() {
  const [payRuns, setPayRuns] = React.useState<PayRun[]>([]);
  const [previewItems, setPreviewItems] = React.useState<PayRunItem[]>([]);
  const [periodStart, setPeriodStart] = React.useState("");
  const [periodEnd, setPeriodEnd] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const loadPayRuns = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch<{ payRuns: PayRun[] }>("/api/payroll/runs");
      setPayRuns(data.payRuns);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pay runs");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPayRuns();
  }, [loadPayRuns]);

  const preview = async () => {
    setError("");

    if (!periodStart || !periodEnd) {
      setError("Choose a period start and end first.");
      return;
    }

    try {
      const data = await apiFetch<{ items: PayRunItem[] }>(
        `/api/payroll/preview?periodStart=${encodeURIComponent(periodStart)}&periodEnd=${encodeURIComponent(periodEnd)}`
      );

      setPreviewItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to preview payroll");
    }
  };

  const updatePreviewAmount = (userId: string, amount: string) => {
    setPreviewItems((prev) =>
      prev.map((item) =>
        item.userId === userId
          ? { ...item, amount: Number(amount) || 0 }
          : item
      )
    );
  };

  const updatePreviewNotes = (userId: string, itemNotes: string) => {
    setPreviewItems((prev) =>
      prev.map((item) =>
        item.userId === userId
          ? { ...item, notes: itemNotes }
          : item
      )
    );
  };

  const createPayRun = async () => {
    setError("");

    if (!periodStart || !periodEnd) {
      setError("Period start and end are required.");
      return;
    }

    try {
      await apiFetch("/api/payroll/runs", {
        method: "POST",
        body: JSON.stringify({
          periodStart,
          periodEnd,
          notes,
          items: previewItems.map((item) => ({
            userId: item.userId,
            amount: item.amount,
            notes: item.notes || ""
          }))
        })
      });

      setPeriodStart("");
      setPeriodEnd("");
      setNotes("");
      setPreviewItems([]);
      await loadPayRuns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create pay run");
    }
  };

  const updateStatus = async (
    payRunId: string,
    status: "draft" | "approved" | "paid_in_roll"
  ) => {
    try {
      await apiFetch(`/api/payroll/runs/${payRunId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });

      await loadPayRuns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update pay run");
    }
  };

  const deletePayRun = async (payRunId: string) => {
    const ok = window.confirm("Delete this pay run?");
    if (!ok) return;

    try {
      await apiFetch(`/api/payroll/runs/${payRunId}`, {
        method: "DELETE"
      });

      await loadPayRuns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete pay run");
    }
  };

  const exportCsv = (payRun: PayRun) => {
    const header = ["Worker", "Email", "Amount", "Notes"];
    const rows = payRun.items.map((item) => [
      item.displayName,
      item.email,
      item.amount.toFixed(2),
      item.notes || ""
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `nmd-payroll-${payRun.periodStart}-to-${payRun.periodEnd}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const previewTotal = previewItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="pageGrid">
      <section className="panel">
        <div className="panelHeader">
          <h2 className="panelTitle">Create Pay Run</h2>
        </div>

        {error && <div className="errorBox">{error}</div>}

        <div className="formGrid">
          <input
            className="textInput"
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
          />

          <input
            className="textInput"
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
          />

          <textarea
            className="textInput"
            placeholder="Payroll notes optional"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="buttonRow">
            <button className="secondaryButton" type="button" onClick={preview}>
              Preview From Paid Invoices
            </button>

            <button className="primaryButton" type="button" onClick={createPayRun}>
              Save Pay Run
            </button>
          </div>
        </div>

        {previewItems.length > 0 && (
          <div className="responsiveTableWrap" style={{ marginTop: 18 }}>
            <table className="dataTable">
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Email</th>
                  <th>Amount</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {previewItems.map((item) => (
                  <tr key={item.userId}>
                    <td>{item.displayName}</td>
                    <td>{item.email}</td>
                    <td>
                      <input
                        className="textInput"
                        inputMode="decimal"
                        value={String(item.amount)}
                        onChange={(e) => updatePreviewAmount(item.userId, e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="textInput"
                        value={item.notes || ""}
                        onChange={(e) => updatePreviewNotes(item.userId, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="statCard" style={{ marginTop: 12 }}>
              <div className="statLabel">Preview Total</div>
              <div className="statValue">${previewTotal.toFixed(2)}</div>
            </div>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panelHeader">
          <h2 className="panelTitle">Roll by ADP Payroll Prep</h2>
        </div>

        {loading && <div className="listCard">Loading pay runs...</div>}

        {!loading && (
          <div className="cardsGrid">
            {payRuns.map((run) => {
              const total = run.items.reduce((sum, item) => sum + item.amount, 0);

              return (
                <div key={run.id} className="quoteCard">
                  <div className="quoteTopRow">
                    <div className="quoteNumber">
                      {new Date(run.periodStart).toLocaleDateString()} —{" "}
                      {new Date(run.periodEnd).toLocaleDateString()}
                    </div>
                    <span className={`statusBadge status-${run.status}`}>
                      {run.status}
                    </span>
                  </div>

                  <div className="cardLine">
                    <strong>Total:</strong> ${total.toFixed(2)}
                  </div>

                  <div className="cardLine">
                    <strong>Notes:</strong> {run.notes || "—"}
                  </div>

                  <div className="cardLine">
                    <strong>Workers:</strong>
                  </div>

                  <div className="listCard">
                    {run.items.map((item) => (
                      <div key={item.userId}>
                        {item.displayName}: ${item.amount.toFixed(2)}
                      </div>
                    ))}
                  </div>

                  <div className="buttonRow">
                    {run.status === "draft" && (
                      <button className="secondaryButton" onClick={() => updateStatus(run.id, "approved")}>
                        Approve
                      </button>
                    )}

                    {run.status !== "paid_in_roll" && (
                      <button className="primaryButton" onClick={() => updateStatus(run.id, "paid_in_roll")}>
                        Mark Paid in Roll
                      </button>
                    )}

                    <button className="secondaryButton" onClick={() => exportCsv(run)}>
                      Export CSV
                    </button>

                    <button className="secondaryButton" onClick={() => deletePayRun(run.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}

            {payRuns.length === 0 && (
              <div className="listCard">No pay runs yet.</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
