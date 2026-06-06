import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { sendEmployeeOnWaySms, sendEmployeeArrivedSms, sendJobCompleteSms, } from '../services/sms.js';
const router = Router();
// Helper: fetch client phone + SMS consent from a job
async function getJobClientInfo(jobId) {
    const result = await pool.query(`SELECT
       j.id           AS job_id,
       j.title        AS service_name,
       c.name         AS client_name,
       c.phone        AS client_phone,
       c.sms_consent  AS sms_consent
     FROM jobs j
     LEFT JOIN clients c ON c.id = j.client_id
     WHERE j.id = $1`, [jobId]);
    return result.rows[0] || null;
}
// Helper: fetch employee name from token user id
async function getEmployeeName(userId) {
    const result = await pool.query(`SELECT name FROM users WHERE id = $1`, [userId]);
    return result.rows[0]?.name || 'Your technician';
}
// POST /api/sms/on-way
router.post('/on-way', requireAuth, async (req, res) => {
    try {
        const { jobId, eta } = req.body;
        const userId = req.user?.id;
        if (!jobId)
            return res.status(400).json({ error: 'jobId required' });
        const job = await getJobClientInfo(Number(jobId));
        if (!job)
            return res.status(404).json({ error: 'Job not found' });
        if (!job.sms_consent) {
            return res.json({ success: false, reason: 'Client has not consented to SMS updates' });
        }
        if (!job.client_phone) {
            return res.json({ success: false, reason: 'No phone number on file for client' });
        }
        const employeeName = await getEmployeeName(Number(userId));
        const result = await sendEmployeeOnWaySms(job.client_phone, job.client_name, employeeName, eta);
        return res.json(result);
    }
    catch (error) {
        console.error('[sms/on-way] error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});
// POST /api/sms/arrived
router.post('/arrived', requireAuth, async (req, res) => {
    try {
        const { jobId } = req.body;
        const userId = req.user?.id;
        if (!jobId)
            return res.status(400).json({ error: 'jobId required' });
        const job = await getJobClientInfo(Number(jobId));
        if (!job)
            return res.status(404).json({ error: 'Job not found' });
        if (!job.sms_consent) {
            return res.json({ success: false, reason: 'Client has not consented to SMS updates' });
        }
        if (!job.client_phone) {
            return res.json({ success: false, reason: 'No phone number on file for client' });
        }
        const employeeName = await getEmployeeName(Number(userId));
        const result = await sendEmployeeArrivedSms(job.client_phone, job.client_name, employeeName);
        return res.json(result);
    }
    catch (error) {
        console.error('[sms/arrived] error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});
// POST /api/sms/job-complete
router.post('/job-complete', requireAuth, async (req, res) => {
    try {
        const { jobId } = req.body;
        if (!jobId)
            return res.status(400).json({ error: 'jobId required' });
        const job = await getJobClientInfo(Number(jobId));
        if (!job)
            return res.status(404).json({ error: 'Job not found' });
        if (!job.sms_consent) {
            return res.json({ success: false, reason: 'Client has not consented to SMS updates' });
        }
        if (!job.client_phone) {
            return res.json({ success: false, reason: 'No phone number on file for client' });
        }
        const result = await sendJobCompleteSms(job.client_phone, job.client_name, job.service_name);
        return res.json(result);
    }
    catch (error) {
        console.error('[sms/job-complete] error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});
export default router;
