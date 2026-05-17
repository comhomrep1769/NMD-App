import type {
  NmdAvailableTimeSlot,
  NmdCalendarJob,
  NmdJobStatus
} from "../types/scheduling";

const JOB_STORAGE_KEY = "nmd_calendar_jobs";
const JOB_EVENT = "nmd-calendar-jobs-updated";

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export const starterCalendarJobs: NmdCalendarJob[] = [
  {
    id: "job-sample-house-wash",
    title: "House Wash - Sample Client",
    clientName: "Sample Client",
    clientId: "client-sample",
    serviceAddress: "123 Sample St, Orlando, FL",
    serviceType: "House Washing",
    treatmentRequired: "Standard House Wash",
    assignedEmployeeName: "Unassigned",
    assignedEmployeeId: "",
    scheduledDate: todayIso(),
    startTime: "09:00",
    endTime: "11:00",
    estimatedDurationMinutes: 120,
    status: "scheduled",
    etaMinutes: null,
    notes: "Sample calendar job. Replace with real scheduled service data.",
    color: "#23c483",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export function loadCalendarJobs(): NmdCalendarJob[] {
  const raw = localStorage.getItem(JOB_STORAGE_KEY);

  if (!raw) {
    saveCalendarJobs(starterCalendarJobs);
    return starterCalendarJobs;
  }

  try {
    const parsed = JSON.parse(raw) as NmdCalendarJob[];

    if (!Array.isArray(parsed)) {
      saveCalendarJobs(starterCalendarJobs);
      return starterCalendarJobs;
    }

    return parsed;
  } catch {
    saveCalendarJobs(starterCalendarJobs);
    return starterCalendarJobs;
  }
}

export function saveCalendarJobs(jobs: NmdCalendarJob[]) {
  const sorted = [...jobs].sort((a, b) =>
    `${a.scheduledDate}-${a.startTime}`.localeCompare(`${b.scheduledDate}-${b.startTime}`)
  );

  localStorage.setItem(JOB_STORAGE_KEY, JSON.stringify(sorted));
  window.dispatchEvent(new CustomEvent(JOB_EVENT));

  return sorted;
}

export function subscribeCalendarJobs(callback: () => void) {
  window.addEventListener(JOB_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(JOB_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function createCalendarJob(input: {
  title: string;
  clientName: string;
  clientId?: string;
  serviceAddress: string;
  serviceType: string;
  treatmentRequired: string;
  assignedEmployeeName: string;
  assignedEmployeeId?: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  estimatedDurationMinutes: number;
  notes?: string;
  color?: string;
}) {
  const now = new Date().toISOString();

  const job: NmdCalendarJob = {
    id: makeId("job"),
    title: input.title.trim(),
    clientName: input.clientName.trim(),
    clientId: input.clientId || "",
    serviceAddress: input.serviceAddress.trim(),
    serviceType: input.serviceType.trim(),
    treatmentRequired: input.treatmentRequired.trim(),
    assignedEmployeeName: input.assignedEmployeeName.trim(),
    assignedEmployeeId: input.assignedEmployeeId || "",
    scheduledDate: input.scheduledDate,
    startTime: input.startTime,
    endTime: input.endTime,
    estimatedDurationMinutes: input.estimatedDurationMinutes,
    status: "scheduled",
    etaMinutes: null,
    notes: input.notes || "",
    color: input.color || "#1988ff",
    createdAt: now,
    updatedAt: now
  };

  saveCalendarJobs([job, ...loadCalendarJobs()]);
  return job;
}

export function updateCalendarJobStatus(
  jobId: string,
  status: NmdJobStatus,
  etaMinutes: number | null = null
) {
  const updated = loadCalendarJobs().map((job) =>
    job.id === jobId
      ? {
          ...job,
          status,
          etaMinutes,
          updatedAt: new Date().toISOString()
        }
      : job
  );

  saveCalendarJobs(updated);

  return updated.find((job) => job.id === jobId) || null;
}

export function deleteCalendarJob(jobId: string) {
  const updated = loadCalendarJobs().filter((job) => job.id !== jobId);
  saveCalendarJobs(updated);
  return updated;
}

export function getClientVisibleStatus(job: NmdCalendarJob) {
  if (job.status === "on_the_way") {
    return job.etaMinutes
      ? `Service member is on the way. ETA: about ${job.etaMinutes} minutes.`
      : "Service member is on the way.";
  }

  if (job.status === "arrived") {
    return "Service member has arrived.";
  }

  if (job.status === "in_progress") {
    return "Service is in progress.";
  }

  if (job.status === "completed") {
    return "Service has been completed.";
  }

  if (job.status === "scheduled") {
    return "Service is scheduled.";
  }

  if (job.status === "cancelled") {
    return "Service was cancelled.";
  }

  if (job.status === "rescheduled") {
    return "Service is being rescheduled.";
  }

  return "Service request received.";
}

export function statusLabel(status: NmdJobStatus) {
  const labels: Record<NmdJobStatus, string> = {
    requested: "Requested",
    scheduled: "Scheduled",
    on_the_way: "On The Way",
    arrived: "Arrived",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
    rescheduled: "Rescheduled"
  };

  return labels[status] || status;
}

export function buildAvailableTimeSlots(date: string): NmdAvailableTimeSlot[] {
  const jobs = loadCalendarJobs().filter((job) => job.scheduledDate === date);

  const baseSlots = [
    { startTime: "08:00", endTime: "10:00", label: "8:00 AM - 10:00 AM" },
    { startTime: "10:00", endTime: "12:00", label: "10:00 AM - 12:00 PM" },
    { startTime: "12:00", endTime: "14:00", label: "12:00 PM - 2:00 PM" },
    { startTime: "14:00", endTime: "16:00", label: "2:00 PM - 4:00 PM" },
    { startTime: "16:00", endTime: "18:00", label: "4:00 PM - 6:00 PM" }
  ];

  return baseSlots.map((slot) => {
    const taken = jobs.some(
      (job) =>
        job.startTime === slot.startTime ||
        job.endTime === slot.endTime ||
        (job.startTime < slot.endTime && job.endTime > slot.startTime)
    );

    return {
      id: `${date}-${slot.startTime}`,
      date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      label: slot.label,
      available: !taken
    };
  });
}
