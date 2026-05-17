import React from "react";

type CalendarRole = "superadmin" | "admin" | "employee" | "client";

type ServiceStatus =
  | "requested"
  | "scheduled"
  | "on_the_way"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

type CalendarJob = {
  id: string;
  title: string;
  clientName: string;
  clientId?: string;
  serviceAddress: string;
  serviceType: string;
  treatmentRequired: string;
  assignedEmployee: string;
  assignedEmployeeId?: string;
  startTime: string;
  endTime: string;
  expectedDurationMinutes: number;
  status: ServiceStatus;
  etaWindow: string;
  notes: string;
};

type CalendarForm = {
  title: string;
  clientName: string;
  serviceAddress: string;
  serviceType: string;
  treatmentRequired: string;
  assignedEmployee: string;
  date: string;
  startTime: string;
  expectedDurationMinutes: string;
  etaWindow: string;
  notes: string;
};

const statusLabels: Record<ServiceStatus, string> = {
  requested: "Requested",
  scheduled: "Scheduled",
  on_the_way: "On The Way",
  arrived: "Arrived",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled"
};

const statusClassNames: Record<ServiceStatus, string> = {
  requested: "statusBadge status-pending_admin_approval",
  scheduled: "statusBadge status-approved",
  on_the_way: "statusBadge status-approved",
  arrived: "statusBadge status-approved",
  in_progress: "statusBadge status-approved",
  completed: "statusBadge status-paid",
  cancelled: "statusBadge"
};

const employeeColorClasses = [
  "calendarEmployeeBlue",
  "calendarEmployeeGreen",
  "calendarEmployeeTeal",
  "calendarEmployeePurple",
  "calendarEmployeeAmber"
];

const starterJobs: CalendarJob[] = [
  {
    id: "job-calendar-1",
    title: "House Wash + Driveway",
    clientName: "Sample Client",
    clientId: "client-sample-1",
    serviceAddress: "123 Client Way, Orlando, FL",
    serviceType: "House Washing",
    treatmentRequired: "Standard House Wash + Concrete Surface Cleaning",
    assignedEmployee: "NMD Team Member",
    assignedEmployeeId: "employee-sample-1",
    startTime: buildIsoDateForCalendar(1, 9, 0),
    endTime: buildIsoDateForCalendar(1, 12, 0),
    expectedDurationMinutes: 180,
    status: "scheduled",
    etaWindow: "9:00 AM - 9:30 AM",
    notes:
      "Client requested house wash and driveway cleaning. Confirm water access and take before/after photos."
  },
  {
    id: "job-calendar-2",
    title: "Roof Cleaning Review",
    clientName: "Roof Lead",
    clientId: "client-sample-2",
    serviceAddress: "456 Roof St, Winter Park, FL",
    serviceType: "Roof Cleaning",
    treatmentRequired: "Roof Cleaning Soft Wash + Plant Protection",
    assignedEmployee: "Admin Review",
    assignedEmployeeId: "employee-sample-2",
    startTime: buildIsoDateForCalendar(2, 13, 0),
    endTime: buildIsoDateForCalendar(2, 15, 0),
    expectedDurationMinutes: 120,
    status: "requested",
    etaWindow: "1:00 PM - 1:30 PM",
    notes:
      "High review roof job. Confirm pitch, plant protection plan, and access before final scheduling."
  }
];

const serviceOptions = [
  "House Washing",
  "Roof Cleaning",
  "Driveway & Sidewalk Cleaning",
  "Patio & Deck Cleaning",
  "Pool Cage & Enclosure Washing",
  "Paver Cleaning & Sealing",
  "Gutter Cleaning",
  "Storefront & Exterior Building Washing",
  "Parking Lot & Parking Garage Cleaning",
  "Dumpster Pad Cleaning",
  "Drive-Thru Cleaning",
  "Graffiti Removal",
  "Heavy Equipment Cleaning",
  "Warehouse & Factory Floor Cleaning",
  "Loading Dock Cleaning",
  "Fleet Washing",
  "Construction Equipment Cleaning"
];

