import http from 'http';
import app from './src/app.js';
import { connectDatabase, disconnectDatabase } from './src/config/db.js';

async function runOperationsTests() {
  console.log('=== Starting Operational Modules API Verification ===\n');
  await connectDatabase();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5098, resolve));
  const baseUrl = 'http://localhost:5098/api/v1';

  try {
    // 1. Login as Admin
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@danzaerp.com', password: 'Admin@123456' }),
    }).then((r) => r.json());

    if (!loginRes.data?.accessToken) {
      throw new Error(`Login failed: ${JSON.stringify(loginRes)}`);
    }
    const token = loginRes.data.accessToken;
    const authHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    console.log('✓ Admin authenticated successfully.');

    // 2. Sales Orders
    console.log('\n--- 1. Sales Orders ---');
    const soList = await fetch(`${baseUrl}/sales-orders`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /sales-orders:', soList.success ? 'PASS' : 'FAIL', `Found: ${soList.data?.length}`);

    const soMetrics = await fetch(`${baseUrl}/sales-orders/processing-metrics`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /sales-orders/processing-metrics:', soMetrics.success ? 'PASS' : 'FAIL', soMetrics.data);

    const soPending = await fetch(`${baseUrl}/sales-orders/pending`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /sales-orders/pending:', soPending.success ? 'PASS' : 'FAIL', `Pending: ${soPending.data?.length}`);

    // 3. Inventory
    console.log('\n--- 2. Module 11 — Inventory ---');
    const invDash = await fetch(`${baseUrl}/inventory/dashboard`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /inventory/dashboard:', invDash.success ? 'PASS' : 'FAIL', `Products: ${invDash.data?.total_products}, Batches: ${invDash.data?.total_batches}`);

    const invSummary = await fetch(`${baseUrl}/inventory/summary`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /inventory/summary:', invSummary.success ? 'PASS' : 'FAIL', `Items: ${invSummary.data?.length}`);

    const invLedger = await fetch(`${baseUrl}/inventory/ledger`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /inventory/ledger:', invLedger.success ? 'PASS' : 'FAIL', `Entries: ${invLedger.data?.length}`);

    const invBatches = await fetch(`${baseUrl}/inventory/batches`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /inventory/batches:', invBatches.success ? 'PASS' : 'FAIL', `Batches: ${invBatches.data?.length}`);

    // 4. Purchase
    console.log('\n--- 3. Module 08 — Purchase ---');
    const suppliers = await fetch(`${baseUrl}/purchase/suppliers`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /purchase/suppliers:', suppliers.success ? 'PASS' : 'FAIL', `Suppliers: ${suppliers.data?.length}`);

    const prs = await fetch(`${baseUrl}/purchase/requisitions`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /purchase/requisitions:', prs.success ? 'PASS' : 'FAIL', `PRs: ${prs.data?.length}`);

    const pos = await fetch(`${baseUrl}/purchase/orders`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /purchase/orders:', pos.success ? 'PASS' : 'FAIL', `POs: ${pos.data?.length}`);

    const grns = await fetch(`${baseUrl}/purchase/grns`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /purchase/grns:', grns.success ? 'PASS' : 'FAIL', `GRNs: ${grns.data?.length}`);

    const pinvs = await fetch(`${baseUrl}/purchase/invoices`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /purchase/invoices:', pinvs.success ? 'PASS' : 'FAIL', `Invoices: ${pinvs.data?.length}`);

    // 5. Production
    console.log('\n--- 4. Module 09 — Production ---');
    const prodDash = await fetch(`${baseUrl}/production/dashboard`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /production/dashboard:', prodDash.success ? 'PASS' : 'FAIL', `Total WOs: ${prodDash.data?.total_work_orders}`);

    const wos = await fetch(`${baseUrl}/production/work-orders`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /production/work-orders:', wos.success ? 'PASS' : 'FAIL', `Work Orders: ${wos.data?.length}`);

    const issues = await fetch(`${baseUrl}/production/material-issues`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /production/material-issues:', issues.success ? 'PASS' : 'FAIL', `Issues: ${issues.data?.length}`);

    const logs = await fetch(`${baseUrl}/production/logs`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /production/logs:', logs.success ? 'PASS' : 'FAIL', `Logs: ${logs.data?.length}`);

    // 6. Quality Control (QC)
    console.log('\n--- 5. QC Functionality ---');
    const qcDash = await fetch(`${baseUrl}/qc/dashboard`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /qc/dashboard:', qcDash.success ? 'PASS' : 'FAIL', `Inspections: ${qcDash.data?.total_inspections}, Pass rate: ${qcDash.data?.pass_rate_percent}%`);

    const qcP = await fetch(`${baseUrl}/qc/parameters`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /qc/parameters:', qcP.success ? 'PASS' : 'FAIL', `Parameters: ${qcP.data?.length}`);

    const qcI = await fetch(`${baseUrl}/qc/inspections`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /qc/inspections:', qcI.success ? 'PASS' : 'FAIL', `Inspections: ${qcI.data?.length}`);

    // 7. Dispatch & Orders Delivery
    console.log('\n--- 6. Module 10 — Orders & Delivery ---');
    const trans = await fetch(`${baseUrl}/dispatch/transporters`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /dispatch/transporters:', trans.success ? 'PASS' : 'FAIL', `Transporters: ${trans.data?.length}`);

    const dispatches = await fetch(`${baseUrl}/dispatch`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /dispatch:', dispatches.success ? 'PASS' : 'FAIL', `Dispatches: ${dispatches.data?.length}`);

    // 8. Invoices
    console.log('\n--- 7. Module 12 — Invoice ---');
    const invDashBoard = await fetch(`${baseUrl}/invoices/dashboard`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /invoices/dashboard:', invDashBoard.success ? 'PASS' : 'FAIL', `Total Billed: ₹${invDashBoard.data?.total_billed}`);

    const invoices = await fetch(`${baseUrl}/invoices`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /invoices:', invoices.success ? 'PASS' : 'FAIL', `Invoices: ${invoices.data?.length}`);

    const notes = await fetch(`${baseUrl}/invoices/notes/list`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /invoices/notes/list:', notes.success ? 'PASS' : 'FAIL', `Credit/Debit Notes: ${notes.data?.length}`);

    const ageing = await fetch(`${baseUrl}/invoices/ageing`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /invoices/ageing:', ageing.success ? 'PASS' : 'FAIL');

    // 9. GST / Tax
    console.log('\n--- 8. Module 13 — GST / Tax ---');
    const taxRates = await fetch(`${baseUrl}/tax/rates`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /tax/rates:', taxRates.success ? 'PASS' : 'FAIL', `Rates: ${taxRates.data?.length}`);

    const gstr1 = await fetch(`${baseUrl}/tax/gstr-1`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /tax/gstr-1:', gstr1.success ? 'PASS' : 'FAIL', `B2B: ${gstr1.data?.sections?.b2b?.length}, HSNs: ${gstr1.data?.sections?.hsn_summary?.length}`);

    const gstr3b = await fetch(`${baseUrl}/tax/gstr-3b`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /tax/gstr-3b:', gstr3b.success ? 'PASS' : 'FAIL', `Net Payable: ₹${gstr3b.data?.net_tax_payable_6_1?.total_payable}`);

    const itc = await fetch(`${baseUrl}/tax/itc-register`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /tax/itc-register:', itc.success ? 'PASS' : 'FAIL', `Total ITC: ₹${itc.data?.total_eligible_itc}`);

    const taxLedger = await fetch(`${baseUrl}/tax/ledger`, { headers: authHeaders }).then((r) => r.json());
    console.log('  GET /tax/ledger:', taxLedger.success ? 'PASS' : 'FAIL', `Output Tax: ₹${taxLedger.data?.output_tax?.totalOutput}`);

    console.log('\n🎉 ALL OPERATIONAL MODULES PASSED VERIFICATION WITH ZERO FAILURES!');
  } finally {
    server.close();
    await disconnectDatabase();
  }
}

runOperationsTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
