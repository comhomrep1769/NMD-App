import React from "react";
import PhotoUploadPanel from "../components/PhotoUploadPanel";
import PhotoGalleryPanel from "../components/PhotoGalleryPanel";
import JobArrivalPhotoWorkflow from "../components/JobArrivalPhotoWorkflow";
import type { AuthUserRole } from "../types";

function normalizeRole(role: AuthUserRole | string) {
  const value = String(role || "").toLowerCase();

  if (
    value === "superadmin" ||
    value === "admin" ||
    value === "employee" ||
    value === "client"
  ) {
    return value;
  }

  if (value === "super_admin" || value === "super-admin") {
    return "superadmin";
  }

  return "employee";
}

export default function JobPhotosPage({
  role = "employee"
}: {
  role?: AuthUserRole | string;
}) {
  const safeRole = normalizeRole(role);

  return (
    <div className="pageGrid">
      <section className="clientHeroPanel">
        <div className="clientHeroContent">
          <span className="clientEyebrow">Photo Records</span>
          <h1>Before, after, and damage documentation.</h1>
          <p>
            Photos protect clients, employees, and NMD by documenting service areas,
            pre-existing damage, treatment progress, and completed work with timestamps.
          </p>

          <div className="clientHeroActions">
            <a className="primaryButton" href="/schedule">
              Open Schedule
            </a>
            <a className="secondaryButton" href="/client/request-service">
              Client Photo Request
            </a>
          </div>
        </div>

        <div className="clientStatusCard">
          <div className="statLabel">Download Rules</div>
          <div className="clientStatusTitle">
            {safeRole === "employee" ? "Employees view only" : "Download enabled"}
          </div>
          <p>
            Clients, Admins, and Super Admins can download approved before/after photos.
            Employees can view job photos but should not download client records.
          </p>
        </div>
      </section>

      {safeRole === "employee" && (
        <JobArrivalPhotoWorkflow
          role="employee"
          jobId="sample-job-1"
          clientName="Sample Client"
          clientId="sample-client-1"
          serviceAddress="123 Client Way, Orlando, FL"
          uploadedByName="Employee"
        />
      )}

      {(safeRole === "admin" || safeRole === "superadmin") && (
        <PhotoUploadPanel
          role={safeRole}
          uploadedByName="Admin"
          clientName="Sample Client"
          clientId="sample-client-1"
          jobId="sample-job-1"
          serviceAddress="123 Client Way, Orlando, FL"
          defaultCategory="property"
          title="Admin Photo Upload"
          subtitle="Upload job, client, property, damage, cash proof, treatment, before, or after photos."
        />
      )}

      {safeRole === "client" && (
        <PhotoUploadPanel
          role="client"
          uploadedByName="Client"
          clientName="Sample Client"
          clientId="sample-client-1"
          jobId="sample-job-1"
          serviceAddress="123 Client Way, Orlando, FL"
          defaultCategory="property"
          title="Upload Property Photos"
          subtitle="Upload photos for quote requests, service details, access areas, stains, or pre-existing damage."
        />
      )}

      <PhotoGalleryPanel
        role={safeRole}
        allowDelete={safeRole === "admin" || safeRole === "superadmin" || safeRole === "client"}
        title={
          safeRole === "client"
            ? "My Photo Records"
            : safeRole === "employee"
              ? "Assigned Job Photos"
              : "All Photo Records"
        }
        subtitle={
          safeRole === "employee"
            ? "Employees can view job photos and upload required before/after documentation."
            : "View, search, filter, download, and manage photo records tied to clients, jobs, and service requests."
        }
      />
    </div>
  );
}
