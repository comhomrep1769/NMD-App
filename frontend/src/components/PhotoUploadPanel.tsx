import React from "react";
import type { NmdPhotoCategory, NmdPhotoRole } from "../types/photoRecords";
import { addPhotoRecord } from "../utils/photoRecordStorage";

type PhotoUploadPanelProps = {
  role: NmdPhotoRole;
  uploadedByName?: string;
  clientName?: string;
  clientId?: string;
  jobId?: string;
  serviceAddress?: string;
  defaultCategory?: NmdPhotoCategory;
  title?: string;
  subtitle?: string;
  onUploaded?: () => void;
};

const categoryOptions: Array<{
  value: NmdPhotoCategory;
  label: string;
}> = [
  { value: "property", label: "Property Photo" },
  { value: "before", label: "Before Photo" },
  { value: "after", label: "After Photo" },
  { value: "pre_existing_damage", label: "Pre-existing Damage" },
  { value: "access_issue", label: "Access Issue" },
  { value: "treatment_area", label: "Treatment Area" },
  { value: "cash_payment_proof", label: "Cash Payment Proof" },
  { value: "general_chat", label: "Chat Image" }
];

export default function PhotoUploadPanel({
  role,
  uploadedByName = "NMD User",
  clientName = "",
  clientId = "",
  jobId = "",
  serviceAddress = "",
  defaultCategory = "property",
  title = "Upload Photos",
  subtitle = "Add photos with notes for estimates, job records, pre-existing damage, and before/after proof.",
  onUploaded
}: PhotoUploadPanelProps) {
  const [category, setCategory] = React.useState<NmdPhotoCategory>(defaultCategory);
  const [note, setNote] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [error, setError] = React.useState("");

  const uploadFiles = async (files: FileList | null) => {
    setError("");
    setSuccess("");

    if (!files || files.length === 0) {
      setError("Choose at least one image.");
      return;
    }

    let uploaded = 0;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        continue;
      }

      const previewUrl = URL.createObjectURL(file);

      addPhotoRecord({
        fileName: file.name,
        previewUrl,
        category,
        note,
        clientName,
        clientId,
        jobId,
        serviceAddress,
        uploadedByRole: role,
        uploadedByName
      });

      uploaded += 1;
    }

    if (uploaded === 0) {
      setError("No valid image files were found.");
      return;
    }

    setSuccess(`Uploaded ${uploaded} photo record(s).`);
    setNote("");
    onUploaded?.();
  };

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">{title}</h2>
          <p className="brandSubtitle">{subtitle}</p>
        </div>
      </div>

      {error && <div className="errorBox">{error}</div>}

      {success && (
        <div className="listCard" style={{ borderColor: "rgba(34, 197, 94, 0.65)" }}>
          {success}
        </div>
      )}

      <div className="errorBox">
        <strong>Photo record safety:</strong> Add notes for pre-existing damage,
        fragile surfaces, access issues, oxidation, cracks, loose paint, damaged screens,
        plant concerns, or anything NMD should document before work starts.
      </div>

      <div className="formGrid" style={{ marginTop: 16 }}>
        <label className="fieldLabel">
          Photo Category
          <select
            className="textInput"
            value={category}
            onChange={(event) => setCategory(event.target.value as NmdPhotoCategory)}
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="fieldLabel">
          Photo Notes
          <textarea
            className="textInput"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Example: pre-existing crack near garage, loose paint by front door, rust under sprinkler..."
          />
        </label>

        <label className="fieldLabel">
          Select Images
          <input
            className="textInput"
            type="file"
            multiple
            accept="image/*"
            capture="environment"
            onChange={(event) => uploadFiles(event.target.files)}
          />
        </label>
      </div>
    </section>
  );
}
