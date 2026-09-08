-- ============================================================
-- Migration v2 — Add MRP, MSP, barcode fields
-- Run: psql -U postgres -d shop_app -f src/db/migrate_v2.sql
-- ============================================================

-- Add new columns to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS mrp            NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS msp            NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS barcode        VARCHAR(100),
  ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(10,2);

-- Copy existing cost_price into purchase_price
UPDATE products SET purchase_price = cost_price WHERE purchase_price IS NULL;

-- Add barcode index for fast lookup
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

-- Done
SELECT 'Migration v2 complete' AS status;
