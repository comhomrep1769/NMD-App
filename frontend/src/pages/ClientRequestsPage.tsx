import React from "react";
import PhotoUploadPanel from "../components/PhotoUploadPanel";
import PhotoGalleryPanel from "../components/PhotoGalleryPanel";

const requestStats = [
  {
    title: "Open Requests",
    value: "0",
    text: "Submitted service requests waiting for NMD review."
  },
  {
    title: "Photo Requests",
    value: "0",
    text: "Requests with uploaded property photos and notes."
  },
  {
    title: "Closed Requests",
    value: "0",
    text: "Completed, converted, or archived requests."
  }
];

const requestSteps = [
  {
    title: "1. Choose service",
    text: "Pick house washing, roof cleaning, driveway cleaning, pavers, commercial work, or custom service."
  },
  {
    title: "2. Upload photos",
    text: "Add wide shots, close-ups, stains, access issues, and pre-existing damage notes."
  },
  {
    title: "3. Admin review",
    text: "NMD reviews your request, photos, service address, treatment needs, and schedule."
  },
  {
    title: "4. Quote sent",
    text: "Once reviewed, NMD sends an official quote or contacts you for more information."
  }
];

export default function ClientRequestsPage() {
  return (
    <div className="pageGrid">
      <section className="clientHeroPanel">
        <div className="clientHeroContent">
          <span className="clientEyebrow">My Service Requests</span>
          <h1>Track service requests and photo submissions.</h1>
          <p>
            Request cleaning, upload property photos, explain surface conditions, and
            keep your estimate/quote process organized from the client portal.
          </p>

          <div className="clientHeroActions">
            <a className="primaryButton" href="/client/request-service">
              Start New Request
            </a>
            <a className="secondaryButton" href="/client">
              Client Portal
            </a>
          </div>
        </div>

        <div className="clientStatusCard">
          <div className="statLabel">Photo Supported</div>
          <div className="clientStatusTitle">Better photos help quoting</div>
          <p>
            Photos help identify surfaces, stains, access, risk, treatment needs, and
            pre-existing damage before NMD creates a final quote.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="statsGrid">
          {requestStats.map((item) => (
            <div key={item.title} className="statCard">
              <div className="statLabel">{item.title}</div>
              <div className="statValue">{item.value}</div>
              <p className="cardLine">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="cardsGrid" style={{ marginTop: 16 }}>
          {requestSteps.map((step) => (
            <article key={step.title} className="quoteCard">
              <div className="quoteNumber">{step.title}</div>
              <p className="cardLine">{step.text}</p>
            </article>
          ))}
        </div>

        <div className="listCard">
          No client service requests are loaded yet. Future records should connect to
          the request form, uploaded photos, Guru estimate intake, admin review, and
          quote conversion.
        </div>
      </section>

      <PhotoUploadPanel
        role="client"
        uploadedByName="Client"
        clientName="Sample Client"
        clientId="sample-client-1"
        defaultCategory="property"
        title="Upload Request Photos"
        subtitle="Attach property photos, stain photos, access photos, and pre-existing damage notes to help NMD review your request."
      />

      <PhotoGalleryPanel
        role="client"
        clientId="sample-client-1"
        allowDelete
        title="My Uploaded Photos"
        subtitle="View and manage photos connected to your service requests."
      />
    </div>
  );
}
