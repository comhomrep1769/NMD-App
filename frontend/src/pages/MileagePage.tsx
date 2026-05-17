import React from "react";

type MileageEntry = {
  id: string;
  employeeName: string;
  date: string;
  startLocation: string;
  endLocation: string;
  jobName: string;
  purpose: string;
  miles: number;
  rate: number;
  status: "draft" | "submitted" | "approved" | "paid" | "rejected";
  notes: string;
  createdAt: string;
};

type MileageForm = {
  employeeName: string;
  date: string;
  startLocation: string;
  endLocation: string;
  jobName: string;
  purpose: string;
  miles: string;
  rate: string;
  notes: string;
};

const defaultRate = 0.6;

const emptyForm: MileageForm = {
  employeeName: "",
  date: new Date().toISOString().slice(0, 10),
  startLocation: "",
  endLocation: "",
  jobName: "",
  purpose: "",
  miles: "",
  rate: String(defaultRate),
  notes: ""
};

const starterEntries: MileageEntry[] = [
  {
    id: "mileage-sample-1",
    employeeName: "NMD Team Member",
    date: new Date().toISOString().slice(0, 10),
    startLocation: "Shop / Starting Location",
    endLocation: "Sample Client Job",
    jobName: "Sample House Wash",
    purpose: "Travel to assigned service job",
    miles: 12,
    rate: defaultRate,
    status: "submitted",
    notes:
      "Sample mileage record. Replace with real employee mileage entries once backend storage is connected.",
    createdAt: new Date().toISOString()
  }
];

const statusLabels: Record<MileageEntry["status"], string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  paid: "Paid",
  rejected: "Rejected"
};

