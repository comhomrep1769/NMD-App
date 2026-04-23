import React from "react";
import { apiFetch } from "../api";
import type { Client, Employee, Invoice, InvoiceStatus, Job } from "../types";

export default function InvoicesPage() {
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [clientId, setClientId] = React.useState("");
  const [clientName, setClientName] = React.useState("");
  const [jobName, setJobName] = React.useState("");
  const [total, setTotal] = React.useState("");
  const [status, setStatus] = React.useState<InvoiceStatus>("unpaid");
  const [jobId, setJobId] = React.useState("");
  const [assignedUserId, setAssignedUserId] = React.useState("");

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [invoiceData, clientData, employeeData, jobData] = await Promise.all([
        apiFetch<{ invoices: Invoice[] }>("/api/invoices"),
        apiFetch<{ clients: Client[] }>("/api/clients"),
        apiFetch<{ employees: Employee[] }>("/api/employees"),
        apiFetch<{ jobs: Job[] }>("/api/jobs")
      ]);

      setInvoices(invoiceData.invoices);
      setClients(clientData.clients);
      setEmployees(employeeData.employees);
      setJobs(jobData.jobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setEditingId(null);
    setClientId("");
    setClientName("");
    setJobName("");
    setTotal("");
    setStatus("unpaid");
    setJobId("");
    setAssignedUserId("");
  };

  const startEdit = (invoice: Invoice) => {
    setEditingId(invoice.id);
    setClientId(invoice.clientId || "");
    setClientName(invoice.clientName);
    setJobName(invoice.jobName);
    setTotal(String(invoice.total));
    setStatus(invoice.status);
    setJobId(invoice.jobId || "");
    setAssignedUserId(invoice.assignedUserId || "");
  };

  const handleClientSelect = (value: string) => {
    setClientId(value);

    const selected = clients.find((c) => c.id === value);
    if (selected) {
      setClientName(`${selected.firstName} ${selected.lastName}`);
    }
  };

  const handleJobSelect = (value: string) => {
    setJobId(value);

    const selected = jobs.find((j) => j.id === value);
    if (selected) {
      setJobName(selected.title);
      setClientName(selected.client_name);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const payload = {
      clientId: clientId || null,
      clientName,
      jobName,
      total: Number(total) || 0,
      status,
      jobId: jobId || null,
      assignedUserId: assignedUserId || null
    };

    try {
      if (editingId) {
        await apiFetch(`/api/invoices/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch("/api/invoices", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save invoice");
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    const ok = window.confirm("Delete this invoice?");
    if (!ok) return;

    try {
      await apiFetch(`/api/invoices/${invoiceId}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete invoice");
    }
  };

  return (
    <div className="pageGrid">
      <section className="panel">
        <div className="panelHeader">
          <h2 className="panelTitle">{editingId ? "Edit Invoice" : "New Invoice"}</h2>
        </div>

        {error && <div className="errorBox">{error}</div>}

        <form className="formGrid" onSubmit={submit}>
          <select className="textInput" value={clientId} onChange={(e) => handleClientSelect(e.target.value)}>
            <option value="">Select saved client optional</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.firstName} {client.lastName}
              </option>
            ))}
          </select>

          <select className="textInput" value={jobId} onChange={(e) => handleJobSelect(e.target.value)}>
            <option value="">Attach scheduled job optional</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} — {new Date(job.start_time).toLocaleDateString()}
              </option>
            ))}
          </select>

          <select className="textInput" value={assignedUserId} onChange={(e) => setAssignedUserId(e.target.value)}>
            <option value="">Assign employee credit optional</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.displayName}
              </option>
            ))}
          </select>

          <input
            className="textInput"
            placeholder="Client name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />

          <input
            className="textInput"
            placeholder="Job name"
            value={jobName}
            onChange={(e) => setJobName(e.target.value)}
          />

          <input
            className="textInput"
            placeholder="Total"
            inputMode="decimal"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
          />

          <select className="textInput" value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus)}>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
          </select>

          <div className="buttonRow">
            <button className="primaryButton" type="submit">
              {editingId ? "Save Invoice" : "Add Invoice"}
            </button>

            {editingId && (
              <button className="secondaryButton" type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <h2 className="panelTitle">Invoices</h2>
        </div>

        {loading && <div className="listCard">Loading invoices...</div>}

        {!loading && (
          <div className="cardsGrid">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="invoiceCard">
                <div className="quoteTopRow">
                  <div className="quoteNumber">Invoice #{invoice.invoiceNumber}</div>
                  <span className={`statusBadge ${invoice.status === "paid" ? "status-paid" : "status-unpaid"}`}>
                    {invoice.status}
                  </span>
                </div>

                <div className="cardLine"><strong>Client:</strong> {invoice.clientName}</div>
                <div className="cardLine"><strong>Job:</strong> {invoice.jobName}</div>
                <div className="cardLine"><strong>Total:</strong> ${invoice.total.toFixed(2)}</div>
                <div className="cardLine"><strong>Scheduled Job:</strong> {invoice.jobTitle || "—"}</div>
                <div className="cardLine"><strong>Employee Credit:</strong> {invoice.assignedEmployeeName || "—"}</div>

                <div className="buttonRow">
                  <button className="secondaryButton" onClick={() => startEdit(invoice)}>
                    Edit
                  </button>

                  <button className="secondaryButton" onClick={() => deleteInvoice(invoice.id)}>
                    Delete
                  </button>

                  {invoice.status === "unpaid" && (
                    <button className="primaryButton">
                      Create Payment Link
                    </button>
                  )}
                </div>
              </div>
            ))}

            {invoices.length === 0 && (
              <div className="listCard">No invoices yet.</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
