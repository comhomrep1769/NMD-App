export default function ClientDashboardPage() {
  return (
    <div className="pageGrid">
      <section className="panel">
        <h2 className="panelTitle">Client Portal</h2>

        <div className="cardsGrid">
          <div className="quoteCard">
            <div className="quoteNumber">My Quotes</div>
            <div className="cardLine">
              View quotes once they are prepared by NMD.
            </div>
          </div>

          <div className="quoteCard">
            <div className="quoteNumber">My Invoices</div>
            <div className="cardLine">
              View invoices and payment links.
            </div>
          </div>

          <div className="quoteCard">
            <div className="quoteNumber">My Appointments</div>
            <div className="cardLine">
              View scheduled services.
            </div>
          </div>

          <div className="quoteCard">
            <div className="quoteNumber">Request Service</div>
            <div className="cardLine">
              Submit future service requests from your client account.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
