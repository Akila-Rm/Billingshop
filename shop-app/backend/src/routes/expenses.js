const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const validate = require('../middleware/validate');

// ── POST /expenses ────────────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { category, amount, note, expense_date } = req.body;
    validate(req.body, ['category', 'amount']);

    if (parseFloat(amount) <= 0) {
      const err = new Error('Amount must be greater than 0');
      err.status = 400;
      throw err;
    }

    const { rows } = await pool.query(
      `INSERT INTO expenses (category, amount, note, expense_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [category, amount, note || null, expense_date || new Date()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// ── GET /expenses ─────────────────────────────────────────────────────────────
// Supports ?from=<ISO>&to=<ISO>
router.get('/', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const params = [];
    let query = 'SELECT * FROM expenses WHERE 1=1';

    if (from) {
      params.push(from);
      query += ` AND expense_date >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      query += ` AND expense_date <= $${params.length}`;
    }

    query += ' ORDER BY expense_date DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ── DELETE /expenses/:id ──────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM expenses WHERE id=$1', [req.params.id]);
    if (rowCount === 0) {
      const err = new Error('Expense not found');
      err.status = 404;
      throw err;
    }
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
