export type NmdPhotoRole = "superadmin" | "admin" | "employee" | "client";

export type NmdPhotoCategory =
  | "before"
  | "after"
  | "damage_note"
  | "access_issue"
  | "chemical_treatment"
  | "cash_payment_proof"
  | "general";

export type NmdPhotoRecord = {
  id: string;
  fileName: string;
  objectUrl?: string;
  category: NmdPhotoCategory;
  note: string;
  clientName: string;
  clientId?: string;
  jobId?: string;
  jobName: string;
  serviceAddress: string;
  uploadedByRole: NmdPhotoRole;
  uploadedByName: string;
  timestamp: string;
  canClientDownload: boolean;
  canAdminDownload: boolean;
  canEmployeeDownload: boolean;
};

export type NmdPhotoUploadDraft = {
  category: NmdPhotoCategory;
  note: string;
  clientName: string;
  jobName: string;
  serviceAddress: string;
};

export type JobPhotoChecklist = {
  jobId: string;
  jobName: string;
  clientName: string;
  serviceAddress: string;
  arrivedAt?: string;
  beforePhotoCount: number;
  afterPhotoCount: number;
  damageNoteCount: number;
  isArrived: boolean;
  isReadyToComplete: boolean;
};
