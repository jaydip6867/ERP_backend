import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../backend/.env') });

import { User } from '../models/user.model.js';
import { Customer } from '../models/customer.model.js';
import { Supplier } from '../models/supplier.model.js';
import { Product } from '../models/product.model.js';
import { SalesOrder } from '../models/salesOrder.model.js';
import { Invoice } from '../models/invoice.model.js';
import { PurchaseInvoice } from '../models/purchaseInvoice.model.js';
import { ChartOfAccounts } from '../models/chartOfAccounts.model.js';
import { JournalEntry } from '../models/journalEntry.model.js';
import { BankAccount } from '../models/bankAccount.model.js';
import { BankTransaction } from '../models/bankTransaction.model.js';
import { Receipt } from '../models/receipt.model.js';
import { Payment } from '../models/payment.model.js';
import { Expense, ExpenseCategory } from '../models/expense.model.js';
import { OwnerFinance } from '../models/ownerFinance.model.js';
import { Ticket } from '../models/ticket.model.js';
import { RootCause } from '../models/rootCause.model.js';
import { CustomerFeedback } from '../models/customerFeedback.model.js';
import { UpsellOpportunity } from '../models/upsellOpportunity.model.js';
import { RepeatOrder } from '../models/repeatOrder.model.js';
import { MarketingCampaign } from '../models/marketingCampaign.model.js';
import { TargetGoal } from '../models/targetGoal.model.js';
import { FounderDecision } from '../models/founderDecision.model.js';
import { Meeting } from '../models/meeting.model.js';
import { TodoTask } from '../models/todoTask.model.js';
import { CalendarEvent } from '../models/calendarEvent.model.js';
import { Notification } from '../models/notification.model.js';
import { AutomationRule } from '../models/automationRule.model.js';
import { DoubleEntryService } from '../services/doubleEntry.service.js';

