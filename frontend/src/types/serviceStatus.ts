export type ServiceStatusValue =
  | "not_started"
  | "scheduled"
  | "on_the_way"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "rescheduled";

export type ServiceStatusRecord = {
  id: string;
  jobId: string;
  clientId: string;
  clientName: string;
  serviceTitle: string;
  serviceAddress: string;
  assignedEmployeeName: string;
  assignedEmployeeId: string;
  scheduledDate: string;
  scheduledTime: string;
  estimatedDurationMinutes: number;
  etaWindow: string;
  status: ServiceStatusValue;
  clientVisibleStatus: string;
  adminNotes: string;
  clientNotes: string;
  requiredTreatment: string;
  createdAt: string;
  updatedAt: string;
};

export type CalendarJob = {
  id: string;
  clientId: string;
  clientName: string;
  serviceTitle: string;
  serviceAddress: string;
  assignedEmployeeName: string;
  assignedEmployeeId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  expectedDurationMinutes: number;
  requiredTreatment: string;
  status: ServiceStatusValue;
  color: string;
  notes: string;
};
