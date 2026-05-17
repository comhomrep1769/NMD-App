import React from "react";
import { apiFetch, getCurrentAuthTokenForDebug } from "../../api";
import {
  downloadTreatmentCaseUploadTemplate,
  parseTreatmentCaseUploadFile,
  uploadedRowsToTreatmentCases,
  type TreatmentCaseUploadRow
} from "../../utils/treatmentCaseUploadHelpers";
import type { TreatmentCase } from "../../types/treatmentCases";
import { treatmentCaseRiskBadgeClass } from "../../types/treatmentCases";
import TreatmentUploadSafetyNotice from "./TreatmentUploadSafetyNotice";

export default function TreatmentCaseUploadPanel({
  adminAccess,
  onUploaded
}: {
  adminAccess: boolean;
  onUploaded: (message: string) => void;
}) {
  const [rows, setRows] = React.useState<TreatmentCaseUploadRow[]>([]);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [mode, setMode] = React.useState("upsert");
  const [uploading, setUploading] = React.useState(false);
  const [success, setSuccess] = React.useState("");
  const [fileName, setFileName] = React.useState("");

  const previewCases = uploadedRowsToTreatmentCases(rows);

  const readFile = async (file: File) => {
    setSuccess("");
    setErrors([]);
    setRows([]);
    setFileName(file.name);

    const text = await file.text();
    const parsed = parseTreatmentCaseUploadFile(file.name, text);

    setRows(parsed.rows);
    setErrors(parsed.errors);
  };

  const uploadRows = async () => {
    if (!adminAccess) {
      setErrors(["Only Admin or Super Admin can upload treatment cases."]);
      return;
    }

    if (rows.length === 0) {
      setErrors(["No valid treatment cases are ready to upload."]);
      return;
    }

    const token = getCurrentAuthTokenForDebug();

    if (!token) {
      setErrors([
        "Missing authorization token. Please log out, log back in as Admin or Super Admin, then try uploading again."
      ]);
      return;
    }

    setUploading(true);
    setSuccess("");
    setErrors([]);

    try {
      const data = await apiFetch<{
        message: string;
        importedCount: number;
        skippedCount: number;
        skipped: Array<{ index: number; reason: string }>;
        cases: TreatmentCase[];
      }>("/api/treatments/cases/upload", {
        method: "POST",
        body: JSON.stringify({
          mode,
          cases: rows
        })
      });

      const confirmedMessage =
        data.message ||
        `Upload confirmed. Imported ${data.importedCount || 0} treatment case(s). Skipped ${data.skippedCount || 0}.`;

      setSuccess(`Upload confirmed: ${confirmedMessage}`);
      setErrors((data.skipped || []).map((item) => `Row ${item.index + 1}: ${item.reason}`));
      onUploaded(`Upload confirmed: ${confirmedMessage}`);
    } catch (err) {
      setSuccess("");
      setErrors([
        err instanceof Error
          ? err.message
          : "Treatment case upload failed. Please try again."
      ]);
    } finally {
      setUploading(false);
    }
  };

  if (!adminAccess) {
    return (
      <section className="panel">
        <h2 className="panelTitle">Upload Treatment Cases</h2>
        <div className="errorBox">
          Uploading treatment cases is available for Admin and Super Admin only.
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">Upload Treatment Cases</h2>
          <p className="brandSubtitle">
            Import treatment cases from CSV or JSON. Cases can link to treatments by treatment name.
          </p>
        </div>

        <div className="buttonRow">
          <button
            className="secondaryButton"
            type="button"
            onClick={downloadTreatmentCaseUploadTemplate}
          >
            Download Case CSV Template
          </button>

          <button
            className="primaryButton"
            type="button"
            onClick={uploadRows}
            disabled={uploading || rows.length === 0}
          >
            {uploading ? "Uploading..." : `Upload ${rows.length} Cases`}
          </button>
        </div>
      </div>

      <TreatmentUploadSafetyNotice type="cases" />

      {success && (
        <div className="listCard" style={{ borderColor: "rgba(34, 197, 94, 0.65)" }}>
          {success}
        </div>
      )}

      {errors.length > 0 && (
        <div className="errorBox">
          <strong>Upload notices:</strong>
          <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
            {errors.slice(0, 12).map((error, index) => (
              <span key={`${error}-${index}`}>{error}</span>
            ))}

            {errors.length > 12 && <span>+ {errors.length - 12} more notices...</span>}
          </div>
        </div>
      )}

      <div className="formGrid" style={{ marginTop: 16 }}>
        <label className="fieldLabel">
          Upload Mode
          <select
            className="textInput"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="upsert">Update existing by title + create new</option>
            <option value="create-only">Create only, skip duplicate titles</option>
          </select>
        </label>

        <label className="fieldLabel">
          CSV or JSON File
          <input
            className="textInput"
            type="file"
            accept=".csv,.json,text/csv,application/json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) readFile(file);
            }}
          />
        </label>
      </div>

      <div className="listCard" style={{ marginTop: 16 }}>
        <strong>Supported CSV headers:</strong> treatmentName, title, surfaceType,
        conditionLevel, problemType, recommendedMix, dwellTime, toolsNeeded, stepByStep,
        safetyChecklist, pricingNote, customerExpectation, riskLevel.
      </div>

      <div className="statsGrid" style={{ marginTop: 16 }}>
        <div className="statCard">
          <div className="statLabel">File</div>
          <div className="statValue" style={{ fontSize: 18 }}>
            {fileName || "None"}
          </div>
        </div>

        <div className="statCard">
          <div className="statLabel">Ready Cases</div>
          <div className="statValue">{rows.length}</div>
        </div>

        <div className="statCard">
          <div className="statLabel">Notices</div>
          <div className="statValue">{errors.length}</div>
        </div>
      </div>

      <div className="cardsGrid" style={{ marginTop: 16 }}>
        {previewCases.slice(0, 12).map((item) => (
          <div key={item.id} className="quoteCard">
            <div className="quoteTopRow">
              <div className="quoteNumber">{item.title}</div>
              <span className={treatmentCaseRiskBadgeClass(item.riskLevel)}>
                {item.riskLevel || "Standard"}
              </span>
            </div>

            <div className="cardLine">
              <strong>Treatment:</strong> {item.treatmentName || "Not linked"}
            </div>

            <div className="cardLine">
              <strong>Surface:</strong> {item.surfaceType || "—"}
            </div>

            <div className="cardLine">
              <strong>Problem:</strong> {item.problemType || "—"}
            </div>

            <div className="cardLine">
              <strong>Mix:</strong> {item.recommendedMix || "—"}
            </div>
          </div>
        ))}

        {previewCases.length > 12 && (
          <div className="listCard">
            Preview showing first 12 cases. Upload will include all {previewCases.length}.
          </div>
        )}

        {previewCases.length === 0 && (
          <div className="listCard">No case upload preview yet. Choose a CSV or JSON file.</div>
        )}
      </div>
    </section>
  );
}
