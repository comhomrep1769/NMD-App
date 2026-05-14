import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

function mapPayment(row: any) {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    clientId: row.client_id,
    clientName: row.client_name,
    collectedBy: row.collected_by,
    collectedByName: row.collected_by_name,
    paymentMethod: row.payment_method,
    amount: Number(row.amount || 0),
    salesTaxAmount: Number(row.sales_tax_amount || 0),
    totalCollected: Number(row.total_collected || 0),
    status: row.status,
    cashPhotoDataUrl: row.cash_photo_data_url,
    notes: row.notes,
    approvedBy: row.approved_by,
    approvedByName: row.approved_by_name,
    approvedAt: row.approved_at,
    createdAt: row.created_at
  };
}

router.get("/me", requireAuth, requireRole("employee", "admin"), async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        p.*,
        collected.display_name AS collected_by_name,
        approved.display_name AS approved_by_name
      FROM pos_payments p
      LEFT JOIN users collected ON collected.id = p.collected_by
      LEFT JOIN users approved ON approved.id = p.approved_by
      WHERE p.collected_by = $1
      ORDER BY p.created_at DESC
      `,
      [req.user!.id]
    );

    const payments = result.rows.map(mapPayment);

    const pendingCash = payments.filter(
      (payment) => payment.paymentMethod === "cash" && payment.status === "pending_admin_approval"
    );

    const approvedCash = payments.filter(
      (payment) =>
        payment.paymentMethod === "cash" &&
        (payment.status === "approved" || payment.status === "paid")
    );

    const rejectedCash = payments.filter(
      (payment) => payment.paymentMethod === "cash" && payment.status === "rejected"
    );

    const cardRecords = payments.filter(
      (payment) => payment.paymentMethod === "card_link"
    );

    const approvedPayments = payments.filter(
      (payment) => payment.status === "approved" || payment.status === "paid"
    );

    const summary = {
      totalSubmitted: payments.length,
      pendingCashCount: pendingCash.length,
      approvedCashCount: approvedCash.length,
      rejectedCashCount: rejectedCash.length,
      cardRecordCount: cardRecords.length,

      pendingCashTotal: pendingCash.reduce((sum, payment) => sum + payment.totalCollected, 0),
      approvedCashTotal: approvedCash.reduce((sum, payment) => sum + payment.totalCollected, 0),
      rejectedCashTotal: rejectedCash.reduce((sum, payment) => sum + payment.totalCollected, 0),

      approvedCollectedTotal: approvedPayments.reduce(
        (sum, payment) => sum + payment.totalCollected,
        0
      ),
      approvedSubtotalTotal: approvedPayments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      ),
      approvedSalesTaxTotal: approvedPayments.reduce(
        (sum, payment) => sum + payment.salesTaxAmount,
        0
      ),

      cardTotal: cardRecords
        .filter((payment) => payment.status === "approved" || payment.status === "paid")
        .reduce((sum, payment) => sum + payment.totalCollected, 0),

      cashTotal: approvedCash.reduce((sum, payment) => sum + payment.totalCollected, 0)
    };

    return res.json({
      payments,
      summary
    });
  } catch (error) {
    console.error("ledger me error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/employee-pos-summary", requireAuth, requireRole("admin"), async (_req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        u.id AS employee_id,
        u.display_name AS employee_name,
        u.email AS employee_email,

        COUNT(p.id)::int AS total_records,

        COALESCE(SUM(CASE
          WHEN p.status IN ('approved', 'paid') THEN p.total_collected
          ELSE 0
        END), 0) AS approved_collected_total,

        COALESCE(SUM(CASE
          WHEN p.status IN ('approved', 'paid') THEN p.amount
          ELSE 0
        END), 0) AS approved_subtotal_total,

        COALESCE(SUM(CASE
          WHEN p.status IN ('approved', 'paid') THEN p.sales_tax_amount
          ELSE 0
        END), 0) AS approved_sales_tax_total,

        COALESCE(SUM(CASE
          WHEN p.payment_method = 'cash'
            AND p.status = 'pending_admin_approval'
          THEN p.total_collected
          ELSE 0
        END), 0) AS pending_cash_total,

        COUNT(CASE
          WHEN p.payment_method = 'cash'
            AND p.status = 'pending_admin_approval'
          THEN 1
        END)::int AS pending_cash_count,

        COALESCE(SUM(CASE
          WHEN p.payment_method = 'cash'
            AND p.status IN ('approved', 'paid')
          THEN p.total_collected
          ELSE 0
        END), 0) AS approved_cash_total,

        COUNT(CASE
          WHEN p.payment_method = 'cash'
            AND p.status IN ('approved', 'paid')
          THEN 1
        END)::int AS approved_cash_count,

        COUNT(CASE
          WHEN p.payment_method = 'cash'
            AND p.status = 'rejected'
          THEN 1
        END)::int AS rejected_cash_count,

        COALESCE(SUM(CASE
          WHEN p.payment_method = 'card_link'
            AND p.status IN ('approved', 'paid')
          THEN p.total_collected
          ELSE 0
        END), 0) AS card_collected_total

      FROM users u
      LEFT JOIN pos_payments p ON p.collected_by = u.id
      WHERE u.role IN ('employee', 'admin')
      GROUP BY u.id, u.display_name, u.email
      ORDER BY approved_collected_total DESC, u.display_name ASC
      `
    );

    return res.json({
      employees: result.rows.map((row) => ({
        employeeId: row.employee_id,
        employeeName: row.employee_name,
        employeeEmail: row.employee_email,
        totalRecords: Number(row.total_records || 0),
        approvedCollectedTotal: Number(row.approved_collected_total || 0),
        approvedSubtotalTotal: Number(row.approved_subtotal_total || 0),
        approvedSalesTaxTotal: Number(row.approved_sales_tax_total || 0),
        pendingCashTotal: Number(row.pending_cash_total || 0),
        pendingCashCount: Number(row.pending_cash_count || 0),
        approvedCashTotal: Number(row.approved_cash_total || 0),
        approvedCashCount: Number(row.approved_cash_count || 0),
        rejectedCashCount: Number(row.rejected_cash_count || 0),
        cardCollectedTotal: Number(row.card_collected_total || 0)
      }))
    });
  } catch (error) {
    console.error("employee pos summary error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
