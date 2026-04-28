import React from "react";
import { apiFetch } from "../api";
import type { Employee, Expense, ExpenseReimbursementStatus } from "../types";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read receipt image."));
    };

    reader.onerror = () => reject(new Error("Could not read receipt image."));
    reader.readAsDataURL(file);
  });
}

const categories = [
  "Fuel",
  "Food",
  "Tools",
  "Equipment",
  "Chemicals",
  "Repairs",
  "Employee Reimbursement",
  "Office",
  "Marketing",
  "Other"
];

const statuses: ExpenseReimbursementStatus[] = [
  "not_reimbursed",
  "pending",
  "approved",
  "reimbursed"
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [employeeId, setEmployeeId] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState("Fuel");
  const [amount, setAmount] = React.useState("");
  const [expenseDate, setExpenseDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [vendor, setVendor] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [receiptDataUrl, setReceiptDataUrl] = React.useState<string | null>(null);
  const [reimbursementStatus, setReimbursementStatus] =
    React.useState<ExpenseReimbursementStatus>("not_reimbursed");
  const [receiptLoading, setReceiptLoading] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [expenseData, employeeData] = await Promise.all([
        apiFetch<{ expenses: Expense[] }>("/api/expenses"),
        apiFetch<{ employees: Employee[] }>("/api/employees")
      ]);

      setExpenses(expenseData.expenses);
      setEmployees(employeeData.employees);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load expenses");
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
    setCategory("Fuel");
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
    setExpenseDate(String(expense.expenseDate).slice(0, 10));
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
      setError("Receipt image is too large. Please upload a smaller image under about 1.8MB.");
      return;
    }

    try {
      setReceiptLoading(true);
      const dataUrl = await fileToDataUrl(file);
      setReceiptDataUrl(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load receipt.");
    } finally {
      setReceiptLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
      } else {
        await apiFetch("/api/expenses", {
          method: "POST",
          body: JSON.stringify(payload)
        });
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

    try {
      await apiFetch(`/api/expenses/${expenseId}`, {
        method: "DELETE"
      });

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete expense");
    }
  };

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const reimbursementTotal = expenses
    .filter((expense) => expense.reimbursementStatus !== "not_reimbursed")
    .reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="pageGrid">
      <section className="panel">
        <div className="panelHeader">
          <h2 className="panelTitle">{editingId ? "Edit Expense" : "New Expense"}</h2>
        </div>

        {error && <div className="errorBox">{error}</div>}

        <form className="formGrid" onSubmit={submit}>
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
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
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
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            <option value="">No employee attached</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.displayName}
              </option>
            ))}
          </select>

          <select
            className="textInput"
            value={reimbursementStatus}
            onChange={(e) => setReimbursementStatus(e.target.value as ExpenseReimbursementStatus)}
          >
            {statuses.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <textarea
            className="textInput"
            placeholder="Notes / reason for purchase"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="assignBox">
            <div className="assignTitle">Receipt Image Optional</div>

            <input
              className="textInput"
              type="file"
              accept="image/*"
              onChange={(e) => handleReceipt(e.target.files?.[0])}
            />

            {receiptLoading && <div className="chatMeta">Loading receipt...</div>}

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
        <div className="panelHeader">
          <h2 className="panelTitle">Expenses</h2>
        </div>

        <div className="statsGrid" style={{ marginBottom: 16 }}>
          <div className="statCard">
            <div className="statLabel">Total Expenses</div>
            <div className="statValue">${total.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Tracked Reimbursements</div>
            <div className="statValue">${reimbursementTotal.toFixed(2)}</div>
          </div>
        </div>

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

                <div className="cardLine"><strong>Category:</strong> {expense.category}</div>
                <div className="cardLine"><strong>Amount:</strong> ${expense.amount.toFixed(2)}</div>
                <div className="cardLine"><strong>Date:</strong> {new Date(expense.expenseDate).toLocaleDateString()}</div>
                <div className="cardLine"><strong>Vendor:</strong> {expense.vendor || "—"}</div>
                <div className="cardLine"><strong>Employee:</strong> {expense.employeeName || "—"}</div>
                <div className="cardLine"><strong>Notes:</strong> {expense.notes || "—"}</div>

                {expense.receiptDataUrl && (
                  <div style={{ marginTop: 12 }}>
                    <div className="cardLine"><strong>Receipt:</strong></div>

                    <a href={expense.receiptDataUrl} target="_blank" rel="noreferrer">
                      <img
                        src={expense.receiptDataUrl}
                        alt="Receipt"
                        style={{
                          width: "100%",
                          maxHeight: 220,
                          objectFit: "cover",
                          borderRadius: 14,
                          border: "1px solid var(--border)"
                        }}
                      />
                    </a>
                  </div>
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
