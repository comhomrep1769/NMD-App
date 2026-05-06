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

type ClientRecurringService = RecurringService & {
  stripeCheckoutSessionId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
  stripePaymentStatus?: string | null;
  stripeCheckoutUrl?: string | null;
};

type ClientPortalData = {
  client: Client | null;
  quotes: Quote[];
  invoices: Invoice[];
  jobs: ClientJob[];
  recurringServices: ClientRecurringService[];
  serviceRequests: ServiceRequest[];
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read image."));
    };

    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

export default function ClientDashboardPage() {
  const [data, setData] = React.useState<ClientPortalData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const [serviceType, setServiceType] = React.useState("Driveway Cleaning");
  const [address, setAddress] = React.useState("");
  const [preferredDate, setPreferredDate] = React.useState("");
  const [preferredTime, setPreferredTime] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [photoDataUrl, setPhotoDataUrl] = React.useState<string | null>(null);
  const [photoNote, setPhotoNote] = React.useState("");
  const [waiverAccepted, setWaiverAccepted] = React.useState(false);
  const [waiverSignature, setWaiverSignature] = React.useState("");
  const [savingRequest, setSavingRequest] = React.useState(false);

  const loadPortal = React.useCallback(async () => {
    setError("");

    try {
      const result = await apiFetch<ClientPortalData>("/api/client-portal/me");
      setData(result);

      if (result.client && !address) {
        setAddress(result.client.address || "");
        setWaiverSignature(`${result.client.firstName} ${result.client.lastName}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load client portal");
    } finally {
      setLoading(false);
    }
  }, [address]);

  React.useEffect(() => {
    loadPortal();
  }, [loadPortal]);

  const handlePhoto = async (file?: File) => {
    setError("");

    if (!file) {
      setPhotoDataUrl(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    if (file.size > 1_800_000) {
      setError("Image is too large. Please upload a smaller image under about 1.8MB.");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setPhotoDataUrl(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load image.");
    }
  };

  const submitServiceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!waiverAccepted || !waiverSignature.trim()) {
      setError("Please accept the waiver and type your full legal name as signature.");
      return;
    }

    try {
      setSavingRequest(true);

      await apiFetch("/api/client-portal/service-request", {
        method: "POST",
        body: JSON.stringify({
          address,
          serviceType,
          preferredDate: preferredDate || null,
          preferredTime,
          notes,
          photoDataUrl,
          photoNote,
          waiverAccepted,
          waiverSignature
        })
      });

      setSuccess("Service request submitted.");
      setServiceType("Driveway Cleaning");
      setPreferredDate("");
      setPreferredTime("");
      setNotes("");
      setPhotoDataUrl(null);
      setPhotoNote("");
      setWaiverAccepted(false);

      await loadPortal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit service request");
    } finally {
      setSavingRequest(false);
    }
  };

  if (loading) {
    return (
      <section className="panel">
        <h2 className="panelTitle">Client Portal</h2>
        <div className="listCard">Loading your portal...</div>
      </section>
    );
  }

  if (error && !data) {
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
  const activeRecurring = data.recurringServices.filter((service) => service.status === "active");

  return (
    <div className="pageGrid">
      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Welcome, {data.client.firstName}</h2>
            <div className="brandSubtitle">NMD Pressure Washing Services LLC</div>
          </div>
        </div>

        {error && <div className="errorBox">{error}</div>}
        {success && <div className="listCard">{success}</div>}

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
            <div className="statLabel">Active Recurring</div>
            <div className="statValue">{activeRecurring.length}</div>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="panelTitle">Request New Service</h2>

        <form className="formGrid" onSubmit={submitServiceRequest}>
          <input
            className="textInput"
            placeholder="Service address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <select
            className="textInput"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
          >
            <option value="Driveway Cleaning">Driveway Cleaning</option>
            <option value="Sidewalk Cleaning">Sidewalk Cleaning</option>
            <option value="House Siding">House Siding</option>
            <option value="Roof Cleaning">Roof Cleaning</option>
            <option value="Fence Cleaning">Fence Cleaning</option>
            <option value="Trash Can Cleaning">Trash Can Cleaning</option>
            <option value="Commercial Cleaning">Commercial Cleaning</option>
            <option value="Other">Other</option>
          </select>

          <input
            className="textInput"
            type="date"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
          />

          <input
            className="textInput"
            placeholder="Preferred time window"
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
          />

          <textarea
            className="textInput"
            placeholder="Notes / details about the surface, stains, access, etc."
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="assignBox">
            <div className="assignTitle">Upload Photo Optional</div>

            <input
              className="textInput"
              type="file"
              accept="image/*"
              onChange={(e) => handlePhoto(e.target.files?.[0])}
            />

            {photoDataUrl && (
              <div style={{ marginTop: 12 }}>
                <img
                  src={photoDataUrl}
                  alt="Request upload preview"
                  style={{
                    width: "100%",
                    maxHeight: 260,
                    objectFit: "cover",
                    borderRadius: 14,
                    border: "1px solid var(--border)"
                  }}
                />

                <button
                  className="secondaryButton"
                  type="button"
                  style={{ marginTop: 10 }}
                  onClick={() => setPhotoDataUrl(null)}
                >
                  Remove Photo
                </button>
              </div>
            )}
          </div>

          <textarea
            className="textInput"
            placeholder="Photo note optional — describe what the image shows"
            rows={3}
            value={photoNote}
            onChange={(e) => setPhotoNote(e.target.value)}
          />

          <div className="assignBox">
            <div className="assignTitle">Required Liability Waiver</div>

            <div className="cardLine">
              By submitting this request, I acknowledge that NMD Pressure Washing Services LLC is not responsible for pre-existing property conditions, including but not limited to oxidation, loose paint, damaged siding, cracked concrete, weakened seals, worn surfaces, improper prior coatings, electrical exposure, or hidden damage.
            </div>

            <div className="cardLine">
              I understand NMD Pressure Washing Services LLC is only responsible for direct damage proven to be caused by its work, and that a quote or service recommendation may depend on visible condition, uploaded photos, and on-site inspection.
            </div>

            <label className="assignItem">
              <input
                type="checkbox"
                checked={waiverAccepted}
                onChange={(e) => setWaiverAccepted(e.target.checked)}
              />
              <span>I have read and accept the liability waiver.</span>
            </label>

            <input
              className="textInput"
              placeholder="Type full legal name as signature"
              value={waiverSignature}
              onChange={(e) => setWaiverSignature(e.target.value)}
            />
          </div>

          <button className="primaryButton" type="submit" disabled={savingRequest}>
            {savingRequest ? "Submitting..." : "Submit Service Request"}
          </button>
        </form>
      </section>

      <section className="panel">
        <h2 className="panelTitle">My Recurring Services</h2>

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
                <strong>Billing:</strong> {service.stripePaymentStatus || "not_started"}
              </div>

              <div className="cardLine">
                <strong>Next Service:</strong>{" "}
                {service.nextServiceDate
                  ? new Date(service.nextServiceDate).toLocaleDateString()
                  : "—"}
              </div>

              <div className="cardLine">
                <strong>Address:</strong> {service.address}
              </div>

              {service.stripeCheckoutUrl && service.stripePaymentStatus !== "active" && (
                <a
                  className="primaryButton"
                  href={service.stripeCheckoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: "none", display: "inline-block", marginTop: 12 }}
                >
                  Activate Recurring Billing
                </a>
              )}

              {service.stripePaymentStatus === "active" && (
                <div className="listCard" style={{ marginTop: 12 }}>
                  Recurring billing is active.
                </div>
              )}

              {service.stripePaymentStatus === "payment_failed" && (
                <div className="errorBox" style={{ marginTop: 12 }}>
                  Payment failed. Please contact NMD or update payment with the checkout link if available.
                </div>
              )}
            </div>
          ))}

          {data.recurringServices.length === 0 && (
            <div className="listCard">No recurring services yet.</div>
          )}
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
