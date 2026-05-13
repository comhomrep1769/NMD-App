import React from "react";
import { apiFetch } from "../api";
import type { Invoice, POSPayment, POSPaymentMethod, Role } from "../types";

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

function methodLabel(method: POSPaymentMethod) {
  if (method === "card_link") return "Card Payment Link";
  if (method === "tap_to_pay") return "Tap To Pay";
  return "Cash";
}

function statusLabel(status: string) {
  if (status === "pending_admin_approval") return "Pending Admin Approval";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  if (status === "paid") return "Paid";
  if (status === "cancelled") return "Cancelled";
  return "Pending";
}

export default function POSPage({ role }: { role: Role }) {
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [payments, setPayments] = React.useState<POSPayment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const [filter, setFilter] = React.useState<"all" | "pending" | "approved" | "rejected">("all");

  const [invoiceId, setInvoiceId] = React.useState("");
  const [clientId, setClientId] = React.useState("");
  const [clientName, setClientName] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<POSPaymentMethod>("card_link");
  const [amount, setAmount] = React.useState("");
  const [salesTaxAmount, setSalesTaxAmount] = React.useState("");
  const [totalCollected, setTotalCollected] = React.useState("");
  const [cashPhotoDataUrl, setCashPhotoDataUrl] = React.useState<string | null>(null);
  const [notes, setNotes] = React.useState("");

  const loadData = React.useCallback(async () => {
    setError("");

    try {
      const invoiceData = await apiFetch<{ invoices: Invoice[] }>("/api/invoices");
      setInvoices(invoiceData.invoices);

      if (role === "admin") {
        const paymentData = await apiFetch<{ payments: POSPayment[] }>("/api/pos/payments");
        setPayments(paymentData.payments);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed loading POS data");
    } finally {
      setLoading(false);
    }
  }, [role]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setInvoiceId("");
    setClientId("");
    setClientName("");
    setPaymentMethod("card_link");
    setAmount("");
    setSalesTaxAmount("");
    setTotalCollected("");
    setCashPhotoDataUrl(null);
    setNotes("");
  };

  const selectInvoice = (value: string) => {
    setInvoiceId(value);

    const invoice = invoices.find((item) => item.id === value);

    if (invoice) {
      setClientId(invoice.clientId || "");
      setClientName(invoice.clientName);
      setAmount(String(invoice.total || 0));
      setSalesTaxAmount("0");
      setTotalCollected(String(invoice.total || 0));
      setNotes(`Invoice #${invoice.invoiceNumber} - ${invoice.jobName}`);
    }
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

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!clientName.trim()) {
      setError("Client name is required.");
      return;
    }

    if (paymentMethod === "cash" && !cashPhotoDataUrl) {
      setError("Cash payments require a photo upload for admin approval.");
      return;
    }

    if (paymentMethod === "tap_to_pay") {
      setError("Tap To Pay is a future Stripe Terminal feature. Use Card Payment Link or Cash for now.");
      return;
    }

    try {
      setSaving(true);

      await apiFetch("/api/pos/payments", {
        method: "POST",
        body: JSON.stringify({
          invoiceId: invoiceId || null,
          clientId: clientId || null,
          clientName,
          paymentMethod,
          amount: Number(amount) || 0,
          salesTaxAmount: Number(salesTaxAmount) || 0,
          totalCollected: Number(totalCollected) || Number(amount) || 0,
          cashPhotoDataUrl,
          notes
        })
      });

      setSuccess(
        paymentMethod === "cash"
          ? "Cash payment submitted for admin approval."
          : "POS payment record created."
      );

      resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed creating POS payment");
    } finally {
      setSaving(false);
    }
  };

  const approvePayment = async (paymentId: string) => {
    const ok = window.confirm("Approve this payment and mark the attached invoice paid if connected?");
    if (!ok) return;

    setError("");
    setSuccess("");

    try {
      await apiFetch(`/api/pos/payments/${paymentId}/approve`, {
        method: "PATCH"
      });

      setSuccess("Payment approved. Linked invoice marked paid if attached.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed approving payment");
    }
  };

  const rejectPayment = async (paymentId: string) => {
    const reason = window.prompt("Reason for rejection optional:");

    setError("");
    setSuccess("");

    try {
      await apiFetch(`/api/pos/payments/${paymentId}/reject`, {
        method: "PATCH",
        body: JSON.stringify({
          notes: reason || undefined
        })
      });

      setSuccess("Payment rejected.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed rejecting payment");
    }
  };

  const createCardLink = async () => {
    setError("");
    setSuccess("");

    if (!invoiceId) {
      setError("Select an invoice first to create/send a card payment link.");
      return;
    }

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
      setError(err instanceof Error ? err.message : "Failed creating payment link");
    }
  };

  const pendingCash = payments.filter((payment) => payment.status === "pending_admin_approval");
  const approvedPayments = payments.filter(
    (payment) => payment.status === "approved" || payment.status === "paid"
  );
  const rejectedPayments = payments.filter((payment) => payment.status === "rejected");

  const approvedTotal = approvedPayments.reduce((sum, payment) => sum + payment.totalCollected, 0);
  const pendingTotal = pendingCash.reduce((sum, payment) => sum + payment.totalCollected, 0);
  const taxTrackedTotal = payments.reduce((sum, payment) => sum + payment.salesTaxAmount, 0);

  const filteredPayments = payments.filter((payment) => {
    if (filter === "pending") return payment.status === "pending_admin_approval";
    if (filter === "approved") return payment.status === "approved" || payment.status === "paid";
    if (filter === "rejected") return payment.status === "rejected";
    return true;
  });

  if (loading) {
    return (
      <section className="panel">
        <h2 className="panelTitle">Payments / POS</h2>
        <div className="listCard">Loading POS...</div>
      </section>
    );
  }

  return (
    <div className="pageGrid">
      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Payments / POS</h2>
            <p className="brandSubtitle">
              Collect payment by card link, future Tap To Pay, or cash with photo proof.
            </p>
          </div>
        </div>

        {error && <div className="errorBox">{error}</div>}
        {success && <div className="listCard">{success}</div>}

        {role === "admin" && (
          <div className="statsGrid" style={{ marginBottom: 16 }}>
            <div className="statCard">
              <div className="statLabel">Pending Cash Approval</div>
              <div className="statValue">{pendingCash.length}</div>
            </div>

            <div className="statCard">
              <div className="statLabel">Pending Cash Total</div>
              <div className="statValue">${pendingTotal.toFixed(2)}</div>
            </div>

            <div className="statCard">
              <div className="statLabel">Approved POS Collected</div>
              <div className="statValue">${approvedTotal.toFixed(2)}</div>
            </div>

            <div className="statCard">
              <div className="statLabel">Sales Tax Tracked</div>
              <div className="statValue">${taxTrackedTotal.toFixed(2)}</div>
            </div>

            <div className="statCard">
              <div className="statLabel">Rejected Records</div>
              <div className="statValue">{rejectedPayments.length}</div>
            </div>

            <div className="statCard">
              <div className="statLabel">Tap To Pay</div>
              <div className="statValue">Future</div>
            </div>
          </div>
        )}

        <form className="formGrid" onSubmit={submitPayment}>
          <select
            className="textInput"
            value={invoiceId}
            onChange={(e) => selectInvoice(e.target.value)}
          >
            <option value="">Select invoice optional</option>
            {invoices.map((invoice) => (
              <option key={invoice.id} value={invoice.id}>
                Invoice #{invoice.invoiceNumber} - {invoice.clientName} - ${invoice.total.toFixed(2)}
              </option>
            ))}
          </select>

          <input
            className="textInput"
            placeholder="Client name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />

          <select
            className="textInput"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as POSPaymentMethod)}
          >
            <option value="card_link">Card Payment Link</option>
            <option value="tap_to_pay">Tap To Pay Future</option>
            <option value="cash">Cash</option>
          </select>

          <input
            className="textInput"
            placeholder="Subtotal / invoice amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
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
            placeholder="Total collected"
            inputMode="decimal"
            value={totalCollected}
            onChange={(e) => setTotalCollected(e.target.value)}
          />

          {paymentMethod === "cash" && (
            <div className="assignBox">
              <div className="assignTitle">Cash Photo Proof Required</div>
              <div className="cardLine">
                Employees must upload a photo of the cash collected. Admin approval is required before the invoice is marked paid.
              </div>

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
          )}

          {paymentMethod === "tap_to_pay" && (
            <div className="listCard">
              Tap To Pay will be connected later through Stripe Terminal. For now, use Card Payment Link or Cash.
            </div>
          )}

          <textarea
            className="textInput"
            placeholder="Notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="buttonRow">
            {paymentMethod === "card_link" && (
              <button className="primaryButton" type="button" onClick={createCardLink}>
                Email / Open Card Payment Link
              </button>
            )}

            <button className="primaryButton" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Record POS Payment"}
            </button>
          </div>
        </form>
      </section>

      {role === "admin" && (
        <section className="panel">
          <div className="panelHeader">
            <div>
              <h2 className="panelTitle">POS Approval Dashboard</h2>
              <p className="brandSubtitle">
                Review cash proof, approve payments, reject incorrect submissions, and track sales tax.
              </p>
            </div>
          </div>

          <div className="buttonRow" style={{ marginBottom: 16 }}>
            <button
              className={filter === "all" ? "primaryButton" : "secondaryButton"}
              type="button"
              onClick={() => setFilter("all")}
            >
              All
            </button>

            <button
              className={filter === "pending" ? "primaryButton" : "secondaryButton"}
              type="button"
              onClick={() => setFilter("pending")}
            >
              Pending Approval
            </button>

            <button
              className={filter === "approved" ? "primaryButton" : "secondaryButton"}
              type="button"
              onClick={() => setFilter("approved")}
            >
              Approved / Paid
            </button>

            <button
              className={filter === "rejected" ? "primaryButton" : "secondaryButton"}
              type="button"
              onClick={() => setFilter("rejected")}
            >
              Rejected
            </button>
          </div>

          <div className="cardsGrid">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="quoteCard">
                <div className="quoteTopRow">
                  <div className="quoteNumber">{payment.clientName}</div>
                  <span className={`statusBadge status-${payment.status}`}>
                    {statusLabel(payment.status)}
                  </span>
                </div>

                <div className="cardLine">
                  <strong>Method:</strong> {methodLabel(payment.paymentMethod)}
                </div>

                <div className="cardLine">
                  <strong>Subtotal:</strong> ${payment.amount.toFixed(2)}
                </div>

                <div className="cardLine">
                  <strong>Sales Tax:</strong> ${payment.salesTaxAmount.toFixed(2)}
                </div>

                <div className="cardLine">
                  <strong>Total:</strong> ${payment.totalCollected.toFixed(2)}
                </div>

                <div className="cardLine">
                  <strong>Collected By:</strong> {payment.collectedByName || "—"}
                </div>

                <div className="cardLine">
                  <strong>Submitted:</strong>{" "}
                  {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : "—"}
                </div>

                <div className="cardLine">
                  <strong>Approved By:</strong> {payment.approvedByName || "—"}
                </div>

                <div className="cardLine">
                  <strong>Approved At:</strong>{" "}
                  {payment.approvedAt ? new Date(payment.approvedAt).toLocaleString() : "—"}
                </div>

                <div className="cardLine">
                  <strong>Notes:</strong> {payment.notes || "—"}
                </div>

                {payment.cashPhotoDataUrl && (
                  <div style={{ marginTop: 12 }}>
                    <div className="assignTitle">Cash Proof</div>
                    <img
                      src={payment.cashPhotoDataUrl}
                      alt="Cash proof"
                      style={{
                        width: "100%",
                        maxHeight: 320,
                        objectFit: "cover",
                        borderRadius: 14,
                        border: "1px solid var(--border)",
                        marginTop: 8
                      }}
                    />
                  </div>
                )}

                {payment.status === "pending_admin_approval" && (
                  <div className="buttonRow" style={{ marginTop: 12 }}>
                    <button
                      className="primaryButton"
                      onClick={() => approvePayment(payment.id)}
                    >
                      Approve Cash
                    </button>

                    <button
                      className="secondaryButton"
                      onClick={() => rejectPayment(payment.id)}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}

            {filteredPayments.length === 0 && (
              <div className="listCard">No POS payment records for this filter.</div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
