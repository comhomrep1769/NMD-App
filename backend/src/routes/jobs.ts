import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { sendPushToUser } from "../services/push.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const isAdmin = req.user!.role === "admin";

    const result = isAdmin
      ? await pool.query(
          `
          SELECT
            j.id,
            j.title,
            j.client_name,
            j.address,
            j.start_time,
            j.end_time,
            j.status,
            j.notes,
            j.created_by,
            j.created_at,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', u.id,
                  'displayName', u.display_name,
                  'email', u.email
                )
              ) FILTER (WHERE u.id IS NOT NULL),
              '[]'
            ) AS assigned_employees
          FROM jobs j
          LEFT JOIN job_assignments ja ON ja.job_id = j.id
          LEFT JOIN users u ON u.id = ja.user_id
          GROUP BY j.id
          ORDER BY j.start_time ASC
          `
        )
      : await pool.query(
          `
          SELECT
            j.id,
            j.title,
            j.client_name,
            j.address,
            j.start_time,
            j.end_time,
            j.status,
            j.notes,
            j.created_by,
            j.created_at,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', u.id,
                  'displayName', u.display_name,
                  'email', u.email
                )
              ) FILTER (WHERE u.id IS NOT NULL),
              '[]'
            ) AS assigned_employees
          FROM jobs j
          JOIN job_assignments myja ON myja.job_id = j.id
          LEFT JOIN job_assignments ja ON ja.job_id = j.id
          LEFT JOIN users u ON u.id = ja.user_id
          WHERE myja.user_id = $1
          GROUP BY j.id
          ORDER BY j.start_time ASC
          `,
          [req.user!.id]
        );

    return res.json({ jobs: result.rows });
  } catch (error) {
    console.error("jobs list error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/check-conflicts", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { startTime, endTime, assignedUserIds } = req.body as {
      startTime?: string;
      endTime?: string;
      assignedUserIds?: string[];
    };

    if (!startTime || !endTime || !Array.isArray(assignedUserIds)) {
      return res.status(400).json({ error: "Missing conflict check fields" });
    }

    if (assignedUserIds.length === 0) {
      return res.json({ conflicts: [] });
    }

    const result = await pool.query(
      `
      SELECT
        a.id,
        a.user_id,
        u.display_name,
        a.start_time,
        a.end_time,
        a.reason
      FROM availability a
      JOIN users u ON u.id = a.user_id
      WHERE a.user_id = ANY($1::uuid[])
        AND a.start_time < $3
        AND a.end_time > $2
      ORDER BY a.start_time ASC
      `,
      [assignedUserIds, startTime, endTime]
    );

    return res.json({ conflicts: result.rows });
  } catch (error) {
    console.error("job conflict check error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const {
      title,
      clientName,
      address,
      startTime,
      endTime,
      status,
      notes,
      assignedUserIds,
      forceCreate
    } = req.body as {
      title?: string;
      clientName?: string;
      address?: string;
      startTime?: string;
      endTime?: string;
      status?: "scheduled" | "in_progress" | "completed" | "cancelled";
      notes?: string;
      assignedUserIds?: string[];
      forceCreate?: boolean;
    };

    if (!title || !clientName || !address || !startTime || !endTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (Array.isArray(assignedUserIds) && assignedUserIds.length > 0 && !forceCreate) {
      const conflictResult = await pool.query(
        `
        SELECT
          a.id,
          a.user_id,
          u.display_name,
          a.start_time,
          a.end_time,
          a.reason
        FROM availability a
        JOIN users u ON u.id = a.user_id
        WHERE a.user_id = ANY($1::uuid[])
          AND a.start_time < $3
          AND a.end_time > $2
        ORDER BY a.start_time ASC
        `,
        [assignedUserIds, startTime, endTime]
      );

      if (conflictResult.rows.length > 0) {
        return res.status(409).json({
          error: "Schedule conflict detected",
          conflicts: conflictResult.rows
        });
      }
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const jobResult = await client.query(
        `
        INSERT INTO jobs (title, client_name, address, start_time, end_time, status, notes, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
        `,
        [
          title,
          clientName,
          address,
          startTime,
          endTime,
          status || "scheduled",
          notes || null,
          req.user!.id
        ]
      );

      const job = jobResult.rows[0];

      if (Array.isArray(assignedUserIds) && assignedUserIds.length > 0) {
        for (const userId of assignedUserIds) {
          await client.query(
            `
            INSERT INTO job_assignments (job_id, user_id)
            VALUES ($1, $2)
            ON CONFLICT (job_id, user_id) DO NOTHING
            `,
            [job.id, userId]
          );
        }
      }

      await client.query("COMMIT");

      if (Array.isArray(assignedUserIds) && assignedUserIds.length > 0) {
        for (const userId of assignedUserIds) {
          await sendPushToUser(userId, {
            title: "New NMD Job Assigned",
            body: `${title} â€” ${clientName}`,
            url: "/"
          });
        }
      }

      return res.status(201).json({ job });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("job create error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:jobId", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { jobId } = req.params;
    const {
      title,
      clientName,
      address,
      startTime,
      endTime,
      status,
      notes,
      assignedUserIds,
      forceUpdate
    } = req.body as {
      title?: string;
      clientName?: string;
      address?: string;
      startTime?: string;
      endTime?: string;
      status?: "scheduled" | "in_progress" | "completed" | "cancelled";
      notes?: string;
      assignedUserIds?: string[];
      forceUpdate?: boolean;
    };

    const currentJobResult = await pool.query(
      `SELECT start_time, end_time FROM jobs WHERE id = $1 LIMIT 1`,
      [jobId]
    );

    if (currentJobResult.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    const finalStartTime = startTime || currentJobResult.rows[0].start_time;
    const finalEndTime = endTime || currentJobResult.rows[0].end_time;

    if (Array.isArray(assignedUserIds) && assignedUserIds.length > 0 && !forceUpdate) {
      const conflictResult = await pool.query(
        `
        SELECT
          a.id,
          a.user_id,
          u.display_name,
          a.start_time,
          a.end_time,
          a.reason
        FROM availability a
        JOIN users u ON u.id = a.user_id
        WHERE a.user_id = ANY($1::uuid[])
          AND a.start_time < $3
          AND a.end_time > $2
        ORDER BY a.start_time ASC
        `,
        [assignedUserIds, finalStartTime, finalEndTime]
      );

      if (conflictResult.rows.length > 0) {
        return res.status(409).json({
          error: "Schedule conflict detected",
          conflicts: conflictResult.rows
        });
      }
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const updated = await client.query(
        `
        UPDATE jobs
        SET
          title = COALESCE($2, title),
          client_name = COALESCE($3, client_name),
          address = COALESCE($4, address),
          start_time = COALESCE($5, start_time),
          end_time = COALESCE($6, end_time),
          status = COALESCE($7, status),
          notes = $8
        WHERE id = $1
        RETURNING *
        `,
        [
          jobId,
          title ?? null,
          clientName ?? null,
          address ?? null,
          startTime ?? null,
          endTime ?? null,
          status ?? null,
          notes ?? null
        ]
      );

      if (updated.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Job not found" });
      }

      if (Array.isArray(assignedUserIds)) {
        await client.query(`DELETE FROM job_assignments WHERE job_id = $1`, [jobId]);

        for (const userId of assignedUserIds) {
          await client.query(
            `
            INSERT INTO job_assignments (job_id, user_id)
            VALUES ($1, $2)
            ON CONFLICT (job_id, user_id) DO NOTHING
            `,
            [jobId, userId]
          );
        }
      }

      await client.query("COMMIT");

      if (Array.isArray(assignedUserIds) && assignedUserIds.length > 0) {
        const updatedJob = updated.rows[0];

        for (const userId of assignedUserIds) {
          await sendPushToUser(userId, {
            title: "NMD Schedule Updated",
            body: `${title || updatedJob.title || "A scheduled job"} was updated.`,
            url: "/"
          });
        }
      }

      return res.json({ job: updated.rows[0] });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("job update error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:jobId", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { jobId } = req.params;

    const result = await pool.query(
      `DELETE FROM jobs WHERE id = $1 RETURNING id`,
      [jobId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    return res.json({ deleted: true });
  } catch (error) {
    console.error("job delete error", error);
    return res.status(500).json({ error: "Server error" });
  }
});


router.get("/board", requireAuth, requireRole("employee"), async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        j.id, j.title, j.client_name, j.address,
        j.start_time, j.end_time, j.status, j.notes, j.created_at,
        COALESCE(
          json_agg(json_build_object('id', u.id, 'displayName', u.display_name))
          FILTER (WHERE u.id IS NOT NULL), '[]'
        ) AS assigned_employees
      FROM jobs j
      LEFT JOIN job_assignments ja ON ja.job_id = j.id
      LEFT JOIN users u ON u.id = ja.user_id
      WHERE j.status = 'scheduled'
        AND j.id NOT IN (
          SELECT job_id FROM job_assignments WHERE user_id = $1
        )
      GROUP BY j.id
      ORDER BY j.start_time ASC
      `,
      [req.user!.id]
    );
    return res.json({ jobs: result.rows });
  } catch (error) {
    console.error("job board error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/:jobId/claim", requireAuth, requireRole("employee"), async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user!.id;

    const jobResult = await pool.query(
      `SELECT * FROM jobs WHERE id = $1 AND status = 'scheduled' LIMIT 1`,
      [jobId]
    );

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: "Job not found or no longer available." });
    }

    await pool.query(
      `INSERT INTO job_assignments (job_id, user_id) VALUES ($1, $2) ON CONFLICT (job_id, user_id) DO NOTHING`,
      [jobId, userId]
    );

    return res.json({ claimed: true, jobId });
  } catch (error) {
    console.error("job claim error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;

