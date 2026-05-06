import { Router } from "express";
import Stripe from "stripe";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
const frontendUrl = process.env.FRONTEND_URL || "https://nmd-frontend.onrender.com";

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey)
  : null;

function mapInvoice(row: any) {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    clientId: row.client_id,
    clientName: row.client_name,
    jobName: row.job_name,
    total: Number(row.total || 0),
    status: row.status,
    jobId: row.job_id,
    assignedUserId: row.assigned_user_id,
    createdAt: row.created_at,
    paymentProvider: row.payment_provider,
    paymentLinkId: row.payment_link_id,
    paymentLinkUrl: row.payment_link_url,
    paymentStatus: row.payment_status,
    paymentCreatedAt: row.payment_created_at,
    stripeCheckoutSessionId: row.stripe_checkout_session_id
  };
}

router.post(
  "/invoices/:invoiceId/create-payment-link",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({
          error: "Stripe is not configured"
        });
      }

      const { invoiceId } = req.params;

      const invoiceResult = await pool.query(
        `
        SELECT *
        FROM invoices
        WHERE id = $1
        LIMIT 1
        `,
        [invoiceId]
      );

      if (invoiceResult.rows.length === 0) {
        return res.status(404).json({
          error: "Invoice not found"
        });
      }

      const invoice = invoiceResult.rows[0];

      if (invoice.payment_link_url) {
        return res.json({
          invoice: mapInvoice(invoice)
        });
      }

      const amountInCents = Math.round(Number(invoice.total || 0) * 100);

      if (amountInCents <= 0) {
        return res.status(400).json({
          error: "Invoice total must be greater than 0"
        });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: amountInCents,
              product_data: {
                name: `NMD Invoice #${invoice.invoice_number}`,
                description: invoice.job_name || "NMD Pressure Washing Service"
              }
            }
          } as Stripe.Checkout.SessionCreateParams.LineItem
        ],
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: String(invoice.invoice_number)
        },
        success_url: `${frontendUrl}/?payment=success&invoice=${invoice.id}`,
        cancel_url: `${frontendUrl}/?payment=cancelled&invoice=${invoice.id}`
      });

      const updatedResult = await pool.query(
        `
        UPDATE invoices
        SET
          payment_provider = 'stripe',
          payment_link_id = $2,
          payment_link_url = $3,
          payment_status = 'link_created',
          payment_created_at = NOW(),
          stripe_checkout_session_id = $2
        WHERE id = $1
        RETURNING *
        `,
        [
          invoice.id,
          session.id,
          session.url
        ]
      );

      return res.json({
        invoice: mapInvoice(updatedResult.rows[0])
      });
    } catch (error) {
      console.error("create payment link error", error);
      return res.status(500).json({
        error: "Server error"
      });
    }
  }
);

router.post(
  "/stripe-webhook",
  async (req, res) => {
    if (!stripe) {
      return res.status(500).send("Stripe not configured");
    }

    let event: Stripe.Event;

    try {
      if (stripeWebhookSecret) {
        const signature = req.headers["stripe-signature"];

        if (!signature) {
          return res.status(400).send("Missing Stripe signature");
        }

        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          stripeWebhookSecret
        );
      } else {
        event = JSON.parse(req.body.toString());
      }
    } catch (error) {
      console.error("Stripe webhook verification failed", error);
      return res.status(400).send("Webhook error");
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const invoiceId = session.metadata?.invoiceId;

        if (invoiceId) {
          await pool.query(
            `
            UPDATE invoices
            SET
              status = 'paid',
              payment_status = 'paid'
            WHERE id = $1
            `,
            [invoiceId]
          );
        }
      }

      return res.json({ received: true });
    } catch (error) {
      console.error("Stripe webhook process error", error);
      return res.status(500).send("Webhook handler error");
    }
  }
);

export default router;
