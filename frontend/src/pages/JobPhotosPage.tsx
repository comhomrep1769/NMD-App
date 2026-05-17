import React from "react";
import PhotoUploadPanel from "../components/PhotoUploadPanel";
import PhotoGalleryPanel from "../components/PhotoGalleryPanel";
import JobArrivalPhotoWorkflow from "../components/JobArrivalPhotoWorkflow";
import type { AuthUserRole } from "../types";

function normalizeRole(role: AuthUserRole | string) {
  if (role === "superadmin" || role === "admin" || role === "employee" || role === "client") {
    return role;
  }

  return "employee";
}

export default function JobPhotosPage({ role = "employee" }: { role?: AuthUserRole | string }) {
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

      {safeRole ===
