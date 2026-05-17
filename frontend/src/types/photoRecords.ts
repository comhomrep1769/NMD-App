export type NmdPhotoRole = "superadmin" | "admin" | "employee" | "client";

export type NmdPhotoCategory =
  | "before"
  | "after"
  | "property"
  | "pre_existing_damage"
  | "access_issue"
  | "treatment_area"
  | "cash_payment_proof"
  | "general_chat";

export type NmdPhotoRecord = {
  id: string;
  fileName: string;
  previewUrl: string;
  category: NmdPhotoCategory;
  note: string;
  clientName: string;
  clientId: string;
  jobId: string;
  serviceAddress: string;
  uploadedByRole: NmdPhotoRole;
  uploadedByName: string;
  createdAt: string;
  canClientDownload: boolean;
  canAdminDownload: boolean;
  canEmployeeDownload: boolean;
};

export type JobPhotoChecklist = {
  jobId: string;
  beforeRequired: boolean;
  afterRequired: boolean;
  beforeComplete: boolean;
  afterComplete: boolean;
  damageNotesComplete: boolean;
};
