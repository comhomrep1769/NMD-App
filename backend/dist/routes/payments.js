import { Router } from "express";
import Stripe from "stripe";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { buildNmdEmailTemplate, sendEmail } from "../services/email.js";
const router = Router();
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
const frontendUrl = process.env.FRONTEND_URL || "https://nmd-frontend.onrender.com";
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
function mapInvoice(row) {
    return {
        id: row.id,
        invoiceNumber: row.invoice_number,
        clientId: row.client_id,
        clientName: row.client_name,
        jobName: row.job_name,
        subtotal: Number(row.subtotal || row.total || 0),
        taxRate: Number(row.tax_rate || 0.065),
        salesTaxAmount: Number(row.sales_tax_amount || 0),
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
async function getClientEmail(clientId, clientName) {
    if (clientId) {
        const result = await pool.query(`SELECT email FROM clients WHERE id = $1 LIMIT 1`, [clientId]);
        if (result.rows[0]?.email)
            return result.rows[0].email;
    }
    if (clientName) {
        const result = await pool.query(`
      SELECT email
      FROM clients
      WHERE LOWER(CONCAT(first_name, ' ', last_name)) = LOWER($1)
      LIMIT 1
      `, [clientName]);
        if (result.rows[0]?.email)
            return result.rows[0].email;
    }
    return null;
}
async function notifyRecurringClient(service, subject, title, body) {
    if (!service?.email)
        return;
    await sendEmail({
        to: service.email,
        subject,
        html: buildNmdEmailTemplate({
            title,
            message: body
        }),
        text: subject
    });
}
router.post("/invoices/:invoiceId/create-payment-link", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({
                error: "Stripe is not configured"
            });
        }
        const { invoiceId } = req.params;
        const invoiceResult = await pool.query(`
        SELECT *
        FROM invoices
        WHERE id = $1
        LIMIT 1
        `, [invoiceId]);
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
                }
            ],
            metadata: {
                invoiceId: invoice.id,
                invoiceNumber: String(invoice.invoice_number)
            },
            success_url: `${frontendUrl}/?payment=success&invoice=${invoice.id}`,
            cancel_url: `${frontendUrl}/?payment=cancelled&invoice=${invoice.id}`
        });
        const updatedResult = await pool.query(`
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
        `, [invoice.id, session.id, session.url]);
        const updatedInvoice = updatedResult.rows[0];
        const email = await getClientEmail(updatedInvoice.client_id, updatedInvoice.client_name);
        if (email && session.url) {
            await sendEmail({
                to: email,
                subject: `NMD Invoice #${updatedInvoice.invoice_number}`,
                html: buildNmdEmailTemplate({
                    title: `Invoice #${updatedInvoice.invoice_number}`,
                    message: `
              <p>Hi ${updatedInvoice.client_name},</p>
              <p>Your NMD invoice is ready for payment.</p>
              <p><strong>Service:</strong> ${updatedInvoice.job_name}</p>
              <p><strong>Subtotal:</strong> $${Number(updatedInvoice.subtotal || updatedInvoice.total || 0).toFixed(2)}</p>
              <p><strong>Sales Tax:</strong> $${Number(updatedInvoice.sales_tax_amount || 0).toFixed(2)}</p>
              <p><strong>Total:</strong> $${Number(updatedInvoice.total || 0).toFixed(2)}</p>
              <p>You can pay securely using the button below.</p>
            `,
                    actionLabel: "Pay Invoice",
                    actionUrl: session.url
                }),
                text: `Your NMD invoice #${updatedInvoice.invoice_number} is ready. Pay here: ${session.url}`
            });
        }
        return res.json({
            invoice: mapInvoice(updatedInvoice)
        });
    }
    catch (error) {
        console.error("create payment link error", error);
        return res.status(500).json({
            error: "Server error"
        });
    }
});
router.post("/stripe-webhook", async (req, res) => {
    if (!stripe) {
        return res.status(500).send("Stripe not configured");
    }
    let event;
    try {
        if (stripeWebhookSecret) {
            const signature = req.headers["stripe-signature"];
            if (!signature) {
                return res.status(400).send("Missing Stripe signature");
            }
            event = stripe.webhooks.constructEvent(req.body, signature, stripeWebhookSecret);
        }
        else {
            event = JSON.parse(req.body.toString());
        }
    }
    catch (error) {
        console.error("Stripe webhook verification failed", error);
        return res.status(400).send("Webhook error");
    }
    try {
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            if (session.mode === "payment") {
                const invoiceId = session.metadata?.invoiceId;
                if (invoiceId) {
                    const dbClient = await pool.connect();
                    try {
                        await dbClient.query("BEGIN");
                        const beforeResult = await dbClient.query(`
              SELECT *
              FROM invoices
              WHERE id = $1
              LIMIT 1
              `, [invoiceId]);
                        const before = beforeResult.rows[0];
                        const updatedResult = await dbClient.query(`
              UPDATE invoices
              SET
                status = 'paid',
                payment_status = 'paid'
              WHERE id = $1
              RETURNING *
              `, [invoiceId]);
                        const invoice = updatedResult.rows[0];
                        if (invoice) {
                            await dbClient.query(`
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
                SELECT
                  $1,
                  $2,
                  $3,
                  NULL,
                  'card_link',
                  $4,
                  $5,
                  $6,
                  'paid',
                  NULL,
                  $7
                WHERE NOT EXISTS (
                  SELECT 1
                  FROM pos_payments
                  WHERE invoice_id = $1
                    AND payment_method = 'card_link'
                    AND status IN ('paid', 'approved')
                )
                `, [
                                invoice.id,
                                invoice.client_id || null,
                                invoice.client_name,
                                Number(invoice.subtotal || invoice.total || 0),
                                Number(invoice.sales_tax_amount || 0),
                                Number(invoice.total || 0),
                                `Stripe card payment completed. Checkout session: ${session.id}`
                            ]);
                        }
                        await dbClient.query("COMMIT");
                        if (invoice && before?.payment_status !== "paid") {
                            const email = await getClientEmail(invoice.client_id, invoice.client_name);
                            if (email) {
                                await sendEmail({
                                    to: email,
                                    subject: `Payment received for NMD Invoice #${invoice.invoice_number}`,
                                    html: buildNmdEmailTemplate({
                                        title: "Payment Received",
                                        message: `
                      <p>Hi ${invoice.client_name},</p>
                      <p>Thank you. Your payment has been received.</p>
                      <p><strong>Invoice:</strong> #${invoice.invoice_number}</p>
                      <p><strong>Service:</strong> ${invoice.job_name}</p>
                      <p><strong>Subtotal:</strong> $${Number(invoice.subtotal || invoice.total || 0).toFixed(2)}</p>
                      <p><strong>Sales Tax:</strong> $${Number(invoice.sales_tax_amount || 0).toFixed(2)}</p>
                      <p><strong>Total Paid:</strong> $${Number(invoice.total || 0).toFixed(2)}</p>
                    `
                                    }),
                                    text: `Payment received for NMD invoice #${invoice.invoice_number}. Thank you.`
                                });
                            }
                            await sendEmail({
                                to: process.env.NMD_ADMIN_EMAIL || "nmdpowash@gmail.com",
                                subject: `NMD payment received: Invoice #${invoice.invoice_number}`,
                                html: buildNmdEmailTemplate({
                                    title: "Payment Received",
                                    message: `
                    <p><strong>Client:</strong> ${invoice.client_name}</p>
                    <p><strong>Invoice:</strong> #${invoice.invoice_number}</p>
                    <p><strong>Service:</strong> ${invoice.job_name}</p>
                    <p><strong>Subtotal:</strong> $${Number(invoice.subtotal || invoice.total || 0).toFixed(2)}</p>
                    <p><strong>Sales Tax:</strong> $${Number(invoice.sales_tax_amount || 0).toFixed(2)}</p>
                    <p><strong>Total Paid:</strong> $${Number(invoice.total || 0).toFixed(2)}</p>
                  `
                                }),
                                text: `Payment received for invoice #${invoice.invoice_number}.`
                            });
                        }
                    }
                    catch (error) {
                        await dbClient.query("ROLLBACK");
                        throw error;
                    }
                    finally {
                        dbClient.release();
                    }
                }
            }
            if (session.mode === "subscription") {
                const recurringServiceId = session.metadata?.recurringServiceId;
                const subscriptionId = typeof session.subscription === "string"
                    ? session.subscription
                    : session.subscription?.id || null;
                const customerId = typeof session.customer === "string"
                    ? session.customer
                    : session.customer?.id || null;
                if (recurringServiceId) {
                    const updatedResult = await pool.query(`
            UPDATE recurring_services
            SET
              stripe_checkout_session_id = $2,
              stripe_subscription_id = COALESCE($3, stripe_subscription_id),
              stripe_customer_id = COALESCE($4, stripe_customer_id),
              stripe_payment_status = 'active',
              status = 'active'
            WHERE id = $1
            RETURNING *
            `, [
                        recurringServiceId,
                        session.id,
                        subscriptionId,
                        customerId
                    ]);
                    const service = updatedResult.rows[0];
                    if (service) {
                        await notifyRecurringClient(service, `NMD recurring service activated: ${service.service_type}`, "Recurring Service Activated", `
                <p>Hi ${service.client_name},</p>
                <p>Your recurring service is now active.</p>
                <p><strong>Service:</strong> ${service.service_type}</p>
                <p><strong>Frequency:</strong> ${service.frequency}</p>
                <p><strong>Price:</strong> $${Number(service.price || 0).toFixed(2)}</p>
                <p><strong>Address:</strong> ${service.address}</p>
              `);
                        await sendEmail({
                            to: process.env.NMD_ADMIN_EMAIL || "nmdpowash@gmail.com",
                            subject: `NMD recurring service activated: ${service.client_name}`,
                            html: buildNmdEmailTemplate({
                                title: "Recurring Service Activated",
                                message: `
                  <p><strong>Client:</strong> ${service.client_name}</p>
                  <p><strong>Service:</strong> ${service.service_type}</p>
                  <p><strong>Frequency:</strong> ${service.frequency}</p>
                  <p><strong>Price:</strong> $${Number(service.price || 0).toFixed(2)}</p>
                  <p><strong>Stripe Subscription:</strong> ${service.stripe_subscription_id || "—"}</p>
                `
                            }),
                            text: `Recurring service activated for ${service.client_name}.`
                        });
                    }
                }
            }
        }
        if (event.type === "invoice.payment_succeeded") {
            const stripeInvoice = event.data.object;
            const rawInvoice = stripeInvoice;
            const subscriptionId = typeof rawInvoice.subscription === "string"
                ? rawInvoice.subscription
                : rawInvoice.subscription?.id || null;
            if (subscriptionId) {
                const updatedResult = await pool.query(`
          UPDATE recurring_services
          SET stripe_payment_status = 'active'
          WHERE stripe_subscription_id = $1
          RETURNING *
          `, [subscriptionId]);
                const service = updatedResult.rows[0];
                if (service) {
                    await sendEmail({
                        to: process.env.NMD_ADMIN_EMAIL || "nmdpowash@gmail.com",
                        subject: `Recurring payment received: ${service.client_name}`,
                        html: buildNmdEmailTemplate({
                            title: "Recurring Payment Received",
                            message: `
                <p><strong>Client:</strong> ${service.client_name}</p>
                <p><strong>Service:</strong> ${service.service_type}</p>
                <p><strong>Price:</strong> $${Number(service.price || 0).toFixed(2)}</p>
                <p><strong>Subscription:</strong> ${service.stripe_subscription_id}</p>
              `
                        }),
                        text: `Recurring payment received for ${service.client_name}.`
                    });
                }
            }
        }
        if (event.type === "invoice.payment_failed") {
            const stripeInvoice = event.data.object;
            const rawInvoice = stripeInvoice;
            const subscriptionId = typeof rawInvoice.subscription === "string"
                ? rawInvoice.subscription
                : rawInvoice.subscription?.id || null;
            if (subscriptionId) {
                const updatedResult = await pool.query(`
          UPDATE recurring_services
          SET stripe_payment_status = 'payment_failed'
          WHERE stripe_subscription_id = $1
          RETURNING *
          `, [subscriptionId]);
                const service = updatedResult.rows[0];
                if (service) {
                    await notifyRecurringClient(service, `NMD recurring payment failed: ${service.service_type}`, "Recurring Payment Failed", `
              <p>Hi ${service.client_name},</p>
              <p>Your recurring service payment did not go through.</p>
              <p><strong>Service:</strong> ${service.service_type}</p>
              <p>Please update your payment method or contact NMD to avoid service interruption.</p>
            `);
                    await sendEmail({
                        to: process.env.NMD_ADMIN_EMAIL || "nmdpowash@gmail.com",
                        subject: `Recurring payment failed: ${service.client_name}`,
                        html: buildNmdEmailTemplate({
                            title: "Recurring Payment Failed",
                            message: `
                <p><strong>Client:</strong> ${service.client_name}</p>
                <p><strong>Service:</strong> ${service.service_type}</p>
                <p><strong>Subscription:</strong> ${service.stripe_subscription_id}</p>
              `
                        }),
                        text: `Recurring payment failed for ${service.client_name}.`
                    });
                }
            }
        }
        if (event.type === "customer.subscription.deleted") {
            const subscription = event.data.object;
            const updatedResult = await pool.query(`
        UPDATE recurring_services
        SET
          stripe_payment_status = 'cancelled',
          status = 'cancelled'
        WHERE stripe_subscription_id = $1
        RETURNING *
        `, [subscription.id]);
            const service = updatedResult.rows[0];
            if (service) {
                await notifyRecurringClient(service, `NMD recurring service cancelled: ${service.service_type}`, "Recurring Service Cancelled", `
            <p>Hi ${service.client_name},</p>
            <p>Your recurring service subscription has been cancelled.</p>
            <p><strong>Service:</strong> ${service.service_type}</p>
            <p>If this was a mistake, please contact NMD to reactivate service.</p>
          `);
                await sendEmail({
                    to: process.env.NMD_ADMIN_EMAIL || "nmdpowash@gmail.com",
                    subject: `Recurring service cancelled: ${service.client_name}`,
                    html: buildNmdEmailTemplate({
                        title: "Recurring Service Cancelled",
                        message: `
              <p><strong>Client:</strong> ${service.client_name}</p>
              <p><strong>Service:</strong> ${service.service_type}</p>
              <p><strong>Subscription:</strong> ${service.stripe_subscription_id}</p>
            `
                    }),
                    text: `Recurring service cancelled for ${service.client_name}.`
                });
            }
        }
        return res.json({ received: true });
    }
    catch (error) {
        console.error("Stripe webhook process error", error);
        return res.status(500).send("Webhook handler error");
    }
});
export default router;
