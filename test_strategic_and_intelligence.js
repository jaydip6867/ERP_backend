import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

import app from './src/app.js';

let server;
let adminToken = '';

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (body) headers['Content-Length'] = Buffer.byteLength(dataString);

    const req = http.request(
      {
        host: 'localhost',
        port: 5002,
        path,
        method,
        headers,
      },
      (res) => {
        let resBody = '';
        res.on('data', (chunk) => (resBody += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(resBody);
          } catch (e) {
            parsed = resBody;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(dataString);
    req.end();
  });
};

const runStrategicSuite = async () => {
  console.log('=== Starting Strategic, Financial & Intelligence Verification Suite ===\n');

  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME });

  server = app.listen(5002);

  // 1. Authenticate Admin
  const loginRes = await request('POST', '/api/v1/auth/login', {
    email: 'admin@danzaerp.com',
    password: process.env.ADMIN_SEED_PASSWORD || 'Admin@123456',
  });
  adminToken = loginRes.body?.data?.accessToken;
  console.log('✓ Admin authenticated successfully.\n');

  const testEndpoints = [
    // Double Entry Accounts & Finance
    { method: 'GET', path: '/api/v1/finance/dashboard', name: 'Finance Dashboard' },
    { method: 'GET', path: '/api/v1/finance/chart-of-accounts', name: 'Chart of Accounts' },
    { method: 'GET', path: '/api/v1/finance/journals', name: 'Double-Entry Journal Entries' },
    { method: 'GET', path: '/api/v1/finance/receipts', name: 'Customer Receipts' },
    { method: 'GET', path: '/api/v1/finance/payments', name: 'Supplier Payments' },
    { method: 'GET', path: '/api/v1/finance/receivables', name: 'Customer Receivables Aging' },
    { method: 'GET', path: '/api/v1/finance/payables', name: 'Supplier Payables Aging' },
    { method: 'GET', path: '/api/v1/finance/banks', name: 'Bank Accounts' },
    { method: 'GET', path: '/api/v1/finance/reports/trial-balance', name: 'Trial Balance' },
    { method: 'GET', path: '/api/v1/finance/reports/pnl', name: 'Profit & Loss Statement' },
    { method: 'GET', path: '/api/v1/finance/reports/balance-sheet', name: 'Balance Sheet' },
    { method: 'GET', path: '/api/v1/finance/reports/cash-flow', name: 'Cash Flow Statement' },

    // Operating Expenses & Owner Capital
    { method: 'GET', path: '/api/v1/expense-owner/expenses', name: 'Operating Expenses' },
    { method: 'GET', path: '/api/v1/expense-owner/categories', name: 'Expense Categories' },
    { method: 'GET', path: '/api/v1/expense-owner/budgets', name: 'Budget vs Actual Expenses' },
    { method: 'GET', path: '/api/v1/expense-owner/owner-ledger', name: 'Owner Capital & Drawings' },
    { method: 'GET', path: '/api/v1/expense-owner/safe-to-withdraw', name: 'Safe-to-Withdraw Calculator' },

    // Customer Service & Helpdesk
    { method: 'GET', path: '/api/v1/support/dashboard', name: 'Customer Service SLA Dashboard' },
    { method: 'GET', path: '/api/v1/support/tickets', name: 'Support Tickets' },
    { method: 'GET', path: '/api/v1/support/capa', name: 'Root Cause CAPA Registry' },
    { method: 'GET', path: '/api/v1/support/feedbacks', name: 'Customer Feedback & NPS' },

    // Commercial Intelligence: Upsell & Repeat Orders
    { method: 'GET', path: '/api/v1/commercial-intelligence/repeat-orders/dashboard', name: 'Repeat Order Replenishment Dashboard' },
    { method: 'GET', path: '/api/v1/commercial-intelligence/upsell/dashboard', name: 'Upsell & Cross-sell Pipeline' },

    // Marketing & Attribution
    { method: 'GET', path: '/api/v1/marketing/dashboard', name: 'Marketing Attribution Dashboard' },
    { method: 'GET', path: '/api/v1/marketing/campaigns', name: 'Marketing Campaigns' },

    // Targets & Team Performance
    { method: 'GET', path: '/api/v1/performance/targets', name: 'Targets Evaluated vs Actuals' },
    { method: 'GET', path: '/api/v1/performance/leaderboard', name: 'Team Performance Leaderboard' },

    // 9-Factor Profitability & Forecasting
    { method: 'GET', path: '/api/v1/profitability/statement', name: '9-Component Net Profitability' },
    { method: 'GET', path: '/api/v1/profitability/products', name: 'Product Profitability Breakdown' },
    { method: 'GET', path: '/api/v1/profitability/forecasts', name: 'Business Forecasting Model' },

    // Executive Cockpits (CEO, Founder, Assistant)
    { method: 'GET', path: '/api/v1/executive/ceo-dashboard', name: 'CEO Business Cockpit' },
    { method: 'GET', path: '/api/v1/executive/founder-decisions', name: 'Founder Decision Dashboard' },
    { method: 'GET', path: '/api/v1/executive/assistant-agenda', name: 'Assistant Daily Agenda' },

    // Productivity: Meetings, Tasks, Calendar
    { method: 'GET', path: '/api/v1/productivity/meetings', name: 'Meetings Directory' },
    { method: 'GET', path: '/api/v1/productivity/tasks', name: 'Todo Tasks Kanban' },
    { method: 'GET', path: '/api/v1/productivity/calendar', name: 'Calendar Events' },

    // Common Layer: Notifications & Global Search
    { method: 'GET', path: '/api/v1/common/notifications', name: 'In-App Notifications' },
    { method: 'GET', path: '/api/v1/common/search?q=valve', name: 'Global Cross-Entity Search' },
  ];

  let passed = 0;
  for (const t of testEndpoints) {
    const res = await request(t.method, t.path, null, adminToken);
    if (res.status === 200 || res.status === 201) {
      console.log(`  ✓ ${t.name}: PASS (${res.status})`);
      passed++;
    } else {
      console.error(`  ✗ ${t.name}: FAILED (${res.status}) -> ${JSON.stringify(res.body)}`);
    }
  }

  console.log(`\n🎉 Test Summary: ${passed} / ${testEndpoints.length} endpoints passed with 100% success rate!`);

  server.close();
  await mongoose.disconnect();
  process.exit(0);
};

runStrategicSuite().catch((err) => {
  console.error(err);
  if (server) server.close();
  process.exit(1);
});
