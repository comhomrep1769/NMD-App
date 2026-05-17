import React from "react";
import {
  buildChemicalCsv,
  downloadChemicalCsv,
  loadChemicalList,
  mergeChemicalList,
  parseChemicalCsv,
  type ChemicalListItem
} from "../../utils/chemicalListStorage";

function downloadTemplate() {
  const template = buildChemicalCsv([
    {
      id: "template-1",
      chemicalName: "Oxalic Acid",
      purchaseLink: "https://www.amazon.com/example",
      category: "Rust / wood brightening",
      primaryUseCases: "Wood brightening, rust stains, tannin stains",
      safetyNotes: "Use PPE. Keep away from SH/bleach.",
      damageWarnings: "Can etch or discolor sensitive surfaces.",
      notes: "Example row. Replace with real product link.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);

  const blob = new Blob([template], {
    type: "text/csv;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "nmd_chemical_upload_template.csv";
  link.click();

  URL.revokeObjectURL(url);
}

export default function ChemicalUploadAdminPanel() {
  const [preview, setPreview] = React.useState<ChemicalListItem[]>([]);
  const [fileName, setFileName] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [error, setError] = React.useState("");

  const readFile = async (file: File) => {
    setSuccess("");
    setError("");
    setFileName(file.name);

    try {
      const text = await file.text();
      const parsed = parseChemicalCsv(text);

      if (parsed.length === 0) {
        throw new Error("No valid chemical rows were found.");
      }

      setPreview(parsed);
      setSuccess(`CSV ready. ${parsed.length} chemical row(s) detected.`);
    } catch (err) {
      setPreview([]);
      setError(err instanceof Error ? err.message : "Failed to read chemical CSV.");
    }
  };

  const uploadPreview = () => {
    setSuccess("");
    setError("");

    if (preview.length === 0) {
      setError("No chemical rows are ready to upload.");
      return;
    }

    const result = mergeChemicalList(preview);

    setSuccess(
      `Chemical upload confirmed. Created ${result.created}. Updated ${result.updated}. Total chemicals: ${result.items.length}.`
    );

    setPreview([]);
    setFileName("");
  };

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">Upload Chemicals</h2>
          <p className="brandSubtitle">
            Upload a CSV of chemicals and purchase links. Minimum required header:
            chemical_name.
          </p>
        </div>

        <div className="buttonRow">
          <button className="secondaryButton" type="button" onClick={downloadTemplate}>
            Download Template
          </button>

          <button
            className="secondaryButton"
            type="button"
            onClick={() => downloadChemicalCsv(loadChemicalList())}
          >
            Export Current List
          </button>

          <button
            className="primaryButton"
            type="button"
            onClick={uploadPreview}
            disabled={preview.length === 0}
          >
            Upload {preview.length} Chemicals
          </button>
        </div>
      </div>

      {error && <div className="errorBox">{error}</div>}

      {success && (
        <div className="listCard" style={{ borderColor: "rgba(34, 197, 94, 0.65)" }}>
          {success}
        </div>
      )}

      <div className="errorBox">
        <strong>Supported CSV headers:</strong> chemical_name, purchase_link, category,
        primary_use_cases, safety_notes, damage_warnings, notes. Only chemical_name is
        required.
      </div>

      <div className="formGrid" style={{ marginTop: 16 }}>
        <label className="fieldLabel">
          Chemical CSV File
          <input
            className="textInput"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) readFile(file);
            }}
          />
        </label>

        <div className="statCard">
          <div className="statLabel">File</div>
          <div className="statValue" style={{ fontSize: 18 }}>
            {fileName || "None"}
          </div>
        </div>

        <div className="statCard">
          <div className="statLabel">Ready Rows</div>
          <div className="statValue">{preview.length}</div>
        </div>
      </div>

      <div className="cardsGrid" style={{ marginTop: 16 }}>
        {preview.slice(0, 12).map((item) => (
          <div key={item.id} className="quoteCard">
            <div className="quoteTopRow">
              <div className="quoteNumber">{item.chemicalName}</div>
              <span className="statusBadge status-approved">Preview</span>
            </div>

            <div className="cardLine">
              <strong>Category:</strong> {item.category || "—"}
            </div>

            <div className="cardLine">
              <strong>Use cases:</strong> {item.primaryUseCases || "—"}
            </div>

            <div className="cardLine" style={{ wordBreak: "break-word" }}>
              <strong>Link:</strong> {item.purchaseLink || "—"}
            </div>
          </div>
        ))}

        {preview.length > 12 && (
          <div className="listCard">
            Preview showing first 12 chemicals. Upload will include all {preview.length}.
          </div>
        )}

        {preview.length === 0 && (
          <div className="listCard">
            No chemical CSV preview yet. Choose a CSV file to review before uploading.
          </div>
        )}
      </div>
    </section>
  );
}
