const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// ── POST /sales ───────────────────────────────────────────────────────────────
// Body: { items: [{product_id, quantity}], discount_type, discount_value, payment_mode }
router.post('/', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { items, discount_type, discount_value = 0, payment_mode } = req.body;

    // ── Basic validation ──────────────────────────────────────────────────────
    if (!items || !Array.isArray(items) || items.length === 0) {
      const err = new Error('Cart is empty');
      err.status = 400;
      throw err;
    }
    if (!['Cash', 'UPI', 'Card'].includes(payment_mode)) {
      const err = new Error("payment_mode must be 'Cash', 'UPI', or 'Card'");
      err.status = 400;
      throw err;
    }
    if (discount_type && !['percent', 'flat'].includes(discount_type)) {
      const err = new Error("discount_type must be 'percent' or 'flat'");
      err.status = 400;
      throw err;
    }
    if (discount_type === 'percent' && (discount_value < 0 || discount_value > 100)) {
      const err = new Error('Percent discount must be between 0 and 100');
      err.status = 400;
      throw err;
    }

    await client.query('BEGIN');

    // ── Lock & fetch product rows ─────────────────────────────────────────────
    const productIds = items.map((i) => i.product_id);
    const { rows: products } = await client.query(
      'SELECT id, name, selling_price, cost_price, stock_quantity FROM products WHERE id = ANY($1) FOR UPDATE',
      [productIds]
    );

    const productMap = {};
    for (const p of products) productMap[p.id] = p;

    // ── Stock check ───────────────────────────────────────────────────────────
    for (const item of items) {
      const prod = productMap[item.product_id];
      if (!prod) {
        const err = new Error(`Product ID ${item.product_id} not found`);
        err.status = 404;
        throw err;
      }
      if (prod.stock_quantity < item.quantity) {
        const err = new Error(
          `Only ${prod.stock_quantity} left for "${prod.name}"`
        );
        err.status = 400;
        throw err;
      }
    }

    // ── Calculate totals ──────────────────────────────────────────────────────
    let subtotal = 0;
    let totalCost = 0;
    for (const item of items) {
      const prod = productMap[item.product_id];
      subtotal += parseFloat(prod.selling_price) * item.quantity;
      totalCost += parseFloat(prod.cost_price) * item.quantity;
    }
    subtotal = Math.round(subtotal * 100) / 100;
    totalCost = Math.round(totalCost * 100) / 100;

    // ── Discount ──────────────────────────────────────────────────────────────
    let discountAmount = 0;
    if (discount_type === 'percent') {
      discountAmount = Math.round(subtotal * (discount_value / 100) * 100) / 100;
    } else if (discount_type === 'flat') {
      discountAmount = Math.min(parseFloat(discount_value), subtotal);
      discountAmount = Math.round(discountAmount * 100) / 100;
    }

    const totalAmount = Math.round((subtotal - discountAmount) * 100) / 100;
    if (totalAmount < 0) {
      const err = new Error('Discount cannot make total amount negative');
      err.status = 400;
      throw err;
    }
    const totalProfit = Math.round((totalAmount - totalCost) * 100) / 100;

    // ── Insert sale ───────────────────────────────────────────────────────────
    const { rows: saleRows } = await client.query(
      `INSERT INTO sales
         (subtotal, discount_type, discount_value, discount_amount, total_amount, total_profit, payment_mode)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [subtotal, discount_type || null, discount_value, discountAmount, totalAmount, totalProfit, payment_mode]
    );
    const sale = saleRows[0];

    // ── Insert sale_items + deduct stock ──────────────────────────────────────
    for (const item of items) {
      const prod = productMap[item.product_id];
      await client.query(
        `INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale, cost_at_sale)
         VALUES ($1,$2,$3,$4,$5)`,
        [sale.id, item.product_id, item.quantity, prod.selling_price, prod.cost_price]
      );
      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(sale);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ── GET /sales ────────────────────────────────────────────────────────────────
// Supports ?from=<ISO>&to=<ISO>
router.get('/', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const params = [];
    let query = `
      SELECT s.*, 
             json_agg(json_build_object(
               'id', si.id,
               'product_id', si.product_id,
               'product_name', p.name,
               'quantity', si.quantity,
               'price_at_sale', si.price_at_sale,
               'cost_at_sale', si.cost_at_sale
             )) AS items
      FROM sales s
      LEFT JOIN sale_items si ON si.sale_id = s.id
      LEFT JOIN products p ON p.id = si.product_id
      WHERE 1=1`;

    if (from) {
      params.push(from);
      query += ` AND s.sale_date >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      query += ` AND s.sale_date <= $${params.length}`;
    }

    query += ' GROUP BY s.id ORDER BY s.sale_date DESC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
