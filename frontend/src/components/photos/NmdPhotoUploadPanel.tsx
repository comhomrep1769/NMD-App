import React from "react";
import type { NmdPhotoCategory, NmdPhotoRole, NmdPhotoUploadDraft } from "../../types/photoWorkflow";
import { addPhotoRecordsFromFiles, photoCategoryLabels } from "../../utils/photoWorkflowStorage";

const categoryOptions: NmdPhotoCategory[] = [
  "before",
  "after",
  "damage_note",
  "access_issue",
  "chemical_treatment",
  "cash_payment_proof",
  "general"
];

const emptyDraft: NmdPhotoUploadDraft = {
  category: "general",
  note: "",
  clientName: "",
  jobName: "",
  serviceAddress: ""
};

export default function NmdPhotoUploadPanel({
  role,
  uploadedByName = "NMD User",
  defaultClientName = "",
  defaultJobName = "",
  defaultServiceAddress = "",
  defaultCategory = "general",
  jobId = "",
  clientId = "",
  onUploaded
}: {
  role: NmdPhotoRole;
  uploadedByName?: string;
  defaultClientName?: string;
  defaultJobName?: string;
  defaultServiceAddress?: string;
  defaultCategory?: NmdPhotoCategory;
  jobId?: string;
  clientId?: string;
  onUploaded?: () => void;
}) {
  const [draft, setDraft] = React.useState<NmdPhotoUploadDraft>({
    ...emptyDraft,
    category: defaultCategory,
    clientName: defaultClientName,
    jobName: defaultJobName,
    serviceAddress: defaultServiceAddress
  });
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [success, setSuccess] = React.useState("");
  const [error, setError] = React.useState("");

  const updateDraft = (field: keyof NmdPhotoUploadDraft, value: string) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const chooseFiles = (files: FileList | null) => {
    if (!files) return;
    setSelectedFiles(Array.from(files));
    setSuccess("");
    setError("");
  };

  const uploadPhotos = () => {
    setSuccess("");
    setError("");

    if (selectedFiles.length === 0) {
      setError("Choose at least one image before uploading.");
      return;
    }

    const result = addPhotoRecordsFromFiles({
      files: selectedFiles,
      draft,
      uploadedByRole: role,
      uploadedByName,
      jobId,
      clientId
    });

    setSelectedFiles([]);
    setSuccess(`Photo upload confirmed. Added ${result.records.length} photo record(s).`);
    onUploaded?.();
  };

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">Upload Photos</h2>
          <p className="brandSubtitle">
            Add before/after photos, property images, access issues, pre-existing damage
            notes, treatment proof, or payment proof.
          </p>
        </div>

        <button className="primaryButton" type="button" onClick={uploadPhotos}>
          Upload {selectedFiles.length} Photo{selectedFiles.length === 1 ? "" : "s"}
        </button>
      </div>

      {error && <div className="errorBox">{error}</div>}

      {success && (
        <div className="listCard" style={{ borderColor: "rgba(34, 197, 94, 0.65)" }}>
          {success}
        </div>
      )}

      <div className="errorBox">
        <strong>Photo safety:</strong> Before photos, damage notes, and timestamps protect
        both the client and NMD. Employees can view photo records but should not download
        client/admin photo records.
      </div>

      <div className="formGrid" style={{ marginTop: 16 }}>
        <label className="fieldLabel">
          Photo Category
          <select
            className="textInput"
            value={draft.category}
            onChange={(event) => updateDraft("category", event.target.value as NmdPhotoCategory)}
          >
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {photoCategoryLabels[category]}
              </option>
            ))}
          </select>
        </label>

        <label className="fieldLabel">
          Client Name
          <input
            className="textInput"
            value={draft.clientName}
            onChange={(event) => updateDraft("clientName", event.target.value)}
            placeholder="Client name"
          />
        </label>

        <label className="fieldLabel">
          Job Name
          <input
            className="textInput"
            value={draft.jobName}
            onChange={(event) => updateDraft("jobName", event.target.value)}
            placeholder="Example: Smith roof and driveway"
          />
        </label>

        <label className="fieldLabel">
          Service Address
          <input
            className="textInput"
            value={draft.serviceAddress}
            onChange={(event) => updateDraft("serviceAddress", event.target.value)}
            placeholder="Service address"
          />
        </label>

        <label className="fieldLabel">
          Photo Notes
          <textarea
            className="textInput"
            rows={4}
            value={draft.note}
            onChange={(event) => updateDraft("note", event.target.value)}
            placeholder="Describe what the photo shows, including pre-existing damage, surface condition, stains, access issues, or completed work."
          />
        </label>

        <label className="fieldLabel">
          Choose Images
          <input
            className="textInput"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => chooseFiles(event.target.files)}
          />
        </label>
      </div>

      {selectedFiles.length > 0 && (
        <div className="cardsGrid" style={{ marginTop: 16 }}>
          {selectedFiles.map((file) => (
            <div key={`${file.name}-${file.size}`} className="quoteCard">
              <div className="quoteTopRow">
                <div className="quoteNumber">{file.name}</div>
                <span className="statusBadge status-approved">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <div className="cardLine">
                Ready to upload as {photoCategoryLabels[draft.category]}.
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
