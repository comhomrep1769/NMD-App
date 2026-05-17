import React from "react";
import ClientPortalNav from "../components/ClientPortalNav";
import PhotoUploadPanel from "../components/PhotoUploadPanel";
import PhotoGalleryPanel from "../components/PhotoGalleryPanel";

export default function ClientPhotosPage() {
  return (
    <div className="pageGrid">
      <section className="clientHeroPanel">
        <div className="clientHeroContent">
          <span className="clientEyebrow">My Photos</span>
          <h1>Property photos and completed job records.</h1>
          <p>
            Upload photos for quote requests and view before/after photos after NMD
            completes service. Photos help protect both the customer and NMD.
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
          <div className="statLabel">Photo Access</div>
          <div className="clientStatusTitle">View and download</div>
          <p>
            Clients can view/download their own approved before/after photos and manage
            property photos uploaded during request submission.
          </p>
        </div>
      </section>

      <section className="clientPortalLayout">
        <ClientPortalNav activeHref="/client/photos" />

        <main className="clientMainArea">
          <PhotoUploadPanel
            role="client"
            uploadedByName="Client"
            clientName="Sample Client"
            clientId="sample-client-1"
            defaultCategory="property"
            title="Upload Property Photos"
            subtitle="Upload surfaces, stains, access areas, and pre-existing damage photos for NMD review."
          />

          <PhotoGalleryPanel
            role="client"
            clientId="sample-client-1"
            allowDelete
            title="My Photo Gallery"
            subtitle="View property request photos, before/after job photos, and documented service images."
          />
        </main>
      </section>
    </div>
  );
}
