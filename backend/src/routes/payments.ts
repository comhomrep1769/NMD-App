import { Router } from "express";
import Stripe from "stripe";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY is not set");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

router.post(
  "/invoices/:invoiceId/create-stripe-link",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { invoiceId } = req.params;

      const invoiceResult = await pool.query(
        `
        SELECT id, invoice_number, client_name, job_name, total, status, payment_link_url
        FROM invoices
        WHERE id = $1
        LIMIT 1
        `,
        [invoiceId]
      );

      if (invoiceResult.rows.length === 0) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      const invoice = invoiceResult.rows[0];

      if (invoice.status === "paid") {
        return res.status(400).json({ error: "Paid invoices do not need payment links" });
      }

      if (invoice.payment_link_url) {
        return res.json({
          paymentLinkUrl: invoice.payment_link_url,
          reused: true
        });
      }

      const amountCents = Math.round(Number(invoice.total) * 100);

      if (!amountCents || amountCents <= 0) {
        return res.status(400).json({ error: "Invoice total must be greater than 0" });
      }

      const paymentLink = await stripe.paymentLinks.create({
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `NMD Invoice #${invoice.invoice_number}`,
                description: `${invoice.client_name} — ${invoice.job_name}`
              },
              unit_amount: amountCents
            },
            quantity: 1
          }
        ],
        payment_intent_data: {
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: String(invoice.invoice_number),
            source: "nmd_app"
          }
        },
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: String(invoice.invoice_number),
          source: "nmd_app"
        }
      });

      await pool.query(
        `
        UPDATE invoices
        SET
          payment_provider = 'stripe',
          payment_link_id = $2,
          payment_link_url = $3,
          payment_status = 'link_created',
          payment_created_at = NOW()
        WHERE id = $1
        `,
        [invoice.id, paymentLink.id, paymentLink.url]
      );

      return res.status(201).json({
        paymentLinkId: paymentLink.id,
        paymentLinkUrl: paymentLink.url,
        reused: false
      });
    } catch (error) {
      console.error("create stripe link error", error);
      return res.status(500).json({ error: "Failed to create Stripe payment link" });
    }
  }
);

export default router;
