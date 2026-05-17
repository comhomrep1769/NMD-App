export type NmdCalendarRole = "superadmin" | "admin" | "employee" | "client";

export type NmdJobStatus =
  | "requested"
  | "scheduled"
  | "on_the_way"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "rescheduled";

export type NmdCalendarJob = {
  id: string;
  title: string;
  clientName: string;
  clientId: string;
  serviceAddress: string;
  serviceType: string;
  treatmentRequired: string;
  assignedEmployeeName: string;
  assignedEmployeeId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  estimatedDurationMinutes: number;
  status: NmdJobStatus;
  etaMinutes: number | null;
  notes: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export type NmdAvailableTimeSlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  label: string;
  available: boolean;
};
