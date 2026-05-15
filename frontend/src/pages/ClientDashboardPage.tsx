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
            <h2 className="panelTitle">Client Dashboard</h2>
            <p className="brandSubtitle">
              Manage your NMD estimates, quotes, communication, and service requests.
            </p>
          </div>
        </div>

        <div className="listCard">
          Use Guru in the corner to start a preliminary estimate. NMD will review your details before confirming official pricing.
        </div>

        <div className="statsGrid" style={{ marginTop: 16 }}>
          <div className="statCard">
            <div className="statLabel">Guru</div>
            <div className="statValue">Live</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Estimates</div>
            <div className="statValue">View</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Quotes</div>
            <div className="statValue">View</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Chat</div>
            <div className="statValue">Open</div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Guru Client Center</h2>
            <p className="brandSubtitle">
              Track preliminary Guru estimates and official NMD quote records.
            </p>
          </div>
        </div>

        <div className="cardsGrid">
          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("client-estimates")}
            style={{ textAlign: "left", cursor: "pointer" }}
          >
            <div className="quoteTopRow">
              <div className="quoteNumber">My Estimates</div>
              <span className="statusBadge status-pending_admin_approval">Preliminary</span>
            </div>
            <div className="cardLine">
              View your Guru estimate requests, uploaded photos, preliminary ranges, review status, and Guru explanations.
            </div>
          </button>

          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("client-quotes")}
            style={{ textAlign: "left", cursor: "pointer" }}
          >
            <div className="quoteTopRow">
              <div className="quoteNumber">My Quotes</div>
              <span className="statusBadge status-approved">Official</span>
            </div>
            <div className="cardLine">
              View official quote records NMD is preparing, sending, or tracking through acceptance.
            </div>
          </button>

          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("chat")}
            style={{ textAlign: "left", cursor: "pointer" }}
          >
            <div className="quoteTopRow">
              <div className="quoteNumber">Message NMD</div>
              <span className="statusBadge status-paid">Chat</span>
            </div>
            <div className="cardLine">
              Open your communication thread for questions, updates, photos, and service follow-up.
            </div>
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Client Quick Actions</h2>
            <p className="brandSubtitle">
              Fast access to your estimate and quote records.
            </p>
          </div>
        </div>

        <div className="buttonRow">
          <button className="primaryButton" type="button" onClick={() => onNavigate("client-estimates")}>
            My Estimates
          </button>

          <button className="secondaryButton" type="button" onClick={() => onNavigate("client-quotes")}>
            My Quotes
          </button>

          <button className="secondaryButton" type="button" onClick={() => onNavigate("chat")}>
            Chat
          </button>
        </div>
      </section>
    </div>
  );
}
