require('dotenv').config();
const express = require('express');
const cors = require('cors');

const productsRouter = require('./routes/products');
const salesRouter = require('./routes/sales');
const reportsRouter = require('./routes/reports');
const expensesRouter = require('./routes/expenses');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/products', productsRouter);
app.use('/sales', salesRouter);
app.use('/reports', reportsRouter);
app.use('/expenses', expensesRouter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Error handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Shop API running on http://localhost:${PORT}`);
});

module.exports = app;
