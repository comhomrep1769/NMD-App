import React from "react";
import type { PageKey } from "../types";

export default function ClientDashboardPage({
  onNavigate
}: {
  onNavigate: (page: PageKey) => void;
}) {
  return (
    <div className="pageGrid">
      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Client Portal</h2>
            <p className="brandSubtitle">
              Request service, track estimates, view communication, and manage your NMD account.
            </p>
          </div>
        </div>

        <div className="cardsGrid">
          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("client-estimates")}
            style={{ textAlign: "left" }}
          >
            <div className="quoteNumber">My Estimates</div>
            <div className="cardLine">
              View Guru estimate requests, review status, and preliminary pricing ranges.
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
              Message NMD about your service request, quote, invoice, or scheduling.
            </div>
          </button>

          <div className="quoteCard">
            <div className="quoteNumber">Start A New Estimate</div>
            <div className="cardLine">
              Tap the floating Guru button in the corner and choose “Start Estimate.”
            </div>
          </div>

          <div className="quoteCard">
            <div className="quoteNumber">Official Quotes</div>
            <div className="cardLine">
              Guru estimates are preliminary. Official quotes will appear after NMD review in a future portal update.
            </div>
          </div>

          <div className="quoteCard">
            <div className="quoteNumber">Invoices & Payments</div>
            <div className="cardLine">
              Client invoice/payment visibility will be connected in a future phase.
            </div>
          </div>

          <div className="quoteCard">
            <div className="quoteNumber">Recurring Service</div>
            <div className="cardLine">
              Recurring service request and subscription options will be added after the core Guru workflow is live.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
