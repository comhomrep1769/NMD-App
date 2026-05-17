import React from "react";
import LiveCalendarPanel from "../components/LiveCalendarPanel";

const availabilityNotes = [
  {
    title: "Preferred windows",
    text: "Clients can choose a preferred service window. NMD confirms final time based on route, employee availability, weather, and job scope."
  },
  {
    title: "Job duration",
    text: "Admin scheduling should include expected duration so the live calendar can help prevent overlaps and overbooking."
  },
  {
    title: "Treatment needs",
    text: "Schedule records should include required treatment notes so employees know what chemicals, safety steps, and equipment are needed."
  }
];

export default function AvailabilityPage() {
  return (
    <div className="pageGrid">
      <section className="clientHeroPanel">
        <div className="clientHeroContent">
          <span className="clientEyebrow">Availability</span>
          <h1>Client-friendly scheduling windows.</h1>
          <p>
            Show customers available appointment windows while keeping final job routing,
            employee assignment, and exact operational scheduling under Admin/Super Admin
            control.
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
          <div className="statLabel">Client Scheduling</div>
          <div className="clientStatusTitle">Request first, confirm after</div>
          <p>
            Clients pick the best window. NMD confirms after reviewing service details,
            photos, travel route, employee schedule, and treatment requirements.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="cardsGrid">
          {availabilityNotes.map((note) => (
            <article key={note.title} className="quoteCard">
              <div className="quoteNumber">{note.title}</div>
              <p className="cardLine">{note.text}</p>
            </article>
          ))}
        </div>
      </section>

      <LiveCalendarPanel role="client" clientName="Sample Client" />
    </div>
  );
}
