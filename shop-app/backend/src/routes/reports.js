const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// ── GET /reports/summary ──────────────────────────────────────────────────────
// Supports ?from=<ISO>&to=<ISO>
// Returns: total_revenue, total_profit, profit_by_category, best_sellers, total_expenses, net_profit
router.get('/summary', async (req, res, next) => {
  try {
    const { from, to } = req.query;

    // Build date condition for sales
    const saleConditions = [];
    const params = [];

    if (from) {
      params.push(from);
      saleConditions.push(`s.sale_date >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      saleConditions.push(`s.sale_date <= $${params.length}`);
    }
    const saleWhere = saleConditions.length ? `WHERE ${saleConditions.join(' AND ')}` : '';

    // ── Total revenue & profit ────────────────────────────────────────────────
    const summaryQuery = `
      SELECT
        COALESCE(SUM(s.total_amount), 0)  AS total_revenue,
        COALESCE(SUM(s.total_profit), 0)  AS total_profit,
        COUNT(s.id)                        AS total_sales
      FROM sales s
      ${saleWhere}`;

    const { rows: summaryRows } = await pool.query(summaryQuery, params);
    const { total_revenue, total_profit, total_sales } = summaryRows[0];

    // ── Profit by category ────────────────────────────────────────────────────
    const categoryParams = [...params];
    const categoryQuery = `
      SELECT
        p.category,
        COALESCE(SUM(si.quantity * (si.price_at_sale - si.cost_at_sale)), 0) AS category_profit,
        COALESCE(SUM(si.quantity * si.price_at_sale), 0)                     AS category_revenue
      FROM sale_items si
      JOIN products p  ON p.id  = si.product_id
      JOIN sales    s  ON s.id  = si.sale_id
      ${saleWhere}
      GROUP BY p.category`;

    const { rows: categoryRows } = await pool.query(categoryQuery, categoryParams);

    // ── Best sellers ──────────────────────────────────────────────────────────
    const bestQuery = `
      SELECT
        p.id,
        p.name,
        p.category,
        SUM(si.quantity) AS total_qty_sold,
        SUM(si.quantity * si.price_at_sale) AS total_revenue
      FROM sale_items si
      JOIN products p ON p.id = si.product_id
      JOIN sales    s ON s.id = si.sale_id
      ${saleWhere}
      GROUP BY p.id, p.name, p.category
      ORDER BY total_qty_sold DESC
      LIMIT 10`;

    const { rows: bestSellers } = await pool.query(bestQuery, [...params]);

    // ── Expenses in the same date range ──────────────────────────────────────
    const expConditions = [];
    const expParams = [];
    if (from) {
      expParams.push(from);
      expConditions.push(`expense_date >= $${expParams.length}`);
    }
    if (to) {
      expParams.push(to);
      expConditions.push(`expense_date <= $${expParams.length}`);
    }
    const expWhere = expConditions.length ? `WHERE ${expConditions.join(' AND ')}` : '';

    const expQuery = `SELECT COALESCE(SUM(amount), 0) AS total_expenses FROM expenses ${expWhere}`;
    const { rows: expRows } = await pool.query(expQuery, expParams);
    const total_expenses = parseFloat(expRows[0].total_expenses);

    const net_profit = parseFloat(total_profit) - total_expenses;

    res.json({
      total_revenue: parseFloat(total_revenue),
      total_profit: parseFloat(total_profit),
      total_sales: parseInt(total_sales, 10),
      profit_by_category: categoryRows.map((r) => ({
        category: r.category,
        profit: parseFloat(r.category_profit),
        revenue: parseFloat(r.category_revenue),
      })),
      best_sellers: bestSellers.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        total_qty_sold: parseInt(r.total_qty_sold, 10),
        total_revenue: parseFloat(r.total_revenue),
      })),
      total_expenses,
      net_profit,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