function makeMileageId() {
  return `mileage-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatMoney(value: number) {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD"
  });
}

function mileageTotal(entry: MileageEntry) {
  return entry.miles * entry.rate;
}

function statusClass(status: MileageEntry["status"]) {
  if (status === "approved" || status === "paid") return "statusBadge status-paid";
  if (status === "submitted") return "statusBadge status-approved";
  if (status === "rejected") return "statusBadge";
  return "statusBadge status-pending_admin_approval";
}

export default function MileagePage() {
  const [entries, setEntries] = React.useState<MileageEntry[]>(starterEntries);
  const [form, setForm] = React.useState<MileageForm>(emptyForm);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<MileageEntry["status"] | "all">(
    "all"
  );
  const [success, setSuccess] = React.useState("");
  const [error, setError] = React.useState("");

  const updateForm = (field: keyof MileageForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const visibleEntries = entries.filter((entry) => {
    const value = search.trim().toLowerCase();

    const matchesSearch =
      !value ||
      [
        entry.employeeName,
        entry.date,
        entry.startLocation,
        entry.endLocation,
        entry.jobName,
        entry.purpose,
        entry.notes,
        entry.status
      ]
        .join(" ")
        .toLowerCase()
        .includes(value);

    const matchesStatus = statusFilter === "all" || entry.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalMiles = visibleEntries.reduce((sum, entry) => sum + entry.miles, 0);
  const totalOwed = visibleEntries.reduce((sum, entry) => sum + mileageTotal(entry), 0);
  const approvedOwed = entries
    .filter((entry) => entry.status === "approved")
    .reduce((sum, entry) => sum + mileageTotal(entry), 0);

  const submitMileage = (event: React.FormEvent) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const miles = Number(form.miles);
    const rate = Number(form.rate);

    if (!form.employeeName.trim()) {
      setError("Employee name is required.");
      return;
    }

    if (!form.date.trim()) {
      setError("Mileage date is required.");
      return;
    }

    if (!Number.isFinite(miles) || miles <= 0) {
      setError("Miles must be greater than 0.");
      return;
    }

    if (!Number.isFinite(rate) || rate < 0) {
      setError("Mileage rate must be 0 or greater.");
      return;
    }

    const next: MileageEntry = {
      id: makeMileageId(),
      employeeName: form.employeeName.trim(),
      date: form.date,
      startLocation: form.startLocation.trim(),
      endLocation: form.endLocation.trim(),
      jobName: form.jobName.trim(),
      purpose: form.purpose.trim(),
      miles,
      rate,
      status: "submitted",
      notes: form.notes.trim(),
      createdAt: new Date().toISOString()
    };

    setEntries((prev) =>
      [next, ...prev].sort((a, b) => b.date.localeCompare(a.date))
    );
    setForm(emptyForm);
    setSuccess(`Mileage submitted. Estimated reimbursement: ${formatMoney(mileageTotal(next))}.`);
  };

  const updateStatus = (id: string, status: MileageEntry["status"]) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, status } : entry))
    );
    setSuccess(`Mileage status updated to ${statusLabels[status]}.`);
  };

  const deleteEntry = (id: string) => {
    const entry = entries.find((item) => item.id === id);
    const ok = window.confirm(
      `Delete mileage entry for ${entry?.employeeName || "this employee"}?`
    );

    if (!ok) return;

    setEntries((prev) => prev.filter((item) => item.id !== id));
    setSuccess("Mileage entry deleted.");
  };

  return (
    <div className="pageGrid">
      <section className="clientHeroPanel">
        <div className="clientHeroContent">
          <span className="clientEyebrow">Mileage Tracker</span>
          <h1>Business driving, reimbursements, and tax records.</h1>
          <p>
            Track employee business mileage, job-related driving, reimbursement amounts,
            approval status, and clean records for bookkeeping and tax reporting.
          </p>

          <div className="clientHeroActions">
            <a className="primaryButton" href="/schedule">
              Open Schedule
            </a>
            <a className="secondaryButton" href="/employees">
              Employees
            </a>
            <a className="secondaryButton" href="/expenses">
              Expenses
            </a>
          </div>
        </div>

        <div className="clientStatusCard">
          <div className="statLabel">Default Rate</div>
          <div className="clientStatusTitle">$0.60 / mile</div>
          <p>
            The default reimbursement rate is set to $0.60 per mile and should remain
            admin-adjustable as company policy changes.
          </p>
        </div>
      </section>

      {error && <div className="errorBox">{error}</div>}

      {success && (
        <div className="listCard" style={{ borderColor: "rgba(34, 197, 94, 0.65)" }}>
          {success}
        </div>
      )}

      <section className="panel">
        <div className="statsGrid">
          <div className="statCard">
            <div className="statLabel">Visible Miles</div>
            <div className="statValue">{totalMiles.toFixed(1)}</div>
            <p className="cardLine">Miles shown after filters.</p>
          </div>

          <div className="statCard">
            <div className="statLabel">Visible Reimbursement</div>
            <div className="statValue">{formatMoney(totalOwed)}</div>
            <p className="cardLine">Estimated amount for visible records.</p>
          </div>

          <div className="statCard">
            <div className="statLabel">Approved Balance</div>
            <div className="statValue">{formatMoney(approvedOwed)}</div>
            <p className="cardLine">Approved mileage awaiting payout.</p>
          </div>

          <div className="statCard">
            <div className="statLabel">Entries</div>
            <div className="statValue">{entries.length}</div>
            <p className="cardLine">Mileage records in this view.</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Submit Mileage</h2>
            <p className="brandSubtitle">
              Employees can submit job-related mileage. Admin/Super Admin can review,
              approve, reject, and mark paid.
            </p>
          </div>
        </div>

        <form className="formGrid" onSubmit={submitMileage} style={{ marginTop: 16 }}>
          <label className="fieldLabel">
            Employee Name
            <input
              className="textInput"
              value={form.employeeName}
              onChange={(event) => updateForm("employeeName", event.target.value)}
              placeholder="Employee name"
            />
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
            Start Location
            <input
              className="textInput"
              value={form.startLocation}
              onChange={(event) => updateForm("startLocation", event.target.value)}
              placeholder="Example: shop, home base, previous job"
            />
          </label>

          <label className="fieldLabel">
            End Location
            <input
              className="textInput"
              value={form.endLocation}
              onChange={(event) => updateForm("endLocation", event.target.value)}
              placeholder="Example: client job address"
            />
          </label>

          <label className="fieldLabel">
            Job / Client Name
            <input
              className="textInput"
              value={form.jobName}
              onChange={(event) => updateForm("jobName", event.target.value)}
              placeholder="Example: Smith driveway cleaning"
            />
          </label>

          <label className="fieldLabel">
            Purpose
            <input
              className="textInput"
              value={form.purpose}
              onChange={(event) => updateForm("purpose", event.target.value)}
              placeholder="Example: Travel to assigned service job"
            />
          </label>

          <label className="fieldLabel">
            Miles
            <input
              className="textInput"
              type="number"
              min="0"
              step="0.1"
              value={form.miles}
              onChange={(event) => updateForm("miles", event.target.value)}
              placeholder="Example: 12.5"
            />
          </label>

          <label className="fieldLabel">
            Reimbursement Rate Per Mile
            <input
              className="textInput"
              type="number"
              min="0"
              step="0.01"
              value={form.rate}
              onChange={(event) => updateForm("rate", event.target.value)}
            />
          </label>

          <label className="fieldLabel">
            Notes
            <textarea
              className="textInput"
              rows={3}
              value={form.notes}
              onChange={(event) => updateForm("notes", event.target.value)}
              placeholder="Odometer note, route note, fuel reimbursement note, job context..."
            />
          </label>

          <div className="buttonRow">
            <button className="primaryButton" type="submit">
              Submit Mileage
            </button>

            <button
              className="secondaryButton"
              type="button"
              onClick={() => setForm(emptyForm)}
            >
              Clear
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Mileage Records</h2>
            <p className="brandSubtitle">
              Review submitted business driving, reimbursements, approval status, and
              payout tracking.
            </p>
          </div>
        </div>

        <div className="formGrid" style={{ marginTop: 16 }}>
          <label className="fieldLabel">
            Search Mileage
            <input
              className="textInput"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee, job, location, notes..."
            />
          </label>

          <label className="fieldLabel">
            Status
            <select
              className="textInput"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as MileageEntry["status"] | "all")
              }
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
        </div>

        <div className="cardsGrid" style={{ marginTop: 16 }}>
          {visibleEntries.map((entry) => (
            <article key={entry.id} className="quoteCard">
              <div className="quoteTopRow">
                <div>
                  <div className="quoteNumber">{entry.employeeName}</div>
                  <div className="cardLine">{entry.date}</div>
                </div>

                <span className={statusClass(entry.status)}>
                  {statusLabels[entry.status]}
                </span>
              </div>

              <div className="assignBox">
                <div className="assignTitle">Trip</div>
                <div className="cardLine">
                  <strong>From:</strong> {entry.startLocation || "—"}
                </div>
                <div className="cardLine">
                  <strong>To:</strong> {entry.endLocation || "—"}
                </div>
                <div className="cardLine">
                  <strong>Job:</strong> {entry.jobName || "—"}
                </div>
              </div>

              <div className="assignBox">
                <div className="assignTitle">Reimbursement</div>
                <div className="cardLine">
                  <strong>Miles:</strong> {entry.miles.toFixed(1)}
                </div>
                <div className="cardLine">
                  <strong>Rate:</strong> {formatMoney(entry.rate)} / mile
                </div>
                <div className="cardLine">
                  <strong>Total:</strong> {formatMoney(mileageTotal(entry))}
                </div>
              </div>

              {entry.notes && (
                <div className="assignBox">
                  <div className="assignTitle">Notes</div>
                  <div className="cardLine">{entry.notes}</div>
                </div>
              )}

              <div className="buttonRow" style={{ marginTop: 12 }}>
                <button
                  className="secondaryButton"
                  type="button"
                  onClick={() => updateStatus(entry.id, "approved")}
                >
                  Approve
                </button>

                <button
                  className="primaryButton"
                  type="button"
                  onClick={() => updateStatus(entry.id, "paid")}
                >
                  Mark Paid
                </button>

                <button
                  className="secondaryButton"
                  type="button"
                  onClick={() => updateStatus(entry.id, "rejected")}
                >
                  Reject
                </button>

                <button
                  className="dangerButton"
                  type="button"
                  onClick={() => deleteEntry(entry.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}

          {visibleEntries.length === 0 && (
            <div className="listCard">
              No mileage records match the current filters.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
