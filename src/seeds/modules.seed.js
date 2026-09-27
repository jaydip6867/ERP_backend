import mongoose from 'mongoose';
import { Company } from '../models/company.model.js';
import { Branch } from '../models/branch.model.js';
import { Warehouse } from '../models/warehouse.model.js';
import { NumberSeries } from '../models/numberSeries.model.js';
import { MasterData } from '../models/masterData.model.js';
import { SystemSettings } from '../models/systemSettings.model.js';
import { ProductCategory } from '../models/productCategory.model.js';
import { Brand } from '../models/brand.model.js';
import { Uom } from '../models/uom.model.js';
import { Hsn } from '../models/hsn.model.js';
import { Product } from '../models/product.model.js';
import { PriceList } from '../models/priceList.model.js';
import { Bom } from '../models/bom.model.js';
import { Customer } from '../models/customer.model.js';
import { CustomerContact } from '../models/customerContact.model.js';
import { CustomerAddress } from '../models/customerAddress.model.js';
import { CustomerDocument } from '../models/customerDocument.model.js';
import { CustomerInteraction } from '../models/customerInteraction.model.js';
import { Lead } from '../models/lead.model.js';
import { LeadFollowup } from '../models/leadFollowup.model.js';
import { ChannelPartner } from '../models/channelPartner.model.js';
import { Quotation } from '../models/quotation.model.js';
import { RetailPos } from '../models/retailPos.model.js';
import { User } from '../models/user.model.js';

