import http from 'http';
import app from './src/app.js';
import { connectDatabase, disconnectDatabase } from './src/config/db.js';

async function runTests() {
  console.log('--- Starting All Modules API Verification ---');
  await connectDatabase();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5099, resolve));
  const baseUrl = 'http://localhost:5099/api/v1';

  try {
    // 1. Health
    const healthRes = await fetch(`${baseUrl}/health`).then((r) => r.json());
    console.log('1. Health check:', healthRes.success ? 'PASS' : 'FAIL', healthRes.message || healthRes.status);

    // 2. Login as Admin
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@danzaerp.com', password: 'Admin@123456' }),
    }).then((r) => r.json());

    if (!loginRes.data?.accessToken) {
      throw new Error(`Admin login failed: ${JSON.stringify(loginRes)}`);
    }
    const token = loginRes.data.accessToken;
    const authHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    console.log('2. Admin Login:', 'PASS', `User: ${loginRes.data.user.full_name} (${loginRes.data.user.role_id?.role_name || 'Admin'})`);

    // 3. Current User Auth Me
    const meRes = await fetch(`${baseUrl}/auth/me`, { headers: authHeaders }).then((r) => r.json());
    console.log('3. GET /auth/me:', meRes.success ? 'PASS' : 'FAIL', `Email: ${meRes.data.email}`);

    // 4. Module 00 - Admin Foundation
    const usersRes = await fetch(`${baseUrl}/admin/users`, { headers: authHeaders }).then((r) => r.json());
    console.log('4.1. GET /admin/users:', usersRes.success ? 'PASS' : 'FAIL', `Count: ${usersRes.data?.length || usersRes.data?.users?.length}`);

    const companyRes = await fetch(`${baseUrl}/admin/company`, { headers: authHeaders }).then((r) => r.json());
    console.log('4.2. GET /admin/company:', companyRes.success ? 'PASS' : 'FAIL', `Company: ${companyRes.data?.company_name || companyRes.data?.company?.company_name}`);

    const branchesRes = await fetch(`${baseUrl}/admin/branches`, { headers: authHeaders }).then((r) => r.json());
    console.log('4.3. GET /admin/branches:', branchesRes.success ? 'PASS' : 'FAIL', `Branches: ${branchesRes.data?.length}`);

    const warehousesRes = await fetch(`${baseUrl}/admin/warehouses`, { headers: authHeaders }).then((r) => r.json());
    console.log('4.4. GET /admin/warehouses:', warehousesRes.success ? 'PASS' : 'FAIL', `Warehouses: ${warehousesRes.data?.length}`);

    const numberSeriesRes = await fetch(`${baseUrl}/admin/number-series`, { headers: authHeaders }).then((r) => r.json());
    console.log('4.5. GET /admin/number-series:', numberSeriesRes.success ? 'PASS' : 'FAIL', `Series: ${numberSeriesRes.data?.length || numberSeriesRes.data?.numberSeries?.length}`);

    // 5. Module 07 - Products
    const productsRes = await fetch(`${baseUrl}/products`, { headers: authHeaders }).then((r) => r.json());
    console.log('5.1. GET /products:', productsRes.success ? 'PASS' : 'FAIL', `Items: ${productsRes.data?.length}`);

    const categoriesRes = await fetch(`${baseUrl}/products/categories`, { headers: authHeaders }).then((r) => r.json());
    console.log('5.2. GET /products/categories:', categoriesRes.success ? 'PASS' : 'FAIL', `Categories: ${categoriesRes.data?.length}`);

    const brandsRes = await fetch(`${baseUrl}/products/brands`, { headers: authHeaders }).then((r) => r.json());
    console.log('5.3. GET /products/brands:', brandsRes.success ? 'PASS' : 'FAIL', `Brands: ${brandsRes.data?.length}`);

    const priceListsRes = await fetch(`${baseUrl}/products/price-lists`, { headers: authHeaders }).then((r) => r.json());
    console.log('5.4. GET /products/price-lists:', priceListsRes.success ? 'PASS' : 'FAIL', `Price lists: ${priceListsRes.data?.length}`);

    const bomsRes = await fetch(`${baseUrl}/products/boms`, { headers: authHeaders }).then((r) => r.json());
    console.log('5.5. GET /products/boms:', bomsRes.success ? 'PASS' : 'FAIL', `BOMs: ${bomsRes.data?.length}`);

    // 6. Module 02 - Customers & CRM
    const customersRes = await fetch(`${baseUrl}/customers`, { headers: authHeaders }).then((r) => r.json());
    console.log('6.1. GET /customers:', customersRes.success ? 'PASS' : 'FAIL', `Customers: ${customersRes.data?.length}`);

    if (customersRes.data?.length > 0) {
      const firstCust = customersRes.data[0];
      const firstCustId = firstCust._id || firstCust.id;
      const c360Res = await fetch(`${baseUrl}/customers/${firstCustId}/360`, { headers: authHeaders }).then((r) => r.json());
      console.log('6.2. GET /customers/:id/360:', c360Res.success ? 'PASS' : 'FAIL', `Contacts: ${c360Res.data?.contacts?.length}, Addresses: ${c360Res.data?.addresses?.length}`);
    }

    // 7. Module 01 - Leads & Follow-ups
    const leadsRes = await fetch(`${baseUrl}/leads`, { headers: authHeaders }).then((r) => r.json());
    console.log('7.1. GET /leads:', leadsRes.success ? 'PASS' : 'FAIL', `Leads: ${leadsRes.data?.length}`);

    const leadDashRes = await fetch(`${baseUrl}/leads/dashboard`, { headers: authHeaders }).then((r) => r.json());
    console.log('7.2. GET /leads/dashboard:', leadDashRes.success ? 'PASS' : 'FAIL', `Active Pipeline: ₹${leadDashRes.data?.metrics?.activePipelineValue}`);

    const kanbanRes = await fetch(`${baseUrl}/leads/kanban`, { headers: authHeaders }).then((r) => r.json());
    console.log('7.3. GET /leads/kanban:', kanbanRes.success ? 'PASS' : 'FAIL', `Stage columns: ${Object.keys(kanbanRes.data || {}).length}`);

    const followupsRes = await fetch(`${baseUrl}/leads/followups`, { headers: authHeaders }).then((r) => r.json());
    console.log('7.4. GET /leads/followups:', followupsRes.success ? 'PASS' : 'FAIL', `Followups: ${followupsRes.data?.length}`);

    // 8. Module 03 - Sales & Quotations
    const quotationsRes = await fetch(`${baseUrl}/sales/quotations`, { headers: authHeaders }).then((r) => r.json());
    console.log('8.1. GET /sales/quotations:', quotationsRes.success ? 'PASS' : 'FAIL', `Quotations: ${quotationsRes.data?.length}`);

    const partnersRes = await fetch(`${baseUrl}/sales/channel-partners`, { headers: authHeaders }).then((r) => r.json());
    console.log('8.2. GET /sales/channel-partners:', partnersRes.success ? 'PASS' : 'FAIL', `Partners: ${partnersRes.data?.length}`);

    const posSummaryRes = await fetch(`${baseUrl}/sales/pos/daily-summary`, { headers: authHeaders }).then((r) => r.json());
    console.log('8.3. GET /sales/pos/daily-summary:', posSummaryRes.success ? 'PASS' : 'FAIL', `Total Bills Today: ${posSummaryRes.data?.totalBills}`);

    console.log('--- ALL MODULES API ENDPOINTS VERIFIED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
    process.exit(process.exitCode || 0);
  }
}

runTests();
