import React from "react";
import { apiFetch } from "../api";
import type { PageKey, POSPayment } from "../types";

export default function EmployeeDashboardPage({
  onNavigate
}: {
  onNavigate: (page: PageKey) => void;
}) {
  const [payments, setPayments] = React.useState<POSPayment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    apiFetch<{ payments: POSPayment[] }>("/api/pos/payments")
      .then((data) => {
        setPayments(data.payments);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load payment records");
      })
      .finally(() => setLoading(false));
  }, []);

  const pendingCash = payments.filter(
    (payment) => payment.status === "pending_admin_approval"
  );

  const approvedCash = payments.filter(
    (payment) =>
      payment.paymentMethod === "cash" &&
      (payment.status === "approved" || payment.status === "paid")
  );

  const rejectedCash = payments.filter(
    (payment) =>
      payment.paymentMethod === "cash" &&
      payment.status === "rejected"
  );

  const pendingCashTotal = pendingCash.reduce(
    (sum, payment) => sum + Number(payment.totalCollected || 0),
    0
  );

  const approvedCashTotal = approvedCash.reduce(
    (sum, payment) => sum + Number(payment.totalCollected || 0),
    0
  );

  const recentPayments = payments.slice(0, 6);

  return (
    <div className="pageGrid">
      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Employee Dashboard</h2>
            <p className="brandSubtitle">
              View your schedule, clock in/out, collect payments, and track submitted cash approvals.
            </p>
          </div>
        </div>

        {error && <div className="errorBox">{error}</div>}

        {pendingCash.length > 0 && (
          <div className="listCard">
            You have {pendingCash.length} cash payment
            {pendingCash.length === 1 ? "" : "s"} waiting for admin approval.
          </div>
        )}

        <div className="statsGrid">
          <div className="statCard">
            <div className="statLabel">Pending Cash Approvals</div>
            <div className="statValue">{pendingCash.length}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Pending Cash Total</div>
            <div className="statValue">${pendingCashTotal.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Approved Cash</div>
            <div className="statValue">${approvedCashTotal.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Rejected Cash Records</div>
            <div className="statValue">{rejectedCash.length}</div>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="panelTitle">Quick Actions</h2>

        <div className="cardsGrid">
          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("schedule")}
            style={{ textAlign: "left" }}
          >
            <div className="quoteNumber">My Schedule</div>
            <div className="cardLine">
              View today’s assigned jobs and upcoming work.
            </div>
          </button>

          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("timeclock")}
            style={{ textAlign: "left" }}
          >
            <div className="quoteNumber">Time Clock</div>
            <div className="cardLine">
              Clock in, clock out, start breaks, and manage lunch/break timers.
            </div>
          </button>

          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("pos")}
            style={{ textAlign: "left" }}
          >
            <div className="quoteNumber">Collect Payment</div>
            <div className="cardLine">
              Open POS to send card payment links or submit cash photo proof.
            </div>

            {pendingCash.length > 0 && (
              <div className="listCard" style={{ marginTop: 10 }}>
                {pendingCash.length} cash approval pending
              </div>
            )}
          </button>

          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("my-ledger")}
            style={{ textAlign: "left" }}
          >
            <div className="quoteNumber">My Ledger</div>
            <div className="cardLine">
              View your work history, totals, and collected payment records.
            </div>
          </button>

          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("treatments")}
            style={{ textAlign: "left" }}
          >
            <div className="quoteNumber">Treatments</div>
            <div className="cardLine">
              Check treatment guidance, dilution ratios, and surface warnings.
            </div>
          </button>

          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("chat")}
            style={{ textAlign: "left" }}
          >
            <div className="quoteNumber">Chat</div>
            <div className="cardLine">
              Open company chat or message admins.
            </div>
          </button>
        </div>
      </section>

      <section className="panel">
        <h2 className="panelTitle">My Recent Payment Submissions</h2>

        {loading && <div className="listCard">Loading payment records...</div>}

        {!loading && (
          <div className="cardsGrid">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="quoteCard">
                <div className="quoteTopRow">
                  <div className="quoteNumber">{payment.clientName}</div>
                  <span className={`statusBadge status-${payment.status}`}>
                    {payment.status}
                  </span>
                </div>

                <div className="cardLine">
                  <strong>Method:</strong>{" "}
                  {payment.paymentMethod === "cash"
                    ? "Cash"
                    : payment.paymentMethod === "card_link"
                      ? "Card Link"
                      : "Tap To Pay"}
                </div>

                <div className="cardLine">
                  <strong>Subtotal:</strong> ${payment.amount.toFixed(2)}
                </div>

                <div className="cardLine">
                  <strong>Sales Tax:</strong> ${payment.salesTaxAmount.toFixed(2)}
                </div>

                <div className="cardLine">
                  <strong>Total:</strong> ${payment.totalCollected.toFixed(2)}
                </div>

                <div className="cardLine">
                  <strong>Submitted:</strong>{" "}
                  {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : "—"}
                </div>

                <div className="cardLine">
                  <strong>Approved:</strong>{" "}
                  {payment.approvedAt ? new Date(payment.approvedAt).toLocaleString() : "—"}
                </div>

                <div className="cardLine">
                  <strong>Notes:</strong> {payment.notes || "—"}
                </div>
              </div>
            ))}

            {recentPayments.length === 0 && (
              <div className="listCard">No payment submissions yet.</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
