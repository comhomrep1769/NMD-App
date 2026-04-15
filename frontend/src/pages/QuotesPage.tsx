import type { Quote } from "../types";

export default function QuotesPage({ quotes }: { quotes: Quote[] }) {
  return (
    <section className="panel">
      <div className="panelHeader">
        <h2 className="panelTitle">Quotes</h2>
        <button className="primaryButton">New Quote</button>
      </div>

      <div className="cardsGrid">
        {quotes.map((quote) => (
          <div key={quote.id} className="quoteCard">
            <div className="quoteTopRow">
              <div className="quoteNumber">Quote #{quote.quoteNumber}</div>
              <span className={`statusBadge status-${quote.status}`}>
                {quote.status}
              </span>
            </div>

            <div className="cardLine"><strong>Client:</strong> {quote.clientName}</div>
            <div className="cardLine"><strong>Service:</strong> {quote.serviceType}</div>
            <div className="cardLine"><strong>Total:</strong> ${quote.total.toFixed(2)}</div>

            <div className="buttonRow">
              <button className="secondaryButton">Edit</button>
              <button className="secondaryButton">Send</button>
              {quote.status === "accepted" && (
                <button className="primaryButton">Convert to Invoice</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
