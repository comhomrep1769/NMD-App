import React from "react";
import type { PageKey } from "../types";

export default function EmployeeDashboardPage({
  onNavigate
}: {
  onNavigate: (page: PageKey) => void;
}) {
  return (
    <div className="pageGrid">
      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Employee Dashboard</h2>
            <p className="brandSubtitle">
              Field tools for schedule, time clock, treatments, notes, payments, and job workflow.
            </p>
          </div>
        </div>

        <div className="statsGrid">
          <div className="statCard">
            <div className="statLabel">Today</div>
            <div className="statValue">Ready</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Schedule</div>
            <div className="statValue">View</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Time Clock</div>
            <div className="statValue">Open</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Guru</div>
            <div className="statValue">Live</div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Guru Field Shortcuts</h2>
            <p className="brandSubtitle">
              Fast access to the field pages employees use most while working jobs.
            </p>
          </div>
        </div>

        <div className="cardsGrid">
          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("treatments")}
            style={{ textAlign: "left", cursor: "pointer" }}
          >
            <div className="quoteTopRow">
              <div className="quoteNumber">Treatments</div>
              <span className="statusBadge status-approved">Guidance</span>
            </div>
            <div className="cardLine">
              Open treatment options, chemical use cases, dilution guidance, safety notes, and surface-specific cleaning notes.
            </div>
          </button>

          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("tips")}
            style={{ textAlign: "left", cursor: "pointer" }}
          >
            <div className="quoteTopRow">
              <div className="quoteNumber">Tips & Notes</div>
              <span className="statusBadge status-paid">Best Practices</span>
            </div>
            <div className="cardLine">
              Open workflow tips, efficiency notes, equipment usage, sales reminders, and field best practices.
            </div>
          </button>

          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("pos")}
            style={{ textAlign: "left", cursor: "pointer" }}
          >
            <div className="quoteTopRow">
              <div className="quoteNumber">Collect Payment</div>
              <span className="statusBadge status-pending_admin_approval">POS</span>
            </div>
            <div className="cardLine">
              Record payment collection, cash proof, and customer payment notes for admin review.
            </div>
          </button>

          <button
            className="quoteCard"
            type="button"
            onClick={() => onNavigate("schedule")}
            style={{ textAlign: "left", cursor: "pointer" }}
          >
            <div className="quoteTopRow">
              <div className="quoteNumber">My Schedule</div>
              <span className="statusBadge status-approved">Jobs</span>
            </div>
            <div className="cardLine">
              View assigned work, schedule notes, job timing, and admin-visible schedule information.
            </div>
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Employee Quick Actions</h2>
            <p className="brandSubtitle">
              Shortcuts for daily employee workflow.
            </p>
          </div>
        </div>

        <div className="buttonRow">
          <button className="primaryButton" type="button" onClick={() => onNavigate("timeclock")}>
            Time Clock
          </button>

          <button className="secondaryButton" type="button" onClick={() => onNavigate("schedule")}>
            Schedule
          </button>

          <button className="secondaryButton" type="button" onClick={() => onNavigate("chat")}>
            Chat
          </button>

          <button className="secondaryButton" type="button" onClick={() => onNavigate("availability")}>
            Availability
          </button>

          <button className="secondaryButton" type="button" onClick={() => onNavigate("my-ledger")}>
            My Ledger
          </button>

          <button className="secondaryButton" type="button" onClick={() => onNavigate("pos")}>
            POS
          </button>
        </div>
      </section>
    </div>
  );
}
