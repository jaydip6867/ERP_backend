import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  User,
  Company,
  Branch,
  Warehouse,
  Product,
  Customer,
  Supplier,
  TaxRate,
  QcParameter,
  QcTemplate,
  QcInspection,
  Transporter,
  PurchaseRequisition,
  PurchaseOrder,
  GoodsReceiptNote,
  PurchaseInvoice,
  SalesOrder,
  WorkOrder,
  MaterialIssue,
  ProductionLog,
  Dispatch,
  Invoice,
  CreditDebitNote,
  Bom,
  Batch,
} from '../models/index.js';
import { StockTransactionService } from '../services/stockTransaction.service.js';
import { GstCalculationService } from '../services/gstCalculation.service.js';

dotenv.config();

export const seedOperations = async () => {
  console.log('🌱 Starting Operations modules seeding...');

  const admin = await User.findOne({ email: 'admin@danzaerp.com' });
  const company = await Company.findOne();
  const branch = await Branch.findOne();
  const warehouse = await Warehouse.findOne();
  const customer = await Customer.findOne();
  const products = await Product.find({ status: 'active' });
  const bom = await Bom.findOne();

  if (!admin || !branch || !warehouse || !customer || products.length === 0) {
    console.log('⚠️ Prerequisite master data missing. Please ensure modules.seed.js has run.');
    return;
  }

  const finishedGood = products.find((p) => p.product_type === 'finished_good') || products[0];
  const rawMaterial = products.find((p) => p.product_type === 'raw_material') || products[1] || products[0];

  // 1. Seed Tax Rates
  console.log('  -> Seeding Tax Rates...');
  await TaxRate.deleteMany({});
  const taxRates = await TaxRate.insertMany([
    { tax_name: 'GST Exempted / Nil', tax_code: 'GST_0', total_rate: 0, cgst_rate: 0, sgst_rate: 0, igst_rate: 0 },
    { tax_name: 'GST 5% (Intra 2.5% + 2.5%)', tax_code: 'GST_5', total_rate: 5, cgst_rate: 2.5, sgst_rate: 2.5, igst_rate: 5 },
    { tax_name: 'GST 12% (Intra 6% + 6%)', tax_code: 'GST_12', total_rate: 12, cgst_rate: 6, sgst_rate: 6, igst_rate: 12 },
    { tax_name: 'GST 18% Standard (Intra 9% + 9%)', tax_code: 'GST_18', total_rate: 18, cgst_rate: 9, sgst_rate: 9, igst_rate: 18, is_default: true },
    { tax_name: 'GST 28% Luxury/Heavy (Intra 14% + 14%)', tax_code: 'GST_28', total_rate: 28, cgst_rate: 14, sgst_rate: 14, igst_rate: 28 },
  ]);

  // 2. Seed Suppliers
  console.log('  -> Seeding Suppliers...');
  await Supplier.deleteMany({});
  const suppliers = await Supplier.insertMany([
    {
      supplier_name: 'Apex Metals & Alloys Ltd.',
      supplier_code: 'SUP-0001',
      contact_person: 'Rajesh Singhania',
      email: 'sales@apexmetals.com',
      mobile: '+91 98251 77210',
      gstin: '24AAACA1234F1Z8',
      category: 'raw_materials',
      rating: 5,
      address: { address_line1: 'Plot 42, GIDC Sachin', city: 'Surat', state: 'Gujarat', pincode: '394230' },
      status: 'active',
      created_by: admin._id,
    },
    {
      supplier_name: 'Precision Fasteners & Seals Pvt Ltd',
      supplier_code: 'SUP-0002',
      contact_person: 'Anil Desai',
      email: 'orders@precisionfasteners.in',
      mobile: '+91 98980 44321',
      gstin: '24AABCP5678G1Z2',
      category: 'consumables',
      rating: 4,
      address: { address_line1: 'Sector 8, Ankleshwar', city: 'Bharuch', state: 'Gujarat', pincode: '393002' },
      status: 'active',
      created_by: admin._id,
    },
    {
      supplier_name: 'TechnoPack Corrugated Boxes',
      supplier_code: 'SUP-0003',
      contact_person: 'Vikram Joshi',
      email: 'contact@technopack.com',
      mobile: '+91 97129 88990',
      gstin: '27AABCT9988H1ZV',
      category: 'packaging',
      rating: 4,
      address: { address_line1: 'MIDC Rabale', city: 'Navi Mumbai', state: 'Maharashtra', pincode: '400701' },
      status: 'active',
      created_by: admin._id,
    },
  ]);

  // 3. Seed Transporters
  console.log('  -> Seeding Transporters...');
  await Transporter.deleteMany({});
  const transporters = await Transporter.insertMany([
    {
      transporter_name: 'V-Trans Express Cargo Ltd',
      transporter_code: 'TRP-0001',
      transporter_id_gst: '24AABCV3344J1Z5',
      contact_person: 'Kishore Mehta',
      phone: '+91 98250 11223',
      vehicle_types: ['Tata 407 (2.5T)', '14ft Container', '32ft Multi-Axle'],
      rating: 5,
      status: 'active',
      created_by: admin._id,
    },
    {
      transporter_name: 'SafeX Logistics & Roadways',
      transporter_code: 'TRP-0002',
      transporter_id_gst: '24AABCS7766K1Z9',
      contact_person: 'Dharmesh Trivedi',
      phone: '+91 99090 33445',
      vehicle_types: ['Eicher Pro 1049', 'Mahindra Bolero Pickup'],
      rating: 4,
      status: 'active',
      created_by: admin._id,
    },
  ]);

  // 4. Seed QC Parameters & Templates
  console.log('  -> Seeding QC Parameters & Templates...');
  await QcParameter.deleteMany({});
  const qcParams = await QcParameter.insertMany([
    {
      param_name: 'Outer Dimension / Diameter',
      param_code: 'QCP-0001',
      category: 'dimensional',
      standard_value: '50.00 mm',
      min_tolerance: 49.85,
      max_tolerance: 50.15,
      unit_of_measure: 'mm',
      created_by: admin._id,
    },
    {
      param_name: 'Surface Finish & Polish',
      param_code: 'QCP-0002',
      category: 'visual',
      data_type: 'boolean',
      standard_value: 'Scratch-free, uniform Ra < 0.8',
      created_by: admin._id,
    },
    {
      param_name: 'Tensile / Burst Pressure Test',
      param_code: 'QCP-0003',
      category: 'mechanical',
      standard_value: '16.0 bar',
      min_tolerance: 15.0,
      max_tolerance: 20.0,
      unit_of_measure: 'bar',
      created_by: admin._id,
    },
  ]);

  await QcTemplate.deleteMany({});
  const qcTemplate = await QcTemplate.create({
    template_name: 'Standard Industrial Inspection Template',
    template_code: 'QCT-0001',
    inspection_type: 'incoming',
    product_id: rawMaterial._id,
    sample_size_percent: 10,
    parameters: qcParams.map((p) => ({
      parameter_id: p._id,
      standard_spec: p.standard_value,
      is_mandatory: true,
    })),
    status: 'active',
    created_by: admin._id,
  });

  // 5. Seed Initial Stock & Batch for Raw Material & Finished Good
  console.log('  -> Initializing Warehouse Stock & Batches...');
  await Batch.deleteMany({});
  await Batch.create([
    {
      batch_number: 'BATCH-RAW-2026-001',
      product_id: rawMaterial._id,
      warehouse_id: warehouse._id,
      mfg_date: new Date('2026-01-10'),
      expiry_date: new Date('2028-01-10'),
      initial_qty: 500,
      current_qty: 500,
      cost_rate: rawMaterial.purchase_rate || 120,
      status: 'active',
      created_by: admin._id,
    },
    {
      batch_number: 'BATCH-FG-2026-001',
      product_id: finishedGood._id,
      warehouse_id: warehouse._id,
      mfg_date: new Date('2026-02-15'),
      expiry_date: new Date('2029-02-15'),
      initial_qty: 120,
      current_qty: 120,
      cost_rate: finishedGood.purchase_rate || 450,
      status: 'active',
      created_by: admin._id,
    },
  ]);

  // Seed baseline stock ledger entry
  await StockTransactionService.recordTransaction({
    transaction_type: 'OPENING_STOCK',
    product_id: rawMaterial._id,
    warehouse_id: warehouse._id,
    batch_number: 'BATCH-RAW-2026-001',
    qty: 500,
    unit_cost: rawMaterial.purchase_rate || 120,
    reference_type: 'Opening',
    reference_no: 'OPN-2026-01',
    remarks: 'Opening raw material stock balance',
    performed_by: admin._id,
  });

  await StockTransactionService.recordTransaction({
    transaction_type: 'OPENING_STOCK',
    product_id: finishedGood._id,
    warehouse_id: warehouse._id,
    batch_number: 'BATCH-FG-2026-001',
    qty: 120,
    unit_cost: finishedGood.purchase_rate || 450,
    reference_type: 'Opening',
    reference_no: 'OPN-2026-02',
    remarks: 'Opening finished goods stock balance',
    performed_by: admin._id,
  });

  // 6. Purchase Workflow: PR -> PO -> GRN -> QC Pass -> Supplier Bill
  console.log('  -> Seeding Procurement flow (PR -> PO -> GRN -> QC)...');
  await PurchaseRequisition.deleteMany({});
  const pr = await PurchaseRequisition.create({
    pr_number: 'PR-2026-00001',
    pr_date: new Date(),
    department: 'Production',
    priority: 'high',
    requested_by: admin._id,
    warehouse_id: warehouse._id,
    reason_for_request: 'min_reorder_level',
    items: [
      {
        product_id: rawMaterial._id,
        requested_qty: 100,
        approved_qty: 100,
        po_qty: 100,
        estimated_rate: rawMaterial.purchase_rate || 120,
        required_by_date: new Date(Date.now() + 7 * 86400000),
      },
    ],
    status: 'approved',
    approved_by: admin._id,
    approved_at: new Date(),
    created_by: admin._id,
  });

  await PurchaseOrder.deleteMany({});
  const poCalc = GstCalculationService.calculateItemTaxes([
    { ordered_qty: 100, rate: rawMaterial.purchase_rate || 120, gst_rate: 18 },
  ], false);

  const po = await PurchaseOrder.create({
    po_number: 'PO-2026-00001',
    po_date: new Date(),
    supplier_id: suppliers[0]._id,
    pr_id: pr._id,
    branch_id: branch._id,
    warehouse_id: warehouse._id,
    expected_delivery_date: new Date(Date.now() + 5 * 86400000),
    payment_terms: 'Net 30 Days',
    items: [
      {
        product_id: rawMaterial._id,
        ordered_qty: 100,
        received_qty: 100,
        pending_qty: 0,
        rate: rawMaterial.purchase_rate || 120,
        taxable_amount: poCalc.taxable_total,
        gst_rate: 18,
        cgst_amount: poCalc.cgst_total,
        sgst_amount: poCalc.sgst_total,
        total_amount: poCalc.grand_total,
      },
    ],
    subtotal: poCalc.subtotal,
    taxable_amount: poCalc.taxable_total,
    cgst_total: poCalc.cgst_total,
    sgst_total: poCalc.sgst_total,
    grand_total: poCalc.grand_total,
    status: 'completed',
    created_by: admin._id,
  });

  await GoodsReceiptNote.deleteMany({});
  const grn = await GoodsReceiptNote.create({
    grn_number: 'GRN-2026-00001',
    grn_date: new Date(),
    po_id: po._id,
    supplier_id: suppliers[0]._id,
    warehouse_id: warehouse._id,
    vendor_challan_no: 'CH-APEX-9921',
    vendor_challan_date: new Date(),
    vehicle_number: 'GJ-05-BX-4482',
    driver_name: 'Ramesh Patel',
    items: [
      {
        product_id: rawMaterial._id,
        received_qty: 100,
        accepted_qty: 100,
        rejected_qty: 0,
        unit_rate: rawMaterial.purchase_rate || 120,
        batch_number: 'BATCH-APEX-GRN-01',
        qc_status: 'passed',
      },
    ],
    status: 'stocked',
    stock_posted: true,
    received_by: admin._id,
    created_by: admin._id,
  });

  // Post GRN stock entry
  await StockTransactionService.recordTransaction({
    transaction_type: 'GRN',
    product_id: rawMaterial._id,
    warehouse_id: warehouse._id,
    batch_number: 'BATCH-APEX-GRN-01',
    qty: 100,
    unit_cost: rawMaterial.purchase_rate || 120,
    reference_type: 'GoodsReceiptNote',
    reference_id: grn._id,
    reference_no: grn.grn_number,
    remarks: 'GRN received and QC passed',
    performed_by: admin._id,
  });

  // Incoming QC inspection record
  await QcInspection.deleteMany({});
  await QcInspection.create({
    inspection_number: 'QC-2026-00001',
    inspection_type: 'incoming',
    source_document_type: 'GRN',
    source_document_id: grn._id,
    source_document_no: grn.grn_number,
    product_id: rawMaterial._id,
    batch_no: 'BATCH-APEX-GRN-01',
    template_id: qcTemplate._id,
    sample_size: 10,
    total_qty: 100,
    accepted_qty: 100,
    rejected_qty: 0,
    rework_qty: 0,
    outcome: 'PASS',
    inspector_id: admin._id,
    results: [
      { parameter_name: 'Outer Dimension / Diameter', standard_spec: '50.00 mm', observed_value: '50.02 mm', result: 'PASS' },
      { parameter_name: 'Surface Finish & Polish', standard_spec: 'Scratch-free', observed_value: 'Clean & polished', result: 'PASS' },
    ],
    remarks: 'Sample batch fully complies with tolerance specification',
    created_by: admin._id,
  });

  // Supplier Bill / Purchase Invoice
  await PurchaseInvoice.deleteMany({});
  await PurchaseInvoice.create({
    invoice_number: 'PINV-2026-00001',
    vendor_bill_number: 'APEX/2026/0412',
    bill_date: new Date(),
    due_date: new Date(Date.now() + 30 * 86400000),
    supplier_id: suppliers[0]._id,
    po_id: po._id,
    grn_id: grn._id,
    items: [
      {
        product_id: rawMaterial._id,
        description: rawMaterial.product_name,
        hsn_code: '7304',
        quantity: 100,
        unit_rate: rawMaterial.purchase_rate || 120,
        taxable_amount: 12000,
        gst_rate: 18,
        cgst_amount: 1080,
        sgst_amount: 1080,
        total_amount: 14160,
      },
    ],
    taxable_amount: 12000,
    cgst_total: 1080,
    sgst_total: 1080,
    grand_total: 14160,
    paid_amount: 0,
    balance_amount: 14160,
    payment_status: 'unpaid',
    status: 'posted',
    created_by: admin._id,
  });

  // 7. Sales Order Workflow: SO -> Stock Reservation -> Work Order
  console.log('  -> Seeding Sales Order & Stock Reservation...');
  await SalesOrder.deleteMany({});
  const soTaxCalc = GstCalculationService.calculateItemTaxes([
    { ordered_qty: 25, rate: finishedGood.selling_rate || 850, gst_rate: 18 },
  ], false);

  const salesOrder = await SalesOrder.create({
    order_number: 'SO-2026-00001',
    order_date: new Date(),
    customer_id: customer._id,
    salesperson_id: admin._id,
    branch_id: branch._id,
    warehouse_id: warehouse._id,
    customer_po_number: 'CUST-PO-2026-884',
    customer_po_date: new Date(),
    payment_terms: 'Net 30 Days',
    delivery_terms: 'Door Delivery',
    expected_delivery_date: new Date(Date.now() + 10 * 86400000),
    billing_address: {
      address_line1: customer.billing_address?.address_line1 || 'Ring Road',
      city: customer.billing_address?.city || 'Surat',
      state: 'Gujarat',
      pincode: '395002',
    },
    shipping_address: {
      address_line1: customer.billing_address?.address_line1 || 'Ring Road',
      city: customer.billing_address?.city || 'Surat',
      state: 'Gujarat',
      pincode: '395002',
    },
    items: [
      {
        product_id: finishedGood._id,
        description: finishedGood.product_name,
        ordered_qty: 25,
        reserved_qty: 25,
        to_purchase_qty: 0,
        to_produce_qty: 0,
        ready_qty: 25,
        dispatched_qty: 15,
        delivered_qty: 15,
        invoiced_qty: 15,
        pending_qty: 10,
        rate: finishedGood.selling_rate || 850,
        taxable_amount: soTaxCalc.taxable_total,
        gst_rate: 18,
        cgst_amount: soTaxCalc.cgst_total,
        sgst_amount: soTaxCalc.sgst_total,
        total_amount: soTaxCalc.grand_total,
      },
    ],
    subtotal: soTaxCalc.subtotal,
    taxable_amount: soTaxCalc.taxable_total,
    cgst_total: soTaxCalc.cgst_total,
    sgst_total: soTaxCalc.sgst_total,
    grand_total: soTaxCalc.grand_total,
    status: 'partially_dispatched',
    approval: {
      status: 'approved',
      approved_by: admin._id,
      approved_at: new Date(),
      remarks: 'Pre-approved enterprise order',
    },
    audit_trail: [
      { action: 'ORDER_CREATED', status_to: 'approved', performed_by: admin._id, remarks: 'Created and approved' },
      { action: 'STOCK_RESERVED', status_to: 'processing', performed_by: admin._id, remarks: 'Reserved 25 units from central warehouse' },
      { action: 'DISPATCH_CONFIRMED', status_to: 'partially_dispatched', performed_by: admin._id, remarks: 'Partial shipment of 15 units dispatched' },
    ],
    created_by: admin._id,
  });

  // 8. Production Workflow: Work Order -> Material Issue -> Production Log
  console.log('  -> Seeding Production flow (Work Order -> Issue -> Log)...');
  await WorkOrder.deleteMany({});
  const workOrder = await WorkOrder.create({
    wo_number: 'WO-2026-00001',
    wo_date: new Date(),
    sales_order_id: salesOrder._id,
    product_id: finishedGood._id,
    bom_id: bom ? bom._id : new mongoose.Types.ObjectId(),
    warehouse_id: warehouse._id,
    raw_material_warehouse_id: warehouse._id,
    planned_qty: 50,
    produced_qty: 50,
    rejected_qty: 2,
    planned_start_date: new Date(Date.now() - 3 * 86400000),
    planned_end_date: new Date(),
    status: 'completed',
    assigned_supervisor_id: admin._id,
    target_batch_number: 'BATCH-FG-WO1',
    created_by: admin._id,
  });

  await MaterialIssue.deleteMany({});
  await MaterialIssue.create({
    issue_number: 'MI-2026-00001',
    issue_date: new Date(Date.now() - 2 * 86400000),
    work_order_id: workOrder._id,
    warehouse_id: warehouse._id,
    items: [
      {
        product_id: rawMaterial._id,
        required_qty: 50,
        issued_qty: 50,
        unit_cost: 120,
        total_cost: 6000,
      },
    ],
    total_cost: 6000,
    issued_by: admin._id,
    status: 'issued',
    stock_deducted: true,
    created_by: admin._id,
  });

  await ProductionLog.deleteMany({});
  await ProductionLog.create({
    log_number: 'PLOG-2026-00001',
    work_order_id: workOrder._id,
    log_date: new Date(),
    shift: 'Shift A (Morning)',
    machine_name: 'CNC Milling Cell #1',
    operator_name: 'Sunil Verma',
    quantity_produced: 50,
    scrap_quantity: 2,
    downtime_minutes: 25,
    downtime_reason: 'Tooling bit replacement',
    qc_status: 'final_qc_passed',
    remarks: 'Clean production run meeting all cycle time benchmarks',
    created_by: admin._id,
  });

  // 9. Dispatch & Delivery: Dispatch -> Deduct Stock -> POD
  console.log('  -> Seeding Dispatch & Delivery tracking...');
  await Dispatch.deleteMany({});
  const dispatch = await Dispatch.create({
    dispatch_number: 'DSP-2026-00001',
    dispatch_date: new Date(),
    sales_order_id: salesOrder._id,
    customer_id: customer._id,
    warehouse_id: warehouse._id,
    transporter_id: transporters[0]._id,
    lr_number: 'LR-VTRANS-88491',
    lr_date: new Date(),
    vehicle_no: 'GJ-05-AZ-9120',
    driver_name: 'Mohan Lal',
    driver_phone: '+91 97230 44556',
    tracking_number: 'TRK-9901-2026',
    e_way_bill_no: '241098452109',
    e_way_bill_date: new Date(),
    total_packages: 3,
    gross_weight_kg: 75.5,
    items: [
      {
        sales_order_item_id: salesOrder.items[0]._id,
        product_id: finishedGood._id,
        batch_number: 'BATCH-FG-2026-001',
        dispatch_qty: 15,
        unit_rate: finishedGood.selling_rate || 850,
        taxable_amount: 15 * (finishedGood.selling_rate || 850),
      },
    ],
    status: 'delivered',
    stock_deducted: true,
    tracking_history: [
      { status: 'Dispatched from Central Warehouse', location: 'Surat CDC', timestamp: new Date(Date.now() - 86400000) },
      { status: 'In Transit', location: 'Bharuch Highway Checkpost', timestamp: new Date(Date.now() - 43200000) },
      { status: 'Delivered', location: 'Customer Receiving Dock', timestamp: new Date() },
    ],
    proof_of_delivery: {
      received_by_name: 'Dinesh Parmar (Store Manager)',
      received_by_phone: '+91 98240 11992',
      received_date: new Date(),
      pod_remarks: 'All 3 packages received intact in good condition with security seals.',
      verified_by: admin._id,
    },
    created_by: admin._id,
  });

  // 10. GST Invoices & Credit Notes
  console.log('  -> Seeding Tax Invoices & Credit Notes...');
  await Invoice.deleteMany({});
  const invTaxCalc = GstCalculationService.calculateItemTaxes([
    { quantity: 15, rate: finishedGood.selling_rate || 850, gst_rate: 18 },
  ], false);

  const invoice = await Invoice.create({
    invoice_number: 'INV-2026-00001',
    invoice_type: 'tax_invoice',
    invoice_date: new Date(),
    due_date: new Date(Date.now() + 30 * 86400000),
    sales_order_id: salesOrder._id,
    dispatch_id: dispatch._id,
    customer_id: customer._id,
    branch_id: branch._id,
    place_of_supply_state: 'Gujarat',
    is_interstate: false,
    billing_address: {
      address_line1: customer.billing_address?.address_line1 || 'GIDC Estate',
      city: 'Surat',
      state: 'Gujarat',
      pincode: '395002',
      gstin: customer.gstin || '24AAACC8899K1Z4',
    },
    shipping_address: {
      address_line1: customer.billing_address?.address_line1 || 'GIDC Estate',
      city: 'Surat',
      state: 'Gujarat',
      pincode: '395002',
      gstin: customer.gstin || '24AAACC8899K1Z4',
    },
    items: [
      {
        product_id: finishedGood._id,
        item_name: finishedGood.product_name,
        hsn_code: '8481',
        quantity: 15,
        uom: 'NOS',
        rate: finishedGood.selling_rate || 850,
        taxable_amount: invTaxCalc.taxable_total,
        gst_rate: 18,
        cgst_amount: invTaxCalc.cgst_total,
        sgst_amount: invTaxCalc.sgst_total,
        total_amount: invTaxCalc.grand_total,
      },
    ],
    subtotal: invTaxCalc.subtotal,
    taxable_total: invTaxCalc.taxable_total,
    cgst_total: invTaxCalc.cgst_total,
    sgst_total: invTaxCalc.sgst_total,
    grand_total: invTaxCalc.grand_total,
    paid_amount: 5000,
    balance_amount: invTaxCalc.grand_total - 5000,
    payment_status: 'partially_paid',
    status: 'issued',
    e_invoice: {
      irn: '4c8e71fa3e4981a8b928198f828108a9c8b82817382718291029381729381928',
      ack_no: '112026849102',
      ack_date: new Date(),
      signed_qr_code: 'NIC_GST_OFFICIAL_QR_VERIFIED_INV-2026-00001',
      status: 'generated',
    },
    e_way_bill: {
      ewb_number: '241098452109',
      ewb_date: new Date(),
      valid_upto: new Date(Date.now() + 3 * 86400000),
      status: 'generated',
    },
    created_by: admin._id,
  });

  // Credit Note
  await CreditDebitNote.deleteMany({});
  await CreditDebitNote.create({
    note_number: 'CN-2026-0001',
    note_type: 'credit_note',
    note_date: new Date(),
    original_invoice_id: invoice._id,
    original_invoice_number: invoice.invoice_number,
    party_type: 'customer',
    customer_id: customer._id,
    reason: 'discount_adjustment',
    items: [
      {
        description: 'Post-delivery commercial discount adjustment',
        taxable_amount: 500,
        gst_rate: 18,
        cgst_amount: 45,
        sgst_amount: 45,
        total_amount: 590,
      },
    ],
    taxable_amount: 500,
    cgst_total: 45,
    sgst_total: 45,
    grand_total: 590,
    status: 'issued',
    remarks: 'Agreed volume rebate credited to customer account',
    created_by: admin._id,
  });

  console.log('✅ Operations modules seeding completed successfully!');
};

import { connectDatabase, disconnectDatabase } from '../config/db.js';

// Allow standalone execution
if (process.argv[1]?.endsWith('operations.seed.js')) {
  connectDatabase()
    .then(async () => {
      console.log('Connected to MongoDB. Running operations seeder...');
      await seedOperations();
      await disconnectDatabase();
      console.log('Disconnected. Done!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}
