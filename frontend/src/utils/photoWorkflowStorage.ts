import type {
  JobPhotoChecklist,
  NmdPhotoCategory,
  NmdPhotoRecord,
  NmdPhotoRole,
  NmdPhotoUploadDraft
} from "../types/photoWorkflow";

const PHOTO_STORAGE_KEY = "nmd_photo_records";
const PHOTO_EVENT = "nmd-photo-records-updated";

export const photoCategoryLabels: Record<NmdPhotoCategory, string> = {
  before: "Before Photo",
  after: "After Photo",
  damage_note: "Pre-existing Damage",
  access_issue: "Access Issue",
  chemical_treatment: "Chemical / Treatment Proof",
  cash_payment_proof: "Cash Payment Proof",
  general: "General Photo"
};

export function makePhotoId() {
  return `photo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function loadPhotoRecords(): NmdPhotoRecord[] {
  const raw = localStorage.getItem(PHOTO_STORAGE_KEY);

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as NmdPhotoRecord[];

    if (!Array.isArray(parsed)) return [];

    return parsed.map((photo) => ({
      id: photo.id || makePhotoId(),
      fileName: photo.fileName || "Uploaded photo",
      objectUrl: photo.objectUrl || "",
      category: photo.category || "general",
      note: photo.note || "",
      clientName: photo.clientName || "",
      clientId: photo.clientId || "",
      jobId: photo.jobId || "",
      jobName: photo.jobName || "",
      serviceAddress: photo.serviceAddress || "",
      uploadedByRole: photo.uploadedByRole || "employee",
      uploadedByName: photo.uploadedByName || "",
      timestamp: photo.timestamp || new Date().toISOString(),
      canClientDownload: Boolean(photo.canClientDownload),
      canAdminDownload: photo.canAdminDownload !== false,
      canEmployeeDownload: Boolean(photo.canEmployeeDownload)
    }));
  } catch {
    return [];
  }
}

export function savePhotoRecords(records: NmdPhotoRecord[]) {
  const sorted = [...records].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  localStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(sorted));
  window.dispatchEvent(new CustomEvent(PHOTO_EVENT));
  return sorted;
}

export function subscribePhotoRecords(callback: () => void) {
  window.addEventListener(PHOTO_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(PHOTO_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function addPhotoRecordsFromFiles({
  files,
  draft,
  uploadedByRole,
  uploadedByName,
  jobId,
  clientId
}: {
  files: File[];
  draft: NmdPhotoUploadDraft;
  uploadedByRole: NmdPhotoRole;
  uploadedByName: string;
  jobId?: string;
  clientId?: string;
}) {
  const now = new Date().toISOString();

  const records: NmdPhotoRecord[] = files.map((file) => ({
    id: makePhotoId(),
    fileName: file.name,
    objectUrl: URL.createObjectURL(file),
    category: draft.category,
    note: draft.note,
    clientName: draft.clientName,
    clientId: clientId || "",
    jobId: jobId || "",
    jobName: draft.jobName,
    serviceAddress: draft.serviceAddress,
    uploadedByRole,
    uploadedByName,
    timestamp: now,
    canClientDownload: uploadedByRole !== "employee" || draft.category !== "cash_payment_proof",
    canAdminDownload: true,
    canEmployeeDownload: false
  }));

  const saved = savePhotoRecords([...records, ...loadPhotoRecords()]);

  return {
    records,
    allRecords: saved
  };
}

export function updatePhotoNote(id: string, note: string) {
  const updated = loadPhotoRecords().map((photo) =>
    photo.id === id
      ? {
          ...photo,
          note
        }
      : photo
  );

  return savePhotoRecords(updated);
}

export function deletePhotoRecord(id: string) {
  const existing = loadPhotoRecords();
  const target = existing.find((photo) => photo.id === id);

  if (target?.objectUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(target.objectUrl);
  }

  return savePhotoRecords(existing.filter((photo) => photo.id !== id));
}

export function getJobPhotoChecklist(jobId: string, fallback?: Partial<JobPhotoChecklist>): JobPhotoChecklist {
  const photos = loadPhotoRecords().filter((photo) => photo.jobId === jobId);

  const beforePhotoCount = photos.filter((photo) => photo.category === "before").length;
  const afterPhotoCount = photos.filter((photo) => photo.category === "after").length;
  const damageNoteCount = photos.filter((photo) => photo.category === "damage_note").length;

  return {
    jobId,
    jobName: fallback?.jobName || "",
    clientName: fallback?.clientName || "",
    serviceAddress: fallback?.serviceAddress || "",
    arrivedAt: fallback?.arrivedAt || "",
    beforePhotoCount,
    afterPhotoCount,
    damageNoteCount,
    isArrived: Boolean(fallback?.isArrived),
    isReadyToComplete: beforePhotoCount > 0 && afterPhotoCount > 0
  };
}

export function filterPhotos({
  records,
  search,
  category,
  role
}: {
  records: NmdPhotoRecord[];
  search: string;
  category: NmdPhotoCategory | "all";
  role: NmdPhotoRole | "all";
}) {
  const value = search.trim().toLowerCase();

  return records.filter((photo) => {
    const matchesCategory = category === "all" || photo.category === category;
    const matchesRole = role === "all" || photo.uploadedByRole === role;

    if (!matchesCategory || !matchesRole) return false;

    if (!value) return true;

    const haystack = [
      photo.fileName,
      photo.note,
      photo.clientName,
      photo.jobName,
      photo.serviceAddress,
      photo.uploadedByRole,
      photo.uploadedByName,
      photo.category
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(value);
  });
}

export function canDownloadPhoto(photo: NmdPhotoRecord, role: NmdPhotoRole) {
  if (role === "superadmin" || role === "admin") return photo.canAdminDownload;
  if (role === "client") return photo.canClientDownload;
  return photo.canEmployeeDownload;
}

export function downloadPhotoRecord(photo: NmdPhotoRecord, role: NmdPhotoRole) {
  if (!canDownloadPhoto(photo, role)) {
    throw new Error("This role can view this image but cannot download it.");
  }

  if (!photo.objectUrl) {
    throw new Error("This photo does not have a downloadable local preview URL yet.");
  }

  const link = document.createElement("a");
  link.href = photo.objectUrl;
  link.download = photo.fileName || "nmd-photo";
  link.click();
}
