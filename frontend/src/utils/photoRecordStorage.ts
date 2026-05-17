import type {
  JobPhotoChecklist,
  NmdPhotoCategory,
  NmdPhotoRecord,
  NmdPhotoRole
} from "../types/photoRecords";

const PHOTO_STORAGE_KEY = "nmd_photo_records";
const PHOTO_EVENT = "nmd-photo-records-updated";

export type PhotoRecordInput = {
  fileName: string;
  previewUrl: string;
  category: NmdPhotoCategory;
  note: string;
  clientName?: string;
  clientId?: string;
  jobId?: string;
  serviceAddress?: string;
  uploadedByRole: NmdPhotoRole;
  uploadedByName?: string;
};

function makePhotoId() {
  return `photo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function loadPhotoRecords(): NmdPhotoRecord[] {
  const raw = localStorage.getItem(PHOTO_STORAGE_KEY);

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as NmdPhotoRecord[];

    if (!Array.isArray(parsed)) return [];

    return parsed;
  } catch {
    return [];
  }
}

export function savePhotoRecords(records: NmdPhotoRecord[]) {
  localStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new CustomEvent(PHOTO_EVENT));

  return records;
}

export function subscribePhotoRecords(callback: () => void) {
  window.addEventListener(PHOTO_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(PHOTO_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function addPhotoRecord(input: PhotoRecordInput) {
  const record: NmdPhotoRecord = {
    id: makePhotoId(),
    fileName: input.fileName,
    previewUrl: input.previewUrl,
    category: input.category,
    note: input.note,
    clientName: input.clientName || "",
    clientId: input.clientId || "",
    jobId: input.jobId || "",
    serviceAddress: input.serviceAddress || "",
    uploadedByRole: input.uploadedByRole,
    uploadedByName: input.uploadedByName || "",
    createdAt: new Date().toISOString(),
    canClientDownload: true,
    canAdminDownload: true,
    canEmployeeDownload: false
  };

  const updated = [record, ...loadPhotoRecords()];
  savePhotoRecords(updated);

  return record;
}

export function updatePhotoNote(id: string, note: string) {
  const updated = loadPhotoRecords().map((record) =>
    record.id === id ? { ...record, note } : record
  );

  savePhotoRecords(updated);

  return updated.find((record) => record.id === id) || null;
}

export function deletePhotoRecord(id: string) {
  const updated = loadPhotoRecords().filter((record) => record.id !== id);
  savePhotoRecords(updated);
  return updated;
}

export function getPhotosForJob(jobId: string) {
  return loadPhotoRecords().filter((record) => record.jobId === jobId);
}

export function getPhotosForClient(clientId: string) {
  return loadPhotoRecords().filter((record) => record.clientId === clientId);
}

export function getJobPhotoChecklist(jobId: string): JobPhotoChecklist {
  const photos = getPhotosForJob(jobId);

  const beforeComplete = photos.some((photo) => photo.category === "before");
  const afterComplete = photos.some((photo) => photo.category === "after");
  const damageNotesComplete = photos.some(
    (photo) => photo.category === "pre_existing_damage" && photo.note.trim()
  );

  return {
    jobId,
    beforeRequired: true,
    afterRequired: true,
    beforeComplete,
    afterComplete,
    damageNotesComplete
  };
}

export function roleCanDownloadPhoto(role: NmdPhotoRole, photo: NmdPhotoRecord) {
  if (role === "superadmin" || role === "admin") return photo.canAdminDownload;
  if (role === "client") return photo.canClientDownload;
  return photo.canEmployeeDownload;
}

export function categoryLabel(category: NmdPhotoCategory) {
  const labels: Record<NmdPhotoCategory, string> = {
    before: "Before Photo",
    after: "After Photo",
    property: "Property Photo",
    pre_existing_damage: "Pre-existing Damage",
    access_issue: "Access Issue",
    treatment_area: "Treatment Area",
    cash_payment_proof: "Cash Payment Proof",
    general_chat: "Chat Image"
  };

  return labels[category] || category;
}
