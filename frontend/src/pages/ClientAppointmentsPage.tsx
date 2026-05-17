import React from "react";
import LiveCalendarPanel from "../components/LiveCalendarPanel";
import ServiceStatusTracker from "../components/ServiceStatusTracker";

const appointmentStats = [
  {
    title: "Upcoming",
    value: "0",
    text: "Confirmed appointments will appear here."
  },
  {
    title: "Pending Confirmation",
    value: "0",
    text: "Preferred time slots waiting for NMD review."
  },
  {
    title: "Completed",
    value: "0",
    text: "Finished appointments and service history."
  }
];

export default function ClientAppointmentsPage() {
  return (
    <div className="pageGrid">
      <section className="clientHeroPanel">
        <div className="clientHeroContent">
          <span className="clientEyebrow">My Appointments</span>
          <h1>Track scheduled service without private location exposure.</h1>
          <p>
            View appointment windows, safe job status updates, ETA, arrival, completion,
            and appointment history from your NMD client portal.
          </p>

          <div className="clientHeroActions">
            <a className="primaryButton" href="/client/request-service">
              Request Service
            </a>
            <a className="secondaryButton" href="/client">
              Client Portal
            </a>
          </div>
        </div>

        <div className="clientStatusCard">
          <div className="statLabel">Privacy Protected</div>
          <div className="clientStatusTitle">Status, not tracking</div>
          <p>
            Clients see on the way, ETA, arrived, and completed. They do not see raw
            employee GPS or route history.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="statsGrid">
          {appointmentStats.map((item) => (
            <div key={item.title} className="statCard">
              <div className="statLabel">{item.title}</div>
              <div className="statValue">{item.value}</div>
              <p className="cardLine">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <ServiceStatusTracker
        clientView
        status="scheduled"
        etaWindow="ETA will appear after service is confirmed"
        serviceTitle="No appointment selected"
        serviceAddress="Your scheduled service address will show here"
        assignedDisplayName="NMD Service Team"
      />

      <LiveCalendarPanel role="client" clientName="Sample Client" />
    </div>
  );
}
