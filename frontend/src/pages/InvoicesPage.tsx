import React from "react";
import { apiFetch } from "../api";
import type { Client, Invoice } from "../types";

const DEFAULT_TAX_RATE = 0.065;

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

function formatRate(rate: number) {
  return `${(rate * 100).toFixed(2)}%`;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [clientId, setClientId] = React.useState("");
  const [clientName, setClientName] = React.useState("");
  const [jobName, setJobName] = React.useState("");
  const [subtotal, setSubtotal] = React.useState("");
  const [taxRate, setTaxRate] = React.useState("6.5");
  const [salesTaxAmount, setSalesTaxAmount] = React.useState("");
  const [total, setTotal] = React.useState("");
  const [status, setStatus] = React.useState<"paid" | "unpaid">("unpaid");

  const [cashInvoiceId, setCashInvoiceId] = React.useState<string | null>(null);
  const [cashAmount, setCashAmount] = React.useState("");
  const [cashSalesTax, setCashSalesTax] = React.useState("");
  const [cashTotalCollected, setCashTotalCollected] = React.useState("");
  const [cashPhotoDataUrl, setCashPhotoDataUrl] = React.useState<string | null>(null);
  const [cashNotes, setCashNotes] = React.useState("");

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [invoiceData, clientData] = await Promise.all([
        apiFetch<{ invoices: Invoice[] }>("/api/invoices"),
        apiFetch<{ clients: Client[] }>("/api/clients")
      ]);

      setInvoices(invoiceData.invoices);
      setClients(clientData.clients);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  React.useEffect(() => {
    const subtotalNumber = Number(subtotal) || 0;
    const taxRateNumber = (Number(taxRate) || 0) / 100;
    const tax = Number((subtotalNumber * taxRateNumber).toFixed(2));
    const finalTotal = Number((subtotalNumber + tax).toFixed(2));

    setSalesTaxAmount(String(tax));
    setTotal(String(finalTotal));
  }, [subtotal, taxRate]);

  const resetForm = () => {
    setEditingId(null);
    setClientId("");
    setClientName("");
    setJobName("");
    setSubtotal("");
    setTaxRate("6.5");
    setSalesTaxAmount("");
    setTotal("");
    setStatus("unpaid");
  };

  const resetCashForm = () => {
    setCashInvoiceId(null);
    setCashAmount("");
    setCashSalesTax("");
    setCashTotalCollected("");
    setCashPhotoDataUrl(null);
    setCashNotes("");
  };

  const handleClientSelect = (value: string) => {
    setClientId(value);

    const selected = clients.find((client) => client.id === value);

    if (selected) {
      setClientName(`${selected.firstName} ${selected.lastName}`);
    }
  };

  const startEdit = (invoice: Invoice) => {
    setEditingId(invoice.id);
    setClientId(invoice.clientId || "");
    setClientName(invoice.clientName);
    setJobName(invoice.jobName);
    setSubtotal(String(invoice.subtotal ?? invoice.total ?? 0));
    setTaxRate(String(((invoice.taxRate ?? DEFAULT_TAX_RATE) * 100).toFixed(2)));
    setSalesTaxAmount(String(invoice.salesTaxAmount ?? 0));
    setTotal(String(invoice.total));
    setStatus(invoice.status);
  };

  const startCashPayment = (invoice: Invoice) => {
    setCashInvoiceId(invoice.id);
    setCashAmount(String(invoice.subtotal ?? invoice.total ?? 0));
    setCashSalesTax(String(invoice.salesTaxAmount ?? 0));
    setCashTotalCollected(String(invoice.total || 0));
    setCashNotes(`Cash collected for Invoice #${invoice.invoiceNumber} - ${invoice.jobName}`);
    setCashPhotoDataUrl(null);
  };

  const handleCashPhoto = async (file?: File) => {
    setError("");

    if (!file) {
      setCashPhotoDataUrl(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    if (file.size > 1_800_000) {
      setError("Cash proof image is too large. Please upload an image under about 1.8MB.");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setCashPhotoDataUrl(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load image.");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const subtotalNumber = Number(subtotal) || 0;
    const taxRateDecimal = (Number(taxRate) || 0) / 100;
    const salesTaxNumber = Number(salesTaxAmount) || 0;
    const totalNumber = Number(total) || 0;

    const payload = {
      clientId: clientId || null,
      clientName,
      jobName,
      subtotal: subtotalNumber,
      taxRate: taxRateDecimal,
      salesTaxAmount: salesTaxNumber,
      total: totalNumber,
      status
    };

    try {
      if (editingId) {
        await apiFetch(`/api/invoices/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });

        setSuccess("Invoice updated.");
      } else {
        await apiFetch("/api/invoices", {
          method: "POST",
          body: JSON.stringify(payload)
        });

        setSuccess("Invoice created.");
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save invoice");
    }
  };

  const createPaymentLink = async (invoiceId: string) => {
    setError("");
    setSuccess("");

    try {
      const data = await apiFetch<{ invoice: Invoice }>(
        `/api/payments/invoices/${invoiceId}/create-payment-link`,
        {
          method: "POST"
        }
      );

      setSuccess("Card payment link created and emailed if the client has an email on file.");

      if (data.invoice.paymentLinkUrl) {
        window.open(data.invoice.paymentLinkUrl, "_blank");
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create payment link");
    }
  };

  const submitCashPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!cashInvoiceId) {
      setError("No invoice selected for cash payment.");
      return;
    }

    if (!cashPhotoDataUrl) {
      setError("Cash payments require a photo upload for admin approval.");
      return;
    }

    const invoice = invoices.find((item) => item.id === cashInvoiceId);

    if (!invoice) {
      setError("Invoice not found.");
      return;
    }

    try {
      await apiFetch("/api/pos/payments", {
        method: "POST",
        body: JSON.stringify({
          invoiceId: invoice.id,
          clientId: invoice.clientId || null,
          clientName: invoice.clientName,
          paymentMethod: "cash",
          amount: Number(cashAmount) || 0,
          salesTaxAmount: Number(cashSalesTax) || 0,
          totalCollected: Number(cashTotalCollected) || Number(cashAmount) || 0,
          cashPhotoDataUrl,
          notes: cashNotes
        })
      });

      setSuccess("Cash payment submitted for admin approval.");
      resetCashForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit cash payment");
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    const ok = window.confirm("Delete this invoice?");
    if (!ok) return;

    setError("");
    setSuccess("");

    try {
      await apiFetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE"
      });

      setSuccess("Invoice deleted.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete invoice");
    }
  };

  const selectedCashInvoice = invoices.find((invoice) => invoice.id === cashInvoiceId);

  return (
    <div className="pageGrid">
      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">
              {editingId ? "Edit Invoice" : "New Invoice"}
            </h2>
            <p className="brandSubtitle">
              Create invoices with subtotal, sales tax helper, total, card links, and cash proof.
            </p>
          </div>
        </div>

        {error && <div className="errorBox">{error}</div>}
        {success && <div className="listCard">{success}</div>}

        <form className="formGrid" onSubmit={submit}>
          <select
            className="textInput"
            value={clientId}
            onChange={(e) => handleClientSelect(e.target.value)}
          >
            <option value="">Select saved client optional</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.firstName} {client.lastName}
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
            placeholder="Job / service name"
            value={jobName}
            onChange={(e) => setJobName(e.target.value)}
          />

          <input
            className="textInput"
            placeholder="Subtotal before tax"
            inputMode="decimal"
            value={subtotal}
            onChange={(e) => setSubtotal(e.target.value)}
          />

          <input
            className="textInput"
            placeholder="Sales tax rate %"
            inputMode="decimal"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
          />

          <input
            className="textInput"
            placeholder="Sales tax amount"
            inputMode="decimal"
            value={salesTaxAmount}
            onChange={(e) => setSalesTaxAmount(e.target.value)}
          />

          <input
            className="textInput"
            placeholder="Invoice total"
            inputMode="decimal"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
          />

          <select
            className="textInput"
            value={status}
            onChange={(e) => setStatus(e.target.value as "paid" | "unpaid")}
          >
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
          </select>

          <div className="assignBox">
            <div className="assignTitle">Tax Helper</div>
            <div className="cardLine">
              Default rate is 6.5%. Subtotal × tax rate calculates the sales tax and invoice total.
            </div>
            <div className="cardLine">
              <strong>Subtotal:</strong> ${Number(subtotal || 0).toFixed(2)}
            </div>
            <div className="cardLine">
              <strong>Tax Rate:</strong> {Number(taxRate || 0).toFixed(2)}%
            </div>
            <div className="cardLine">
              <strong>Sales Tax:</strong> ${Number(salesTaxAmount || 0).toFixed(2)}
            </div>
            <div className="cardLine">
              <strong>Total:</strong> ${Number(total || 0).toFixed(2)}
            </div>
          </div>

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

      {cashInvoiceId && selectedCashInvoice && (
        <section className="panel">
          <div className="panelHeader">
            <div>
              <h2 className="panelTitle">Record Cash Payment</h2>
              <p className="brandSubtitle">
                Invoice #{selectedCashInvoice.invoiceNumber} • {selectedCashInvoice.clientName}
              </p>
            </div>

            <button className="secondaryButton" type="button" onClick={resetCashForm}>
              Close
            </button>
          </div>

          <form className="formGrid" onSubmit={submitCashPayment}>
            <input
              className="textInput"
              placeholder="Subtotal / invoice amount"
              inputMode="decimal"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
            />

            <input
              className="textInput"
              placeholder="Sales tax amount"
              inputMode="decimal"
              value={cashSalesTax}
              onChange={(e) => setCashSalesTax(e.target.value)}
            />

            <input
              className="textInput"
              placeholder="Total cash collected"
              inputMode="decimal"
              value={cashTotalCollected}
              onChange={(e) => setCashTotalCollected(e.target.value)}
            />

            <div className="assignBox">
              <div className="assignTitle">Cash Photo Proof Required</div>

              <input
                className="textInput"
                type="file"
                accept="image/*"
                onChange={(e) => handleCashPhoto(e.target.files?.[0])}
              />

              {cashPhotoDataUrl && (
                <div style={{ marginTop: 12 }}>
                  <img
                    src={cashPhotoDataUrl}
                    alt="Cash proof preview"
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
                    onClick={() => setCashPhotoDataUrl(null)}
                  >
                    Remove Photo
                  </button>
                </div>
              )}
            </div>

            <textarea
              className="textInput"
              placeholder="Cash notes"
              rows={4}
              value={cashNotes}
              onChange={(e) => setCashNotes(e.target.value)}
            />

            <button className="primaryButton" type="submit">
              Submit Cash For Admin Approval
            </button>
          </form>
        </section>
      )}

      <section className="panel">
        <div className="panelHeader">
          <h2 className="panelTitle">Invoices</h2>
        </div>

        {loading && <div className="listCard">Loading invoices...</div>}

        {!loading && (
          <div className="cardsGrid">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="quoteCard">
                <div className="quoteTopRow">
                  <div className="quoteNumber">Invoice #{invoice.invoiceNumber}</div>
                  <span className={`statusBadge status-${invoice.status}`}>
                    {invoice.status}
                  </span>
                </div>

                <div className="cardLine">
                  <strong>Client:</strong> {invoice.clientName}
                </div>

                <div className="cardLine">
                  <strong>Service:</strong> {invoice.jobName}
                </div>

                <div className="cardLine">
                  <strong>Subtotal:</strong> ${Number(invoice.subtotal ?? invoice.total ?? 0).toFixed(2)}
                </div>

                <div className="cardLine">
                  <strong>Tax Rate:</strong> {formatRate(invoice.taxRate ?? DEFAULT_TAX_RATE)}
                </div>

                <div className="cardLine">
                  <strong>Sales Tax:</strong> ${Number(invoice.salesTaxAmount ?? 0).toFixed(2)}
                </div>

                <div className="cardLine">
                  <strong>Total:</strong> ${invoice.total.toFixed(2)}
                </div>

                <div className="cardLine">
                  <strong>Payment:</strong> {invoice.paymentStatus || invoice.status}
                </div>

                {invoice.paymentLinkUrl && (
                  <div className="cardLine">
                    <strong>Payment Link:</strong>{" "}
                    <a href={invoice.paymentLinkUrl} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  </div>
                )}

                <div className="buttonRow">
                  <button className="secondaryButton" onClick={() => startEdit(invoice)}>
                    Edit
                  </button>

                  <button className="primaryButton" onClick={() => createPaymentLink(invoice.id)}>
                    Email / Open Card Link
                  </button>

                  <button className="secondaryButton" onClick={() => startCashPayment(invoice)}>
                    Record Cash
                  </button>

                  <button
                    className="secondaryButton"
                    onClick={() =>
                      alert("Tap To Pay will be added later through Stripe Terminal.")
                    }
                  >
                    Tap To Pay Future
                  </button>

                  <button className="secondaryButton" onClick={() => deleteInvoice(invoice.id)}>
                    Delete
                  </button>
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
