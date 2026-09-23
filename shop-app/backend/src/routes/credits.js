const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const validate = require('../middleware/validate');

// ── GET /credits ──────────────────────────────────────────────────────────────
// ?status=pending|paid  (default: all)
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM credits WHERE 1=1';
    const params = [];

    if (status === 'pending') {
      query += ' AND is_paid = FALSE';
    } else if (status === 'paid') {
      query += ' AND is_paid = TRUE';
    }

    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// ── POST /credits ─────────────────────────────────────────────────────────────
// Create a credit record (called from sell screen Pay Later)
router.post('/', async (req, res, next) => {
  try {
    const { customer_name, phone, amount, note, sale_id } = req.body;
    validate(req.body, ['customer_name', 'amount']);

    if (parseFloat(amount) <= 0) {
      const err = new Error('Amount must be greater than 0');
      err.status = 400; throw err;
    }

    const { rows } = await pool.query(
      `INSERT INTO credits (customer_name, phone, amount, note, sale_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [customer_name.trim(), phone?.trim() || null, amount, note?.trim() || null, sale_id || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// ── PATCH /credits/:id/paid ───────────────────────────────────────────────────
// Mark a credit as paid
router.patch('/:id/paid', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE credits
       SET is_paid = TRUE, paid_at = NOW()
       WHERE id = $1 AND is_paid = FALSE
       RETURNING *`,
      [req.params.id]
    );
    if (rows.length === 0) {
      const err = new Error('Credit not found or already paid');
      err.status = 404; throw err;
    }
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ── DELETE /credits/:id ───────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM credits WHERE id = $1', [req.params.id]);
    if (rowCount === 0) {
      const err = new Error('Credit not found');
      err.status = 404; throw err;
    }
    res.json({ message: 'Credit deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