const treatmentOptions = [
  "Standard House Wash",
  "Roof Cleaning Soft Wash",
  "Concrete Surface Cleaning",
  "Rust Stain Removal",
  "Oxidation-Sensitive Siding Wash",
  "Wood Fence Cleaning",
  "Paver Cleaning",
  "Restaurant Degreasing",
  "Plant Protection",
  "Graffiti Removal",
  "Fleet Washing"
];

const employeeOptions = [
  "NMD Team Member",
  "Admin Review",
  "Employee 1",
  "Employee 2",
  "Employee 3",
  "Owner / Super Admin"
];

function buildIsoDateForCalendar(daysFromToday: number, hour: number, minute: number) {
  const date = new Date();

  date.setDate(date.getDate() + daysFromToday);
  date.setHours(hour, minute, 0, 0);

  return date.toISOString();
}

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatTimeInput(date: Date) {
  return date.toTimeString().slice(0, 5);
}

function formatReadableDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

function formatReadableTime(value: string) {
  const date = new Date(value);

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit"
  });
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();

  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);

  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);

  result.setDate(result.getDate() + days);

  return result;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function minutesToEndTime(date: string, durationMinutes: number) {
  const start = new Date(date);
  const end = new Date(start);

  end.setMinutes(end.getMinutes() + durationMinutes);

  return end.toISOString();
}

function buildDateTime(date: string, time: string) {
  const combined = new Date(`${date}T${time || "09:00"}:00`);

  return combined.toISOString();
}

