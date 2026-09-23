-- Migration v3 — Credits / Udhari table
CREATE TABLE IF NOT EXISTS credits (
  id            SERIAL PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  phone         VARCHAR(15),
  amount        NUMERIC(10,2) NOT NULL,
  note          TEXT,
  is_paid       BOOLEAN DEFAULT FALSE,
  sale_id       INTEGER REFERENCES sales(id) ON DELETE SET NULL,
  created_at    TIMESTAMP DEFAULT NOW(),
  paid_at       TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_credits_paid ON credits(is_paid);
SELECT 'Migration v3 complete' AS status;
