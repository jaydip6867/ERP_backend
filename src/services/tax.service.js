import { TaxRate } from '../models/taxRate.model.js';
import { GstCalculationService } from './gstCalculation.service.js';
import { Invoice } from '../models/invoice.model.js';
import { PurchaseInvoice } from '../models/purchaseInvoice.model.js';
import { Supplier } from '../models/supplier.model.js';
import { AppError } from '../utils/appError.js';

export class TaxService {
  /**
   * Tax Rates Master
   */
  static async getTaxRates() {
    return TaxRate.find({ status: 'active' }).sort({ total_rate: 1 });
  }

  static async createTaxRate(data, userId) {
    return TaxRate.create({ ...data, created_by: userId });
  }

  static async updateTaxRate(id, data, userId) {
    const rate = await TaxRate.findByIdAndUpdate(id, { ...data, updated_by: userId }, { new: true });
    if (!rate) throw AppError.notFound('Tax rate not found');
    return rate;
  }

  /**
   * GST Returns & Calculations
   */
  static async getGstr1(params) {
    return GstCalculationService.getGstr1Data(params);
  }

  static async getGstr3b(params) {
    return GstCalculationService.getGstr3bData(params);
  }

  /**
   * Input Tax Credit (ITC) Register
   */
  static async getItcRegister({ startDate, endDate } = {}) {
    const query = { status: { $ne: 'cancelled' } };
    if (startDate || endDate) {
      query.bill_date = {};
      if (startDate) query.bill_date.$gte = new Date(startDate);
      if (endDate) query.bill_date.$lte = new Date(endDate);
    }

    const bills = await PurchaseInvoice.find(query).populate('supplier_id', 'supplier_name gstin');

    let totalEligibleItc = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const entries = bills.map((b) => {
      totalCgst += b.cgst_total || 0;
      totalSgst += b.sgst_total || 0;
      totalIgst += b.igst_total || 0;
      const itc = (b.cgst_total || 0) + (b.sgst_total || 0) + (b.igst_total || 0);
      totalEligibleItc += itc;

      return {
        supplier_name: b.supplier_id?.supplier_name,
        supplier_gstin: b.supplier_id?.gstin,
        bill_number: b.vendor_bill_number,
        bill_date: b.bill_date,
        taxable_amount: b.taxable_amount,
        cgst: b.cgst_total,
        sgst: b.sgst_total,
        igst: b.igst_total,
        total_itc: itc,
        eligibility: 'All other ITC',
      };
    });

    return {
      total_bills: bills.length,
      total_eligible_itc: Math.round(totalEligibleItc * 100) / 100,
      total_cgst: Math.round(totalCgst * 100) / 100,
      total_sgst: Math.round(totalSgst * 100) / 100,
      total_igst: Math.round(totalIgst * 100) / 100,
      entries,
    };
  }

  /**
   * Tax Ledger summary (Output Tax vs Input Tax)
   */
  static async getTaxLedgerSummary() {
    const [salesTax, purchaseTax] = await Promise.all([
      Invoice.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: null,
            outputCgst: { $sum: '$cgst_total' },
            outputSgst: { $sum: '$sgst_total' },
            outputIgst: { $sum: '$igst_total' },
            totalOutput: { $sum: { $add: ['$cgst_total', '$sgst_total', '$igst_total'] } },
          },
        },
      ]),
      PurchaseInvoice.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: null,
            inputCgst: { $sum: '$cgst_total' },
            inputSgst: { $sum: '$sgst_total' },
            inputIgst: { $sum: '$igst_total' },
            totalInput: { $sum: { $add: ['$cgst_total', '$sgst_total', '$igst_total'] } },
          },
        },
      ]),
    ]);

    const output = salesTax[0] || { outputCgst: 0, outputSgst: 0, outputIgst: 0, totalOutput: 0 };
    const input = purchaseTax[0] || { inputCgst: 0, inputSgst: 0, inputIgst: 0, totalInput: 0 };

    return {
      output_tax: output,
      input_tax_credit: input,
      net_payable: {
        cgst: Math.max(0, output.outputCgst - input.inputCgst),
        sgst: Math.max(0, output.outputSgst - input.inputSgst),
        igst: Math.max(0, output.outputIgst - input.inputIgst),
        total: Math.max(0, output.totalOutput - input.totalInput),
      },
    };
  }
}

export default TaxService;