function makeJobId() {
  return `job-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeRole(role?: string): CalendarRole {
  const value = String(role || "").toLowerCase();

  if (value === "superadmin" || value === "admin" || value === "employee" || value === "client") {
    return value;
  }

  if (value === "super_admin" || value === "super-admin") {
    return "superadmin";
  }

  return "admin";
}

function getStatusHelpText(status: ServiceStatus) {
  if (status === "on_the_way") {
    return "Client sees On The Way + ETA only. No raw live location is exposed.";
  }

  if (status === "arrived") {
    return "Client sees Arrived. Employee should begin before-photo workflow.";
  }

  if (status === "completed") {
    return "Client sees Completed. Before/after photos can be attached to their profile.";
  }

  if (status === "scheduled") {
    return "Client sees scheduled service window.";
  }

  if (status === "requested") {
    return "Admin/Super Admin review needed before final schedule.";
  }

  if (status === "in_progress") {
    return "Job is active. Keep client updates limited and secure.";
  }

  return "Status is not active.";
}

function emptyFormForDate(date: Date): CalendarForm {
  return {
    title: "",
    clientName: "",
    serviceAddress: "",
    serviceType: "House Washing",
    treatmentRequired: "Standard House Wash",
    assignedEmployee: "NMD Team Member",
    date: formatDateInput(date),
    startTime: "09:00",
    expectedDurationMinutes: "120",
    etaWindow: "9:00 AM - 9:30 AM",
    notes: ""
  };
}

export default function LiveCalendarPanel({
  role = "admin",
  currentEmployeeName = "NMD Team Member",
  clientName = "Sample Client"
}: {
  role?: string;
  currentEmployeeName?: string;
  clientName?: string;
}) {
  const safeRole = normalizeRole(role);
  const adminAccess = safeRole === "superadmin" || safeRole === "admin";
  const employeeAccess = safeRole === "employee";
  const clientAccess = safeRole === "client";

  const [jobs, setJobs] = React.useState<CalendarJob[]>(starterJobs);
  const [weekAnchor, setWeekAnchor] = React.useState(() => startOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [selectedJobId, setSelectedJobId] = React.useState<string | null>(starterJobs[0]?.id || null);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState<CalendarForm>(() => emptyFormForDate(new Date()));
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<ServiceStatus | "all">("all");
  const [success, setSuccess] = React.useState("");
  const [error, setError] = React.useState("");

  const weekDays = React.useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekAnchor, index)),
    [weekAnchor]
  );

  const visibleJobs = jobs.filter((job) => {
    const jobDate = new Date(job.startTime);
    const inCurrentWeek = weekDays.some((day) => isSameDay(day, jobDate));

    const matchesRole =
      adminAccess ||
      (employeeAccess && job.assignedEmployee === currentEmployeeName) ||
      (clientAccess && job.clientName === clientName);

    const value = search.trim().toLowerCase();

    const matchesSearch =
      !value ||
      [
        job.title,
        job.clientName,
        job.serviceAddress,
        job.serviceType,
        job.treatmentRequired,
        job.assignedEmployee,
        job.notes,
        job.status
      ]
        .join(" ")
        .toLowerCase()
        .includes(value);

    const matchesStatus = statusFilter === "all" || job.status === statusFilter;

    return inCurrentWeek && matchesRole && matchesSearch && matchesStatus;
  });

  const selectedJob = jobs.find((job) => job.id === selectedJobId) || visibleJobs[0] || null;

  const selectedDayJobs = visibleJobs
    .filter((job) => isSameDay(new Date(job.startTime), selectedDate))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const updateForm = (field: keyof CalendarForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const openNewJobForm = (date = selectedDate) => {
    if (!adminAccess) {
      setError("Only Admin or Super Admin can schedule jobs.");
      return;
    }

    setForm(emptyFormForDate(date));
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const saveJob = (event: React.FormEvent) => {
    event.preventDefault();

    if (!adminAccess) {
      setError("Only Admin or Super Admin can schedule jobs.");
      return;
    }

    if (!form.title.trim() || !form.clientName.trim() || !form.serviceAddress.trim()) {
      setError("Job title, client name, and service address are required.");
      return;
    }

    const duration = Number(form.expectedDurationMinutes) || 120;
    const startTime = buildDateTime(form.date, form.startTime);
    const endTime = minutesToEndTime(startTime, duration);

    const newJob: CalendarJob = {
      id: makeJobId(),
      title: form.title.trim(),
      clientName: form.clientName.trim(),
      serviceAddress: form.serviceAddress.trim(),
      serviceType: form.serviceType.trim(),
      treatmentRequired: form.treatmentRequired.trim(),
      assignedEmployee: form.assignedEmployee.trim(),
      startTime,
      endTime,
      expectedDurationMinutes: duration,
      status: "scheduled",
      etaWindow: form.etaWindow.trim() || "ETA pending",
      notes: form.notes.trim()
    };

    setJobs((prev) =>
      [...prev, newJob].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
    );

    setSelectedJobId(newJob.id);
    setSelectedDate(new Date(newJob.startTime));
    setShowForm(false);
    setSuccess("Job scheduled on the live calendar.");
    setError("");
  };

  const updateJobStatus = (jobId: string, status: ServiceStatus) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? {
              ...job,
              status
            }
          : job
      )
    );

    setSuccess(`Service status updated to ${statusLabels[status]}.`);
  };

  const deleteJob = (jobId: string) => {
    if (!adminAccess) {
      setError("Only Admin or Super Admin can delete scheduled jobs.");
      return;
    }

    const job = jobs.find((entry) => entry.id === jobId);
    const ok = window.confirm(`Delete scheduled job "${job?.title || "selected job"}"?`);

    if (!ok) return;

    setJobs((prev) => prev.filter((entry) => entry.id !== jobId));
    setSelectedJobId(null);
    setSuccess("Scheduled job removed.");
  };

  const availableSlots = [
    "8:00 AM - 10:00 AM",
    "10:00 AM - 12:00 PM",
    "12:00 PM - 2:00 PM",
    "2:00 PM - 4:00 PM",
    "4:00 PM - 6:00 PM"
  ];

  return (
    <section className="panel liveCalendarPanel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">
            {clientAccess ? "Available Scheduling" : "Live Service Calendar"}
          </h2>
          <p className="brandSubtitle">
            {clientAccess
              ? "Choose a preferred service window. Final scheduling is confirmed by NMD."
              : "Schedule employees to jobs, connect service details, and send secure status updates without exposing raw employee tracking."}
          </p>
        </div>

        <div className="buttonRow">
          <button
            className="secondaryButton"
            type="button"
            onClick={() => setWeekAnchor((prev) => addDays(prev, -7))}
          >
            Previous Week
          </button>

          <button
            className="secondaryButton"
            type="button"
            onClick={() => {
              const today = new Date();
              setWeekAnchor(startOfWeek(today));
              setSelectedDate(today);
            }}
          >
            This Week
          </button>

          <button
            className="secondaryButton"
            type="button"
            onClick={() => setWeekAnchor((prev) => addDays(prev, 7))}
          >
            Next Week
          </button>

          {adminAccess && (
            <button className="primaryButton" type="button" onClick={() => openNewJobForm()}>
              Schedule Job
            </button>
          )}
        </div>
      </div>

      {error && <div className="errorBox">{error}</div>}

      {success && (
        <div className="listCard" style={{ borderColor: "rgba(34, 197, 94, 0.65)" }}>
          {success}
        </div>
      )}

      <div className="errorBox">
        <strong>Secure tracking rule:</strong> Clients should only see job-bound status
        updates like <strong>On The Way</strong>, <strong>ETA</strong>,{" "}
        <strong>Arrived</strong>, and <strong>Completed</strong>. Do not expose raw live
        GPS, employee home routes, or persistent location history.
      </div>

      <div className="formGrid" style={{ marginTop: 16 }}>
        <label className="fieldLabel">
          Search Calendar
          <input
            className="textInput"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search client, employee, service, treatment, address..."
          />
        </label>

        <label className="fieldLabel">
          Status Filter
          <select
            className="textInput"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ServiceStatus | "all")}
          >
            <option value="all">All Statuses</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="calendarWeekGrid" style={{ marginTop: 16 }}>
        {weekDays.map((day) => {
          const dayJobs = visibleJobs.filter((job) => isSameDay(new Date(job.startTime), day));
          const active = isSameDay(day, selectedDate);

          return (
            <button
              key={day.toISOString()}
              className={active ? "calendarDayCard active" : "calendarDayCard"}
              type="button"
              onClick={() => setSelectedDate(day)}
            >
              <span className="calendarDayName">{formatReadableDate(day)}</span>
              <strong>{dayJobs.length}</strong>
              <small>{dayJobs.length === 1 ? "job" : "jobs"}</small>
            </button>
          );
        })}
      </div>

      {clientAccess && (
        <section className="clientInfoPanel" style={{ marginTop: 16 }}>
          <div>
            <h2>Available Time Slots</h2>
            <p>
              Select a preferred appointment window. NMD will confirm based on route,
              employee availability, job duration, weather, and treatment needs.
            </p>
          </div>

          <div className="clientServicePills">
            {availableSlots.map((slot) => (
              <button
                key={slot}
                className="secondaryButton"
                type="button"
                onClick={() => setSuccess(`Preferred time slot selected: ${slot}`)}
              >
                {slot}
              </button>
            ))}
          </div>
        </section>
      )}

      {showForm && adminAccess && (
        <form className="formGrid calendarFormPanel" onSubmit={saveJob} style={{ marginTop: 16 }}>
          <div className="panelHeader">
            <div>
              <h3 className="panelTitle" style={{ fontSize: "1.3rem" }}>
                Schedule New Job
              </h3>
              <p className="brandSubtitle">
                Tie the job to client profile details, service address, expected time,
                treatment required, and assigned employee.
              </p>
            </div>

            <button
              className="secondaryButton"
              type="button"
              onClick={() => setShowForm(false)}
            >
              Close
            </button>
          </div>

          <label className="fieldLabel">
            Job Title
            <input
              className="textInput"
              value={form.title}
              onChange={(event) => updateForm("title", event.target.value)}
              placeholder="Example: Smith roof and house wash"
            />
          </label>

          <label className="fieldLabel">
            Client Name
            <input
              className="textInput"
              value={form.clientName}
              onChange={(event) => updateForm("clientName", event.target.value)}
              placeholder="Client name"
            />
          </label>

          <label className="fieldLabel">
            Scheduled Service Address
            <input
              className="textInput"
              value={form.serviceAddress}
              onChange={(event) => updateForm("serviceAddress", event.target.value)}
              placeholder="Service address"
            />
          </label>

          <label className="fieldLabel">
            Service Type
            <select
              className="textInput"
              value={form.serviceType}
              onChange={(event) => updateForm("serviceType", event.target.value)}
            >
              {serviceOptions.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </label>

          <label className="fieldLabel">
            Treatment Required
            <select
              className="textInput"
              value={form.treatmentRequired}
              onChange={(event) => updateForm("treatmentRequired", event.target.value)}
            >
              {treatmentOptions.map((treatment) => (
                <option key={treatment} value={treatment}>
                  {treatment}
                </option>
              ))}
            </select>
          </label>

          <label className="fieldLabel">
            Assigned Employee
            <select
              className="textInput"
              value={form.assignedEmployee}
              onChange={(event) => updateForm("assignedEmployee", event.target.value)}
            >
              {employeeOptions.map((employee) => (
                <option key={employee} value={employee}>
                  {employee}
                </option>
              ))}
            </select>
          </label>

          <label className="fieldLabel">
            Date
            <input
              className="textInput"
              type="date"
              value={form.date}
              onChange={(event) => updateForm("date", event.target.value)}
            />
          </label>

          <label className="fieldLabel">
            Start Time
            <input
              className="textInput"
              type="time"
              value={form.startTime}
              onChange={(event) => updateForm("startTime", event.target.value)}
            />
          </label>

          <label className="fieldLabel">
            Expected Duration Minutes
            <input
              className="textInput"
              type="number"
              min="15"
              step="15"
              value={form.expectedDurationMinutes}
              onChange={(event) => updateForm("expectedDurationMinutes", event.target.value)}
            />
          </label>

          <label className="fieldLabel">
            Client ETA Window
            <input
              className="textInput"
              value={form.etaWindow}
              onChange={(event) => updateForm("etaWindow", event.target.value)}
              placeholder="Example: 9:00 AM - 9:30 AM"
            />
          </label>

          <label className="fieldLabel">
            Job Notes
            <textarea
              className="textInput"
              rows={4}
              value={form.notes}
              onChange={(event) => updateForm("notes", event.target.value)}
              placeholder="Access, photos, client concerns, plant protection, treatment notes..."
            />
          </label>

          <div className="buttonRow">
            <button className="primaryButton" type="submit">
              Save Job To Calendar
            </button>

            <button
              className="secondaryButton"
              type="button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="calendarContentGrid" style={{ marginTop: 16 }}>
        <section className="calendarDayJobs">
          <div className="panelHeader">
            <div>
              <h3 className="panelTitle" style={{ fontSize: "1.25rem" }}>
                {formatReadableDate(selectedDate)}
              </h3>
              <p className="brandSubtitle">
                {selectedDayJobs.length} scheduled item(s) for this selected day.
              </p>
            </div>

            {adminAccess && (
              <button
                className="secondaryButton"
                type="button"
                onClick={() => openNewJobForm(selectedDate)}
              >
                Add To This Day
              </button>
            )}
          </div>

          <div className="cardsGrid" style={{ marginTop: 16 }}>
            {selectedDayJobs.map((job, index) => (
              <button
                key={job.id}
                className={selectedJob?.id === job.id ? "calendarJobCard active" : "calendarJobCard"}
                type="button"
                onClick={() => setSelectedJobId(job.id)}
              >
                <span className={employeeColorClasses[index % employeeColorClasses.length]} />
                <div>
                  <strong>{job.title}</strong>
                  <small>
                    {formatReadableTime(job.startTime)} - {formatReadableTime(job.endTime)}
                  </small>
                  <small>{job.clientName}</small>
                </div>
                <span className={statusClassNames[job.status]}>
                  {statusLabels[job.status]}
                </span>
              </button>
            ))}

            {selectedDayJobs.length === 0 && (
              <div className="listCard">
                No jobs are scheduled for this day.
                {adminAccess ? " Use Add To This Day to schedule one." : ""}
              </div>
            )}
          </div>
        </section>

        <section className="calendarSelectedJob">
          {selectedJob ? (
            <div className="quoteCard">
              <div className="quoteTopRow">
                <div>
                  <div className="quoteNumber">{selectedJob.title}</div>
                  <div className="cardLine">{selectedJob.serviceType}</div>
                </div>

                <span className={statusClassNames[selectedJob.status]}>
                  {statusLabels[selectedJob.status]}
                </span>
              </div>

              <div className="assignBox">
                <div className="assignTitle">Client / Address</div>
                <div className="cardLine">
                  <strong>Client:</strong> {selectedJob.clientName}
                </div>
                <div className="cardLine">
                  <strong>Address:</strong> {selectedJob.serviceAddress}
                </div>
              </div>

              <div className="assignBox">
                <div className="assignTitle">Schedule</div>
                <div className="cardLine">
                  <strong>Time:</strong> {formatReadableTime(selectedJob.startTime)} -{" "}
                  {formatReadableTime(selectedJob.endTime)}
                </div>
                <div className="cardLine">
                  <strong>Expected Duration:</strong>{" "}
                  {selectedJob.expectedDurationMinutes} minutes
                </div>
                <div className="cardLine">
                  <strong>Client ETA Window:</strong> {selectedJob.etaWindow}
                </div>
              </div>

              <div className="assignBox">
                <div className="assignTitle">Treatment / Employee</div>
                <div className="cardLine">
                  <strong>Treatment Required:</strong> {selectedJob.treatmentRequired}
                </div>
                <div className="cardLine">
                  <strong>Assigned:</strong> {selectedJob.assignedEmployee}
                </div>
              </div>

              <div className="assignBox">
                <div className="assignTitle">Secure Status Update</div>
                <div className="cardLine">{getStatusHelpText(selectedJob.status)}</div>

                {(adminAccess || employeeAccess) && (
                  <div className="buttonRow" style={{ marginTop: 12 }}>
                    <button
                      className="secondaryButton"
                      type="button"
                      onClick={() => updateJobStatus(selectedJob.id, "on_the_way")}
                    >
                      On The Way
                    </button>

                    <button
                      className="secondaryButton"
                      type="button"
                      onClick={() => updateJobStatus(selectedJob.id, "arrived")}
                    >
                      Arrived
                    </button>

                    <button
                      className="secondaryButton"
                      type="button"
                      onClick={() => updateJobStatus(selectedJob.id, "in_progress")}
                    >
                      In Progress
                    </button>

                    <button
                      className="primaryButton"
                      type="button"
                      onClick={() => updateJobStatus(selectedJob.id, "completed")}
                    >
                      Completed
                    </button>
                  </div>
                )}
              </div>

              {selectedJob.notes && (
                <div className="assignBox">
                  <div className="assignTitle">Notes</div>
                  <div className="cardLine" style={{ whiteSpace: "pre-wrap" }}>
                    {selectedJob.notes}
                  </div>
                </div>
              )}

              {adminAccess && (
                <div className="buttonRow" style={{ marginTop: 12 }}>
                  <button
                    className="dangerButton"
                    type="button"
                    onClick={() => deleteJob(selectedJob.id)}
                  >
                    Delete Job
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="listCard">
              Select a scheduled job to see client, address, treatment, employee, ETA,
              and secure service status details.
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
