import { Router } from "express";
import Stripe from "stripe";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is missing");
  }

  return new Stripe(key);
}

router.post("/stripe-webhook", async (req, res) => {
  const stripe = getStripe();
  const sig = req.headers["stripe-signature"];

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).send("Missing Stripe signature or webhook secret");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Stripe webhook signature error:", err);
    return res.status(400).send("Webhook signature failed");
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.metadata?.invoiceId) {
        await pool.query(
          `
          UPDATE invoices
          SET
            status = 'paid',
            payment_status = 'paid',
            stripe_checkout_session_id = $2
          WHERE id = $1
          `,
          [session.metadata.invoiceId, session.id]
        );
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing error:", error);
    return res.status(500).send("Webhook processing failed");
  }
});

router.post(
  "/invoices/:invoiceId/create-stripe-link",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const stripe = getStripe();

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
