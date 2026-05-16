import React from "react";

export default function TreatmentUploadHubPanel({
  adminAccess,
  onOpenTreatmentUpload,
  onOpenCaseUpload
}: {
  adminAccess: boolean;
  onOpenTreatmentUpload: () => void;
  onOpenCaseUpload: () => void;
}) {
  if (!adminAccess) {
    return (
      <section className="panel">
        <h2 className="panelTitle">Upload Center</h2>
        <div className="errorBox">
          Upload tools are available for Admin and Super Admin only.
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">Treatment Upload Center</h2>
          <p className="brandSubtitle">
            Choose what type of treatment knowledge you want to upload into the NMD database.
          </p>
        </div>
      </div>

      <div className="cardsGrid" style={{ marginTop: 16 }}>
        <button
          className="quoteCard"
          type="button"
          onClick={onOpenTreatmentUpload}
          style={{
            textAlign: "left",
            cursor: "pointer"
          }}
        >
          <div className="quoteTopRow">
            <div className="quoteNumber">Upload Treatments</div>
            <span className="statusBadge status-approved">CSV / JSON</span>
          </div>

          <div className="cardLine">
            Upload chemical/treatment records such as house wash, roof wash, rust removal,
            concrete cleaning, wood restoration, plant protection, oxidation warnings, and more.
          </div>

          <div className="assignBox">
            <div className="assignTitle">Includes</div>
            <div className="cardLine">
              Name, category, surfaces, chemical/product, dilution ratio, use case,
              safety notes, instructions, purchase link, and pricing reference.
            </div>
          </div>
        </button>

        <button
          className="quoteCard"
          type="button"
          onClick={onOpenCaseUpload}
          style={{
            textAlign: "left",
            cursor: "pointer"
          }}
        >
          <div className="quoteTopRow">
            <div className="quoteNumber">Upload Treatment Cases</div>
            <span className="statusBadge status-pending_admin_approval">
              Case Workflows
            </span>
          </div>

          <div className="cardLine">
            Upload detailed case-based guidance such as “Heavy Irrigation Rust On Concrete,”
            “Painted Driveway With Stripes,” or “Black Streak Asphalt Shingle Roof.”
          </div>

          <div className="assignBox">
            <div className="assignTitle">Includes</div>
            <div className="cardLine">
              Linked treatment name, title, surface, condition, problem type, recommended mix,
              dwell time, tools, step-by-step workflow, safety checklist, pricing note,
              customer expectation, and risk level.
            </div>
          </div>
        </button>
      </div>

      <div className="errorBox" style={{ marginTop: 16 }}>
        Uploads are for structured treatment knowledge only. Advanced Guru auto-ingestion
        from screenshots, PDFs, raw notes, and community posts should stay reserved for the
        later Super Admin knowledge-ingestion phase.
      </div>
    </section>
  );
}
