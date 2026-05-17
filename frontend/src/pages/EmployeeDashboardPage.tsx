import React from "react";
import JobArrivalPhotoWorkflow from "../components/JobArrivalPhotoWorkflow";
import LiveCalendarPanel from "../components/LiveCalendarPanel";
import PhotoGalleryPanel from "../components/PhotoGalleryPanel";
import ServiceStatusTracker from "../components/ServiceStatusTracker";

const employeeStats = [
  {
    title: "Assigned Jobs",
    value: "0",
    text: "Jobs currently assigned to you."
  },
  {
    title: "Photos Needed",
    value: "0",
    text: "Jobs needing before/after photos."
  },
  {
    title: "Hours Today",
    value: "0",
    text: "Clocked hours will appear here."
  },
  {
    title: "Revenue Generated",
    value: "$0",
    text: "Personal generated revenue tracking."
  }
];

const employeeActions = [
  {
    title: "Open Schedule",
    text: "View your assigned jobs and admin-visible schedule.",
    href: "/schedule"
  },
  {
    title: "Job Photos",
    text: "Upload before/after photos and document pre-existing damage.",
    href: "/photos"
  },
  {
    title: "Treatments",
    text: "Search treatment guidance, SH calculator, safety notes, and field workflows.",
    href: "/treatments"
  },
  {
    title: "Chat",
    text: "Message admins or use company chat for job communication.",
    href: "/chat"
  }
];

export default function EmployeeDashboardPage() {
  return (
    <div className="pageGrid">
      <section className="clientHeroPanel">
        <div className="clientHeroContent">
          <span className="clientEyebrow">Employee Portal</span>
          <h1>Your schedule, jobs, treatments, and photo workflow.</h1>
          <p>
            Employees can view assigned jobs, update secure service status, upload
            required before/after photos, document pre-existing damage, and access
            approved treatment guidance.
          </p>

          <div className="clientHeroActions">
            <a className="primaryButton" href="/schedule">
              My Schedule
            </a>
            <a className="secondaryButton" href="/photos">
              Job Photos
            </a>
            <a className="secondaryButton" href="/treatments">
              Treatments
            </a>
          </div>
        </div>

        <div className="clientStatusCard">
          <div className="statLabel">Field Rule</div>
          <div className="clientStatusTitle">Before + after photos</div>
          <p>
            Each job should include before photos, after photos, and notes/photos for
            pre-existing property damage before completion.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="statsGrid">
          {employeeStats.map((stat) => (
            <div key={stat.title} className="statCard">
              <div className="statLabel">{stat.title}</div>
              <div className="statValue">{stat.value}</div>
              <p className="cardLine">{stat.text}</p>
            </div>
          ))}
        </div>

        <div className="cardsGrid" style={{ marginTop: 16 }}>
          {employeeActions.map((action) => (
            <article key={action.title} className="quoteCard">
              <div className="quoteNumber">{action.title}</div>
              <p className="cardLine">{action.text}</p>

              <div className="buttonRow" style={{ marginTop: 12 }}>
                <a className="secondaryButton" href={action.href}>
                  Open
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <ServiceStatusTracker
        status="scheduled"
        etaWindow="ETA will update when you mark On The Way"
        serviceTitle="Assigned job preview"
        serviceAddress="Service address appears after assignment"
        assignedDisplayName="You"
      />

      <JobArrivalPhotoWorkflow
        role="employee"
        jobId="sample-job-1"
        clientName="Sample Client"
        clientId="sample-client-1"
        serviceAddress="123 Client Way, Orlando, FL"
        uploadedByName="Employee"
      />

      <LiveCalendarPanel role="employee" currentEmployeeName="NMD Team Member" />

      <PhotoGalleryPanel
        role="employee"
        title="Assigned Job Photos"
        subtitle="Employees can view photos and upload required before/after documentation, but cannot download client photo records."
      />
    </div>
  );
}
