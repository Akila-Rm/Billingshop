-- ============================================================
-- Shop App — PostgreSQL schema
-- Run once: psql -U postgres -d shop_app -f src/db/init.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(150) NOT NULL,
  category          VARCHAR(50)  NOT NULL CHECK (category IN ('Slippers', 'Perfumes')),
  brand             VARCHAR(100),
  size_or_volume    VARCHAR(50),
  cost_price        NUMERIC(10,2) NOT NULL,
  selling_price     NUMERIC(10,2) NOT NULL,
  stock_quantity    INTEGER       NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER     NOT NULL DEFAULT 5,
  image_url         TEXT,
  created_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id               SERIAL PRIMARY KEY,
  subtotal         NUMERIC(10,2) NOT NULL,
  discount_type    VARCHAR(10) CHECK (discount_type IN ('percent', 'flat')),
  discount_value   NUMERIC(10,2) DEFAULT 0,
  discount_amount  NUMERIC(10,2) DEFAULT 0,
  total_amount     NUMERIC(10,2) NOT NULL,
  total_profit     NUMERIC(10,2) NOT NULL,
  payment_mode     VARCHAR(20) CHECK (payment_mode IN ('Cash', 'UPI', 'Card')),
  sale_date        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
  id             SERIAL PRIMARY KEY,
  sale_id        INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  product_id     INTEGER REFERENCES products(id),
  quantity       INTEGER       NOT NULL,
  price_at_sale  NUMERIC(10,2) NOT NULL,
  cost_at_sale   NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id           SERIAL PRIMARY KEY,
  category     VARCHAR(50)   NOT NULL,
  amount       NUMERIC(10,2) NOT NULL,
  note         TEXT,
  expense_date TIMESTAMP DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_sales_date        ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale   ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date     ON expenses(expense_date);
