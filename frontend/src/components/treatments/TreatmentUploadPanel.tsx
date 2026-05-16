import React from "react";
import { apiFetch } from "../../api";
import type { TreatmentItem } from "../../types";
import {
  downloadTreatmentUploadTemplate,
  parseTreatmentUploadFile,
  uploadedRowsToTreatmentItems,
  type TreatmentUploadRow
} from "../../utils/treatmentUploadHelpers";
import TreatmentCard from "./TreatmentCard";

export default function TreatmentUploadPanel({
  adminAccess,
  onUploaded
}: {
  adminAccess: boolean;
  onUploaded: (treatments: TreatmentItem[], message: string) => void;
}) {
  const [rows, setRows] = React.useState<TreatmentUploadRow[]>([]);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [mode, setMode] = React.useState("upsert");
  const [uploading, setUploading] = React.useState(false);
  const [success, setSuccess] = React.useState("");
  const [fileName, setFileName] = React.useState("");

  const previewTreatments = uploadedRowsToTreatmentItems(rows);

  const readFile = async (file: File) => {
    setSuccess("");
    setErrors([]);
    setRows([]);
    setFileName(file.name);

    const text = await file.text();
    const parsed = parseTreatmentUploadFile(file.name, text);

    setRows(parsed.rows);
    setErrors(parsed.errors);
  };

  const uploadRows = async () => {
    if (!adminAccess) {
      setErrors(["Only Admin or Super Admin can upload treatments."]);
      return;
    }

    if (rows.length === 0) {
      setErrors(["No valid treatments are ready to upload."]);
      return;
    }

    setUploading(true);
    setSuccess("");

    try {
      const data = await apiFetch<{
        message: string;
        importedCount: number;
        skippedCount: number;
        skipped: Array<{ index: number; reason: string }>;
        treatments: TreatmentItem[];
      }>("/api/treatments/upload", {
        method: "POST",
        body: JSON.stringify({
          mode,
          treatments: rows
        })
      });

      setSuccess(data.message || "Treatment upload complete.");
      setErrors((data.skipped || []).map((item) => `Row ${item.index + 1}: ${item.reason}`));
      onUploaded(data.treatments || [], data.message || "Treatment upload complete.");
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Treatment upload failed."]);
    } finally {
      setUploading(false);
    }
  };

  if (!adminAccess) {
    return (
      <section className="panel">
        <h2 className="panelTitle">Upload Treatments</h2>
        <div className="errorBox">
          Uploading treatments is available for Admin and Super Admin only.
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">Upload Treatments</h2>
          <p className="brandSubtitle">
            Import treatments from CSV or JSON. Use this for bulk treatment, chemical, safety, and pricing guidance.
          </p>
        </div>

        <div className="buttonRow">
          <button
            className="secondaryButton"
            type="button"
            onClick={downloadTreatmentUploadTemplate}
          >
            Download CSV Template
          </button>

          <button
            className="primaryButton"
            type="button"
            onClick={uploadRows}
            disabled={uploading || rows.length === 0}
          >
            {uploading ? "Uploading..." : `Upload ${rows.length} Treatments`}
          </button>
        </div>
      </div>

      {success && <div className="listCard">{success}</div>}

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
            <option value="upsert">Update existing by name/category + create new</option>
            <option value="create-only">Create only, skip duplicates</option>
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
        <strong>Supported CSV headers:</strong> name, category, surfaceTypes, chemical,
        dilutionRatio, useCase, safetyNotes, instructions, purchaseLink, costReference.
        Surfaces can be separated with semicolons, commas, or pipes.
      </div>

      <div className="statsGrid" style={{ marginTop: 16 }}>
        <div className="statCard">
          <div className="statLabel">File</div>
          <div className="statValue" style={{ fontSize: 18 }}>
            {fileName || "None"}
          </div>
        </div>

        <div className="statCard">
          <div className="statLabel">Ready Rows</div>
          <div className="statValue">{rows.length}</div>
        </div>

        <div className="statCard">
          <div className="statLabel">Errors</div>
          <div className="statValue">{errors.length}</div>
        </div>
      </div>

      <div className="cardsGrid" style={{ marginTop: 16 }}>
        {previewTreatments.slice(0, 12).map((treatment) => (
          <TreatmentCard
            key={treatment.id}
            treatment={treatment}
            active={false}
            onSelect={() => undefined}
          />
        ))}

        {previewTreatments.length > 12 && (
          <div className="listCard">
            Preview showing first 12 treatments. Upload will include all {previewTreatments.length}.
          </div>
        )}

        {previewTreatments.length === 0 && (
          <div className="listCard">No upload preview yet. Choose a CSV or JSON file.</div>
        )}
      </div>
    </section>
  );
}
