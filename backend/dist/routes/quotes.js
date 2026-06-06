import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { buildNmdEmailTemplate, sendEmail } from "../services/email.js";
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
async function getClientEmail(clientId, clientName) {
    if (clientId) {
        const result = await pool.query(`SELECT email FROM clients WHERE id = $1 LIMIT 1`, [clientId]);
        if (result.rows[0]?.email)
            return result.rows[0].email;
    }
    if (clientName) {
        const result = await pool.query(`SELECT email FROM clients WHERE LOWER(CONCAT(first_name, ' ', last_name)) = LOWER($1) LIMIT 1`, [clientName]);
        if (result.rows[0]?.email)
            return result.rows[0].email;
    }
    return null;
}
router.get("/", requireAuth, async (_req, res) => {
    try {
        const result = await pool.query(`
      SELECT id, quote_number, client_id, client_name, service_type, total,
        status, converted_invoice_id, accepted_at, created_at
      FROM quotes ORDER BY created_at DESC
    `);
        return res.json({ quotes: result.rows.map(mapQuote) });
    }
    catch (error) {
        console.error("quotes list error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { clientId, clientName, serviceType, total, status } = req.body;
        if (!clientName || !serviceType) {
            return res.status(400).json({ error: "Client name and service type are required" });
        }
        const result = await pool.query(`INSERT INTO quotes (client_id, client_name, service_type, total, status, accepted_at)
      VALUES ($1, $2, $3, $4, $5, CASE WHEN $5 = 'accepted' THEN NOW() ELSE NULL END)
      RETURNING id, quote_number, client_id, client_name, service_type, total, status, converted_invoice_id, accepted_at, created_at`, [clientId || null, clientName, serviceType, total || 0, status || "draft"]);
        const quote = mapQuote(result.rows[0]);
        if (quote.status === "sent") {
            const email = await getClientEmail(quote.clientId, quote.clientName);
            if (email) {
                await sendEmail({
                    to: email,
                    subject: `NMD Quote #${quote.quoteNumber}`,
                    html: buildNmdEmailTemplate({
                        title: `Quote #${quote.quoteNumber}`,
                        heading: `Quote #${quote.quoteNumber} from NMD Pressure Washing`,
                        message: `Hi ${quote.clientName},\n\nYour NMD quote is ready for review.\n\nService: ${quote.serviceType}\nTotal: $${quote.total.toFixed(2)}\n\nPlease log into your client portal to accept or decline this quote.`,
                        buttonText: "View Quote",
                        buttonUrl: `${process.env.FRONTEND_URL || "https://nmdpowash.com"}/client/quotes`,
                        footerNote: "Clean Results. Reliable Service. Every Time."
                    }),
                    text: `Your NMD quote #${quote.quoteNumber} is ready. Total: $${quote.total.toFixed(2)}`
                });
            }
        }
        return res.status(201).json({ quote });
    }
    catch (error) {
        console.error("quote create error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.patch("/:quoteId", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { quoteId } = req.params;
        const { clientId, clientName, serviceType, total, status } = req.body;
        const beforeResult = await pool.query(`SELECT * FROM quotes WHERE id = $1 LIMIT 1`, [quoteId]);
        if (beforeResult.rows.length === 0)
            return res.status(404).json({ error: "Quote not found" });
        const before = beforeResult.rows[0];
        const result = await pool.query(`UPDATE quotes SET
        client_id = $2, client_name = COALESCE($3, client_name),
        service_type = COALESCE($4, service_type), total = COALESCE($5, total),
        status = COALESCE($6, status),
        accepted_at = CASE WHEN $6 = 'accepted' AND accepted_at IS NULL THEN NOW() ELSE accepted_at END
      WHERE id = $1
      RETURNING id, quote_number, client_id, client_name, service_type, total, status, converted_invoice_id, accepted_at, created_at`, [quoteId, clientId || null, clientName ?? null, serviceType ?? null, total ?? null, status ?? null]);
        const quote = mapQuote(result.rows[0]);
        if (before.status !== "sent" && quote.status === "sent") {
            const email = await getClientEmail(quote.clientId, quote.clientName);
            if (email) {
                await sendEmail({
                    to: email,
                    subject: `NMD Quote #${quote.quoteNumber}`,
                    html: buildNmdEmailTemplate({
                        title: `Quote #${quote.quoteNumber}`,
                        heading: `Quote #${quote.quoteNumber} from NMD Pressure Washing`,
                        message: `Hi ${quote.clientName},\n\nYour NMD quote is ready for review.\n\nService: ${quote.serviceType}\nTotal: $${quote.total.toFixed(2)}\n\nPlease log into your client portal to accept or decline this quote.`,
                        buttonText: "View Quote",
                        buttonUrl: `${process.env.FRONTEND_URL || "https://nmdpowash.com"}/client/quotes`,
                        footerNote: "Clean Results. Reliable Service. Every Time."
                    }),
                    text: `Your NMD quote #${quote.quoteNumber} is ready. Total: $${quote.total.toFixed(2)}`
                });
            }
        }
        return res.json({ quote });
    }
    catch (error) {
        console.error("quote update error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.post("/:quoteId/accept", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { quoteId } = req.params;
        const result = await pool.query(`UPDATE quotes SET status = 'accepted', accepted_at = COALESCE(accepted_at, NOW())
      WHERE id = $1
      RETURNING id, quote_number, client_id, client_name, service_type, total, status, converted_invoice_id, accepted_at, created_at`, [quoteId]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Quote not found" });
        return res.json({ quote: mapQuote(result.rows[0]) });
    }
    catch (error) {
        console.error("quote accept error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.post("/:quoteId/client-accept", requireAuth, requireRole("client"), async (req, res) => {
    try {
        const { quoteId } = req.params;
        const userEmail = req.user.email;
        const existing = await pool.query(`SELECT * FROM quotes WHERE id = $1 LIMIT 1`, [quoteId]);
        if (existing.rows.length === 0)
            return res.status(404).json({ error: "Quote not found" });
        const quote = existing.rows[0];
        const clientCheck = await pool.query(`SELECT * FROM clients WHERE LOWER(email) = LOWER($1) LIMIT 1`, [userEmail]);
        const clientName = clientCheck.rows[0]
            ? `${clientCheck.rows[0].first_name} ${clientCheck.rows[0].last_name}`.trim()
            : null;
        if (clientName && quote.client_name.toLowerCase() !== clientName.toLowerCase()) {
            return res.status(403).json({ error: "Not authorized to accept this quote." });
        }
        const result = await pool.query(`UPDATE quotes SET status = 'accepted', accepted_at = COALESCE(accepted_at, NOW())
      WHERE id = $1
      RETURNING id, quote_number, client_id, client_name, service_type, total, status, converted_invoice_id, accepted_at, created_at`, [quoteId]);
        await sendEmail({
            to: process.env.NMD_ADMIN_EMAIL || "nmdpowash@gmail.com",
            subject: `Quote #${quote.quote_number} accepted by ${quote.client_name}`,
            html: buildNmdEmailTemplate({
                title: "Quote Accepted",
                message: `${quote.client_name} has accepted Quote #${quote.quote_number} for ${quote.service_type}.\n\nTotal: $${Number(quote.total).toFixed(2)}\n\nLog in to convert it to an invoice.`,
                buttonText: "View Quotes",
                buttonUrl: `${process.env.FRONTEND_URL || "https://nmdpowash.com"}/quotes`
            }),
            text: `${quote.client_name} accepted quote #${quote.quote_number}`
        });
        return res.json({ quote: mapQuote(result.rows[0]) });
    }
    catch (error) {
        console.error("client quote accept error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.post("/:quoteId/client-decline", requireAuth, requireRole("client"), async (req, res) => {
    try {
        const { quoteId } = req.params;
        const existing = await pool.query(`SELECT * FROM quotes WHERE id = $1 LIMIT 1`, [quoteId]);
        if (existing.rows.length === 0)
            return res.status(404).json({ error: "Quote not found" });
        const quote = existing.rows[0];
        const result = await pool.query(`UPDATE quotes SET status = 'declined' WHERE id = $1
      RETURNING id, quote_number, client_id, client_name, service_type, total, status, converted_invoice_id, accepted_at, created_at`, [quoteId]);
        await sendEmail({
            to: process.env.NMD_ADMIN_EMAIL || "nmdpowash@gmail.com",
            subject: `Quote #${quote.quote_number} declined by ${quote.client_name}`,
            html: buildNmdEmailTemplate({
                title: "Quote Declined",
                message: `${quote.client_name} has declined Quote #${quote.quote_number} for ${quote.service_type}.\n\nTotal: $${Number(quote.total).toFixed(2)}`
            }),
            text: `${quote.client_name} declined quote #${quote.quote_number}`
        });
        return res.json({ quote: mapQuote(result.rows[0]) });
    }
    catch (error) {
        console.error("client quote decline error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.post("/:quoteId/convert-to-invoice", requireAuth, requireRole("admin"), async (req, res) => {
    const client = await pool.connect();
    try {
        const { quoteId } = req.params;
        await client.query("BEGIN");
        const quoteResult = await client.query(`SELECT * FROM quotes WHERE id = $1 LIMIT 1`, [quoteId]);
        if (quoteResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Quote not found" });
        }
        const quote = quoteResult.rows[0];
        if (quote.converted_invoice_id) {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: "This quote has already been converted to an invoice." });
        }
        if (quote.status !== "accepted") {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: "Only accepted quotes can be converted to invoices." });
        }
        const invoiceResult = await client.query(`INSERT INTO invoices (client_id, client_name, job_name, total, status)
      VALUES ($1, $2, $3, $4, 'unpaid')
      RETURNING id, invoice_number, client_id, client_name, job_name, total, status, job_id, assigned_user_id, created_at, payment_provider, payment_link_id, payment_link_url, payment_status, payment_created_at, stripe_checkout_session_id`, [quote.client_id || null, quote.client_name, quote.service_type, quote.total || 0]);
        const invoice = invoiceResult.rows[0];
        await client.query(`UPDATE quotes SET converted_invoice_id = $2 WHERE id = $1`, [quoteId, invoice.id]);
        await client.query("COMMIT");
        const email = await getClientEmail(quote.client_id, quote.client_name);
        if (email) {
            await sendEmail({
                to: email,
                subject: `NMD Invoice #${invoice.invoice_number} created`,
                html: buildNmdEmailTemplate({
                    title: `Invoice #${invoice.invoice_number}`,
                    message: `Hi ${quote.client_name},\n\nYour accepted quote has been converted into an invoice.\n\nService: ${invoice.job_name}\nTotal: $${Number(invoice.total || 0).toFixed(2)}\n\nNMD will be in touch with next steps.`,
                    footerNote: "Clean Results. Reliable Service. Every Time."
                }),
                text: `Your NMD invoice #${invoice.invoice_number} has been created. Total: $${Number(invoice.total).toFixed(2)}`
            });
        }
        return res.status(201).json({
            invoice: {
                id: invoice.id, invoiceNumber: invoice.invoice_number, clientId: invoice.client_id,
                clientName: invoice.client_name, jobName: invoice.job_name, total: Number(invoice.total),
                status: invoice.status, jobId: invoice.job_id, assignedUserId: invoice.assigned_user_id,
                createdAt: invoice.created_at, paymentProvider: invoice.payment_provider,
                paymentLinkId: invoice.payment_link_id, paymentLinkUrl: invoice.payment_link_url,
                paymentStatus: invoice.payment_status, paymentCreatedAt: invoice.payment_created_at,
                stripeCheckoutSessionId: invoice.stripe_checkout_session_id
            }
        });
    }
    catch (error) {
        await client.query("ROLLBACK");
        console.error("quote convert invoice error", error);
        return res.status(500).json({ error: "Server error" });
    }
    finally {
        client.release();
    }
});
router.delete("/:quoteId", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { quoteId } = req.params;
        const result = await pool.query(`DELETE FROM quotes WHERE id = $1 RETURNING id`, [quoteId]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Quote not found" });
        return res.json({ deleted: true });
    }
    catch (error) {
        console.error("quote delete error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
export default router;
