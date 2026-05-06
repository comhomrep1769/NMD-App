import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

async function findClientForUser(userId: string, userEmail: string) {
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

  return clientResult.rows[0] || null;
}

router.get("/me", requireAuth, requireRole("client"), async (req, res) => {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email;

    const client = await findClientForUser(userId, userEmail);

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

    const fullName = `${client.first_name} ${client.last_name}`;

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
          [client.id, fullName]
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
          [client.id, fullName]
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
          [fullName, client.address]
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
          WHERE client_id = $1
             OR client_user_id = $2
             OR LOWER(email) = LOWER($3)
             OR LOWER(phone) = LOWER($4)
          ORDER BY created_at DESC
          `,
          [client.id, userId, client.email, client.phone]
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

router.post("/service-request", requireAuth, requireRole("client"), async (req, res) => {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email;

    const client = await findClientForUser(userId, userEmail);

    if (!client) {
      return res.status(400).json({
        error: "No client profile connected to this account yet."
      });
    }

    const {
      address,
      serviceType,
      preferredDate,
      preferredTime,
      notes,
      photoDataUrl,
      photoNote,
      waiverAccepted,
      waiverSignature
    } = req.body as {
      address?: string;
      serviceType?: string;
      preferredDate?: string | null;
      preferredTime?: string;
      notes?: string;
      photoDataUrl?: string | null;
      photoNote?: string;
      waiverAccepted?: boolean;
      waiverSignature?: string;
    };

    if (!serviceType) {
      return res.status(400).json({ error: "Service type is required" });
    }

    if (!waiverAccepted || !waiverSignature?.trim()) {
      return res.status(400).json({
        error: "Liability waiver acceptance and signature are required before submitting."
      });
    }

    if (photoDataUrl && photoDataUrl.length > 2_500_000) {
      return res.status(400).json({
        error: "Photo is too large. Please upload a smaller image."
      });
    }

    const result = await pool.query(
      `
      INSERT INTO service_requests
        (
          client_user_id,
          client_id,
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
          waiver_signed_at
        )
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, TRUE, $14, NOW())
      RETURNING
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
      `,
      [
        userId,
        client.id,
        client.first_name,
        client.last_name,
        client.phone,
        client.email,
        address?.trim() || client.address,
        serviceType.trim(),
        preferredDate || null,
        preferredTime?.trim() || null,
        notes?.trim() || null,
        photoDataUrl || null,
        photoNote?.trim() || null,
        waiverSignature.trim()
      ]
    );

    const row = result.rows[0];

    return res.status(201).json({
      request: {
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
      }
    });
  } catch (error) {
    console.error("client portal service request error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
