import React from "react";
import LiveCalendarPanel from "../components/LiveCalendarPanel";
import type { AuthUserRole } from "../types";

export default function SchedulePage({ role = "admin" }: { role?: AuthUserRole | string }) {
  return (
    <div className="pageGrid">
      <section className="clientHeroPanel">
        <div className="clientHeroContent">
          <span className="clientEyebrow">NMD Scheduling</span>
          <h1>Live job calendar and secure service status updates.</h1>
          <p>
            Schedule employees to client jobs, connect service address and treatment
            requirements, track expected duration, and update customers with safe
            job-bound statuses like on the way, arrived, and completed.
          </p>

          <div className="clientHeroActions">
            <a className="primaryButton" href="/requests">
              View Requests
            </a>
            <a className="secondaryButton" href="/clients">
              View Clients
            </a>
          </div>
        </div>

        <div className="clientStatusCard">
          <div className="statLabel">Secure Tracking</div>
          <div className="clientStatusTitle">ETA and status only</div>
          <p>
            Clients should never see raw live GPS, employee home routes, or persistent
            location history. The system should show limited job status updates only.
          </p>
        </div>
      </section>

      <LiveCalendarPanel role={role} currentEmployeeName="NMD Team Member" />
    </div>
  );
}
