import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
const router = Router();
function mapQuote(row) {
    return {
        id: row.id,
        quoteNumber: row.quote_number,
        clientId: row.client_id,
        clientName: row.client_name,
        serviceType: row.service_type,
        total: Number(row.total || 0),
        status: row.status,
        convertedInvoiceId: row.converted_invoice_id,
        acceptedAt: row.accepted_at,
        createdAt: row.created_at
    };
}
router.get("/my-quotes", requireAuth, requireRole("client"), async (req, res) => {
    try {
        const clientResult = await pool.query(`
      SELECT id, email, first_name, last_name
      FROM clients
      WHERE user_id = $1
         OR LOWER(email) = LOWER($2)
      ORDER BY created_at DESC
      LIMIT 1
      `, [req.user.id, req.user.email]);
        const clientProfile = clientResult.rows[0];
        if (!clientProfile) {
            return res.json({
                quotes: []
            });
        }
        const fullName = `${clientProfile.first_name || ""} ${clientProfile.last_name || ""}`.trim();
        const quotesResult = await pool.query(`
      SELECT q.*
      FROM quotes q
      WHERE q.client_id = $1
         OR LOWER(q.client_name) = LOWER($2)
      ORDER BY q.created_at DESC
      `, [clientProfile.id, fullName]);
        return res.json({
            quotes: quotesResult.rows.map(mapQuote)
        });
    }
    catch (error) {
        console.error("client my quotes error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
export default router;
