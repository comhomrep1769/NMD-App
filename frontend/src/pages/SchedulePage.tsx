import React from "react";
import { apiFetch } from "../api";
import type { Employee, Job, JobStatus, Role } from "../types";

const statusOptions: JobStatus[] = ["scheduled", "in_progress", "completed", "cancelled"];

type AvailabilityConflict = {
  id: string;
  user_id: string;
  display_name: string;
  start_time: string;
  end_time: string;
  reason?: string | null;
};

export default function SchedulePage({ role }: { role: Role }) {
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [refreshKey, setRefreshKey] = React.useState(0);

  const [title, setTitle] = React.useState("");
  const [clientName, setClientName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [startTime, setStartTime] = React.useState("");
  const [endTime, setEndTime] = React.useState("");
  const [status, setStatus] = React.useState<JobStatus>("scheduled");
  const [notes, setNotes] = React.useState("");
  const [assignedUserIds, setAssignedUserIds] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [conflicts, setConflicts] = React.useState<AvailabilityConflict[]>([]);

  React.useEffect(() => {
    setLoading(true);
    setError("");

    Promise.all([
      apiFetch<{ jobs: Job[] }>("/api/jobs"),
      role === "admin"
        ? apiFetch<{ employees: Employee[] }>("/api/employees")
        : Promise.resolve({ employees: [] as Employee[] })
    ])
      .then(([jobsData, employeesData]) => {
        setJobs(jobsData.jobs);
        setEmployees(employeesData.employees);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load schedule"))
      .finally(() => setLoading(false));
  }, [role, refreshKey]);

  const resetForm = () => {
    setTitle("");
    setClientName("");
    setAddress("");
    setStartTime("");
    setEndTime("");
    setStatus("scheduled");
    setNotes("");
    setAssignedUserIds([]);
    setConflicts([]);
  };

  const checkConflicts = async () => {
    if (!startTime || !endTime || assignedUserIds.length === 0) {
      setConflicts([]);
      return [];
    }

    const data = await apiFetch<{ conflicts: AvailabilityConflict[] }>("/api/jobs/check-conflicts", {
      method: "POST",
      body: JSON.stringify({
        startTime,
        endTime,
        assignedUserIds
      })
    });

    setConflicts(data.conflicts);
    return data.conflicts;
  };

  const createJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const foundConflicts = await checkConflicts();

      if (foundConflicts.length > 0) {
        const force = window.confirm(
          "This job conflicts with employee unavailability. Do you still want to create it?"
        );

        if (!force) {
          setSaving(false);
          return;
        }
      }

      await apiFetch("/api/jobs", {
        method: "POST",
        body: JSON.stringify({
          title,
          clientName,
          address,
          startTime,
          endTime,
          status,
          notes,
          assignedUserIds,
          forceCreate: true
        })
      });

      resetForm();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create job";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pageGrid">
      {role === "admin" && (
        <section className="panel">
          <h2 className="panelTitle">Create Job</h2>

          {error && <div className="errorBox">{error}</div>}

          {conflicts.length > 0 && (
            <div className="errorBox">
              <strong>Schedule conflict detected:</strong>
              {conflicts.map((conflict) => (
                <div key={conflict.id} style={{ marginTop: 8 }}>
                  {conflict.display_name} is unavailable from{" "}
                  {new Date(conflict.start_time).toLocaleString()} to{" "}
                  {new Date(conflict.end_time).toLocaleString()}
                  {conflict.reason ? ` — ${conflict.reason}` : ""}
                </div>
              ))}
            </div>
          )}

          <form className="formGrid" onSubmit={createJob}>
            <input
              className="textInput"
              placeholder="Job title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <input
              className="textInput"
              placeholder="Client name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />

            <input
              className="textInput"
              placeholder="Job address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <input
              className="textInput"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />

            <input
              className="textInput"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />

            <select
              className="textInput"
              value={status}
              onChange={(e) => setStatus(e.target.value as JobStatus)}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <textarea
              className="textInput"
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />

            <div className="assignBox">
              <div className="assignTitle">Assign Employees</div>
              <div className="assignList">
                {employees.map((employee) => (
                  <label key={employee.id} className="assignItem">
                    <input
                      type="checkbox"
                      checked={assignedUserIds.includes(employee.id)}
                      onChange={(e) => {
                        setAssignedUserIds((prev) =>
                          e.target.checked
                            ? [...prev, employee.id]
                            : prev.filter((id) => id !== employee.id)
                        );
                      }}
                    />
                    <span>{employee.displayName}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="buttonRow">
              <button className="secondaryButton" type="button" onClick={checkConflicts}>
                Check Conflicts
              </button>

              <button className="primaryButton" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Create Job"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel">
        <div className="panelHeader">
          <h2 className="panelTitle">{role === "admin" ? "All Scheduled Jobs" : "My Scheduled Jobs"}</h2>
        </div>

        {loading && <div className="listCard">Loading jobs...</div>}
        {error && role !== "admin" && <div className="errorBox">{error}</div>}

        {!loading && (
          <div className="cardsGrid">
            {jobs.map((job) => (
              <div key={job.id} className="quoteCard">
                <div className="quoteTopRow">
                  <div className="quoteNumber">{job.title}</div>
                  <span className={`statusBadge status-${job.status}`}>{job.status}</span>
                </div>

                <div className="cardLine"><strong>Client:</strong> {job.client_name}</div>
                <div className="cardLine"><strong>Address:</strong> {job.address}</div>
                <div className="cardLine"><strong>Start:</strong> {new Date(job.start_time).toLocaleString()}</div>
                <div className="cardLine"><strong>End:</strong> {new Date(job.end_time).toLocaleString()}</div>

                {job.notes && (
                  <div className="cardLine"><strong>Notes:</strong> {job.notes}</div>
                )}

                <div className="cardLine">
                  <strong>Assigned:</strong>{" "}
                  {job.assigned_employees.length > 0
                    ? job.assigned_employees.map((e) => e.displayName).join(", ")
                    : "None"}
                </div>
              </div>
            ))}

            {jobs.length === 0 && (
              <div className="listCard">No jobs yet.</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
