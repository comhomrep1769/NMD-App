import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// GET all entries (optionally filter by category)
router.get('/', requireAuth, requireRole("admin", "superadmin"), async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM guru_training';
    const params: any[] = [];

    if (category && search) {
      query += ' WHERE category = $1 AND (title ILIKE $2 OR content ILIKE $2)';
      params.push(category, `%${search}%`);
    } else if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    } else if (search) {
      query += ' WHERE title ILIKE $1 OR content ILIKE $1';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch guru training data' });
  }
});

// GET single entry
router.get('/:id', requireAuth, requireRole("admin", "superadmin"), async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM guru_training WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch entry' });
  }
});

// POST create entry
router.post('/', requireAuth, requireRole("admin", "superadmin"), async (req: Request, res: Response) => {
  try {
    const { category, title, content } = req.body;
    if (!category || !title || !content) {
      return res.status(400).json({ error: 'category, title, and content are required' });
    }
    const result = await pool.query(
      'INSERT INTO guru_training (category, title, content) VALUES ($1, $2, $3) RETURNING *',
      [category, title, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

// PUT update entry
router.put('/:id', requireAuth, requireRole("admin", "superadmin"), async (req: Request, res: Response) => {
  try {
    const { category, title, content } = req.body;
    const result = await pool.query(
      `UPDATE guru_training
       SET category = COALESCE($1, category),
           title = COALESCE($2, title),
           content = COALESCE($3, content),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [category, title, content, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

// DELETE entry
router.delete('/:id', requireAuth, requireRole("admin", "superadmin"), async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM guru_training WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

export default router;