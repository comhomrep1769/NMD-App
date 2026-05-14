import React from "react";
import { apiFetch } from "../api";
import type { POSPayment } from "../types";

type LedgerSummary = {
  totalSubmitted: number;
  pendingCashCount: number;
  approvedCashCount: number;
  rejectedCashCount: number;
  cardRecordCount: number;
  pendingCashTotal: number;
  approvedCashTotal: number;
  rejectedCashTotal: number;
  approvedCollectedTotal: number;
  approvedSubtotalTotal: number;
  approvedSalesTaxTotal: number;
  cardTotal: number;
  cashTotal: number;
};

function methodLabel(method: string) {
  if (method === "card_link") return "Card Link";
  if (method === "tap_to_pay") return "Tap To Pay";
  return "Cash";
}

function statusLabel(status: string) {
  if (status === "pending_admin_approval") return "Pending Admin Approval";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  if (status === "paid") return "Paid";
  if (status === "cancelled") return "Cancelled";
  return "Pending";
}

export default function MyLedgerPage() {
  const [payments, setPayments] = React.useState<POSPayment[]>([]);
  const [summary, setSummary] = React.useState<LedgerSummary | null>(null);
  const [filter, setFilter] = React.useState<"all" | "pending" | "approved" | "rejected" | "cash" | "card">("all");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const loadLedger = React.useCallback(async () => {
    setError("");

    try {
      const data = await apiFetch<{
        payments: POSPayment[];
        summary: LedgerSummary;
      }>("/api/ledger/me");

      setPayments(data.payments);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ledger");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  const filteredPayments = payments.filter((payment) => {
    if (filter === "pending") return payment.status === "pending_admin_approval";
    if (filter === "approved") return payment.status === "approved" || payment.status === "paid";
    if (filter === "rejected") return payment.status === "rejected";
    if (filter === "cash") return payment.paymentMethod === "cash";
    if (filter === "card") return payment.paymentMethod === "card_link";
    return true;
  });

  if (loading) {
    return (
      <section className="panel">
        <h2 className="panelTitle">My Ledger</h2>
        <div className="listCard">Loading your ledger...</div>
      </section>
    );
  }

  return (
    <div className="pageGrid">
      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">My Ledger</h2>
            <p className="brandSubtitle">
              Track your submitted cash payments, approved collections, rejected records, and sales tax totals.
            </p>
          </div>
        </div>

        {error && <div className="errorBox">{error}</div>}

        {summary && (
          <div className="statsGrid">
            <div className="statCard">
              <div className="statLabel">Total Payment Records</div>
              <div className="statValue">{summary.totalSubmitted}</div>
            </div>

            <div className="statCard">
              <div className="statLabel">Approved Collected</div>
              <div className="statValue">${summary.approvedCollectedTotal.toFixed(2)}</div>
            </div>

            <div className="statCard">
              <div className="statLabel">Approved Subtotal</div>
              <div className="statValue">${summary.approvedSubtotalTotal.toFixed(2)}</div>
            </div>

            <div className="statCard">
              <div className="statLabel">Sales Tax Tracked</div>
              <div className="statValue">${summary.approvedSalesTaxTotal.toFixed(2)}</div>
            </div>

            <div className="statCard">
              <div className="statLabel">Pending Cash</div>
              <div className="statValue">{summary.pendingCashCount}</div>
            </div>

            <div className="statCard">
              <div className="statLabel">Pending Cash Total</div>
              <div className="statValue">${summary.pendingCashTotal.toFixed(2)}</div>
            </div>

            <div className="statCard">
              <div className="statLabel">Approved Cash</div>
              <div className="statValue">${summary.approvedCashTotal.toFixed(2)}</div>
            </div>

            <div className="statCard">
              <div className="statLabel">Card Records</div>
              <div className="statValue">{summary.cardRecordCount}</div>
            </div>

            <div className="statCard">
              <div className="statLabel">Rejected Cash</div>
              <div className="statValue">{summary.rejectedCashCount}</div>
            </div>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Payment Records</h2>
            <p className="brandSubtitle">
              Cash submissions stay pending until an admin approves them.
            </p>
          </div>
        </div>

        <div className="buttonRow" style={{ marginBottom: 16 }}>
          <button
            className={filter === "all" ? "primaryButton" : "secondaryButton"}
            type="button"
            onClick={() => setFilter("all")}
          >
            All
          </button>

          <button
            className={filter === "pending" ? "primaryButton" : "secondaryButton"}
            type="button"
            onClick={() => setFilter("pending")}
          >
            Pending
          </button>

          <button
            className={filter === "approved" ? "primaryButton" : "secondaryButton"}
            type="button"
            onClick={() => setFilter("approved")}
          >
            Approved
          </button>

          <button
            className={filter === "cash" ? "primaryButton" : "secondaryButton"}
            type="button"
            onClick={() => setFilter("cash")}
          >
            Cash
          </button>

          <button
            className={filter === "card" ? "primaryButton" : "secondaryButton"}
            type="button"
            onClick={() => setFilter("card")}
          >
            Card
          </button>

          <button
            className={filter === "rejected" ? "primaryButton" : "secondaryButton"}
            type="button"
            onClick={() => setFilter("rejected")}
          >
            Rejected
          </button>
        </div>

        <div className="cardsGrid">
          {filteredPayments.map((payment) => (
            <div key={payment.id} className="quoteCard">
              <div className="quoteTopRow">
                <div className="quoteNumber">{payment.clientName}</div>
                <span className={`statusBadge status-${payment.status}`}>
                  {statusLabel(payment.status)}
                </span>
              </div>

              <div className="cardLine">
                <strong>Method:</strong> {methodLabel(payment.paymentMethod)}
              </div>

              <div className="cardLine">
                <strong>Subtotal:</strong> ${payment.amount.toFixed(2)}
              </div>

              <div className="cardLine">
                <strong>Sales Tax:</strong> ${payment.salesTaxAmount.toFixed(2)}
              </div>

              <div className="cardLine">
                <strong>Total Collected:</strong> ${payment.totalCollected.toFixed(2)}
              </div>

              <div className="cardLine">
                <strong>Submitted:</strong>{" "}
                {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : "—"}
              </div>

              <div className="cardLine">
                <strong>Approved By:</strong> {payment.approvedByName || "—"}
              </div>

              <div className="cardLine">
                <strong>Approved At:</strong>{" "}
                {payment.approvedAt ? new Date(payment.approvedAt).toLocaleString() : "—"}
              </div>

              <div className="cardLine">
                <strong>Notes:</strong> {payment.notes || "—"}
              </div>

              {payment.cashPhotoDataUrl && (
                <img
                  src={payment.cashPhotoDataUrl}
                  alt="Cash proof"
                  style={{
                    width: "100%",
                    maxHeight: 260,
                    objectFit: "cover",
                    borderRadius: 14,
                    border: "1px solid var(--border)",
                    marginTop: 12
                  }}
                />
              )}
            </div>
          ))}

          {filteredPayments.length === 0 && (
            <div className="listCard">No payment records found for this filter.</div>
          )}
        </div>
      </section>
    </div>
  );
}
