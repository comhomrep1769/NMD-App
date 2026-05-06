import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/me", requireAuth, requireRole("client"), async (req, res) => {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email;

    const clientResult = await pool.query(
      `
      SELECT *
      FROM clients
      WHERE user_id = $1
         OR LOWER(email) = LOWER($2)
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [userId, userEmail]
    );

    const client = clientResult.rows[0] || null;

    if (!client) {
      return res.json({
        client: null,
        quotes: [],
        invoices: [],
        jobs: [],
        recurringServices: [],
        serviceRequests: []
      });
    }

    const [quotesResult, invoicesResult, jobsResult, recurringResult, requestsResult] =
      await Promise.all([
        pool.query(
          `
          SELECT
            id,
            quote_number,
            client_id,
            client_name,
            service_type,
            total,
            status,
            converted_invoice_id,
            accepted_at,
            created_at
          FROM quotes
          WHERE client_id = $1
             OR LOWER(client_name) = LOWER($2)
          ORDER BY created_at DESC
          `,
          [client.id, `${client.first_name} ${client.last_name}`]
        ),

        pool.query(
          `
          SELECT
            id,
            invoice_number,
            client_id,
            client_name,
            job_name,
            total,
            status,
            job_id,
            assigned_user_id,
            created_at,
            payment_provider,
            payment_link_id,
            payment_link_url,
            payment_status,
            payment_created_at,
            stripe_checkout_session_id
          FROM invoices
          WHERE client_id = $1
             OR LOWER(client_name) = LOWER($2)
          ORDER BY created_at DESC
          `,
          [client.id, `${client.first_name} ${client.last_name}`]
        ),

        pool.query(
          `
          SELECT
            id,
            title,
            client_name,
            address,
            start_time,
            end_time,
            status,
            notes,
            created_at
          FROM jobs
          WHERE LOWER(client_name) = LOWER($1)
             OR LOWER(address) = LOWER($2)
          ORDER BY start_time DESC
          `,
          [`${client.first_name} ${client.last_name}`, client.address]
        ),

        pool.query(
          `
          SELECT
            id,
            client_id,
            client_name,
            phone,
            email,
            address,
            service_type,
            frequency,
            price,
            status,
            next_service_date,
            notes,
            created_at
          FROM recurring_services
          WHERE client_id = $1
             OR LOWER(email) = LOWER($2)
          ORDER BY next_service_date ASC NULLS LAST, created_at DESC
          `,
          [client.id, client.email]
        ),

        pool.query(
          `
          SELECT
            id,
            first_name,
            last_name,
            phone,
            email,
            address,
            service_type,
            preferred_date,
            preferred_time,
            notes,
            photo_data_url,
            photo_note,
            waiver_accepted,
            waiver_signature,
            waiver_signed_at,
            status,
            created_at
          FROM service_requests
          WHERE LOWER(email) = LOWER($1)
             OR LOWER(phone) = LOWER($2)
          ORDER BY created_at DESC
          `,
          [client.email, client.phone]
        )
      ]);

    return res.json({
      client: {
        id: client.id,
        firstName: client.first_name,
        lastName: client.last_name,
        phone: client.phone,
        email: client.email,
        address: client.address,
        createdAt: client.created_at
      },

      quotes: quotesResult.rows.map((row) => ({
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
      })),

      invoices: invoicesResult.rows.map((row) => ({
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
      })),

      jobs: jobsResult.rows.map((row) => ({
        id: row.id,
        title: row.title,
        clientName: row.client_name,
        address: row.address,
        startTime: row.start_time,
        endTime: row.end_time,
        status: row.status,
        notes: row.notes,
        createdAt: row.created_at
      })),

      recurringServices: recurringResult.rows.map((row) => ({
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
        createdAt: row.created_at
      })),

      serviceRequests: requestsResult.rows.map((row) => ({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone,
        email: row.email,
        address: row.address,
        serviceType: row.service_type,
        preferredDate: row.preferred_date,
        preferredTime: row.preferred_time,
        notes: row.notes,
        photoDataUrl: row.photo_data_url,
        photoNote: row.photo_note,
        waiverAccepted: row.waiver_accepted,
        waiverSignature: row.waiver_signature,
        waiverSignedAt: row.waiver_signed_at,
        status: row.status,
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    console.error("client portal me error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
