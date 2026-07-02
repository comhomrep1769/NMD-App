import { Router } from "express";
import Stripe from "stripe";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { buildNmdEmailTemplate, sendEmail } from "../services/email.js";
const router = Router();
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const frontendUrl = process.env.FRONTEND_URL || "https://nmd-frontend.onrender.com";
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
function mapRecurring(row) {
    return {
        id: row.id,
        clientId: row.client_id,
        clientName: row.client_name,
        phone: row.phone,
        email: row.email,
        address: row.address,
        serviceType: row.service_type,
        frequency: row.frequency,
        price: Number(row.price || 0),
        status: row.status,
        nextServiceDate: row.next_service_date,
        notes: row.notes,
        lastReminderSentAt: row.last_reminder_sent_at,
        stripeCheckoutSessionId: row.stripe_checkout_session_id,
        stripeSubscriptionId: row.stripe_subscription_id,
        stripeCustomerId: row.stripe_customer_id,
        stripePaymentStatus: row.stripe_payment_status,
        stripeCheckoutUrl: row.stripe_checkout_url,
        createdBy: row.created_by,
        createdAt: row.created_at
    };
}
function stripeIntervalForFrequency(frequency) {
    if (frequency === "weekly")
        return { interval: "week", interval_count: 1 };
    if (frequency === "biweekly")
        return { interval: "week", interval_count: 2 };
    if (frequency === "quarterly")
        return { interval: "month", interval_count: 3 };
    return { interval: "month", interval_count: 1 };
}
function shouldSendReminder(frequency, daysUntilService) {
    if (frequency === "weekly" || frequency === "biweekly") {
        return daysUntilService === 5 || daysUntilService === 3;
    }
    return daysUntilService === 7;
}
async function sendRecurringReminder(service) {
    if (!service.email) {
        return { sent: false, reason: "No client email" };
    }
    const dateText = service.next_service_date
        ? new Date(service.next_service_date).toLocaleDateString()
        : "soon";
    await sendEmail({
        to: service.email,
        subject: `Upcoming NMD service reminder: ${service.service_type}`,
        html: buildNmdEmailTemplate({
            title: "Upcoming Service Reminder",
            message: `
        <p>Hi ${service.client_name},</p>
        <p>This is a reminder for your upcoming recurring NMD service.</p>
        <p><strong>Service:</strong> ${service.service_type}</p>
        <p><strong>Frequency:</strong> ${service.frequency}</p>
        <p><strong>Address:</strong> ${service.address}</p>
        <p><strong>Next Service Date:</strong> ${dateText}</p>
        <p>If this date no longer works, please contact NMD to reschedule.</p>
      `
        }),
        text: `Upcoming NMD service reminder: ${service.service_type} at ${service.address} on ${dateText}.`
    });
    await pool.query(`UPDATE recurring_services SET last_reminder_sent_at = NOW() WHERE id = $1`, [service.id]);
    return { sent: true };
}
router.get("/", requireAuth, requireRole("admin"), async (_req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM recurring_services ORDER BY next_service_date ASC NULLS LAST, created_at DESC`);
        return res.json({ recurringServices: result.rows.map(mapRecurring) });
    }
    catch (error) {
        console.error("recurring list error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
// ── Client opt-in endpoint ──────────────────────────────────────────────────
// Called from the client portal. Looks up their client record + invoice,
// creates the recurring entry, and notifies admin by email.
router.post("/client-optin", requireAuth, requireRole("client"), async (req, res) => {
    try {
        const userId = req.user.id;
        const userEmail = req.user.email;
        const { invoiceId, frequency, serviceType } = req.body;
        if (!invoiceId || !frequency) {
            return res.status(400).json({ error: "Invoice and frequency are required." });
        }
        const validFrequencies = ["weekly", "biweekly", "monthly", "quarterly"];
        if (!validFrequencies.includes(frequency)) {
            return res.status(400).json({ error: "Invalid frequency." });
        }
        // Find the client record
        const clientResult = await pool.query(`SELECT * FROM clients WHERE user_id = $1 OR LOWER(email) = LOWER($2) ORDER BY created_at DESC LIMIT 1`, [userId, userEmail]);
        const client = clientResult.rows[0];
        if (!client) {
            return res.status(400).json({ error: "No client profile found for this account." });
        }
        // Verify the invoice belongs to this client and is paid
        const invoiceResult = await pool.query(`SELECT * FROM invoices WHERE id = $1 AND (client_id = $2 OR LOWER(client_name) = LOWER($3)) LIMIT 1`, [invoiceId, client.id, `${client.first_name} ${client.last_name}`]);
        const invoice = invoiceResult.rows[0];
        if (!invoice) {
            return res.status(404).json({ error: "Invoice not found or does not belong to your account." });
        }
        if (invoice.status !== "paid") {
            return res.status(400).json({ error: "Only paid invoices can be enrolled in a recurring plan." });
        }
        // Check not already enrolled for this service type
        const existing = await pool.query(`SELECT id FROM recurring_services WHERE client_id = $1 AND LOWER(service_type) = LOWER($2) AND status = 'active' LIMIT 1`, [client.id, serviceType || invoice.job_name]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: "You already have an active recurring plan for this service." });
        }
        // Create the recurring service entry
        const result = await pool.query(`INSERT INTO recurring_services
        (client_id, client_name, phone, email, address, service_type, frequency, price, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9)
       RETURNING *`, [
            client.id,
            `${client.first_name} ${client.last_name}`,
            client.phone || null,
            client.email || null,
            client.address || null,
            serviceType || invoice.job_name,
            frequency,
            Number(invoice.total || 0) * 0.8, // 20% discount applied
            `Client opted in from portal. Invoice #${invoice.invoice_number}.`
        ]);
        const newService = result.rows[0];
        // Notify admin
        const adminEmail = process.env.NMD_ADMIN_EMAIL || "nmdpowash@gmail.com";
        await sendEmail({
            to: adminEmail,
            subject: `New recurring plan enrollment: ${newService.client_name}`,
            html: buildNmdEmailTemplate({
                title: "New Recurring Plan Enrollment",
                heading: "A client has enrolled in a recurring service plan",
                message: `${newService.client_name} has opted into a recurring service plan from their client portal.\n\nService: ${newService.service_type}\nFrequency: ${newService.frequency}\nPrice (after 20% discount): $${Number(newService.price).toFixed(2)}\nAddress: ${newService.address || "On file"}\nPhone: ${newService.phone || "On file"}\nEmail: ${newService.email || "On file"}\n\nLog in to confirm the schedule and set the next service date.`,
                buttonText: "View Recurring Services",
                buttonUrl: `${process.env.FRONTEND_URL || "https://nmdpowash.com"}/recurring`,
                footerNote: "Clean Results. Reliable Service. Every Time."
            }),
            text: `${newService.client_name} enrolled in ${newService.frequency} ${newService.service_type}. Price: $${Number(newService.price).toFixed(2)}/visit.`
        });
        // Confirm enrollment to client
        if (newService.email) {
            await sendEmail({
                to: newService.email,
                subject: `You're enrolled in recurring ${newService.service_type} with NMD!`,
                html: buildNmdEmailTemplate({
                    title: "Recurring Plan Confirmed",
                    heading: "You're enrolled! 🎉",
                    message: `Hi ${client.first_name},\n\nYou've successfully enrolled in a recurring service plan with NMD Pressure Washing.\n\nService: ${newService.service_type}\nFrequency: ${newService.frequency}\nYour discounted price: $${Number(newService.price).toFixed(2)} per visit (20% off)\n\nNMD will be in touch shortly to confirm your schedule. Thank you for choosing NMD!`,
                    buttonText: "View My Plan",
                    buttonUrl: `${process.env.FRONTEND_URL || "https://nmdpowash.com"}/client/recurring`,
                    footerNote: "Clean Results. Reliable Service. Every Time."
                }),
                text: `You're enrolled in ${newService.frequency} ${newService.service_type} with NMD at $${Number(newService.price).toFixed(2)}/visit.`
            });
        }
        return res.status(201).json({ recurringService: mapRecurring(newService) });
    }
    catch (error) {
        console.error("client recurring opt-in error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { clientId, clientName, phone, email, address, serviceType, frequency, price, status, nextServiceDate, notes } = req.body;
        if (!clientName || !address) {
            return res.status(400).json({ error: "Client name and address are required" });
        }
        const result = await pool.query(`INSERT INTO recurring_services
        (client_id, client_name, phone, email, address, service_type, frequency, price, status, next_service_date, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`, [
            clientId || null, clientName.trim(), phone?.trim() || null,
            email?.trim() || null, address.trim(),
            serviceType?.trim() || "Trash Can Cleaning",
            frequency || "monthly", price ?? 10, status || "active",
            nextServiceDate || null, notes?.trim() || null, req.user.id
        ]);
        return res.status(201).json({ recurringService: mapRecurring(result.rows[0]) });
    }
    catch (error) {
        console.error("recurring create error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.patch("/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { id } = req.params;
        const { clientId, clientName, phone, email, address, serviceType, frequency, price, status, nextServiceDate, notes } = req.body;
        const result = await pool.query(`UPDATE recurring_services SET
        client_id = $2, client_name = COALESCE($3, client_name), phone = $4, email = $5,
        address = COALESCE($6, address), service_type = COALESCE($7, service_type),
        frequency = COALESCE($8, frequency), price = COALESCE($9, price),
        status = COALESCE($10, status), next_service_date = $11, notes = $12
       WHERE id = $1 RETURNING *`, [id, clientId || null, clientName ?? null, phone ?? null, email ?? null,
            address ?? null, serviceType ?? null, frequency ?? null, price ?? null,
            status ?? null, nextServiceDate || null, notes ?? null]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Recurring service not found" });
        return res.json({ recurringService: mapRecurring(result.rows[0]) });
    }
    catch (error) {
        console.error("recurring update error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.patch("/:id/status", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status || !["active", "paused", "cancelled"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }
        const result = await pool.query(`UPDATE recurring_services SET status = $2 WHERE id = $1 RETURNING *`, [id, status]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Recurring service not found" });
        return res.json({ recurringService: mapRecurring(result.rows[0]) });
    }
    catch (error) {
        console.error("recurring status error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.post("/:id/create-stripe-subscription", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        if (!stripe)
            return res.status(500).json({ error: "Stripe is not configured" });
        const { id } = req.params;
        const result = await pool.query(`SELECT * FROM recurring_services WHERE id = $1 LIMIT 1`, [id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Recurring service not found" });
        const service = result.rows[0];
        if (!service.email)
            return res.status(400).json({ error: "Client email is required before creating a Stripe subscription." });
        if (Number(service.price || 0) <= 0)
            return res.status(400).json({ error: "Recurring service price must be greater than 0." });
        if (service.stripe_checkout_url && service.stripe_payment_status === "checkout_created") {
            return res.json({ recurringService: mapRecurring(service) });
        }
        const interval = stripeIntervalForFrequency(service.frequency);
        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            customer_email: service.email,
            line_items: [{
                    quantity: 1,
                    price_data: {
                        currency: "usd",
                        unit_amount: Math.round(Number(service.price || 0) * 100),
                        recurring: interval,
                        product_data: { name: `NMD ${service.service_type}`, description: `${service.frequency} service at ${service.address}` }
                    }
                }],
            metadata: { recurringServiceId: service.id, serviceType: service.service_type, clientName: service.client_name },
            subscription_data: { metadata: { recurringServiceId: service.id, serviceType: service.service_type, clientName: service.client_name } },
            success_url: `${frontendUrl}/?subscription=success&recurring=${service.id}`,
            cancel_url: `${frontendUrl}/?subscription=cancelled&recurring=${service.id}`
        });
        const updated = await pool.query(`UPDATE recurring_services SET stripe_checkout_session_id = $2, stripe_checkout_url = $3, stripe_payment_status = 'checkout_created' WHERE id = $1 RETURNING *`, [service.id, session.id, session.url]);
        if (session.url) {
            await sendEmail({
                to: service.email,
                subject: `Set up your NMD recurring service: ${service.service_type}`,
                html: buildNmdEmailTemplate({
                    title: "Recurring Service Setup",
                    message: `<p>Hi ${service.client_name},</p><p>NMD has prepared your recurring service subscription checkout.</p><p><strong>Service:</strong> ${service.service_type}</p><p><strong>Frequency:</strong> ${service.frequency}</p><p><strong>Price:</strong> $${Number(service.price || 0).toFixed(2)}</p><p><strong>Address:</strong> ${service.address}</p><p>Use the secure button below to activate your recurring billing.</p>`,
                    actionLabel: "Activate Recurring Service",
                    actionUrl: session.url
                }),
                text: `Activate your NMD recurring service here: ${session.url}`
            });
        }
        return res.json({ recurringService: mapRecurring(updated.rows[0]) });
    }
    catch (error) {
        console.error("create stripe subscription error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.post("/:id/send-reminder", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`SELECT * FROM recurring_services WHERE id = $1 LIMIT 1`, [id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Recurring service not found" });
        const reminder = await sendRecurringReminder(result.rows[0]);
        if (!reminder.sent)
            return res.status(400).json({ error: reminder.reason || "Reminder not sent" });
        return res.json({ sent: true, message: "Reminder email sent." });
    }
    catch (error) {
        console.error("recurring reminder error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.post("/scan-reminders", requireAuth, requireRole("admin"), async (_req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM recurring_services
       WHERE status = 'active' AND email IS NOT NULL AND next_service_date IS NOT NULL
         AND next_service_date >= CURRENT_DATE AND next_service_date <= CURRENT_DATE + INTERVAL '7 days'
         AND (last_reminder_sent_at IS NULL OR last_reminder_sent_at::date < CURRENT_DATE)
       ORDER BY next_service_date ASC`);
        let sent = 0;
        const skipped = [];
        for (const service of result.rows) {
            const serviceDate = new Date(service.next_service_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            serviceDate.setHours(0, 0, 0, 0);
            const daysUntilService = Math.round((serviceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (!shouldSendReminder(service.frequency, daysUntilService)) {
                skipped.push({ id: service.id, clientName: service.client_name, reason: `Not a reminder day. ${daysUntilService} days until service.` });
                continue;
            }
            const reminder = await sendRecurringReminder(service);
            if (reminder.sent) {
                sent += 1;
            }
            else {
                skipped.push({ id: service.id, clientName: service.client_name, reason: reminder.reason || "Reminder not sent" });
            }
        }
        return res.json({ scanned: result.rows.length, sent, skipped });
    }
    catch (error) {
        console.error("recurring scan reminders error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.post("/:id/create-next-job", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { id } = req.params;
        const recurringResult = await pool.query(`SELECT * FROM recurring_services WHERE id = $1 LIMIT 1`, [id]);
        if (recurringResult.rows.length === 0)
            return res.status(404).json({ error: "Recurring service not found" });
        const service = recurringResult.rows[0];
        if (service.status !== "active")
            return res.status(400).json({ error: "Only active recurring services can create jobs" });
        const serviceDate = service.next_service_date || new Date().toISOString().slice(0, 10);
        const jobResult = await pool.query(`INSERT INTO jobs (title, client_name, address, start_time, end_time, status, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, 'scheduled', $6, $7) RETURNING *`, [service.service_type, service.client_name, service.address,
            `${serviceDate}T09:00:00`, `${serviceDate}T10:00:00`,
            service.notes || "Created from recurring service subscription.", req.user.id]);
        return res.status(201).json({ job: jobResult.rows[0] });
    }
    catch (error) {
        console.error("recurring create job error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`DELETE FROM recurring_services WHERE id = $1 RETURNING id`, [id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Recurring service not found" });
        return res.json({ deleted: true });
    }
    catch (error) {
        console.error("recurring delete error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
export default router;