export async function seedAllModules() {
  console.log('--- Starting Enterprise Modules Seeding ---');

  const adminUser = await User.findOne({ email: 'admin@danzaerp.com' });
  const userId = adminUser ? adminUser._id : null;

  // 1. Company
  let company = await Company.findOne({ company_code: 'DANZA-HQ' });
  if (!company) {
    company = await Company.create({
      company_name: 'Danza International ERP Solutions Ltd',
      company_code: 'DANZA-HQ',
      legal_name: 'Danza International Private Limited',
      gstin: '27AABCD1234E1Z5',
      pan: 'AABCD1234E',
      cin: 'U72900MH2024PTC123456',
      email: 'corporate@danzaerp.com',
      phone: '+91 22 2490 8800',
      website: 'https://danzaerp.com',
      currency: 'INR',
      currency_symbol: '₹',
      financial_year_start: '04-01',
      financial_year_end: '03-31',
      registered_address: {
        address_line1: 'Tower B, Tech Park, Andheri East',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400069',
        country: 'India',
      },
      created_by: userId,
    });
    console.log('✓ Company profile seeded');
  }

  // 2. Branches
  let branchMumbai = await Branch.findOne({ branch_code: 'BR-MUM' });
  if (!branchMumbai) {
    branchMumbai = await Branch.create({
      branch_name: 'Mumbai Central Branch',
      branch_code: 'BR-MUM',
      company_id: company._id,
      is_head_office: true,
      email: 'mumbai@danzaerp.com',
      phone: '+91 22 2490 8801',
      gstin: '27AABCD1234E1Z5',
      state: 'Maharashtra',
      city: 'Mumbai',
      pincode: '400069',
      address_line1: 'Tower B, Tech Park, Andheri East',
      created_by: userId,
    });
  }

  let branchDelhi = await Branch.findOne({ branch_code: 'BR-DEL' });
  if (!branchDelhi) {
    branchDelhi = await Branch.create({
      branch_name: 'Delhi NCR Branch',
      branch_code: 'BR-DEL',
      company_id: company._id,
      is_head_office: false,
      email: 'delhi@danzaerp.com',
      phone: '+91 11 4150 9900',
      gstin: '07AABCD1234E1Z2',
      state: 'Delhi',
      city: 'New Delhi',
      pincode: '110020',
      address_line1: 'Plot 45, Okhla Industrial Area Phase III',
      created_by: userId,
    });
  }
  console.log('✓ Branches seeded (Mumbai, Delhi)');

  // 3. Warehouses
  let whCentral = await Warehouse.findOne({ warehouse_code: 'WH-MUM-01' });
  if (!whCentral) {
    whCentral = await Warehouse.create({
      warehouse_name: 'Central Distribution Hub Mumbai',
      warehouse_code: 'WH-MUM-01',
      branch_id: branchMumbai._id,
      warehouse_type: 'central',
      city: 'Bhiwandi',
      state: 'Maharashtra',
      is_primary: true,
      created_by: userId,
    });
  }

  let whNorth = await Warehouse.findOne({ warehouse_code: 'WH-DEL-01' });
  if (!whNorth) {
    whNorth = await Warehouse.create({
      warehouse_name: 'North Logistics Depot Delhi',
      warehouse_code: 'WH-DEL-01',
      branch_id: branchDelhi._id,
      warehouse_type: 'regional',
      city: 'New Delhi',
      state: 'Delhi',
      is_primary: false,
      created_by: userId,
    });
  }
  console.log('✓ Warehouses seeded');

  // 4. Number Series
  const defaultSeries = [
    { module: 'PRODUCT', prefix: 'PRD-', padding: 4, current_number: 100 },
    { module: 'CUSTOMER', prefix: 'CUST-', padding: 4, current_number: 200 },
    { module: 'LEAD', prefix: 'LD-', padding: 4, current_number: 300 },
    { module: 'QUOTATION', prefix: 'QUO-2026-', padding: 4, current_number: 1 },
    { module: 'POS_BILL', prefix: 'POS-2026-', padding: 4, current_number: 1 },
    { module: 'PARTNER', prefix: 'CP-', padding: 3, current_number: 10 },
    { module: 'BOM', prefix: 'BOM-', padding: 4, current_number: 50 },
    { module: 'PRICE_LIST', prefix: 'PL-', padding: 3, current_number: 10 },
  ];

  for (const ns of defaultSeries) {
    await NumberSeries.findOneAndUpdate({ module: ns.module }, { $setOnInsert: ns }, { upsert: true });
  }
  console.log('✓ Number series seeded');

  // 5. Product Masters: Categories, Brands, UOMs, HSNs
  let catHardware = await ProductCategory.findOne({ category_code: 'CAT-HDW' });
  if (!catHardware) {
    catHardware = await ProductCategory.create({
      category_name: 'Architectural Hardware',
      category_code: 'CAT-HDW',
      description: 'Hinges, locks, handles, door closers',
    });
  }

  let catGlass = await ProductCategory.findOne({ category_code: 'CAT-GLS' });
  if (!catGlass) {
    catGlass = await ProductCategory.create({
      category_name: 'Glass Fittings & Railing',
      category_code: 'CAT-GLS',
      description: 'Spider fittings, glass clamps, spigots, balustrades',
    });
  }

  let brandSign = await Brand.findOne({ brand_name: 'Danza Signature' });
  if (!brandSign) {
    brandSign = await Brand.create({
      brand_name: 'Danza Signature',
      brand_code: 'BRD-SIGN',
      description: 'Luxury grade architectural hardware',
    });
  }

  let brandPro = await Brand.findOne({ brand_name: 'Danza Pro-Fit' });
  if (!brandPro) {
    brandPro = await Brand.create({
      brand_name: 'Danza Pro-Fit',
      brand_code: 'BRD-PROF',
      description: 'Commercial & high traffic performance hardware',
    });
  }

  let uomPcs = await Uom.findOne({ uom_code: 'PCS' });
  if (!uomPcs) {
    uomPcs = await Uom.create({ uom_name: 'Pieces', uom_code: 'PCS' });
  }

  let uomSet = await Uom.findOne({ uom_code: 'SET' });
  if (!uomSet) {
    uomSet = await Uom.create({ uom_name: 'Set / Pair', uom_code: 'SET' });
  }

  let uomMtr = await Uom.findOne({ uom_code: 'MTR' });
  if (!uomMtr) {
    uomMtr = await Uom.create({ uom_name: 'Meters', uom_code: 'MTR' });
  }

  let hsn1 = await Hsn.findOne({ hsn_code: '83024110' });
  if (!hsn1) {
    hsn1 = await Hsn.create({
      hsn_code: '83024110',
      description: 'Fittings for doors and windows of base metal',
      gst_rate: 18,
    });
  }
  console.log('✓ Product categories, brands, UOMs, HSNs seeded');

  // 6. Products
  let prod1 = await Product.findOne({ sku: 'DZ-SS-HNG-403' });
  if (!prod1) {
    prod1 = await Product.create({
      product_name: 'Heavy Duty SS 304 Bearing Hinge (4"x3"x3mm)',
      product_code: 'PRD-0101',
      sku: 'DZ-SS-HNG-403',
      category_id: catHardware._id,
      brand_id: brandSign._id,
      uom_id: uomSet._id,
      hsn_id: hsn1._id,
      gst_rate: 18,
      purchase_rate: 220,
      selling_rate: 450,
      product_type: 'finished_good',
      opening_stock: 500,
      current_stock: 480,
      reorder_level: 50,
      status: 'active',
      created_by: userId,
    });
  }

  let prod2 = await Product.findOne({ sku: 'DZ-FLR-SPG-100' });
  if (!prod2) {
    prod2 = await Product.create({
      product_name: 'Hydraulic Double Cylinder Floor Spring 100KG',
      product_code: 'PRD-0102',
      sku: 'DZ-FLR-SPG-100',
      category_id: catGlass._id,
      brand_id: brandSign._id,
      uom_id: uomPcs._id,
      hsn_id: hsn1._id,
      gst_rate: 18,
      purchase_rate: 1850,
      selling_rate: 3400,
      product_type: 'finished_good',
      opening_stock: 120,
      current_stock: 110,
      reorder_level: 20,
      status: 'active',
      created_by: userId,
    });
  }

  let prod3 = await Product.findOne({ sku: 'DZ-MORT-LCK-85' });
  if (!prod3) {
    prod3 = await Product.create({
      product_name: 'Euro Profile Mortise Lock Body 85mm Center',
      product_code: 'PRD-0103',
      sku: 'DZ-MORT-LCK-85',
      category_id: catHardware._id,
      brand_id: brandPro._id,
      uom_id: uomPcs._id,
      hsn_id: hsn1._id,
      gst_rate: 18,
      purchase_rate: 650,
      selling_rate: 1250,
      product_type: 'finished_good',
      opening_stock: 250,
      current_stock: 235,
      reorder_level: 30,
      status: 'active',
      created_by: userId,
    });
  }

  let prodRaw1 = await Product.findOne({ sku: 'RAW-SS304-ROD' });
  if (!prodRaw1) {
    prodRaw1 = await Product.create({
      product_name: 'Stainless Steel 304 Solid Rod Extrusion',
      product_code: 'PRD-RAW-001',
      sku: 'RAW-SS304-ROD',
      category_id: catHardware._id,
      uom_id: uomMtr._id,
      gst_rate: 18,
      purchase_rate: 140,
      selling_rate: 200,
      product_type: 'raw_material',
      opening_stock: 2000,
      current_stock: 1800,
      status: 'active',
      created_by: userId,
    });
  }
  console.log('✓ Products seeded');

  // 7. Price List
  let priceList = await PriceList.findOne({ price_list_code: 'PL-WHOLESALE' });
  if (!priceList) {
    priceList = await PriceList.create({
      price_list_name: 'Standard Wholesale & Distributor List',
      price_list_code: 'PL-WHOLESALE',
      type: 'dealer',
      is_default: true,
      items: [
        { product_id: prod1._id, min_quantity: 10, rate: 380, discount_percent: 5 },
        { product_id: prod2._id, min_quantity: 5, rate: 2950, discount_percent: 8 },
        { product_id: prod3._id, min_quantity: 10, rate: 1050, discount_percent: 10 },
      ],
      created_by: userId,
    });
  }

  // 8. BOM
  let bom1 = await Bom.findOne({ bom_number: 'BOM-HNG-403' });
  if (!bom1) {
    bom1 = await Bom.create({
      bom_number: 'BOM-HNG-403',
      product_id: prod1._id,
      bom_name: 'SS 304 Bearing Hinge Standard Production Assembly',
      revision: 'Rev-01',
      batch_size: 100,
      uom_id: uomSet._id,
      items: [
        {
          item_product_id: prodRaw1._id,
          quantity: 40,
          uom_id: uomMtr._id,
          unit_cost: 140,
          total_cost: 5600,
          wastage_percent: 3,
        },
      ],
      overhead_cost: 1200,
      labor_cost: 2500,
      total_estimated_cost: 9300,
      created_by: userId,
    });
  }
  console.log('✓ Price list and BOM seeded');

  // 9. Customers
  let custApex = await Customer.findOne({ customer_code: 'CUST-0201' });
  if (!custApex) {
    custApex = await Customer.create({
      customer_code: 'CUST-0201',
      company_name: 'Apex Infrastructure & Facade Projects LLP',
      customer_type: 'corporate',
      gstin: '27AAACA1122B1Z3',
      pan: 'AAACA1122B',
      email: 'procurement@apexinfra.com',
      phone: '+91 22 6123 4400',
      website: 'https://apexinfra.com',
      credit_limit: 1500000,
      credit_days: 45,
      credit_status: 'approved',
      price_list_id: priceList._id,
      sales_person_id: userId,
      branch_id: branchMumbai._id,
      segment: 'Platinum',
      stage: 'active',
      outstanding_balance: 320000,
      total_orders_count: 8,
      status: 'active',
      created_by: userId,
    });

    await CustomerContact.create({
      customer_id: custApex._id,
      contact_name: 'Rajesh Mehra',
      designation: 'VP - Procurement & Contracts',
      email: 'r.mehra@apexinfra.com',
      phone: '+91 98200 12345',
      is_primary: true,
      is_decision_maker: true,
      created_by: userId,
    });

    await CustomerAddress.create({
      customer_id: custApex._id,
      address_type: 'billing',
      address_title: 'Corporate Headquarters',
      address_line1: 'Apex Tower, 12th Floor, BKC',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400051',
      gstin: '27AAACA1122B1Z3',
      is_primary: true,
      created_by: userId,
    });

    await CustomerDocument.create({
      customer_id: custApex._id,
      doc_type: 'gst_certificate',
      doc_number: '27AAACA1122B1Z3',
      file_name: 'apex_gst_certificate.pdf',
      file_url: '/uploads/docs/apex_gst.pdf',
      verification_status: 'verified',
      verified_by: userId,
      verified_at: new Date(),
      created_by: userId,
    });

    await CustomerInteraction.create({
      customer_id: custApex._id,
      interaction_type: 'meeting',
      subject: 'Quarterly Rate Contract Discussion for Phase 2 Glass Towers',
      description: 'Discussed volume discount and annual commitment for floor springs and hinges.',
      interaction_date: new Date(),
      conducted_by: userId,
      next_action_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      outcome: 'Client requested revised quote with 5% partner discount.',
      created_by: userId,
    });
  }

  let custMetro = await Customer.findOne({ customer_code: 'CUST-0202' });
  if (!custMetro) {
    custMetro = await Customer.create({
      customer_code: 'CUST-0202',
      company_name: 'Metro Hardware & Sanitary Distributors',
      customer_type: 'distributor',
      gstin: '07BBBPB9988C1Z8',
      pan: 'BBBPB9988C',
      email: 'sales@metrohardware.in',
      phone: '+91 11 2380 5511',
      credit_limit: 800000,
      credit_days: 30,
      credit_status: 'approved',
      price_list_id: priceList._id,
      sales_person_id: userId,
      branch_id: branchDelhi._id,
      segment: 'Gold',
      stage: 'active',
      outstanding_balance: 145000,
      total_orders_count: 14,
      status: 'active',
      created_by: userId,
    });
  }
  console.log('✓ Customers, contacts, addresses, interactions seeded');

  // 10. Leads & Follow-ups
  let lead1 = await Lead.findOne({ lead_code: 'LD-0301' });
  if (!lead1) {
    lead1 = await Lead.create({
      lead_code: 'LD-0301',
      company_name: 'Godrej Properties Luxury Residences',
      contact_name: 'Sunil Verma',
      email: 's.verma@godrejluxury.com',
      mobile: '+91 99880 77665',
      city: 'Mumbai',
      state: 'Maharashtra',
      lead_source: 'exhibition',
      pipeline_stage: 'proposal',
      lead_status: 'proposal_sent',
      rating: 'hot',
      estimated_value: 850000,
      probability_percent: 75,
      expected_closing_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      assigned_to: userId,
      branch_id: branchMumbai._id,
      notes: 'Interested in SS 304 premium mortise locks and concealed hinges for 120 luxury villas.',
      created_by: userId,
    });

    await LeadFollowup.create({
      lead_id: lead1._id,
      followup_type: 'meeting',
      followup_date: new Date(),
      followup_time: '02:30 PM',
      priority: 'high',
      assigned_to: userId,
      status: 'pending',
      agenda: 'Deliver physical hardware sample mockups and finalize discount terms.',
      created_by: userId,
    });
  }

  let lead2 = await Lead.findOne({ lead_code: 'LD-0302' });
  if (!lead2) {
    lead2 = await Lead.create({
      lead_code: 'LD-0302',
      company_name: 'K Raheja Corp Tech Park Phase IV',
      contact_name: 'Anita Roy',
      email: 'anita.roy@kraheja.com',
      mobile: '+91 98110 54321',
      city: 'Bengaluru',
      state: 'Karnataka',
      lead_source: 'referral',
      pipeline_stage: 'negotiation',
      lead_status: 'negotiation',
      rating: 'hot',
      estimated_value: 1450000,
      probability_percent: 85,
      expected_closing_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      assigned_to: userId,
      branch_id: branchMumbai._id,
      notes: 'Contract negotiation for glass patch fittings and automatic floor springs.',
      created_by: userId,
    });
  }

  let lead3 = await Lead.findOne({ lead_code: 'LD-0303' });
  if (!lead3) {
    lead3 = await Lead.create({
      lead_code: 'LD-0303',
      company_name: 'Skyline Interior Architects',
      contact_name: 'Deepak Chopra',
      email: 'deepak@skylinearchitects.in',
      mobile: '+91 97230 45678',
      city: 'Ahmedabad',
      state: 'Gujarat',
      lead_source: 'website',
      pipeline_stage: 'contacted',
      lead_status: 'contacted',
      rating: 'warm',
      estimated_value: 320000,
      probability_percent: 40,
      expected_closing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      assigned_to: userId,
      branch_id: branchMumbai._id,
      created_by: userId,
    });
  }
  console.log('✓ Leads and follow-ups seeded');

  // 11. Channel Partner
  let cpGold = await ChannelPartner.findOne({ partner_code: 'CP-010' });
  if (!cpGold) {
    cpGold = await ChannelPartner.create({
      partner_code: 'CP-010',
      partner_name: 'Gold Coast Hardware Distributors LLP',
      partner_type: 'distributor',
      contact_person: 'Vikram Singhania',
      email: 'vikram@goldcoasthardware.in',
      phone: '+91 98220 99887',
      commission_percent: 6.5,
      city: 'Pune',
      state: 'Maharashtra',
      gstin: '27AAAFG1122H1Z4',
      status: 'active',
      created_by: userId,
    });
  }

  // 12. Quotations
  let quo1 = await Quotation.findOne({ quotation_number: 'QUO-2026-0001-R0' });
  if (!quo1 && custApex) {
    quo1 = await Quotation.create({
      quotation_number: 'QUO-2026-0001-R0',
      base_number: 'QUO-2026-0001',
      revision_number: 'R0',
      customer_id: custApex._id,
      quotation_date: new Date(),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      sales_person_id: userId,
      branch_id: branchMumbai._id,
      channel_partner_id: cpGold._id,
      is_interstate: false,
      items: [
        {
          product_id: prod1._id,
          description: 'Heavy Duty SS 304 Bearing Hinge',
          quantity: 200,
          uom_id: uomSet._id,
          rate: 450,
          discount_percent: 10,
          discount_amount: 9000,
          taxable_amount: 81000,
          gst_rate: 18,
          cgst_amount: 7290,
          sgst_amount: 7290,
          igst_amount: 0,
          total_amount: 95580,
        },
        {
          product_id: prod2._id,
          description: 'Hydraulic Double Cylinder Floor Spring 100KG',
          quantity: 50,
          uom_id: uomPcs._id,
          rate: 3400,
          discount_percent: 5,
          discount_amount: 8500,
          taxable_amount: 161500,
          gst_rate: 18,
          cgst_amount: 14535,
          sgst_amount: 14535,
          igst_amount: 0,
          total_amount: 190570,
        },
      ],
      subtotal: 260000,
      discount_total: 17500,
      taxable_total: 242500,
      cgst_total: 21825,
      sgst_total: 21825,
      igst_total: 0,
      grand_total: 286150,
      status: 'approved',
      discount_approval_status: 'approved',
      discount_approved_by: userId,
      notes: 'Supply for Apex BKC Tower Project - Lot 1',
      created_by: userId,
    });
  }

  // 13. Retail POS Bill
  let posBill = await RetailPos.findOne({ bill_number: 'POS-2026-0001' });
  if (!posBill) {
    posBill = await RetailPos.create({
      bill_number: 'POS-2026-0001',
      bill_date: new Date(),
      branch_id: branchMumbai._id,
      cashier_id: userId,
      customer_name: 'Anil K. Sharma (Walk-in)',
      customer_phone: '+91 98200 44556',
      items: [
        {
          product_id: prod1._id,
          product_name: prod1.product_name,
          sku: prod1.sku,
          quantity: 4,
          rate: 450,
          discount_amount: 0,
          gst_rate: 18,
          tax_amount: 324,
          total: 2124,
        },
      ],
      subtotal: 1800,
      discount_total: 0,
      tax_total: 324,
      grand_total: 2124,
      payment_mode: 'upi',
      amount_paid: 2124,
      change_returned: 0,
      status: 'completed',
    });
  }
  console.log('✓ Channel partner, quotations, and retail POS bills seeded');
  console.log('--- All Enterprise Modules Seeded Successfully! ---');
}
