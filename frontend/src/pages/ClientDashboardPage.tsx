import React from "react";
import { apiFetch } from "../api";
import type { Client, Invoice, Quote, RecurringService, ServiceRequest } from "../types";

type ClientJob = {
  id: string;
  title: string;
  clientName: string;
  address: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string | null;
  createdAt: string;
};

type ClientPortalData = {
  client: Client | null;
  quotes: Quote[];
  invoices: Invoice[];
  jobs: ClientJob[];
  recurringServices: RecurringService[];
  serviceRequests: ServiceRequest[];
};

export default function ClientDashboardPage() {
  const [data, setData] = React.useState<ClientPortalData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    apiFetch<ClientPortalData>("/api/client-portal/me")
      .then((result) => setData(result))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load client portal");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="panel">
        <h2 className="panelTitle">Client Portal</h2>
        <div className="listCard">Loading your portal...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel">
        <h2 className="panelTitle">Client Portal</h2>
        <div className="errorBox">{error}</div>
      </section>
    );
  }

  if (!data?.client) {
    return (
      <div className="pageGrid">
        <section className="panel">
          <h2 className="panelTitle">Client Portal</h2>
          <div className="listCard">
            Your login is active, but no client profile is connected yet.
          </div>
          <div className="cardLine">
            NMD can connect your account to your client profile by matching your email.
          </div>
        </section>
      </div>
    );
  }

  const unpaidInvoices = data.invoices.filter((invoice) => invoice.status === "unpaid");
  const acceptedQuotes = data.quotes.filter((quote) => quote.status === "accepted");
  const upcomingJobs = data.jobs.filter((job) => new Date(job.startTime).getTime() >= Date.now());

  return (
    <div className="pageGrid">
      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Welcome, {data.client.firstName}</h2>
            <div className="brandSubtitle">NMD Pressure Washing Services LLC</div>
          </div>
        </div>

        <div className="statsGrid">
          <div className="statCard">
            <div className="statLabel">Open Invoices</div>
            <div className="statValue">{unpaidInvoices.length}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Quotes Accepted</div>
            <div className="statValue">{acceptedQuotes.length}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Upcoming Jobs</div>
            <div className="statValue">{upcomingJobs.length}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Recurring Services</div>
            <div className="statValue">{data.recurringServices.length}</div>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="panelTitle">My Invoices</h2>

        <div className="cardsGrid">
          {data.invoices.map((invoice) => (
            <div key={invoice.id} className="quoteCard">
              <div className="quoteTopRow">
                <div className="quoteNumber">Invoice #{invoice.invoiceNumber}</div>
                <span className={`statusBadge status-${invoice.status}`}>
                  {invoice.status}
                </span>
              </div>

              <div className="cardLine">
                <strong>Service:</strong> {invoice.jobName}
              </div>

              <div className="cardLine">
                <strong>Total:</strong> ${invoice.total.toFixed(2)}
              </div>

              <div className="cardLine">
                <strong>Payment Status:</strong> {invoice.paymentStatus || invoice.status}
              </div>

              {invoice.paymentLinkUrl && invoice.status !== "paid" && (
                <a
                  className="primaryButton"
                  href={invoice.paymentLinkUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: "none", display: "inline-block", marginTop: 12 }}
                >
                  Pay Invoice
                </a>
              )}
            </div>
          ))}

          {data.invoices.length === 0 && (
            <div className="listCard">No invoices yet.</div>
          )}
        </div>
      </section>

      <section className="panel">
        <h2 className="panelTitle">My Quotes</h2>

        <div className="cardsGrid">
          {data.quotes.map((quote) => (
            <div key={quote.id} className="quoteCard">
              <div className="quoteTopRow">
                <div className="quoteNumber">Quote #{quote.quoteNumber}</div>
                <span className={`statusBadge status-${quote.status}`}>
                  {quote.status}
                </span>
              </div>

              <div className="cardLine">
                <strong>Service:</strong> {quote.serviceType}
              </div>

              <div className="cardLine">
                <strong>Total:</strong> ${quote.total.toFixed(2)}
              </div>

              <div className="cardLine">
                <strong>Accepted:</strong>{" "}
                {quote.acceptedAt ? new Date(quote.acceptedAt).toLocaleString() : "—"}
              </div>
            </div>
          ))}

          {data.quotes.length === 0 && (
            <div className="listCard">No quotes yet.</div>
          )}
        </div>
      </section>

      <section className="panel">
        <h2 className="panelTitle">Appointments</h2>

        <div className="cardsGrid">
          {data.jobs.map((job) => (
            <div key={job.id} className="quoteCard">
              <div className="quoteTopRow">
                <div className="quoteNumber">{job.title}</div>
                <span className={`statusBadge status-${job.status}`}>
                  {job.status}
                </span>
              </div>

              <div className="cardLine">
                <strong>Address:</strong> {job.address}
              </div>

              <div className="cardLine">
                <strong>Start:</strong> {new Date(job.startTime).toLocaleString()}
              </div>

              <div className="cardLine">
                <strong>End:</strong> {new Date(job.endTime).toLocaleString()}
              </div>

              <div className="cardLine">
                <strong>Notes:</strong> {job.notes || "—"}
              </div>
            </div>
          ))}

          {data.jobs.length === 0 && (
            <div className="listCard">No appointments yet.</div>
          )}
        </div>
      </section>

      <section className="panel">
        <h2 className="panelTitle">Recurring Services</h2>

        <div className="cardsGrid">
          {data.recurringServices.map((service) => (
            <div key={service.id} className="quoteCard">
              <div className="quoteTopRow">
                <div className="quoteNumber">{service.serviceType}</div>
                <span className={`statusBadge status-${service.status}`}>
                  {service.status}
                </span>
              </div>

              <div className="cardLine">
                <strong>Frequency:</strong> {service.frequency}
              </div>

              <div className="cardLine">
                <strong>Price:</strong> ${service.price.toFixed(2)}
              </div>

              <div className="cardLine">
                <strong>Next Service:</strong>{" "}
                {service.nextServiceDate
                  ? new Date(service.nextServiceDate).toLocaleDateString()
                  : "—"}
              </div>
            </div>
          ))}

          {data.recurringServices.length === 0 && (
            <div className="listCard">No recurring services yet.</div>
          )}
        </div>
      </section>

      <section className="panel">
        <h2 className="panelTitle">My Service Requests</h2>

        <div className="cardsGrid">
          {data.serviceRequests.map((request) => (
            <div key={request.id} className="quoteCard">
              <div className="quoteTopRow">
                <div className="quoteNumber">{request.serviceType}</div>
                <span className={`statusBadge status-${request.status}`}>
                  {request.status}
                </span>
              </div>

              <div className="cardLine">
                <strong>Address:</strong> {request.address}
              </div>

              <div className="cardLine">
                <strong>Preferred:</strong>{" "}
                {request.preferredDate
                  ? `${new Date(request.preferredDate).toLocaleDateString()} ${request.preferredTime || ""}`
                  : request.preferredTime || "—"}
              </div>

              <div className="cardLine">
                <strong>Notes:</strong> {request.notes || "—"}
              </div>
            </div>
          ))}

          {data.serviceRequests.length === 0 && (
            <div className="listCard">No service requests yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