export const seedFinanceAndIntelligence = async () => {
  console.log('Seeding Finance, Expenses, Owner Capital, Customer Service, and Intelligence...');

  const admin = await User.findOne({ email: 'admin@danzaerp.com' });
  const customer = await Customer.findOne();
  const supplier = await Supplier.findOne();
  const product = await Product.findOne();
  const order = await SalesOrder.findOne();
  const invoice = await Invoice.findOne();
  const purchaseInvoice = await PurchaseInvoice.findOne();

  // 1. Chart of Accounts
  await DoubleEntryService.seedStandardAccounts();
  const bankCoa = await ChartOfAccounts.findOne({ sub_type: 'BANK_AND_CASH' });
  const arCoa = await ChartOfAccounts.findOne({ sub_type: 'ACCOUNTS_RECEIVABLE' });
  const apCoa = await ChartOfAccounts.findOne({ sub_type: 'ACCOUNTS_PAYABLE' });
  const equityCoa = await ChartOfAccounts.findOne({ sub_type: 'OWNER_EQUITY' });

  // 2. Bank Accounts
  let bank = await BankAccount.findOne({ account_number: '50200088991122' });
  if (!bank) {
    bank = await BankAccount.create({
      account_name: 'HDFC Corporate Operating A/c',
      bank_name: 'HDFC Bank Ltd',
      account_number: '50200088991122',
      ifsc_code: 'HDFC0001234',
      branch_name: 'Sachin Industrial Estate, Surat',
      account_type: 'CURRENT',
      opening_balance: 750000,
      current_balance: 750000,
      is_default: true,
      status: 'active',
      created_by: admin?._id,
    });
  }

  // 3. Bank Transaction
  await BankTransaction.create({
    bank_account_id: bank._id,
    transaction_date: new Date(),
    transaction_type: 'DEPOSIT',
    amount: 150000,
    balance_after: 900000,
    reference_number: 'NEFT-HDFC-998822',
    description: 'Initial Working Capital Inward',
    is_reconciled: true,
    reconciliation_date: new Date(),
    created_by: admin?._id,
  });

  // 4. Customer Receipt
  if (customer && invoice) {
    await Receipt.create({
      receipt_number: `REC-2026-0001`,
      customer_id: customer._id,
      bank_account_id: bank._id,
      amount: 5000,
      unallocated_amount: 0,
      payment_mode: 'BANK_TRANSFER',
      transaction_reference: 'UTR9988776655',
      allocations: [{ invoice_id: invoice._id, allocated_amount: 5000 }],
      status: 'cleared',
      created_by: admin?._id,
    });
  }

  // 5. Supplier Payment
  if (supplier && purchaseInvoice) {
    await Payment.create({
      payment_number: `PAY-2026-0001`,
      supplier_id: supplier._id,
      bank_account_id: bank._id,
      amount: 10000,
      unallocated_amount: 0,
      payment_mode: 'NEFT',
      transaction_reference: 'UTR1122334455',
      allocations: [{ purchase_invoice_id: purchaseInvoice._id, allocated_amount: 10000 }],
      status: 'cleared',
      created_by: admin?._id,
    });
  }

  // 6. Expense Category & Expense
  let expCat = await ExpenseCategory.findOne({ code: 'UTIL_ELEC' });
  if (!expCat) {
    expCat = await ExpenseCategory.create({
      category_name: 'Factory Electricity & Power',
      code: 'UTIL_ELEC',
      monthly_budget: 85000,
      description: 'DGVCL 3-Phase Industrial Power Connection',
      status: 'active',
      created_by: admin?._id,
    });
  }

  await Expense.create({
    expense_number: 'EXP-2026-0001',
    category_id: expCat._id,
    title: 'DGVCL Power Bill — Sachin Unit 1',
    amount: 62450,
    payment_mode: 'BANK_TRANSFER',
    bank_account_id: bank._id,
    vendor_name: 'Dakshin Gujarat Vij Company Ltd',
    bill_number: 'EB-2026-09-881',
    is_recurring: true,
    recurring_frequency: 'MONTHLY',
    approval_status: 'approved',
    approved_by: admin?._id,
    remarks: 'Industrial HT supply monthly billing',
    created_by: admin?._id,
  });

  // 7. Owner Capital & Drawings
  await OwnerFinance.create({
    transaction_number: 'OWN-2026-0001',
    owner_name: 'Rajesh V. Patel (Managing Partner)',
    transaction_type: 'CAPITAL_INFUSION',
    amount: 1000000,
    bank_account_id: bank._id,
    payment_mode: 'BANK_TRANSFER',
    reference_number: 'IMPS-OWNER-001',
    notes: 'Equity injection for Plant 2 CNC lathe expansion',
    approval_status: 'approved',
    created_by: admin?._id,
  });

  await OwnerFinance.create({
    transaction_number: 'OWN-2026-0002',
    owner_name: 'Rajesh V. Patel (Managing Partner)',
    transaction_type: 'DRAWINGS',
    amount: 75000,
    bank_account_id: bank._id,
    payment_mode: 'BANK_TRANSFER',
    reference_number: 'NEFT-DRAWINGS-001',
    notes: 'Monthly personal drawings from capital account (non-operating deduction)',
    approval_status: 'approved',
    created_by: admin?._id,
  });

  // 8. Customer Service Ticket & CAPA
  if (customer) {
    const tck = await Ticket.create({
      ticket_number: 'TCK-2026-0001',
      customer_id: customer._id,
      subject: 'Minor flange face scratch detected during unboxing',
      description: 'Customer observed superficial hairline scratch on RF serration of 3" 150# Ball Valve.',
      category: 'QUALITY_DEFECT',
      priority: 'high',
      status: 'in_progress',
      assigned_to: admin?._id,
      order_id: order?._id,
      invoice_id: invoice?._id,
      product_id: product?._id,
      response_due_at: new Date(Date.now() + 4 * 3600000),
      resolution_due_at: new Date(Date.now() + 24 * 3600000),
      first_responded_at: new Date(),
      activities: [
        {
          author_id: admin?._id,
          message: 'Inspection video received from site engineer. Analyzing with dispatch packaging team.',
          activity_type: 'REPLY',
        },
      ],
      created_by: admin?._id,
    });

    await RootCause.create({
      ticket_id: tck._id,
      defect_type: 'Superficial Machined Face Scuffing',
      root_cause_analysis: 'Wooden pallet banding was overtightened without protective flange plastic cap.',
      five_why_analysis: [
        { why_step: 1, question: 'Why was flange scratched?', answer: 'Metal banding rubbed against face.' },
        { why_step: 2, question: 'Why did banding rub?', answer: 'Plastic end cap slipped off during transit.' },
        { why_step: 3, question: 'Why did end cap slip?', answer: 'Adhesive tape was missing.' },
      ],
      corrective_action: 'Replace valve face with free on-site buffing and supply fresh certified end protector.',
      preventive_action: 'Mandate taped injection-molded PE flange guards for all export & class 150+ valves.',
      responsible_person_id: admin?._id,
      status: 'IMPLEMENTED',
      created_by: admin?._id,
    });

    await CustomerFeedback.create({
      customer_id: customer._id,
      ticket_id: tck._id,
      nps_score: 9,
      rating_category: 'PROMOTER',
      feedback_text: 'Prompt response and same-day replacement resolution by Danza quality team.',
      sentiment: 'POSITIVE',
      created_by: admin?._id,
    });
  }

  // 9. Upsell & Repeat Orders
  if (customer && product) {
    await UpsellOpportunity.create({
      opportunity_number: 'UPS-2026-0001',
      customer_id: customer._id,
      opportunity_type: 'CROSS_SELL',
      trigger_product_id: product._id,
      suggested_product_id: product._id,
      confidence_score: 90,
      estimated_revenue: 125000,
      status: 'suggested',
      assigned_salesperson_id: admin?._id,
      followup_notes: 'Recommend high-pressure pneumatic actuator kit compatible with valves ordered last week.',
      created_by: admin?._id,
    });

    if (order) {
      await RepeatOrder.create({
        schedule_number: 'REP-2026-0001',
        customer_id: customer._id,
        previous_order_id: order._id,
        product_id: product._id,
        estimated_quantity: 25,
        average_consumption_days: 30,
        expected_reorder_date: new Date(Date.now() + 15 * 86400000),
        status: 'upcoming',
        assigned_salesperson_id: admin?._id,
        contact_notes: 'Quarterly maintenance replacement batch for chemical plant project.',
        created_by: admin?._id,
      });
    }
  }

  // 10. Marketing Campaign
  await MarketingCampaign.create({
    campaign_name: 'Gujarat Industrial Expo 2026',
    campaign_code: 'EXPO_GUJ_26',
    campaign_type: 'EXHIBITION',
    start_date: new Date('2026-08-01'),
    end_date: new Date('2026-08-05'),
    budget: 250000,
    total_spend: 180000,
    status: 'completed',
    target_audience: 'Refineries, Petrochemicals, Pharma EPC Contractors',
    spends: [
      {
        spend_date: new Date('2026-08-01'),
        amount: 150000,
        channel: 'EXHIBITION',
        notes: 'Stall registration & structural design',
      },
      {
        spend_date: new Date('2026-08-02'),
        amount: 30000,
        channel: 'PRINT_MEDIA',
        notes: 'Product brochures & technical datasheets',
      },
    ],
    templates: [
      {
        template_name: 'Post-Expo Follow-up Email',
        channel: 'EMAIL',
        subject: 'Thank you for visiting Danza ERP / Valves booth at Gujarat Expo',
        content: 'Dear {{customer_name}}, thank you for discussing your project requirements...',
      },
    ],
    created_by: admin?._id,
  });

  // 11. Target Goals
  await TargetGoal.create({
    target_name: 'Q3 2026 Industrial Valve Sales',
    target_type: 'COMPANY',
    target_metric: 'SALES_REVENUE',
    period_type: 'QUARTERLY',
    period_label: 'Q3 2026',
    start_date: new Date('2026-07-01'),
    end_date: new Date('2026-09-30'),
    target_value: 2500000,
    assigned_user_id: admin?._id,
    status: 'active',
    created_by: admin?._id,
  });

  // 12. Founder Decisions
  await FounderDecision.create({
    decision_code: 'DEC-2026-0001',
    category: 'HIGH_DISCOUNT_REQUEST',
    title: 'Special 18.5% Project Discount Approval for Reliance Refinery Tender',
    description: 'Commercial sales team requested 18.5% discount on bulk lot of 500 Cryogenic Valves.',
    impact_amount: 450000,
    severity: 'HIGH',
    related_entity_type: 'Quotation',
    status: 'PENDING',
    action_logs: [],
    created_by: admin?._id,
  });

  await FounderDecision.create({
    decision_code: 'DEC-2026-0002',
    category: 'LARGE_PURCHASE',
    title: 'Bulk Stainless Steel SS316 Bar Stock Procurement (₹12.5 Lakhs)',
    description: 'Raw material procurement to lock in nickel price before anticipated LME market rally.',
    impact_amount: 1250000,
    severity: 'CRITICAL',
    related_entity_type: 'PurchaseOrder',
    status: 'PENDING',
    action_logs: [],
    created_by: admin?._id,
  });

  // 13. Meetings & Todo Tasks
  const meeting = await Meeting.create({
    title: 'Monthly Executive Operations & Financial Review',
    meeting_date: new Date(Date.now() + 2 * 3600000),
    duration_minutes: 90,
    location_or_link: 'Executive Boardroom, Surat HQ',
    organizer_id: admin?._id,
    attendees: [{ user_id: admin?._id, status: 'ACCEPTED' }],
    agenda: '1. Production throughput vs dispatch backlog. 2. Receivables aging & cash flow. 3. New foundry supplier onboarding.',
    minutes_of_meeting: 'Agreed to expedite 3" valve testing and clear overdue customer dispatches by Friday.',
    decisions_taken: ['Approve ₹5 Lakhs advance for raw material casting', 'Implement mandatory flange protector protocol'],
    action_items: [
      {
        task_description: 'Send revised tax invoices and follow up with L&T procurement team',
        assigned_to: admin?._id,
        due_date: new Date(Date.now() + 48 * 3600000),
        is_created_as_todo: true,
      },
    ],
    status: 'SCHEDULED',
    created_by: admin?._id,
  });

  await TodoTask.create({
    title: 'Verify Bank Reconciliation statement for September',
    description: 'Cross-check HDFC Bank current account balance against internal ERP ledger.',
    status: 'TODO',
    priority: 'HIGH',
    due_date: new Date(Date.now() + 24 * 3600000),
    assigned_to: admin?._id,
    related_entity_type: 'Meeting',
    related_entity_id: meeting._id,
    created_by: admin?._id,
  });

  await CalendarEvent.create({
    title: 'Executive Board Sync: Monthly P&L Review',
    description: 'Review double-entry financial statements and working capital surplus',
    event_type: 'MEETING',
    start_time: new Date(Date.now() + 2 * 3600000),
    end_time: new Date(Date.now() + 3.5 * 3600000),
    user_id: admin?._id,
    color: '#4f46e5',
    created_by: admin?._id,
  });

  // 14. Notifications & Automation Rules
  await Notification.create({
    user_id: admin?._id,
    title: 'Founder Decision Required',
    message: 'High discount request (18.5%) submitted for Reliance Refinery Tender',
    type: 'OWNER_DECISION_PENDING',
    link_url: '/executive/founder',
    is_read: false,
  });

  await Notification.create({
    user_id: admin?._id,
    title: 'Customer SLA Alert',
    message: 'Support Ticket #TCK-2026-0001 has 2 hours remaining before resolution SLA threshold',
    type: 'TICKET_SLA',
    link_url: '/support/tickets',
    is_read: false,
  });

  await AutomationRule.create({
    rule_name: 'Auto-Task on Quality Complaint Ticket',
    trigger_event: 'TICKET_CREATED',
    action_type: 'ASSIGN_TASK',
    action_config: { priority: 'HIGH', dueDays: 2 },
    is_active: true,
  });

  console.log('✅ Finance & Intelligence seed completed successfully!');
};

if (process.argv[2] === '--run') {
  mongoose
    .connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME })
    .then(async () => {
      await seedFinanceAndIntelligence();
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export default seedFinanceAndIntelligence;
