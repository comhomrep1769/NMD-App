import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { buildNmdEmailTemplate, sendEmail } from "../services/email.js";

const router = Router();

function mapRecurring(row: any) {
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
    createdBy: row.created_by,
    createdAt: row.created_at
  };
}

router.get("/", requireAuth, requireRole("admin"), async (_req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM recurring_services
      ORDER BY next_service_date ASC NULLS LAST, created_at DESC
      `
    );

    return res.json({
      recurringServices: result.rows.map(mapRecurring)
    });
  } catch (error) {
    console.error("recurring list error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const {
      clientId,
      clientName,
      phone,
      email,
      address,
      serviceType,
      frequency,
      price,
      status,
      nextServiceDate,
      notes
    } = req.body;

    if (!clientName || !address) {
      return res.status(400).json({
        error: "Client name and address are required"
      });
    }

    const result = await pool.query(
      `
      INSERT INTO recurring_services
        (
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
          created_by
        )
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
      `,
      [
        clientId || null,
        clientName.trim(),
        phone?.trim() || null,
        email?.trim() || null,
        address.trim(),
        serviceType?.trim() || "Trash Can Cleaning",
        frequency || "monthly",
        price ?? 10,
        status || "active",
        nextServiceDate || null,
        notes?.trim() || null,
        req.user!.id
      ]
    );

    return res.status(201).json({
      recurringService: mapRecurring(result.rows[0])
    });
  } catch (error) {
    console.error("recurring create error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const {
      clientId,
      clientName,
      phone,
      email,
      address,
      serviceType,
      frequency,
      price,
      status,
      nextServiceDate,
      notes
    } = req.body;

    const result = await pool.query(
      `
      UPDATE recurring_services
      SET
        client_id = $2,
        client_name = COALESCE($3, client_name),
        phone = $4,
        email = $5,
        address = COALESCE($6, address),
        service_type = COALESCE($7, service_type),
        frequency = COALESCE($8, frequency),
        price = COALESCE($9, price),
        status = COALESCE($10, status),
        next_service_date = $11,
        notes = $12
      WHERE id = $1
      RETURNING *
      `,
      [
        id,
        clientId || null,
        clientName ?? null,
        phone ?? null,
        email ?? null,
        address ?? null,
        serviceType ?? null,
        frequency ?? null,
        price ?? null,
        status ?? null,
        nextServiceDate || null,
        notes ?? null
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Recurring service not found" });
    }

    return res.json({
      recurringService: mapRecurring(result.rows[0])
    });
  } catch (error) {
    console.error("recurring update error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id/status", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body as {
      status?: "active" | "paused" | "cancelled";
    };

    if (!status || !["active", "paused", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const result = await pool.query(
      `
      UPDATE recurring_services
      SET status = $2
      WHERE id = $1
      RETURNING *
      `,
      [id, status]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Recurring service not found" });
    }

    return res.json({
      recurringService: mapRecurring(result.rows[0])
    });
  } catch (error) {
    console.error("recurring status error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/:id/send-reminder", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM recurring_services
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Recurring service not found"
      });
    }

    const service = result.rows[0];

    if (!service.email) {
      return res.status(400).json({
        error: "This recurring service does not have a client email."
      });
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

    return res.json({
      sent: true,
      message: "Reminder email sent."
    });
  } catch (error) {
    console.error("recurring reminder error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/:id/create-next-job", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const recurringResult = await pool.query(
      `
      SELECT *
      FROM recurring_services
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (recurringResult.rows.length === 0) {
      return res.status(404).json({ error: "Recurring service not found" });
    }

    const service = recurringResult.rows[0];

    if (service.status !== "active") {
      return res.status(400).json({
        error: "Only active recurring services can create jobs"
      });
    }

    const serviceDate = service.next_service_date || new Date().toISOString().slice(0, 10);

    const startTime = `${serviceDate}T09:00:00`;
    const endTime = `${serviceDate}T10:00:00`;

    const result = await pool.query(
      `
      INSERT INTO jobs
        (title, client_name, address, start_time, end_time, status, notes, created_by)
      VALUES
        ($1, $2, $3, $4, $5, 'scheduled', $6, $7)
      RETURNING *
      `,
      [
        service.service_type,
        service.client_name,
        service.address,
        startTime,
        endTime,
        service.notes || "Created from recurring service subscription.",
        req.user!.id
      ]
    );

    return res.status(201).json({ job: result.rows[0] });
  } catch (error) {
    console.error("recurring create job error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM recurring_services WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Recurring service not found" });
    }

    return res.json({ deleted: true });
  } catch (error) {
    console.error("recurring delete error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
