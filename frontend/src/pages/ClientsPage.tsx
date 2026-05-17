import React from "react";
import PhotoGalleryPanel from "../components/PhotoGalleryPanel";

const clientStats = [
  {
    title: "Clients",
    value: "0",
    text: "Client accounts and service profiles."
  },
  {
    title: "Open Requests",
    value: "0",
    text: "Requests needing estimate or admin review."
  },
  {
    title: "Photo Records",
    value: "0",
    text: "Client photos, before/after images, and damage notes."
  },
  {
    title: "Recurring Services",
    value: "0",
    text: "Active or requested recurring service plans."
  }
];

const clientProfileSections = [
  {
    title: "Client Profile",
    text: "Client name, email, phone, service address, communication history, and linked requests."
  },
  {
    title: "Quotes & Invoices",
    text: "Client quote history, invoice history, payment links, and paid/unpaid status."
  },
  {
    title: "Appointments",
    text: "Scheduled services, ETA windows, arrived/completed status, and job history."
  },
  {
    title: "Photos",
    text: "Property photos, before/after photos, damage documentation, and timestamps."
  }
];

export default function ClientsPage() {
  return (
    <div className="pageGrid">
      <section className="clientHeroPanel">
        <div className="clientHeroContent">
          <span className="clientEyebrow">Client Management</span>
          <h1>Client profiles, service records, and photo documentation.</h1>
          <p>
            Admins and Super Admins can manage client records, service history, quote
            requests, recurring services, scheduling, communication, and photo records.
          </p>

          <div className="clientHeroActions">
            <a className="primaryButton" href="/requests">
              Review Requests
            </a>
            <a className="secondaryButton" href="/schedule">
              Schedule Service
            </a>
            <a className="secondaryButton" href="/photos">
              Photo Records
            </a>
          </div>
        </div>

        <div className="clientStatusCard">
          <div className="statLabel">Client Data Separation</div>
          <div className="clientStatusTitle">Client records stay protected</div>
          <p>
            Clients should only see their own quotes, invoices, requests, appointments,
            recurring services, photos, and chat history.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="statsGrid">
          {clientStats.map((stat) => (
            <div key={stat.title} className="statCard">
              <div className="statLabel">{stat.title}</div>
              <div className="statValue">{stat.value}</div>
              <p className="cardLine">{stat.text}</p>
            </div>
          ))}
        </div>

        <div className="cardsGrid" style={{ marginTop: 16 }}>
          {clientProfileSections.map((section) => (
            <article key={section.title} className="quoteCard">
              <div className="quoteNumber">{section.title}</div>
              <p className="cardLine">{section.text}</p>
            </article>
          ))}
        </div>

        <div className="listCard">
          Client database records will connect here next: profiles, service addresses,
          quote/invoice history, appointments, recurring services, chat history, and
          attached photo records.
        </div>
      </section>

      <PhotoGalleryPanel
        role="admin"
        title="Client Photo Records"
        subtitle="Photos attached to client profiles will be searchable here for Admin and Super Admin review."
      />
    </div>
  );
}
