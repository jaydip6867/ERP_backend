import app from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import http from 'http';

async function runAllInsertTests() {
  console.log('🚀 Starting Comprehensive ERP All-Pages Insert Test Suite...');
  await connectDatabase();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;
  console.log(`📡 Test server running on ${baseUrl}`);

  let token = null;
  const results = [];

  const recordResult = (moduleName, action, success, detail) => {
    results.push({ moduleName, action, success, detail });
    const icon = success ? '✅' : '❌';
    console.log(`${icon} [${moduleName}] ${action}: ${detail}`);
  };

  try {
    // 1. Auth Login
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@danzaerp.com', password: 'Admin@123456' }),
    });
    const loginJson = await loginRes.json();
    const tokenData = loginJson.data?.accessToken || loginJson.data?.token || loginJson.accessToken || loginJson.token;
    if (loginRes.ok && tokenData) {
      token = tokenData;
      recordResult('Auth', 'Admin Login', true, 'Authenticated successfully');
    } else {
      recordResult('Auth', 'Admin Login', false, loginJson.message || 'Login failed');
      throw new Error('Authentication failed - cannot proceed with authenticated tests');
    }

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const post = async (endpoint, data) => {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(data),
      });
      const body = await res.json();
      return { ok: res.ok, status: res.status, body };
    };

    const get = async (endpoint) => {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        headers: authHeaders,
      });
      const body = await res.json();
      return { ok: res.ok, status: res.status, body };
    };

    const getId = (resBody) => {
      if (!resBody) return null;
      const d = resBody.data || resBody;
      for (const k of Object.keys(d)) {
        if (d[k] && typeof d[k] === 'object' && (d[k]._id || d[k].id)) {
          return d[k]._id || d[k].id;
        }
      }
      return d._id || d.id || null;
    };

    const ts = Date.now().toString().slice(-5);

    // 2. Organization Foundation
    let deptId = null;
    const deptRes = await post('/organization/departments', {
      department_code: `DPT_${ts}`,
      department_name: `Engineering & Tech ${ts}`,
      description: 'Core software and ERP engineering division',
      status: 'active',
      head_user_id: '',
      parent_department_id: '',
      branch_id: '',
    });
    if (deptRes.ok) {
      deptId = getId(deptRes.body);
      recordResult('Organization', 'Create Department', true, `Created Dept ID: ${deptId}`);
    } else {
      recordResult('Organization', 'Create Department', false, deptRes.body.message);
    }

    let posId = null;
    const posRes = await post('/organization/positions', {
      position_code: `POS_${ts}`,
      position_name: `Senior ERP Architect ${ts}`,
      department_id: deptId || null,
      level: 2,
      base_salary_min: 80000,
      base_salary_max: 120000,
      status: 'active',
    });
    if (posRes.ok) {
      posId = getId(posRes.body);
      recordResult('Organization', 'Create Position', true, `Created Position ID: ${posId}`);
    } else {
      recordResult('Organization', 'Create Position', false, posRes.body.message);
    }

    const orgTreeRes = await get('/organization/tree');
    recordResult('Organization', 'Get Organization Tree', orgTreeRes.ok, `Tree departments count: ${orgTreeRes.body.data?.totalDepartments || 0}`);

    // 3. Human Resources (HR)
    let jobOpeningId = null;
    const jobRes = await post('/hr/job-openings', {
      title: `Full Stack Engineer ${ts}`,
      department_id: deptId || null,
      position_id: posId || null,
      openings_count: 3,
      job_type: 'full-time',
      experience_years: 3,
      salary_range: '₹80k - ₹120k',
      status: 'published',
    });
    if (jobRes.ok) {
      jobOpeningId = getId(jobRes.body);
      recordResult('HR', 'Create Job Opening', true, `Opening ID: ${jobOpeningId}`);
    } else {
      recordResult('HR', 'Create Job Opening', false, jobRes.body.message);
    }

    let candidateId = null;
    const candRes = await post('/hr/candidates', {
      candidate_code: `CAN_${ts}`,
      job_opening_id: jobOpeningId || null,
      full_name: `Alex Mercer ${ts}`,
      email: `alex.mercer.${ts}@example.com`,
      phone: `+9198765${ts.slice(-5)}`,
      stage: 'applied',
      experience_years: 4,
    });
    if (candRes.ok) {
      candidateId = getId(candRes.body);
      recordResult('HR', 'Create Candidate', true, `Candidate ID: ${candidateId}`);
    } else {
      recordResult('HR', 'Create Candidate', false, candRes.body.message);
    }

    const intvRes = await post('/hr/interviews', {
      candidate_id: candidateId || null,
      job_opening_id: jobOpeningId || null,
      round_name: 'Technical Architecture Round',
      interview_date: new Date(Date.now() + 86400000).toISOString(),
      status: 'scheduled',
      feedback: 'Initial screening cleared',
    });
    recordResult('HR', 'Schedule Interview', intvRes.ok, intvRes.ok ? 'Interview scheduled' : intvRes.body.message);

    let employeeId = null;
    const empRes = await post('/hr/employees', {
      employee_code: `EMP_${ts}`,
      first_name: 'Alex',
      last_name: `Mercer ${ts}`,
      email: `alex.emp.${ts}@danzaerp.com`,
      phone: `+9198123${ts.slice(-5)}`,
      joining_date: new Date().toISOString(),
      department_id: deptId || null,
      position_id: posId || null,
      employment_status: 'probation',
      employment_type: 'full-time',
      salary: {
        basic: 60000,
        hra: 20000,
        allowances: 10000,
        gross: 90000,
        net: 85000,
      },
    });
    if (empRes.ok) {
      employeeId = getId(empRes.body);
      recordResult('HR', 'Create Employee', true, `Employee ID: ${employeeId}`);
    } else {
      recordResult('HR', 'Create Employee', false, empRes.body.message);
    }

    const onbRes = await post('/hr/onboarding', {
      employee_id: employeeId || null,
      start_date: new Date().toISOString(),
      completion_percentage: 25,
      status: 'in-progress',
      tasks: [
        { title: 'Submit Identification Proofs', completed: true },
        { title: 'Setup Development Workstation', completed: false },
      ],
    });
    recordResult('HR', 'Create Onboarding Record', onbRes.ok, onbRes.ok ? 'Onboarding initialized' : onbRes.body.message);

    const attRes = await post('/hr/attendance', {
      employee_id: employeeId || null,
      date: new Date().toISOString(),
      punch_in: new Date().toISOString(),
      status: 'present',
    });
    recordResult('HR', 'Record Attendance', attRes.ok, attRes.ok ? 'Attendance logged' : attRes.body.message);

    const leaveRes = await post('/hr/leave', {
      employee_id: employeeId || null,
      leave_type: 'sick',
      start_date: new Date(Date.now() + 86400000 * 2).toISOString(),
      end_date: new Date(Date.now() + 86400000 * 3).toISOString(),
      days_count: 2,
      reason: 'Medical checkup',
    });
    recordResult('HR', 'Create Leave Request', leaveRes.ok, leaveRes.ok ? 'Leave request registered' : leaveRes.body.message);

    const payrollRes = await post('/hr/payroll/run', {
      month: 9,
      year: 2026,
    });
    recordResult('HR', 'Run Monthly Payroll', payrollRes.ok, payrollRes.ok ? `Payroll run status: ${payrollRes.body.data?.status || 'OK'}` : payrollRes.body.message);

    const trainRes = await post('/hr/training', {
      training_code: `TRN_${ts}`,
      title: `Advanced Microservices and ERP Architecture ${ts}`,
      trainer: 'Google Cloud Architect',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 86400000 * 5).toISOString(),
      status: 'planned',
    });
    recordResult('HR', 'Create Training Program', trainRes.ok, trainRes.ok ? 'Training created' : trainRes.body.message);

    const perfRes = await post('/hr/performance', {
      employee_id: employeeId || null,
      review_cycle: 'Q3-2026',
      overall_rating: 4.8,
      achievements: 'Implemented 15 new enterprise modules with zero downtime',
      feedback: 'Excellent technical and architectural contributions',
    });
    recordResult('HR', 'Create Performance Appraisal', perfRes.ok, perfRes.ok ? 'Performance record created' : perfRes.body.message);

    const goalRes = await post('/hr/goals', {
      employee_id: employeeId || null,
      title: 'Achieve 99.99% Core API Uptime',
      target_date: new Date(Date.now() + 86400000 * 60).toISOString(),
      progress_percentage: 75,
      status: 'in-progress',
    });
    recordResult('HR', 'Create Goal', goalRes.ok, goalRes.ok ? 'Goal registered' : goalRes.body.message);

    const polRes = await post('/hr/policies', {
      policy_code: `POL_${ts}`,
      title: `Remote Work and Information Security Policy ${ts}`,
      category: 'it-security',
      content: 'Standard operating procedures for remote ERP operations and secure tokens.',
      effective_date: new Date().toISOString(),
    });
    recordResult('HR', 'Publish HR Policy', polRes.ok, polRes.ok ? 'Policy published' : polRes.body.message);

    const docRes = await post('/hr/documents', {
      employee_id: employeeId || null,
      document_type: 'national_id',
      document_title: 'Government Identity Verification',
      file_url: 'https://example.com/docs/id.pdf',
      status: 'verified',
    });
    recordResult('HR', 'Upload Employee Document', docRes.ok, docRes.ok ? 'Document uploaded' : docRes.body.message);

    const engRes = await post('/hr/engagement', {
      title: `Quarterly Hackathon & Innovation Day ${ts}`,
      initiative_type: 'event',
      date: new Date(Date.now() + 86400000 * 14).toISOString(),
      budget: 150000,
      status: 'upcoming',
    });
    recordResult('HR', 'Create Employee Engagement', engRes.ok, engRes.ok ? 'Engagement logged' : engRes.body.message);

    // 4. Technology & Automation Suite
    let integrationId = null;
    const intRes = await post('/technology/integrations', {
      integration_code: `INT_${ts}`,
      provider_name: `WhatsApp Cloud Gateway ${ts}`,
      integration_type: 'WHATSAPP',
      status: 'ACTIVE',
      base_url: 'https://graph.facebook.com/v19.0',
      api_key: 'test_token_abc123',
    });
    if (intRes.ok) {
      integrationId = getId(intRes.body);
      recordResult('Technology', 'Create Integration', true, `Integration ID: ${integrationId}`);
    } else {
      recordResult('Technology', 'Create Integration', false, intRes.body.message);
    }

    let ruleId = null;
    const autoRes = await post('/technology/automation-rules', {
      rule_code: `RULE_${ts}`,
      rule_name: `Auto Order Dispatched Notification ${ts}`,
      trigger_event: 'ORDER_DISPATCHED',
      action_type: 'SEND_WHATSAPP_MESSAGE',
      is_active: true,
      action_config: { template_name: 'order_shipped_v1' },
    });
    if (autoRes.ok) {
      ruleId = getId(autoRes.body);
      recordResult('Technology', 'Create Automation Rule', true, `Rule ID: ${ruleId}`);
    } else {
      recordResult('Technology', 'Create Automation Rule', false, autoRes.body.message);
    }

    if (ruleId) {
      const runRes = await post(`/technology/automation-rules/${ruleId}/run`, { payload: { order_id: 'SO-9999' } });
      recordResult('Technology', 'Execute Automation Run', runRes.ok, runRes.ok ? 'Rule triggered' : runRes.body.message);
    }

    // 5. Research & Development (R&D / NPD)
    const mrRes = await post('/rnd/market-research', {
      title: `Sustainable Organic Cotton Activewear Trend Analysis ${ts}`,
      category: 'FABRIC_TRENDS',
      summary: 'Growing enterprise demand for GOTS certified organic activewear.',
      status: 'COMPLETED',
    });
    recordResult('R&D', 'Create Market Research', mrRes.ok, mrRes.ok ? 'Research saved' : mrRes.body.message);

    const compRes = await post('/rnd/competitors', {
      competitor_name: `Apex Activewear ${ts}`,
      brand_name: 'Apex Pro',
      website: 'https://apexactivewear.example.com',
      pricing_tier: 'PREMIUM',
      market_share_estimate: '15.5%',
    });
    recordResult('R&D', 'Create Competitor Record', compRes.ok, compRes.ok ? 'Competitor logged' : compRes.body.message);

    let oppId = null;
    const oppRes = await post('/rnd/opportunities', {
      opportunity_title: `Zero-waste Seamless T-Shirts ${ts}`,
      origin: 'MARKET_RESEARCH',
      priority: 'HIGH',
      expected_roi: 28.5,
      description: 'Manufacture seamless tubular knit t-shirts with 18% lower fabric wastage.',
    });
    if (oppRes.ok) {
      oppId = getId(oppRes.body);
      recordResult('R&D', 'Create Opportunity', true, `Opportunity ID: ${oppId}`);
    } else {
      recordResult('R&D', 'Create Opportunity', false, oppRes.body.message);
    }

    let npdProjectId = null;
    const npdRes = await post('/rnd/product-development', {
      project_code: `NPD_${ts}`,
      project_name: `All-Season Dry-Fit Polo ${ts}`,
      stage: 'SAMPLING',
      target_launch_date: new Date(Date.now() + 86400000 * 90).toISOString(),
      budget: 500000,
      description: 'Polyester-cotton dri-fit blend with anti-microbial finish.',
    });
    if (npdRes.ok) {
      npdProjectId = getId(npdRes.body);
      recordResult('R&D', 'Create Product Development Project', true, `NPD ID: ${npdProjectId}`);
    } else {
      recordResult('R&D', 'Create Product Development Project', false, npdRes.body.message);
    }

    const sampleRes = await post('/rnd/samples', {
      sample_code: `SMP_${ts}`,
      product_name: `Dry-Fit Polo Prototype #1 ${ts}`,
      npd_project_id: npdProjectId || null,
      size: 'L',
      color: 'Navy Blue',
      status: 'APPROVED',
      comments: 'Drape and GSM verified to specifications.',
    });
    recordResult('R&D', 'Create Product Sample', sampleRes.ok, sampleRes.ok ? 'Sample registered' : sampleRes.body.message);

    const testRes = await post('/rnd/tests', {
      test_code: `TST_${ts}`,
      test_type: 'SHRINKAGE_AND_COLORFASTNESS',
      sample_name: `Dry-Fit Polo Prototype #1 ${ts}`,
      test_result: 'PASS',
      parameters: { shrinkage_percent: 1.2, wash_fastness: 'Grade 4-5' },
    });
    recordResult('R&D', 'Log Material Test', testRes.ok, testRes.ok ? 'Test logged' : testRes.body.message);

    const impRes = await post('/rnd/improvements', {
      title: `Reinforced Seam Thread Optimization ${ts}`,
      current_drawback: 'Slight fraying after 30 industrial washes',
      proposed_solution: 'Switch to core-spun polyester-poly thread',
      status: 'IN_REVIEW',
    });
    recordResult('R&D', 'Log Improvement (VAVE)', impRes.ok, impRes.ok ? 'Improvement logged' : impRes.body.message);

    const crRes = await post('/rnd/customer-research', {
      study_title: `B2B Institutional Corporate Wear Survey ${ts}`,
      methodology: 'SURVEY',
      target_audience: 'HR & Admin Managers (500+ employees)',
      insights: '82% prefer wrinkle-free blended fabric with custom embroidery.',
    });
    recordResult('R&D', 'Create Customer Research Study', crRes.ok, crRes.ok ? 'Study recorded' : crRes.body.message);

    const fbRes = await post('/rnd/feedback', {
      source: 'DEALER',
      sentiment: 'POSITIVE',
      feedback_text: 'Customers loved the breathability of the monsoon collection.',
      product_category: 'Polos',
    });
    recordResult('R&D', 'Record Product Feedback', fbRes.ok, fbRes.ok ? 'Feedback saved' : fbRes.body.message);

    const psRes = await post('/rnd/problem-solving', {
      issue_title: `Color Bleeding on Red Poly-cotton Fabric ${ts}`,
      root_cause: 'Dye fixation temperature variance in batch #481',
      corrective_action: 'Calibrated stenter temperature sensors with dual thermocouple checks.',
      status: 'CLOSED',
    });
    recordResult('R&D', 'Create Problem Solving (8D)', psRes.ok, psRes.ok ? 'Problem solving closed' : psRes.body.message);

    // 6. Operations Extensions
    const printRes = await post('/operations/printing', {
      job_code: `PRN_${ts}`,
      design_name: `Danza Signature Monogram ${ts}`,
      print_type: 'SCREEN_PRINT',
      quantity: 1200,
      status: 'IN_PROGRESS',
    });
    recordResult('Operations', 'Create Printing Job', printRes.ok, printRes.ok ? 'Printing job scheduled' : printRes.body.message);

    const embRes = await post('/operations/embroidery', {
      job_code: `EMB_${ts}`,
      design_name: `Left Chest Corporate Crest ${ts}`,
      stitch_count: 8500,
      quantity: 800,
      status: 'QUEUED',
    });
    recordResult('Operations', 'Create Embroidery Job', embRes.ok, embRes.ok ? 'Embroidery job registered' : embRes.body.message);

    const packRes = await post('/operations/packing', {
      job_code: `PCK_${ts}`,
      box_count: 40,
      packaging_type: 'CARTON_EXPORT',
      quantity: 2000,
      status: 'READY_TO_PACK',
    });
    recordResult('Operations', 'Create Packing Job', packRes.ok, packRes.ok ? 'Packing job registered' : packRes.body.message);

    const logRes = await post('/operations/logistics', {
      tracking_number: `TRK_${ts}`,
      transporter_name: 'BlueDart Express',
      destination: 'Mumbai Central Hub',
      freight_charges: 14500,
      status: 'DISPATCHED',
    });
    recordResult('Operations', 'Create Logistics Job', logRes.ok, logRes.ok ? 'Consignment booked' : logRes.body.message);

    const scRes = await post('/operations/supply-chain', {
      plan_code: `SCP_${ts}`,
      material_name: '100% Combed Compact Yarn 30s',
      projected_demand: 5000,
      buffer_quantity: 1000,
      procurement_lead_time_days: 12,
    });
    recordResult('Operations', 'Create Supply Chain Plan', scRes.ok, scRes.ok ? 'Supply chain plan saved' : scRes.body.message);

    // 7. Commercial & Marketing Extensions
    const campRes = await post('/marketing/campaigns', {
      campaign_name: `Festive Premium Polo Campaign ${ts}`,
      channel: 'INSTAGRAM',
      budget: 85000,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 86400000 * 30).toISOString(),
    });
    recordResult('Marketing', 'Create Campaign', campRes.ok, campRes.ok ? 'Campaign created' : campRes.body.message);

    const assetRes = await post('/marketing/assets', {
      asset_name: `Festive Lookbook 2026 High-Res ${ts}`,
      asset_type: 'CATALOGUE',
      file_url: 'https://example.com/assets/festive_2026.pdf',
      tags: ['polo', 'festive', 'lookbook'],
    });
    recordResult('Marketing', 'Create Marketing Asset', assetRes.ok, assetRes.ok ? 'Asset recorded' : assetRes.body.message);

    const contentRes = await post('/marketing/content', {
      title: `The Science of Fabric Breathability & GSM ${ts}`,
      content_type: 'BLOG',
      scheduled_date: new Date(Date.now() + 86400000 * 3).toISOString(),
      status: 'DRAFT',
    });
    recordResult('Marketing', 'Create Content Item', contentRes.ok, contentRes.ok ? 'Content scheduled' : contentRes.body.message);

    const creatRes = await post('/marketing/creatives', {
      request_title: `Banner creatives for Diwali Expo ${ts}`,
      dimensions: '1920x1080',
      deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
      status: 'IN_DESIGN',
    });
    recordResult('Marketing', 'Create Creative Request', creatRes.ok, creatRes.ok ? 'Creative request lodged' : creatRes.body.message);

    const physRes = await post('/marketing/physical', {
      activity_name: `Garment Manufacturers Trade Expo Delhi ${ts}`,
      location: 'Pragati Maidan, New Delhi',
      event_date: new Date(Date.now() + 86400000 * 20).toISOString(),
      budget: 250000,
      status: 'PLANNING',
    });
    recordResult('Marketing', 'Create Physical Marketing Activity', physRes.ok, physRes.ok ? 'Physical activity planned' : physRes.body.message);

    // 8. Finance Extensions
    const ccRes = await post('/finance/cost-centers', {
      cost_center_code: `CC_${ts}`,
      cost_center_name: `Danza R&D and Innovation Lab ${ts}`,
      department_id: deptId || null,
      allocated_budget: 1200000,
      status: 'ACTIVE',
    });
    recordResult('Finance', 'Create Cost Center', ccRes.ok, ccRes.ok ? 'Cost center allocated' : ccRes.body.message);

    const misRes = await post('/finance/management-reports', {
      report_title: `Executive Q3 Performance & Cash Flow Forecast ${ts}`,
      report_type: 'MIS_SUMMARY',
      fiscal_year: '2026-2027',
      content: { ebitda: 4200000, netMargin: '18.4%', runwayMonths: 18 },
    });
    recordResult('Finance', 'Create Management Report', misRes.ok, misRes.ok ? 'MIS Report published' : misRes.body.message);

    // 9. Core Commercial & Master Data Records
    const custRes = await post('/customers', {
      customer_code: `CUST_${ts}`,
      name: `Reliance Retail Sourcing ${ts}`,
      company_name: `Reliance Retail Ltd ${ts}`,
      email: `sourcing.${ts}@relianceretail.example.com`,
      mobile: `+9198333${ts.slice(-5)}`,
      customer_type: 'B2B',
      billing_address: { street: 'BKC Bandra East', city: 'Mumbai', state: 'Maharashtra', country: 'India', postal_code: '400051' },
      shipping_address: { street: 'Warehouse 4 Bhiwandi', city: 'Thane', state: 'Maharashtra', country: 'India', postal_code: '421302' },
      credit_limit: 5000000,
      status: 'active',
    });
    recordResult('Core ERP', 'Create Customer', custRes.ok, custRes.ok ? `Customer created` : custRes.body.message);

    const leadRes = await post('/leads', {
      lead_code: `LED_${ts}`,
      first_name: 'Vikram',
      last_name: `Malhotra ${ts}`,
      company_name: `Raymond Sourcing ${ts}`,
      email: `vikram.${ts}@raymond.example.com`,
      phone: `+9198222${ts.slice(-5)}`,
      status: 'new',
      source: 'WEBSITE',
    });
    recordResult('Core ERP', 'Create Lead', leadRes.ok, leadRes.ok ? 'Lead created' : leadRes.body.message);

    const prodRes = await post('/products', {
      product_code: `PRD_${ts}`,
      name: `Danza Signature Polo 220 GSM ${ts}`,
      sku: `SKU-POLO-${ts}`,
      category: 'T-Shirts',
      selling_price: 650,
      cost_price: 320,
      status: 'active',
    });
    recordResult('Core ERP', 'Create Product', prodRes.ok, prodRes.ok ? 'Product created' : prodRes.body.message);

    const taskRes = await post('/productivity/tasks', {
      title: `Review Q4 Production Capacity for Export Orders ${ts}`,
      priority: 'high',
      due_date: new Date(Date.now() + 86400000 * 5).toISOString(),
      status: 'TODO',
    });
    recordResult('Productivity', 'Create Kanban Task', taskRes.ok, taskRes.ok ? 'Task created' : taskRes.body.message);

    const meetRes = await post('/productivity/meetings', {
      title: `Executive Strategic Alignment Meeting ${ts}`,
      start_time: new Date(Date.now() + 86400000).toISOString(),
      end_time: new Date(Date.now() + 86400000 + 3600000).toISOString(),
      agenda: 'Review enterprise cockpits and new module adoption',
    });
    recordResult('Productivity', 'Schedule Meeting', meetRes.ok, meetRes.ok ? 'Meeting scheduled' : meetRes.body.message);

    // Summary
    const passed = results.filter((r) => r.success).length;
    const total = results.length;
    console.log('\n=========================================');
    console.log(`📊 TEST SUITE SUMMARY: ${passed}/${total} PASSED (${Math.round((passed / total) * 100)}%)`);
    console.log('=========================================');

    if (passed < total) {
      console.log('\n❌ Failed Tests:');
      results.filter((r) => !r.success).forEach((r) => console.log(`  - [${r.moduleName}] ${r.action}: ${r.detail}`));
    }
  } catch (err) {
    console.error('Fatal error during test suite execution:', err);
  } finally {
    server.close();
    await disconnectDatabase();
  }
}

runAllInsertTests();
