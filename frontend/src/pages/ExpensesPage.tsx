import React from "react";
import { apiFetch } from "../api";
import type { Employee, Expense, POSPayment } from "../types";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read file."));
    };

    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [posPayments, setPosPayments] = React.useState<POSPayment[]>([]);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [employeeId, setEmployeeId] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState("tools_equipment");
  const [amount, setAmount] = React.useState("");
  const [expenseDate, setExpenseDate] = React.useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [vendor, setVendor] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [receiptDataUrl, setReceiptDataUrl] = React.useState<string | null>(null);
  const [reimbursementStatus, setReimbursementStatus] = React.useState<
    "not_reimbursed" | "pending" | "approved" | "reimbursed"
  >("not_reimbursed");

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [expenseData, employeeData, posData] = await Promise.all([
        apiFetch<{ expenses: Expense[] }>("/api/expenses"),
        apiFetch<{ employees: Employee[] }>("/api/employees"),
        apiFetch<{ payments: POSPayment[] }>("/api/pos/payments")
      ]);

      setExpenses(expenseData.expenses);
      setEmployees(employeeData.employees);
      setPosPayments(posData.payments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookkeeping data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setEditingId(null);
    setEmployeeId("");
    setTitle("");
    setCategory("tools_equipment");
    setAmount("");
    setExpenseDate(new Date().toISOString().slice(0, 10));
    setVendor("");
    setNotes("");
    setReceiptDataUrl(null);
    setReimbursementStatus("not_reimbursed");
  };

  const startEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setEmployeeId(expense.employeeId || "");
    setTitle(expense.title);
    setCategory(expense.category);
    setAmount(String(expense.amount));
    setExpenseDate(expense.expenseDate ? String(expense.expenseDate).slice(0, 10) : "");
    setVendor(expense.vendor || "");
    setNotes(expense.notes || "");
    setReceiptDataUrl(expense.receiptDataUrl || null);
    setReimbursementStatus(expense.reimbursementStatus);
  };

  const handleReceipt = async (file?: File) => {
    setError("");

    if (!file) {
      setReceiptDataUrl(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    if (file.size > 1_800_000) {
      setError("Receipt image is too large. Please upload an image under about 1.8MB.");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setReceiptDataUrl(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load receipt image.");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Expense title is required.");
      return;
    }

    const payload = {
      employeeId: employeeId || null,
      title,
      category,
      amount: Number(amount) || 0,
      expenseDate,
      vendor,
      notes,
      receiptDataUrl,
      reimbursementStatus
    };

    try {
      if (editingId) {
        await apiFetch(`/api/expenses/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });

        setSuccess("Expense updated.");
      } else {
        await apiFetch("/api/expenses", {
          method: "POST",
          body: JSON.stringify(payload)
        });

        setSuccess("Expense added.");
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save expense");
    }
  };

  const deleteExpense = async (expenseId: string) => {
    const ok = window.confirm("Delete this expense?");
    if (!ok) return;

    setError("");
    setSuccess("");

    try {
      await apiFetch(`/api/expenses/${expenseId}`, {
        method: "DELETE"
      });

      setSuccess("Expense deleted.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete expense");
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const pendingReimbursements = expenses
    .filter((expense) => expense.reimbursementStatus === "pending")
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const approvedReimbursements = expenses
    .filter((expense) => expense.reimbursementStatus === "approved")
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const reimbursedTotal = expenses
    .filter((expense) => expense.reimbursementStatus === "reimbursed")
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const paidPosPayments = posPayments.filter(
    (payment) => payment.status === "paid" || payment.status === "approved"
  );

  const posCollectedTotal = paidPosPayments.reduce(
    (sum, payment) => sum + Number(payment.totalCollected || 0),
    0
  );

  const posSubtotalTotal = paidPosPayments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

  const salesTaxTrackedTotal = paidPosPayments.reduce(
    (sum, payment) => sum + Number(payment.salesTaxAmount || 0),
    0
  );

  const pendingCashApprovalTotal = posPayments
    .filter((payment) => payment.status === "pending_admin_approval")
    .reduce((sum, payment) => sum + Number(payment.totalCollected || 0), 0);

  const cardCollectedTotal = paidPosPayments
    .filter((payment) => payment.paymentMethod === "card_link")
    .reduce((sum, payment) => sum + Number(payment.totalCollected || 0), 0);

  const cashCollectedTotal = paidPosPayments
    .filter((payment) => payment.paymentMethod === "cash")
    .reduce((sum, payment) => sum + Number(payment.totalCollected || 0), 0);

  const estimatedNetBeforePayroll = posCollectedTotal - salesTaxTrackedTotal - totalExpenses;

  const categoryTotals = expenses.reduce<Record<string, number>>((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount || 0);
    return acc;
  }, {});

  return (
    <div className="pageGrid">
      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Bookkeeping</h2>
            <p className="brandSubtitle">
              Track expenses, reimbursements, POS collections, sales tax, cash flow, and profit/loss basics.
            </p>
          </div>
        </div>

        {error && <div className="errorBox">{error}</div>}
        {success && <div className="listCard">{success}</div>}

        <div className="statsGrid">
          <div className="statCard">
            <div className="statLabel">POS Collected</div>
            <div className="statValue">${posCollectedTotal.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">POS Subtotal</div>
            <div className="statValue">${posSubtotalTotal.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Sales Tax Tracked</div>
            <div className="statValue">${salesTaxTrackedTotal.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Card Collected</div>
            <div className="statValue">${cardCollectedTotal.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Cash Approved</div>
            <div className="statValue">${cashCollectedTotal.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Pending Cash Approval</div>
            <div className="statValue">${pendingCashApprovalTotal.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Total Expenses</div>
            <div className="statValue">${totalExpenses.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Est. Net Before Payroll</div>
            <div className="statValue">${estimatedNetBeforePayroll.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Pending Reimbursements</div>
            <div className="statValue">${pendingReimbursements.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Approved Reimbursements</div>
            <div className="statValue">${approvedReimbursements.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Reimbursed Total</div>
            <div className="statValue">${reimbursedTotal.toFixed(2)}</div>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="panelTitle">
          {editingId ? "Edit Expense" : "Add Expense"}
        </h2>

        <form className="formGrid" onSubmit={submit}>
          <select
            className="textInput"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            <option value="">Company expense / no employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.displayName} - {employee.role}
              </option>
            ))}
          </select>

          <input
            className="textInput"
            placeholder="Expense title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <select
            className="textInput"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="tools_equipment">Tools / Equipment</option>
            <option value="chemicals">Chemicals</option>
            <option value="fuel">Fuel</option>
            <option value="food">Food</option>
            <option value="employee_reimbursement">Employee Reimbursement</option>
            <option value="vehicle">Vehicle</option>
            <option value="marketing">Marketing</option>
            <option value="software">Software</option>
            <option value="insurance">Insurance</option>
            <option value="other">Other</option>
          </select>

          <input
            className="textInput"
            placeholder="Amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <input
            className="textInput"
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
          />

          <input
            className="textInput"
            placeholder="Vendor / store optional"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
          />

          <select
            className="textInput"
            value={reimbursementStatus}
            onChange={(e) =>
              setReimbursementStatus(
                e.target.value as "not_reimbursed" | "pending" | "approved" | "reimbursed"
              )
            }
          >
            <option value="not_reimbursed">Not Reimbursed</option>
            <option value="pending">Pending Reimbursement</option>
            <option value="approved">Approved Reimbursement</option>
            <option value="reimbursed">Reimbursed</option>
          </select>

          <textarea
            className="textInput"
            placeholder="Notes / reason for purchase"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="assignBox">
            <div className="assignTitle">Receipt Photo Optional</div>

            <input
              className="textInput"
              type="file"
              accept="image/*"
              onChange={(e) => handleReceipt(e.target.files?.[0])}
            />

            {receiptDataUrl && (
              <div style={{ marginTop: 12 }}>
                <img
                  src={receiptDataUrl}
                  alt="Receipt preview"
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
                  onClick={() => setReceiptDataUrl(null)}
                >
                  Remove Receipt
                </button>
              </div>
            )}
          </div>

          <div className="buttonRow">
            <button className="primaryButton" type="submit">
              {editingId ? "Save Expense" : "Add Expense"}
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
        <h2 className="panelTitle">Expense Category Summary</h2>

        <div className="cardsGrid">
          {Object.entries(categoryTotals).map(([categoryName, total]) => (
            <div key={categoryName} className="quoteCard">
              <div className="quoteNumber">{categoryName.replaceAll("_", " ")}</div>
              <div className="cardLine">
                <strong>Total:</strong> ${total.toFixed(2)}
              </div>
            </div>
          ))}

          {Object.keys(categoryTotals).length === 0 && (
            <div className="listCard">No expense categories yet.</div>
          )}
        </div>
      </section>

      <section className="panel">
        <h2 className="panelTitle">Recent POS Collections</h2>

        <div className="cardsGrid">
          {posPayments.slice(0, 8).map((payment) => (
            <div key={payment.id} className="quoteCard">
              <div className="quoteTopRow">
                <div className="quoteNumber">{payment.clientName}</div>
                <span className={`statusBadge status-${payment.status}`}>
                  {payment.status}
                </span>
              </div>

              <div className="cardLine">
                <strong>Method:</strong>{" "}
                {payment.paymentMethod === "card_link"
                  ? "Card Link"
                  : payment.paymentMethod === "tap_to_pay"
                    ? "Tap To Pay"
                    : "Cash"}
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
                <strong>Created:</strong>{" "}
                {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : "—"}
              </div>
            </div>
          ))}

          {posPayments.length === 0 && (
            <div className="listCard">No POS collections yet.</div>
          )}
        </div>
      </section>

      <section className="panel">
        <h2 className="panelTitle">Expenses</h2>

        {loading && <div className="listCard">Loading expenses...</div>}

        {!loading && (
          <div className="cardsGrid">
            {expenses.map((expense) => (
              <div key={expense.id} className="quoteCard">
                <div className="quoteTopRow">
                  <div className="quoteNumber">{expense.title}</div>
                  <span className={`statusBadge status-${expense.reimbursementStatus}`}>
                    {expense.reimbursementStatus}
                  </span>
                </div>

                <div className="cardLine">
                  <strong>Category:</strong> {expense.category}
                </div>

                <div className="cardLine">
                  <strong>Amount:</strong> ${expense.amount.toFixed(2)}
                </div>

                <div className="cardLine">
                  <strong>Date:</strong>{" "}
                  {expense.expenseDate
                    ? new Date(expense.expenseDate).toLocaleDateString()
                    : "—"}
                </div>

                <div className="cardLine">
                  <strong>Employee:</strong> {expense.employeeName || "Company"}
                </div>

                <div className="cardLine">
                  <strong>Vendor:</strong> {expense.vendor || "—"}
                </div>

                <div className="cardLine">
                  <strong>Notes:</strong> {expense.notes || "—"}
                </div>

                {expense.receiptDataUrl && (
                  <img
                    src={expense.receiptDataUrl}
                    alt="Receipt"
                    style={{
                      width: "100%",
                      maxHeight: 260,
                      objectFit: "cover",
                      borderRadius: 14,
                      border: "1px solid var(--border)",
                      marginTop: 12
                    }}
                  />
                )}

                <div className="buttonRow">
                  <button className="secondaryButton" onClick={() => startEdit(expense)}>
                    Edit
                  </button>

                  <button className="secondaryButton" onClick={() => deleteExpense(expense.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {expenses.length === 0 && (
              <div className="listCard">No expenses yet.</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
