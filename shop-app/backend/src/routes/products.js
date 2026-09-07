const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const validate = require('../middleware/validate');

// ── GET /products ─────────────────────────────────────────────────────────────
// Supports ?search=<text> and ?category=Slippers|Perfumes
router.get('/', async (req, res, next) => {
  try {
    const { search = '', category = '' } = req.query;
    const params = [];
    let query = 'SELECT * FROM products WHERE 1=1';

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR brand ILIKE $${params.length})`;
    }
    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ── POST /products ────────────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const {
      name, category, brand, size_or_volume,
      cost_price, selling_price, stock_quantity,
      low_stock_threshold, image_url,
    } = req.body;

    validate(req.body, ['name', 'category', 'cost_price', 'selling_price', 'stock_quantity']);

    if (!['Slippers', 'Perfumes'].includes(category)) {
      const err = new Error("category must be 'Slippers' or 'Perfumes'");
      err.status = 400;
      throw err;
    }

    const { rows } = await pool.query(
      `INSERT INTO products
         (name, category, brand, size_or_volume, cost_price, selling_price,
          stock_quantity, low_stock_threshold, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        name, category, brand || null, size_or_volume || null,
        cost_price, selling_price,
        stock_quantity, low_stock_threshold ?? 5,
        image_url || null,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// ── PUT /products/:id ─────────────────────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, category, brand, size_or_volume,
      cost_price, selling_price, stock_quantity,
      low_stock_threshold, image_url,
    } = req.body;

    validate(req.body, ['name', 'category', 'cost_price', 'selling_price', 'stock_quantity']);

    if (!['Slippers', 'Perfumes'].includes(category)) {
      const err = new Error("category must be 'Slippers' or 'Perfumes'");
      err.status = 400;
      throw err;
    }

    const { rows } = await pool.query(
      `UPDATE products SET
         name=$1, category=$2, brand=$3, size_or_volume=$4,
         cost_price=$5, selling_price=$6, stock_quantity=$7,
         low_stock_threshold=$8, image_url=$9
       WHERE id=$10
       RETURNING *`,
      [
        name, category, brand || null, size_or_volume || null,
        cost_price, selling_price, stock_quantity,
        low_stock_threshold ?? 5, image_url || null,
        id,
      ]
    );

    if (rows.length === 0) {
      const err = new Error('Product not found');
      err.status = 404;
      throw err;
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// ── DELETE /products/:id ──────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM products WHERE id=$1', [id]);
    if (rowCount === 0) {
      const err = new Error('Product not found');
      err.status = 404;
      throw err;
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
