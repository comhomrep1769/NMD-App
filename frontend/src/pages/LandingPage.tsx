import React from "react";
import ServicesCatalog from "../components/ServicesCatalog";
import type { NmdServiceItem } from "../utils/nmdServicesCatalog";

export default function LandingPage() {
  const requestService = (service: NmdServiceItem) => {
    const params = new URLSearchParams({
      service: service.title
    });

    window.location.href = `/client/request-service?${params.toString()}`;
  };

  return (
    <div className="pageGrid">
      <section className="clientHeroPanel">
        <div className="clientHeroContent">
          <span className="clientEyebrow">NMD Pressure Washing Services</span>
          <h1>No More Dirt. Cleaner homes, businesses, and properties.</h1>
          <p>
            Residential, commercial, and industrial exterior cleaning with service
            requests, photo-supported estimates, quotes, invoices, scheduling, and
            client communication through the NMD app.
          </p>

          <div className="clientHeroActions">
            <a className="primaryButton" href="/client/request-service">
              Request Quote
            </a>
            <a className="secondaryButton" href="/client/register">
              Create Client Account
            </a>
            <a className="secondaryButton" href="/login">
              Login
            </a>
          </div>
        </div>

        <div className="clientStatusCard">
          <div className="statLabel">Client App</div>
          <div className="clientStatusTitle">Book, chat, track, and pay</div>
          <p>
            Clients can request service, upload property photos, review quotes,
            view invoices, message NMD, and track safe job status updates.
          </p>
        </div>
      </section>

      <section className="clientInfoPanel">
        <div>
          <h2>Install the NMD app</h2>
          <p>
            On iPhone, open in Safari and tap Share → Add to Home Screen. On Android,
            open in Chrome and tap the menu → Add to Home Screen.
          </p>
        </div>

        <a className="primaryButton" href="/client/register">
          Get Started
        </a>
      </section>

      <ServicesCatalog onRequestService={requestService} />
    </div>
  );
}
