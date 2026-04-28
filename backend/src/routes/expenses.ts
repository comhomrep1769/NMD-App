import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, requireRole("admin"), async (_req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        e.id,
        e.employee_id,
        u.display_name AS employee_name,
        e.title,
        e.category,
        e.amount,
        e.expense_date,
        e.vendor,
        e.notes,
        e.receipt_data_url,
        e.reimbursement_status,
        e.created_by,
        e.created_at
      FROM expenses e
      LEFT JOIN users u ON u.id = e.employee_id
      ORDER BY e.expense_date DESC, e.created_at DESC
      `
    );

    return res.json({
      expenses: result.rows.map((row) => ({
        id: row.id,
        employeeId: row.employee_id,
        employeeName: row.employee_name,
        title: row.title,
        category: row.category,
        amount: Number(row.amount),
        expenseDate: row.expense_date,
        vendor: row.vendor,
        notes: row.notes,
        receiptDataUrl: row.receipt_data_url,
        reimbursementStatus: row.reimbursement_status,
        createdBy: row.created_by,
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    console.error("expenses list error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const {
      employeeId,
      title,
      category,
      amount,
      expenseDate,
      vendor,
      notes,
      receiptDataUrl,
      reimbursementStatus
    } = req.body as {
      employeeId?: string | null;
      title?: string;
      category?: string;
      amount?: number;
      expenseDate?: string;
      vendor?: string;
      notes?: string;
      receiptDataUrl?: string | null;
      reimbursementStatus?: "not_reimbursed" | "pending" | "approved" | "reimbursed";
    };

    if (!title) {
      return res.status(400).json({ error: "Expense title is required" });
    }

    if (receiptDataUrl && receiptDataUrl.length > 2_500_000) {
      return res.status(400).json({
        error: "Receipt image is too large. Please upload a smaller image."
      });
    }

    const result = await pool.query(
      `
      INSERT INTO expenses
        (
          employee_id,
          title,
          category,
          amount,
          expense_date,
          vendor,
          notes,
          receipt_data_url,
          reimbursement_status,
          created_by
        )
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
      `,
      [
        employeeId || null,
        title.trim(),
        category?.trim() || "Other",
        amount || 0,
        expenseDate || new Date().toISOString().slice(0, 10),
        vendor?.trim() || null,
        notes?.trim() || null,
        receiptDataUrl || null,
        reimbursementStatus || "not_reimbursed",
        req.user!.id
      ]
    );

    return res.status(201).json({ expense: result.rows[0] });
  } catch (error) {
    console.error("expense create error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:expenseId", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { expenseId } = req.params;

    const {
      employeeId,
      title,
      category,
      amount,
      expenseDate,
      vendor,
      notes,
      receiptDataUrl,
      reimbursementStatus
    } = req.body as {
      employeeId?: string | null;
      title?: string;
      category?: string;
      amount?: number;
      expenseDate?: string;
      vendor?: string;
      notes?: string;
      receiptDataUrl?: string | null;
      reimbursementStatus?: "not_reimbursed" | "pending" | "approved" | "reimbursed";
    };

    const result = await pool.query(
      `
      UPDATE expenses
      SET
        employee_id = $2,
        title = COALESCE($3, title),
        category = COALESCE($4, category),
        amount = COALESCE($5, amount),
        expense_date = COALESCE($6, expense_date),
        vendor = $7,
        notes = $8,
        receipt_data_url = COALESCE($9, receipt_data_url),
        reimbursement_status = COALESCE($10, reimbursement_status)
      WHERE id = $1
      RETURNING *
      `,
      [
        expenseId,
        employeeId || null,
        title ?? null,
        category ?? null,
        amount ?? null,
        expenseDate ?? null,
        vendor ?? null,
        notes ?? null,
        receiptDataUrl ?? null,
        reimbursementStatus ?? null
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    return res.json({ expense: result.rows[0] });
  } catch (error) {
    console.error("expense update error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:expenseId", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { expenseId } = req.params;

    const result = await pool.query(
      `DELETE FROM expenses WHERE id = $1 RETURNING id`,
      [expenseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    return res.json({ deleted: true });
  } catch (error) {
    console.error("expense delete error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
