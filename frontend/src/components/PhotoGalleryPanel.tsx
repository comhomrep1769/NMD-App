import React from "react";
import type { NmdPhotoCategory, NmdPhotoRecord, NmdPhotoRole } from "../types/photoRecords";
import {
  categoryLabel,
  deletePhotoRecord,
  loadPhotoRecords,
  roleCanDownloadPhoto,
  subscribePhotoRecords,
  updatePhotoNote
} from "../utils/photoRecordStorage";

type PhotoGalleryPanelProps = {
  role: NmdPhotoRole;
  title?: string;
  subtitle?: string;
  clientId?: string;
  jobId?: string;
  allowDelete?: boolean;
};

const categories: Array<{
  value: "all" | NmdPhotoCategory;
  label: string;
}> = [
  { value: "all", label: "All Photos" },
  { value: "before", label: "Before" },
  { value: "after", label: "After" },
  { value: "property", label: "Property" },
  { value: "pre_existing_damage", label: "Damage Notes" },
  { value: "access_issue", label: "Access Issues" },
  { value: "treatment_area", label: "Treatment Areas" },
  { value: "cash_payment_proof", label: "Payment Proof" },
  { value: "general_chat", label: "Chat Images" }
];

function downloadPhoto(photo: NmdPhotoRecord) {
  const link = document.createElement("a");
  link.href = photo.previewUrl;
  link.download = photo.fileName || "nmd-photo";
  link.click();
}

export default function PhotoGalleryPanel({
  role,
  title = "Photo Records",
  subtitle = "View job photos, client property photos, before/after records, and liability notes.",
  clientId,
  jobId,
  allowDelete = false
}: PhotoGalleryPanelProps) {
  const [photos, setPhotos] = React.useState<NmdPhotoRecord[]>(() => loadPhotoRecords());
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<"all" | NmdPhotoCategory>("all");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    return subscribePhotoRecords(() => {
      setPhotos(loadPhotoRecords());
    });
  }, []);

  const visiblePhotos = photos.filter((photo) => {
    const matchesClient = !clientId || photo.clientId === clientId;
    const matchesJob = !jobId || photo.jobId === jobId;
    const matchesCategory = categoryFilter === "all" || photo.category === categoryFilter;

    const value = search.trim().toLowerCase();
    const matchesSearch =
      !value ||
      [
        photo.fileName,
        photo.note,
        photo.clientName,
        photo.serviceAddress,
        photo.uploadedByName,
        photo.category
      ]
        .join(" ")
        .toLowerCase()
        .includes(value);

    return matchesClient && matchesJob && matchesCategory && matchesSearch;
  });

  const canDelete = allowDelete || role === "admin" || role === "superadmin";

  const handleDelete = (photo: NmdPhotoRecord) => {
    const ok = window.confirm(`Delete photo record "${photo.fileName}"?`);
    if (!ok) return;

    deletePhotoRecord(photo.id);
    setPhotos(loadPhotoRecords());
  };

  const handleNoteChange = (photo: NmdPhotoRecord, note: string) => {
    updatePhotoNote(photo.id, note);
    setPhotos(loadPhotoRecords());
  };

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">{title}</h2>
          <p className="brandSubtitle">{subtitle}</p>
        </div>
      </div>

      <div className="formGrid" style={{ marginTop: 16 }}>
        <label className="fieldLabel">
          Search Photos
          <input
            className="textInput"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search photo notes, client, address, category..."
          />
        </label>

        <label className="fieldLabel">
          Photo Category
          <select
            className="textInput"
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value as "all" | NmdPhotoCategory)
            }
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="statsGrid" style={{ marginTop: 16 }}>
        <div className="statCard">
          <div className="statLabel">Photos</div>
          <div className="statValue">{photos.length}</div>
        </div>

        <div className="statCard">
          <div className="statLabel">Visible</div>
          <div className="statValue">{visiblePhotos.length}</div>
        </div>

        <div className="statCard">
          <div className="statLabel">Download</div>
          <div className="statValue" style={{ fontSize: 18 }}>
            {role === "employee" ? "View Only" : "Allowed"}
          </div>
        </div>
      </div>

      <div className="cardsGrid" style={{ marginTop: 16 }}>
        {visiblePhotos.map((photo) => {
          const expanded = expandedId === photo.id;
          const canDownload = roleCanDownloadPhoto(role, photo);

          return (
            <article key={photo.id} className="quoteCard">
              <div className="quoteTopRow">
                <div>
                  <div className="quoteNumber">{photo.fileName}</div>
                  <div className="cardLine">{categoryLabel(photo.category)}</div>
                </div>

                <span className="statusBadge status-approved">Photo</span>
              </div>

              <div
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  border: "1px solid rgba(82, 178, 255, 0.28)",
                  background: "rgba(0,0,0,0.25)",
                  marginBottom: 12
                }}
              >
                <img
                  src={photo.previewUrl}
                  alt={photo.fileName}
                  style={{
                    width: "100%",
                    height: 180,
                    objectFit: "cover",
                    display: "block"
                  }}
                />
              </div>

              <div className="cardLine">
                <strong>Timestamp:</strong>{" "}
                {new Date(photo.createdAt).toLocaleString()}
              </div>

              {photo.clientName && (
                <div className="cardLine">
                  <strong>Client:</strong> {photo.clientName}
                </div>
              )}

              {photo.serviceAddress && (
                <div className="cardLine">
                  <strong>Address:</strong> {photo.serviceAddress}
                </div>
              )}

              <div className="buttonRow" style={{ marginTop: 12 }}>
                <button
                  className="secondaryButton"
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : photo.id)}
                >
                  {expanded ? "Hide Notes" : "View Notes"}
                </button>

                {canDownload && (
                  <button
                    className="primaryButton"
                    type="button"
                    onClick={() => downloadPhoto(photo)}
                  >
                    Download
                  </button>
                )}

                {canDelete && (
                  <button
                    className="dangerButton"
                    type="button"
                    onClick={() => handleDelete(photo)}
                  >
                    Delete
                  </button>
                )}
              </div>

              {expanded && (
                <div className="assignBox">
                  <div className="assignTitle">Photo Notes</div>

                  {role === "admin" || role === "superadmin" ? (
                    <textarea
                      className="textInput"
                      rows={4}
                      value={photo.note}
                      onChange={(event) => handleNoteChange(photo, event.target.value)}
                    />
                  ) : (
                    <div className="cardLine" style={{ whiteSpace: "pre-wrap" }}>
                      {photo.note || "No notes added."}
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}

        {visiblePhotos.length === 0 && (
          <div className="listCard">No photo records match the current filters.</div>
        )}
      </div>
    </section>
  );
}
