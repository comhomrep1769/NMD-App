import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  sendEmployeeOnWaySms,
  sendEmployeeArrivedSms,
  sendJobCompleteSms,
} from '../services/sms.js';

const router = Router();

// ── Geocode an address using Nominatim (free, no key needed) ─────────────────
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const encoded = encodeURIComponent(address);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
      { headers: { 'User-Agent': 'NMD-Pressure-Washing-App/1.0' } }
    );
    const data = await res.json() as Array<{ lat: string; lon: string }>;
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

// ── Helper: get client info for SMS ─────────────────────────────────────────
async function getJobClientInfo(jobId: string) {
  const result = await pool.query(
    `SELECT j.id, j.title AS service_name, c.name AS client_name,
            c.phone AS client_phone, c.sms_consent
     FROM jobs j
     LEFT JOIN clients c ON c.id = j.client_id
     WHERE j.id = $1`,
    [jobId]
  );
  return result.rows[0] || null;
}

async function getEmployeeName(userId: string) {
  const result = await pool.query(
    `SELECT display_name AS name FROM users WHERE id = $1`,
    [userId]
  );
  return result.rows[0]?.name || 'Your technician';
}

// ── ADMIN: Get all jobs for a date ───────────────────────────────────────────
// GET /api/routes/jobs-for-date?date=YYYY-MM-DD
router.get('/jobs-for-date', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { date } = req.query as { date?: string };
    if (!date) return res.status(400).json({ error: 'date required' });

    const result = await pool.query(
      `SELECT j.id, j.title, j.client_name, j.address, j.start_time, j.end_time,
              j.status, j.notes, j.lat, j.lng,
              COALESCE(
                json_agg(json_build_object('id', u.id, 'displayName', u.display_name))
                FILTER (WHERE u.id IS NOT NULL), '[]'
              ) AS assigned_employees
       FROM jobs j
       LEFT JOIN job_assignments ja ON ja.job_id = j.id
       LEFT JOIN users u ON u.id = ja.user_id
       WHERE j.status = 'scheduled'
         AND DATE(j.start_time AT TIME ZONE 'America/New_York') = $1
       GROUP BY j.id
       ORDER BY j.start_time ASC`,
      [date]
    );

    // Geocode any jobs missing lat/lng
    const jobs = result.rows;
    for (const job of jobs) {
      if (!job.lat || !job.lng) {
        const coords = await geocodeAddress(job.address);
        if (coords) {
          job.lat = coords.lat;
          job.lng = coords.lng;
          await pool.query(
            `UPDATE jobs SET lat=$1, lng=$2 WHERE id=$3`,
            [coords.lat, coords.lng, job.id]
          );
        }
      }
    }

    return res.json({ jobs });
  } catch (error) {
    console.error('[routes/jobs-for-date]', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── ADMIN: Get all employees ─────────────────────────────────────────────────
// GET /api/routes/employees
router.get('/employees', requireAuth, requireRole('admin'), async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, display_name AS name, email
       FROM users
       WHERE role = 'employee'
       ORDER BY display_name ASC`
    );
    return res.json({ employees: result.rows });
  } catch (error) {
    console.error('[routes/employees]', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── EMPLOYEE: Get my route for a date ───────────────────────────────────────
// GET /api/routes/my-route?date=YYYY-MM-DD
// NOTE: must be registered BEFORE GET '/' to avoid route conflict
router.get('/my-route', requireAuth, async (req: Request, res: Response) => {
  try {
    const { date } = req.query as { date?: string };
    const userId = (req as any).user?.id as string;
    const routeDate = date || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT r.id AS route_id,
              rs.id AS stop_id,
              rs.stop_order,
              rs.departed_at,
              rs.arrived_at,
              rs.completed_at,
              j.id AS job_id,
              j.title,
              j.client_name,
              j.address,
              j.lat,
              j.lng,
              j.start_time,
              j.end_time,
              j.notes
       FROM routes r
       JOIN route_stops rs ON rs.route_id = r.id
       JOIN jobs j ON j.id = rs.job_id
       WHERE r.employee_id = $1 AND r.route_date = $2
       ORDER BY rs.stop_order ASC`,
      [userId, routeDate]
    );

    return res.json({ stops: result.rows, date: routeDate });
  } catch (error) {
    console.error('[routes/my-route]', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── ADMIN: Get all routes for a date ────────────────────────────────────────
// GET /api/routes?date=YYYY-MM-DD
router.get('/', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { date } = req.query as { date?: string };
    if (!date) return res.status(400).json({ error: 'date required' });

    const result = await pool.query(
      `SELECT r.id, r.employee_id, r.route_date,
              u.display_name AS employee_name,
              COALESCE(
                json_agg(
                  json_build_object(
                    'stopId', rs.id,
                    'jobId', j.id,
                    'stopOrder', rs.stop_order,
                    'title', j.title,
                    'clientName', j.client_name,
                    'address', j.address,
                    'lat', j.lat,
                    'lng', j.lng,
                    'startTime', j.start_time,
                    'departedAt', rs.departed_at,
                    'arrivedAt', rs.arrived_at,
                    'completedAt', rs.completed_at
                  ) ORDER BY rs.stop_order ASC
                ) FILTER (WHERE rs.id IS NOT NULL), '[]'
              ) AS stops
       FROM routes r
       JOIN users u ON u.id = r.employee_id
       LEFT JOIN route_stops rs ON rs.route_id = r.id
       LEFT JOIN jobs j ON j.id = rs.job_id
       WHERE r.route_date = $1
       GROUP BY r.id, u.display_name
       ORDER BY u.display_name ASC`,
      [date]
    );

    return res.json({ routes: result.rows });
  } catch (error) {
    console.error('[routes GET /]', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── ADMIN: Create or replace a route ────────────────────────────────────────
// POST /api/routes
// body: { employeeId: UUID, date: 'YYYY-MM-DD', jobIds: [UUID, ...] }
router.post('/', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { employeeId, date, jobIds } = req.body as {
      employeeId?: string;
      date?: string;
      jobIds?: string[];
    };

    if (!employeeId || !date || !Array.isArray(jobIds)) {
      return res.status(400).json({ error: 'employeeId, date, and jobIds are required' });
    }

    const createdBy = (req as any).user?.id as string;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const routeResult = await client.query(
        `INSERT INTO routes (employee_id, route_date, created_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (employee_id, route_date)
         DO UPDATE SET created_by = EXCLUDED.created_by
         RETURNING id`,
        [employeeId, date, createdBy]
      );
      const routeId = routeResult.rows[0].id;

      await client.query(`DELETE FROM route_stops WHERE route_id = $1`, [routeId]);

      for (let i = 0; i < jobIds.length; i++) {
        await client.query(
          `INSERT INTO route_stops (route_id, job_id, stop_order) VALUES ($1, $2, $3)`,
          [routeId, jobIds[i], i + 1]
        );
      }

      await client.query('COMMIT');
      return res.status(201).json({ routeId, message: 'Route saved' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[routes POST /]', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── ADMIN: Reorder stops ─────────────────────────────────────────────────────
// PUT /api/routes/:routeId/stops
router.put('/:routeId/stops', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { routeId } = req.params;
    const { jobIds } = req.body as { jobIds?: string[] };
    if (!Array.isArray(jobIds)) return res.status(400).json({ error: 'jobIds required' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`DELETE FROM route_stops WHERE route_id = $1`, [routeId]);
      for (let i = 0; i < jobIds.length; i++) {
        await client.query(
          `INSERT INTO route_stops (route_id, job_id, stop_order) VALUES ($1, $2, $3)`,
          [routeId, jobIds[i], i + 1]
        );
      }
      await client.query('COMMIT');
      return res.json({ updated: true });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[routes PUT stops]', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── EMPLOYEE: Depart (On My Way) ─────────────────────────────────────────────
// POST /api/routes/stops/:stopId/depart
router.post('/stops/:stopId/depart', requireAuth, async (req: Request, res: Response) => {
  try {
    const { stopId } = req.params;
    const userId = (req as any).user?.id as string;

    const stopResult = await pool.query(
      `UPDATE route_stops SET departed_at = NOW()
       WHERE id = $1
       RETURNING job_id, departed_at`,
      [stopId]
    );

    if (stopResult.rows.length === 0) return res.status(404).json({ error: 'Stop not found' });

    const jobId = stopResult.rows[0].job_id as string;
    const job = await getJobClientInfo(jobId);
    let smsSent = false;

    if (job?.sms_consent && job?.client_phone) {
      const employeeName = await getEmployeeName(userId);
      const result = await sendEmployeeOnWaySms(job.client_phone, job.client_name, employeeName);
      smsSent = result.success;
    }

    return res.json({ departed: true, departedAt: stopResult.rows[0].departed_at, smsSent });
  } catch (error) {
    console.error('[stops/depart]', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── EMPLOYEE: Arrive ─────────────────────────────────────────────────────────
// POST /api/routes/stops/:stopId/arrive
router.post('/stops/:stopId/arrive', requireAuth, async (req: Request, res: Response) => {
  try {
    const { stopId } = req.params;
    const userId = (req as any).user?.id as string;

    const stopResult = await pool.query(
      `UPDATE route_stops SET arrived_at = NOW()
       WHERE id = $1
       RETURNING job_id, arrived_at`,
      [stopId]
    );

    if (stopResult.rows.length === 0) return res.status(404).json({ error: 'Stop not found' });

    const jobId = stopResult.rows[0].job_id as string;
    const job = await getJobClientInfo(jobId);
    let smsSent = false;

    if (job?.sms_consent && job?.client_phone) {
      const employeeName = await getEmployeeName(userId);
      const result = await sendEmployeeArrivedSms(job.client_phone, job.client_name, employeeName);
      smsSent = result.success;
    }

    return res.json({ arrived: true, arrivedAt: stopResult.rows[0].arrived_at, smsSent });
  } catch (error) {
    console.error('[stops/arrive]', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── EMPLOYEE: Complete ───────────────────────────────────────────────────────
// POST /api/routes/stops/:stopId/complete
router.post('/stops/:stopId/complete', requireAuth, async (req: Request, res: Response) => {
  try {
    const { stopId } = req.params;

    const stopResult = await pool.query(
      `UPDATE route_stops SET completed_at = NOW()
       WHERE id = $1
       RETURNING job_id, completed_at`,
      [stopId]
    );

    if (stopResult.rows.length === 0) return res.status(404).json({ error: 'Stop not found' });

    const jobId = stopResult.rows[0].job_id as string;
    const job = await getJobClientInfo(jobId);
    let smsSent = false;

    if (job?.sms_consent && job?.client_phone) {
      const result = await sendJobCompleteSms(job.client_phone, job.client_name, job.service_name);
      smsSent = result.success;
    }

    await pool.query(`UPDATE jobs SET status = 'completed' WHERE id = $1`, [jobId]);

    return res.json({ completed: true, completedAt: stopResult.rows[0].completed_at, smsSent });
  } catch (error) {
    console.error('[stops/complete]', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;