import axios from 'axios';

// ── Change this to your machine's LAN IP when testing on a physical device ──
// e.g. 'http://192.168.1.100:4000'
const BASE_URL = 'http://localhost:4000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Response interceptor: unwrap data, surface error messages ────────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error?.response?.data?.error ||
      error?.message ||
      'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// ── PRODUCTS ─────────────────────────────────────────────────────────────────
export const getProducts   = (params = {}) => api.get('/products', { params });
export const createProduct = (data)        => api.post('/products', data);
export const updateProduct = (id, data)    => api.put(`/products/${id}`, data);
export const deleteProduct = (id)          => api.delete(`/products/${id}`);

// ── SALES ────────────────────────────────────────────────────────────────────
export const completeSale = (data)        => api.post('/sales', data);
export const getSales     = (params = {}) => api.get('/sales', { params });

// ── REPORTS ──────────────────────────────────────────────────────────────────
export const getReportSummary = (params = {}) => api.get('/reports/summary', { params });

// ── EXPENSES ─────────────────────────────────────────────────────────────────
export const createExpense = (data)        => api.post('/expenses', data);
export const getExpenses   = (params = {}) => api.get('/expenses', { params });
export const deleteExpense = (id)          => api.delete(`/expenses/${id}`);

export default api;
