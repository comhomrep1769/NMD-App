import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
const router = Router();
router.get("/admin", requireAuth, requireRole("admin"), async (_req, res) => {
    try {
        const [clientsResult, quotesResult, invoicesResult, requestsResult, expensesResult, mileageResult, recurringResult, payrollResult] = await Promise.all([
            pool.query(`SELECT COUNT(*)::int AS total FROM clients`),
            pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'accepted')::int AS accepted,
          COUNT(*) FILTER (WHERE status = 'sent')::int AS sent,
          COUNT(*) FILTER (WHERE status = 'draft')::int AS draft
        FROM quotes
      `),
            pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'paid')::int AS paid_count,
          COUNT(*) FILTER (WHERE status = 'unpaid')::int AS unpaid_count,
          COALESCE(SUM(total) FILTER (WHERE status = 'paid'), 0)::numeric AS paid_total,
          COALESCE(SUM(total) FILTER (WHERE status = 'unpaid'), 0)::numeric AS unpaid_total
        FROM invoices
      `),
            pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
          COUNT(*) FILTER (WHERE status = 'reviewed')::int AS reviewed,
          COUNT(*) FILTER (WHERE status = 'scheduled')::int AS scheduled,
          COUNT(*) FILTER (WHERE status = 'declined')::int AS declined
        FROM service_requests
      `),
            pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COALESCE(SUM(amount), 0)::numeric AS total_amount,
          COALESCE(SUM(amount) FILTER (WHERE reimbursement_status IN ('pending', 'approved')), 0)::numeric AS reimbursement_pending
        FROM expenses
      `),
            pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COALESCE(SUM(miles_driven), 0)::numeric AS total_miles,
          COALESCE(SUM(reimbursement_total), 0)::numeric AS reimbursement_total,
          COALESCE(SUM(reimbursement_total) FILTER (WHERE reimbursement_status = 'pending'), 0)::numeric AS pending_reimbursement
        FROM mileage_logs
      `),
            pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'active')::int AS active,
          COALESCE(
            SUM(
              CASE
                WHEN status <> 'active' THEN 0
                WHEN frequency = 'weekly' THEN price * 4
                WHEN frequency = 'biweekly' THEN price * 2
                WHEN frequency = 'monthly' THEN price
                WHEN frequency = 'quarterly' THEN price / 3
                ELSE 0
              END
            ),
            0
          )::numeric AS estimated_monthly_revenue
        FROM recurring_services
      `),
            pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'draft')::int AS draft,
          COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
          COUNT(*) FILTER (WHERE status = 'paid_in_roll')::int AS paid_in_roll
        FROM pay_runs
      `)
        ]);
        const invoices = invoicesResult.rows[0];
        return res.json({
            dashboard: {
                clients: {
                    total: clientsResult.rows[0].total
                },
                quotes: {
                    total: quotesResult.rows[0].total,
                    accepted: quotesResult.rows[0].accepted,
                    sent: quotesResult.rows[0].sent,
                    draft: quotesResult.rows[0].draft
                },
                invoices: {
                    total: invoices.total,
                    paidCount: invoices.paid_count,
                    unpaidCount: invoices.unpaid_count,
                    paidTotal: Number(invoices.paid_total),
                    unpaidTotal: Number(invoices.unpaid_total)
                },
                requests: {
                    total: requestsResult.rows[0].total,
                    pending: requestsResult.rows[0].pending,
                    reviewed: requestsResult.rows[0].reviewed,
                    scheduled: requestsResult.rows[0].scheduled,
                    declined: requestsResult.rows[0].declined
                },
                expenses: {
                    total: expensesResult.rows[0].total,
                    totalAmount: Number(expensesResult.rows[0].total_amount),
                    reimbursementPending: Number(expensesResult.rows[0].reimbursement_pending)
                },
                mileage: {
                    total: mileageResult.rows[0].total,
                    totalMiles: Number(mileageResult.rows[0].total_miles),
                    reimbursementTotal: Number(mileageResult.rows[0].reimbursement_total),
                    pendingReimbursement: Number(mileageResult.rows[0].pending_reimbursement)
                },
                recurring: {
                    total: recurringResult.rows[0].total,
                    active: recurringResult.rows[0].active,
                    estimatedMonthlyRevenue: Number(recurringResult.rows[0].estimated_monthly_revenue)
                },
                payroll: {
                    total: payrollResult.rows[0].total,
                    draft: payrollResult.rows[0].draft,
                    approved: payrollResult.rows[0].approved,
                    paidInRoll: payrollResult.rows[0].paid_in_roll
                }
            }
        });
    }
    catch (error) {
        console.error("dashboard metrics error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
export default router;
