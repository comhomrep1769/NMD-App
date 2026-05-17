import React from "react";
import LiveCalendarPanel from "../components/LiveCalendarPanel";
import PhotoGalleryPanel from "../components/PhotoGalleryPanel";
import ServiceStatusTracker from "../components/ServiceStatusTracker";
import type { AuthUserRole } from "../types";

const adminStats = [
  {
    title: "Quotes Sent",
    value: "0",
    text: "Track quotes sent to clients."
  },
  {
    title: "Quotes Accepted",
    value: "0",
    text: "Accepted quote conversion tracking."
  },
  {
    title: "Invoices Sent",
    value: "0",
    text: "Invoices delivered to clients."
  },
  {
    title: "Invoices Paid",
    value: "0",
    text: "Paid invoices and payment tracking."
  }
];

const adminActionCards = [
  {
    title: "Review Service Requests",
    text: "Review client requests, uploaded photos, surfaces, stains, and scheduling preferences.",
    href: "/requests",
    button: "Open Requests"
  },
  {
    title: "Schedule Jobs",
    text: "Use the live calendar to assign employees, duration, treatments, and service addresses.",
    href: "/schedule",
    button: "Open Calendar"
  },
  {
    title: "Photo Records",
    text: "Review before/after photos, pre-existing damage notes, and client property photos.",
    href: "/photos",
    button: "Open Photos"
  },
  {
    title: "Treatments",
    text: "Search treatment workflows, chemical list, SH calculator, and field guidance.",
    href: "/treatments",
    button: "Open Treatments"
  }
];

export default function DashboardPage({ role = "admin" }: { role?: AuthUserRole | string }) {
  const safeRole = String(role || "admin").toLowerCase();
  const adminRole = safeRole === "admin" || safeRole === "superadmin";

  return (
    <div className="pageGrid">
      <section className="clientHeroPanel">
        <div className="clientHeroContent">
          <span className="clientEyebrow">
            {adminRole ? "NMD Admin Dashboard" : "NMD Dashboard"}
          </span>
          <h1>Operations, scheduling, photos, and service status in one place.</h1>
          <p>
            Manage requests, quotes, invoices, service scheduling, secure client status
            updates, treatment knowledge, and photo documentation from the NMD dashboard.
          </p>

          <div className="clientHeroActions">
            <a className="primaryButton" href="/requests">
              Review Requests
            </a>
            <a className="secondaryButton" href="/schedule">
              Schedule Jobs
            </a>
            <a className="secondaryButton" href="/photos">
              Photo Records
            </a>
          </div>
        </div>

        <div className="clientStatusCard">
          <div className="statLabel">Today</div>
          <div className="clientStatusTitle">Ready for scheduling</div>
          <p>
            Upcoming jobs, service statuses, employee assignments, and client updates
            will appear here as backend records connect.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="statsGrid">
          {adminStats.map((stat) => (
            <div key={stat.title} className="statCard">
              <div className="statLabel">{stat.title}</div>
              <div className="statValue">{stat.value}</div>
              <p className="cardLine">{stat.text}</p>
            </div>
          ))}
        </div>

        <div className="cardsGrid" style={{ marginTop: 16 }}>
          {adminActionCards.map((card) => (
            <article key={card.title} className="quoteCard">
              <div className="quoteNumber">{card.title}</div>
              <p className="cardLine">{card.text}</p>

              <div className="buttonRow" style={{ marginTop: 12 }}>
                <a className="secondaryButton" href={card.href}>
                  {card.button}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <ServiceStatusTracker
        status="scheduled"
        etaWindow="ETA pending"
        serviceTitle="Selected job status preview"
        serviceAddress="Service address will appear here"
        assignedDisplayName="NMD Service Team"
      />

      <LiveCalendarPanel role={String(role)} currentEmployeeName="NMD Team Member" />

      <PhotoGalleryPanel
        role={adminRole ? "admin" : "employee"}
        title="Recent Photo Records"
        subtitle="Review job photos, pre-existing damage notes, before/after records, and client uploads."
      />
    </div>
  );
}
