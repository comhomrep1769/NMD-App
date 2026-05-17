import type {
  CalendarJob,
  ServiceStatusRecord,
  ServiceStatusValue
} from "../types/serviceStatus";

const STATUS_STORAGE_KEY = "nmd_service_status_records";
const CALENDAR_STORAGE_KEY = "nmd_calendar_jobs";
const STATUS_EVENT = "nmd-service-status-updated";

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function serviceStatusLabel(status: ServiceStatusValue) {
  const labels: Record<ServiceStatusValue, string> = {
    not_started: "Not Started",
    scheduled: "Scheduled",
    on_the_way: "On The Way",
    arrived: "Arrived",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
    rescheduled: "Rescheduled"
  };

  return labels[status] || "Scheduled";
}

export function clientSafeStatusLabel(status: ServiceStatusValue, etaWindow?: string) {
  if (status === "on_the_way") {
    return etaWindow ? `On the way • ETA ${etaWindow}` : "On the way";
  }

  if (status === "arrived") return "Service member has arrived";
  if (status === "in_progress") return "Service is in progress";
  if (status === "completed") return "Service completed";
  if (status === "cancelled") return "Service cancelled";
  if (status === "rescheduled") return "Service rescheduled";

  return "Service scheduled";
}

export function loadServiceStatusRecords(): ServiceStatusRecord[] {
  const raw = localStorage.getItem(STATUS_STORAGE_KEY);

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as ServiceStatusRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveServiceStatusRecords(records: ServiceStatusRecord[]) {
  localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new CustomEvent(STATUS_EVENT));
  return records;
}

export function subscribeServiceStatus(callback: () => void) {
  window.addEventListener(STATUS_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(STATUS_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function addServiceStatusRecord(
  input: Omit<ServiceStatusRecord, "id" | "createdAt" | "updatedAt" | "clientVisibleStatus">
) {
  const now = new Date().toISOString();

  const record: ServiceStatusRecord = {
    ...input,
    id: makeId("status"),
    clientVisibleStatus: clientSafeStatusLabel(input.status, input.etaWindow),
    createdAt: now,
    updatedAt: now
  };

  return saveServiceStatusRecords([record, ...loadServiceStatusRecords()]);
}

export function updateServiceStatus(
  id: string,
  status: ServiceStatusValue,
  etaWindow?: string
) {
  const updated = loadServiceStatusRecords().map((record) => {
    if (record.id !== id) return record;

    return {
      ...record,
      status,
      etaWindow: etaWindow ?? record.etaWindow,
      clientVisibleStatus: clientSafeStatusLabel(status, etaWindow ?? record.etaWindow),
      updatedAt: new Date().toISOString()
    };
  });

  return saveServiceStatusRecords(updated);
}

export function loadCalendarJobs(): CalendarJob[] {
  const raw = localStorage.getItem(CALENDAR_STORAGE_KEY);

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as CalendarJob[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCalendarJobs(jobs: CalendarJob[]) {
  localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(jobs));
  window.dispatchEvent(new CustomEvent(STATUS_EVENT));
  return jobs;
}

export function addCalendarJob(input: Omit<CalendarJob, "id">) {
  const job: CalendarJob = {
    ...input,
    id: makeId("calendar")
  };

  saveCalendarJobs([job, ...loadCalendarJobs()]);

  addServiceStatusRecord({
    jobId: job.id,
    clientId: job.clientId,
    clientName: job.clientName,
    serviceTitle: job.serviceTitle,
    serviceAddress: job.serviceAddress,
    assignedEmployeeName: job.assignedEmployeeName,
    assignedEmployeeId: job.assignedEmployeeId,
    scheduledDate: job.scheduledDate,
    scheduledTime: job.startTime,
    estimatedDurationMinutes: job.expectedDurationMinutes,
    etaWindow: "",
    status: job.status,
    adminNotes: job.notes,
    clientNotes: "",
    requiredTreatment: job.requiredTreatment
  });

  return job;
}

export function deleteCalendarJob(id: string) {
  return saveCalendarJobs(loadCalendarJobs().filter((job) => job.id !== id));
}

export function seedDemoCalendarJobs() {
  const existing = loadCalendarJobs();

  if (existing.length > 0) return existing;

  const today = new Date();
  const date = today.toISOString().slice(0, 10);

  const demoJobs: CalendarJob[] = [
    {
      id: makeId("calendar"),
      clientId: "client-demo-1",
      clientName: "Demo Client",
      serviceTitle: "House Washing",
      serviceAddress: "123 Client Service Address",
      assignedEmployeeName: "Employee One",
      assignedEmployeeId: "employee-demo-1",
      scheduledDate: date,
      startTime: "09:00",
      endTime: "11:00",
      expectedDurationMinutes: 120,
      requiredTreatment: "Standard House Wash",
      status: "scheduled",
      color: "#23c483",
      notes: "Demo scheduled job for calendar layout."
    }
  ];

  saveCalendarJobs(demoJobs);

  demoJobs.forEach((job) => {
    addServiceStatusRecord({
      jobId: job.id,
      clientId: job.clientId,
      clientName: job.clientName,
      serviceTitle: job.serviceTitle,
      serviceAddress: job.serviceAddress,
      assignedEmployeeName: job.assignedEmployeeName,
      assignedEmployeeId: job.assignedEmployeeId,
      scheduledDate: job.scheduledDate,
      scheduledTime: job.startTime,
      estimatedDurationMinutes: job.expectedDurationMinutes,
      etaWindow: "",
      status: job.status,
      adminNotes: job.notes,
      clientNotes: "",
      requiredTreatment: job.requiredTreatment
    });
  });

  return demoJobs;
}
