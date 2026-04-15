import type { Invoice, Quote } from "../types";

export default function DashboardPage({
  quotes,
  invoices
}: {
  quotes: Quote[];
  invoices: Invoice[];
}) {
  const unpaidTotal = invoices
    .filter((i) => i.status === "unpaid")
    .reduce((sum, i) => sum + i.total, 0);

  const paidTotal = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.total, 0);

  const acceptedQuotes = quotes.filter((q) => q.status === "accepted").length;

  return (
    <div className="pageGrid">
      <section className="panel">
        <h2 className="panelTitle">Overview</h2>
        <div className="statsGrid">
          <div className="statCard">
            <div className="statLabel">Paid Total</div>
            <div className="statValue">${paidTotal.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Unpaid Total</div>
            <div className="statValue danger">${unpaidTotal.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Quotes</div>
            <div className="statValue">{quotes.length}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Accepted Quotes</div>
            <div className="statValue">{acceptedQuotes}</div>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="panelTitle">Phase 1 Notes</h2>
        <div className="listCard">
          <div>Responsive desktop + mobile shell</div>
          <div>Light/dark theme toggle</div>
          <div>Quotes split from invoices</div>
          <div>Ready for backend in Phase 2</div>
        </div>
      </section>
    </div>
  );
}
