# Lavanya Shop — Slipper & Perfume Shop Management App

A full-stack mobile shop management system built with **React Native (Expo)**, **Node.js + Express**, and **PostgreSQL**.

---

## Features

| Feature | Details |
|---|---|
| Product management | Add, edit, delete products in Slippers / Perfumes categories |
| Stock tracking | Auto-deducted on every sale; low-stock alerts on dashboard |
| Billing / Sell | Cart-based billing with percent or flat discounts, payment mode selection |
| Reports | Revenue, gross profit, net profit, profit-by-category bar chart, best sellers |
| Expenses | Log and track shop expenses; deducted from gross profit for net profit |

---

## Project Structure

```
shop-app/
├── backend/              Node.js + Express API
│   ├── src/
│   │   ├── db/
│   │   │   ├── pool.js   PostgreSQL connection pool
│   │   │   └── init.sql  Database schema (run once)
│   │   ├── middleware/
│   │   │   ├── errorHandler.js
│   │   │   └── validate.js
│   │   ├── routes/
│   │   │   ├── products.js
│   │   │   ├── sales.js
│   │   │   ├── reports.js
│   │   │   └── expenses.js
│   │   └── server.js
│   ├── .env              Local environment variables
│   └── package.json
│
└── frontend/             React Native (Expo) app
    ├── src/
    │   ├── navigation/   Bottom tab + stack navigator
    │   ├── screens/      5 screens (Dashboard, Products, AddProduct, Sell, Reports, Expenses)
    │   ├── components/   Shared UI components
    │   ├── services/     Axios API layer
    │   └── theme/        Colours, spacing, typography
    ├── App.js
    └── package.json
```

---

## Prerequisites

- **Node.js** v18+
- **PostgreSQL** 14+
- **Expo CLI** (`npm install -g expo-cli`) or **Expo Go** app on your phone
- **npm** or **yarn**

---

## 1 — Database Setup

```sql
-- Create the database
psql -U postgres -c "CREATE DATABASE shop_app;"

-- Run the schema
psql -U postgres -d shop_app -f backend/src/db/init.sql
```

---

## 2 — Backend Setup

```bash
cd backend
npm install
```

The `.env` file is pre-configured for local development:

```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=1234
DB_NAME=shop_app
```

> **Important:** Change `DB_PASSWORD` and use a strong secret before any public deployment.

Start the API server:

```bash
npm run dev        # development (nodemon, auto-restart)
npm start          # production
```

The API will be available at `http://localhost:3000`.

Verify it is running:

```
GET http://localhost:3000/health
→ { "status": "ok", "timestamp": "..." }
```

---

## 3 — Frontend Setup

```bash
cd frontend
npm install
```

### Connect to the backend

Open `src/services/api.js` and update `BASE_URL`:

- **Android emulator:** `http://10.0.2.2:3000`
- **iOS simulator:** `http://localhost:3000`
- **Physical device (same Wi-Fi):** `http://<your-machine-LAN-IP>:3000`

### Start the app

```bash
npm start          # opens Expo Dev Tools
```

Scan the QR code with **Expo Go** on your phone, or press `a` for Android emulator / `i` for iOS simulator.

---

## API Reference

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products?search=&category=` | List all products |
| POST | `/products` | Add a product |
| PUT | `/products/:id` | Edit / restock a product |
| DELETE | `/products/:id` | Remove a product |

### Sales
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sales` | Complete a sale (transactional) |
| GET | `/sales?from=&to=` | List sales with optional date filter |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/summary?from=&to=` | Revenue, profit, best sellers, expenses |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/expenses` | Log an expense |
| GET | `/expenses?from=&to=` | List expenses |
| DELETE | `/expenses/:id` | Delete an expense |

---

## Business Logic Notes

- **Stock deduction** runs in a single PostgreSQL transaction with `FOR UPDATE` row lock — prevents overselling if two sales hit the server simultaneously.
- **Discount calculation:**  
  - `percent`: `discount_amount = subtotal × (discount_value / 100)`  
  - `flat`: `discount_amount = min(discount_value, subtotal)`  
  - API rejects any combination that would make `total_amount` negative.
- **Historical price integrity:** `sale_items` stores `price_at_sale` and `cost_at_sale` at transaction time, so editing product prices later never distorts old reports.
- **Net Profit** = Gross Profit − Total Expenses (within the same date range).

---

## Screens

| Screen | Tab | Description |
|--------|-----|-------------|
| Dashboard | Home | Today's revenue, profit, sales count, low-stock alert, recent sales |
| Products | Products | Searchable list with category filter, low-stock badges, edit/delete |
| Add / Edit Product | (push) | Form with margin preview and image picker |
| Sell / Billing | Sell | Cart, qty +/−, discount toggle, payment mode, live totals |
| Reports | Reports | Today / Week / Month summary, bar chart, best sellers table |
| Expenses | Expenses | Log and view all expenses, running total |
