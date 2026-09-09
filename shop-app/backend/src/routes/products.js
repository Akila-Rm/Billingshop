const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const validate = require('../middleware/validate');

// ── GET /products ─────────────────────────────────────────────────────────────
// ?search=  ?category=  ?barcode=
router.get('/', async (req, res, next) => {
  try {
    const { search = '', category = '', barcode = '' } = req.query;
    const params = [];
    let query = 'SELECT * FROM products WHERE 1=1';

    if (barcode) {
      params.push(barcode);
      query += ` AND barcode = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR brand ILIKE $${params.length} OR barcode ILIKE $${params.length})`;
    }
    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// ── POST /products ────────────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const {
      name, brand, size_or_volume,
      cost_price, purchase_price, selling_price,
      mrp, msp, barcode,
      stock_quantity, low_stock_threshold, image_url,
    } = req.body;
    const category = 'Perfumes'; // Hardcoded for DB compatibility

    validate(req.body, ['name', 'selling_price', 'stock_quantity']);

    // purchase_price OR cost_price must be provided
    const finalPurchasePrice = purchase_price ?? cost_price;
    if (!finalPurchasePrice || isNaN(parseFloat(finalPurchasePrice)) || parseFloat(finalPurchasePrice) <= 0) {
      const err = new Error('Purchase price is required and must be greater than 0');
      err.status = 400; throw err;
    }

    // MSP check: selling price must be >= MSP if provided
    if (msp && parseFloat(selling_price) < parseFloat(msp)) {
      const err = new Error(`Selling price (₹${selling_price}) cannot be less than MSP (₹${msp})`);
      err.status = 400; throw err;
    }

    const { rows } = await pool.query(
      `INSERT INTO products
         (name, category, brand, size_or_volume,
          cost_price, purchase_price, selling_price,
          mrp, msp, barcode,
          stock_quantity, low_stock_threshold, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        name, category, brand || null, size_or_volume || null,
        finalPurchasePrice, finalPurchasePrice, selling_price,
        mrp || null, msp || null, barcode || null,
        stock_quantity, low_stock_threshold ?? 5,
        image_url || null,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// ── PUT /products/:id ─────────────────────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, brand, size_or_volume,
      cost_price, purchase_price, selling_price,
      mrp, msp, barcode,
      stock_quantity, low_stock_threshold, image_url,
    } = req.body;
    const category = 'Perfumes'; // Hardcoded for DB compatibility

    validate(req.body, ['name', 'selling_price', 'stock_quantity']);

    const finalPurchasePrice = purchase_price ?? cost_price;
    if (!finalPurchasePrice || isNaN(parseFloat(finalPurchasePrice)) || parseFloat(finalPurchasePrice) <= 0) {
      const err = new Error('Purchase price is required and must be greater than 0');
      err.status = 400; throw err;
    }

    if (msp && parseFloat(selling_price) < parseFloat(msp)) {
      const err = new Error(`Selling price (₹${selling_price}) cannot be less than MSP (₹${msp})`);
      err.status = 400; throw err;
    }

    const { rows } = await pool.query(
      `UPDATE products SET
         name=$1, category=$2, brand=$3, size_or_volume=$4,
         cost_price=$5, purchase_price=$6, selling_price=$7,
         mrp=$8, msp=$9, barcode=$10,
         stock_quantity=$11, low_stock_threshold=$12, image_url=$13
       WHERE id=$14
       RETURNING *`,
      [
        name, category, brand || null, size_or_volume || null,
        finalPurchasePrice, finalPurchasePrice, selling_price,
        mrp || null, msp || null, barcode || null,
        stock_quantity, low_stock_threshold ?? 5,
        image_url || null, id,
      ]
    );

    if (rows.length === 0) {
      const err = new Error('Product not found'); err.status = 404; throw err;
    }
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ── DELETE /products/:id ──────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM products WHERE id=$1', [req.params.id]);
    if (rowCount === 0) {
      const err = new Error('Product not found'); err.status = 404; throw err;
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (err) { next(err); }
});

module.exports = router;
