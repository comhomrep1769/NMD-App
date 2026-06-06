import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { buildNmdEmailTemplate, sendEmail } from "../services/email.js";
const router = Router();
function mapPayment(row) {
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
router.get("/payments", requireAuth, requireRole("admin", "employee"), async (req, res) => {
    try {
        const isAdmin = req.user.role === "admin";
        const result = await pool.query(`
        SELECT
          p.*,
          collected.display_name AS collected_by_name,
          approved.display_name AS approved_by_name
        FROM pos_payments p
        LEFT JOIN users collected ON collected.id = p.collected_by
        LEFT JOIN users approved ON approved.id = p.approved_by
        WHERE
          $1::boolean = TRUE
          OR p.collected_by = $2
        ORDER BY p.created_at DESC
        `, [isAdmin, req.user.id]);
        return res.json({
            payments: result.rows.map(mapPayment)
        });
    }
    catch (error) {
        console.error("pos payments list error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.post("/payments", requireAuth, requireRole("admin", "employee"), async (req, res) => {
    try {
        const { invoiceId, clientId, clientName, paymentMethod, amount, salesTaxAmount, totalCollected, cashPhotoDataUrl, notes } = req.body;
        if (!clientName || !paymentMethod) {
            return res.status(400).json({
                error: "Client name and payment method are required"
            });
        }
        if (!["card_link", "tap_to_pay", "cash"].includes(paymentMethod)) {
            return res.status(400).json({
                error: "Invalid payment method"
            });
        }
        if (paymentMethod === "cash" && !cashPhotoDataUrl) {
            return res.status(400).json({
                error: "Cash payments require a photo upload for admin approval"
            });
        }
        if (cashPhotoDataUrl && cashPhotoDataUrl.length > 2_500_000) {
            return res.status(400).json({
                error: "Cash photo is too large. Please upload a smaller image."
            });
        }
        const paymentStatus = paymentMethod === "cash"
            ? "pending_admin_approval"
            : paymentMethod === "tap_to_pay"
                ? "pending"
                : "pending";
        const result = await pool.query(`
        INSERT INTO pos_payments (
          invoice_id,
          client_id,
          client_name,
          collected_by,
          payment_method,
          amount,
          sales_tax_amount,
          total_collected,
          status,
          cash_photo_data_url,
          notes
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
        )
        RETURNING *
        `, [
            invoiceId || null,
            clientId || null,
            clientName.trim(),
            req.user.id,
            paymentMethod,
            amount || 0,
            salesTaxAmount || 0,
            totalCollected || amount || 0,
            paymentStatus,
            cashPhotoDataUrl || null,
            notes || null
        ]);
        const payment = result.rows[0];
        if (paymentMethod === "cash") {
            await sendEmail({
                to: process.env.NMD_ADMIN_EMAIL || "nmdpowash@gmail.com",
                subject: `NMD cash payment needs approval: ${clientName}`,
                html: buildNmdEmailTemplate({
                    title: "Cash Payment Needs Approval",
                    message: `
              <p><strong>Client:</strong> ${clientName}</p>
              <p><strong>Submitted By:</strong> ${req.user.displayName || req.user.email}</p>
              <p><strong>Method:</strong> Cash</p>
              <p><strong>Amount:</strong> $${Number(amount || 0).toFixed(2)}</p>
              <p><strong>Sales Tax:</strong> $${Number(salesTaxAmount || 0).toFixed(2)}</p>
              <p><strong>Total Collected:</strong> $${Number(totalCollected || amount || 0).toFixed(2)}</p>
              <p><strong>Notes:</strong> ${notes || "—"}</p>
              <p>An employee/admin submitted cash payment proof. Please review and approve/reject it in the admin portal.</p>
            `
                }),
                text: `Cash payment needs approval for ${clientName}.`
            });
        }
        return res.status(201).json({
            payment: mapPayment(payment)
        });
    }
    catch (error) {
        console.error("pos payment create error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.patch("/payments/:paymentId/approve", requireAuth, requireRole("admin"), async (req, res) => {
    const client = await pool.connect();
    try {
        const { paymentId } = req.params;
        await client.query("BEGIN");
        const paymentResult = await client.query(`
        SELECT *
        FROM pos_payments
        WHERE id = $1
        LIMIT 1
        `, [paymentId]);
        if (paymentResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                error: "Payment record not found"
            });
        }
        const payment = paymentResult.rows[0];
        const updatedPayment = await client.query(`
        UPDATE pos_payments
        SET
          status = 'approved',
          approved_by = $2,
          approved_at = NOW()
        WHERE id = $1
        RETURNING *
        `, [paymentId, req.user.id]);
        if (payment.invoice_id) {
            await client.query(`
          UPDATE invoices
          SET
            status = 'paid',
            payment_status = 'paid'
          WHERE id = $1
          `, [payment.invoice_id]);
        }
        await client.query("COMMIT");
        return res.json({
            payment: mapPayment(updatedPayment.rows[0])
        });
    }
    catch (error) {
        await client.query("ROLLBACK");
        console.error("pos payment approve error", error);
        return res.status(500).json({ error: "Server error" });
    }
    finally {
        client.release();
    }
});
router.patch("/payments/:paymentId/reject", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { notes } = req.body;
        const result = await pool.query(`
        UPDATE pos_payments
        SET
          status = 'rejected',
          approved_by = $2,
          approved_at = NOW(),
          notes = COALESCE($3, notes)
        WHERE id = $1
        RETURNING *
        `, [paymentId, req.user.id, notes || null]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Payment record not found"
            });
        }
        return res.json({
            payment: mapPayment(result.rows[0])
        });
    }
    catch (error) {
        console.error("pos payment reject error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
export default router;
