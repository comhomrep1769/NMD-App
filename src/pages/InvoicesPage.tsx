import type { Invoice } from "../types";

export default function InvoicesPage({
  invoices
}: {
  invoices: Invoice[];
}) {
  return (
    <section className="panel">
      <div className="panelHeader">
        <h2 className="panelTitle">Invoices</h2>
        <button className="primaryButton">New Invoice</button>
      </div>

      <div className="cardsGrid">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="invoiceCard">
            <div className="quoteTopRow">
              <div className="quoteNumber">Invoice #{invoice.invoiceNumber}</div>
              <span className={`statusBadge ${invoice.status === "paid" ? "status-paid" : "status-unpaid"}`}>
                {invoice.status}
              </span>
            </div>

            <div className="cardLine"><strong>Client:</strong> {invoice.clientName}</div>
            <div className="cardLine"><strong>Job:</strong> {invoice.jobName}</div>
            <div className="cardLine"><strong>Total:</strong> ${invoice.total.toFixed(2)}</div>

            <div className="buttonRow">
              <button className="secondaryButton">Edit</button>
              <button className="secondaryButton">PDF</button>
              {invoice.status === "unpaid" && (
                <button className="primaryButton">Create Payment Link</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
