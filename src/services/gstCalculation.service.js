import { Invoice } from '../models/invoice.model.js';
import { PurchaseInvoice } from '../models/purchaseInvoice.model.js';
import { CreditDebitNote } from '../models/creditDebitNote.model.js';

export class GstCalculationService {
  /**
   * Determine whether a transaction is interstate or intrastate based on state strings or GSTIN 2-digit state prefixes.
   */
  static isInterstateTransaction(originState = 'Gujarat', destinationState = 'Gujarat') {
    if (!originState || !destinationState) return false;
    return originState.trim().toLowerCase() !== destinationState.trim().toLowerCase();
  }

  /**
   * Calculate line-by-line GST breakdown.
   *
   * @param {Array} items - Array of items with { quantity, rate, discount_percent, gst_rate, cess_rate }
   * @param {boolean} isInterstate - True for IGST, False for CGST + SGST
   */
  static calculateItemTaxes(items = [], isInterstate = false) {
    let subtotal = 0;
    let discountTotal = 0;
    let taxableTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;
    let cessTotal = 0;

    const calculatedItems = items.map((item) => {
      const qty = Number(item.quantity || item.ordered_qty || 0);
      const rate = Number(item.rate || 0);
      const grossAmount = qty * rate;
      subtotal += grossAmount;

      const discountPercent = Number(item.discount_percent || 0);
      const discountAmount = Number(item.discount_amount || (grossAmount * discountPercent) / 100);
      discountTotal += discountAmount;

      const taxableAmount = Math.max(0, grossAmount - discountAmount);
      taxableTotal += taxableAmount;

      const gstRate = Number(item.gst_rate !== undefined ? item.gst_rate : 18);
      const cessRate = Number(item.cess_rate || 0);

      let cgstAmount = 0;
      let sgstAmount = 0;
      let igstAmount = 0;
      let cessAmount = (taxableAmount * cessRate) / 100;
      cessTotal += cessAmount;

      if (isInterstate) {
        igstAmount = (taxableAmount * gstRate) / 100;
        igstTotal += igstAmount;
      } else {
        const halfRate = gstRate / 2;
        cgstAmount = (taxableAmount * halfRate) / 100;
        sgstAmount = (taxableAmount * halfRate) / 100;
        cgstTotal += cgstAmount;
        sgstTotal += sgstAmount;
      }

      const totalItemAmount = taxableAmount + cgstAmount + sgstAmount + igstAmount + cessAmount;

      return {
        ...item,
        quantity: qty,
        rate,
        discount_amount: Math.round(discountAmount * 100) / 100,
        taxable_amount: Math.round(taxableAmount * 100) / 100,
        gst_rate: gstRate,
        cgst_amount: Math.round(cgstAmount * 100) / 100,
        sgst_amount: Math.round(sgstAmount * 100) / 100,
        igst_amount: Math.round(igstAmount * 100) / 100,
        cess_amount: Math.round(cessAmount * 100) / 100,
        total_amount: Math.round(totalItemAmount * 100) / 100,
      };
    });

    const totalBeforeRound = taxableTotal + cgstTotal + sgstTotal + igstTotal + cessTotal;
    const roundedGrandTotal = Math.round(totalBeforeRound);
    const roundOff = Math.round((roundedGrandTotal - totalBeforeRound) * 100) / 100;

    return {
      items: calculatedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      discount_total: Math.round(discountTotal * 100) / 100,
      taxable_total: Math.round(taxableTotal * 100) / 100,
      cgst_total: Math.round(cgstTotal * 100) / 100,
      sgst_total: Math.round(sgstTotal * 100) / 100,
      igst_total: Math.round(igstTotal * 100) / 100,
      cess_total: Math.round(cessTotal * 100) / 100,
      round_off: roundOff,
      grand_total: roundedGrandTotal,
    };
  }

  /**
   * Aggregate GSTR-1 Outward Supplies report structure.
   */
  static async getGstr1Data({ startDate, endDate }) {
    const query = { status: { $ne: 'cancelled' } };
    if (startDate || endDate) {
      query.invoice_date = {};
      if (startDate) query.invoice_date.$gte = new Date(startDate);
      if (endDate) query.invoice_date.$lte = new Date(endDate);
    }

    const invoices = await Invoice.find(query).populate('customer_id');

    // Section 4: B2B Registered
    const b2b = [];
    // Section 5: B2CL (Interstate unregistered > 2.5L)
    const b2cl = [];
    // Section 7: B2CS (Intrastate or interstate small < 2.5L unregistered)
    const b2cs = [];
    // HSN aggregation map
    const hsnMap = {};

    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    invoices.forEach((inv) => {
      totalTaxable += inv.taxable_total || 0;
      totalCgst += inv.cgst_total || 0;
      totalSgst += inv.sgst_total || 0;
      totalIgst += inv.igst_total || 0;

      const customerGstin = inv.customer_id?.gstin || inv.billing_address?.gstin;
      const isRegistered = Boolean(customerGstin && customerGstin.trim().length === 15);

      if (isRegistered) {
        b2b.push({
          gstin: customerGstin,
          customer_name: inv.customer_id?.company_name || inv.customer_id?.display_name,
          invoice_number: inv.invoice_number,
          invoice_date: inv.invoice_date,
          taxable_amount: inv.taxable_total,
          cgst: inv.cgst_total,
          sgst: inv.sgst_total,
          igst: inv.igst_total,
          grand_total: inv.grand_total,
          place_of_supply: inv.place_of_supply_state,
        });
      } else if (inv.is_interstate && inv.grand_total > 250000) {
        b2cl.push({
          place_of_supply: inv.place_of_supply_state,
          invoice_number: inv.invoice_number,
          invoice_date: inv.invoice_date,
          taxable_amount: inv.taxable_total,
          igst: inv.igst_total,
          grand_total: inv.grand_total,
        });
      } else {
        b2cs.push({
          place_of_supply: inv.place_of_supply_state,
          taxable_amount: inv.taxable_total,
          cgst: inv.cgst_total,
          sgst: inv.sgst_total,
          igst: inv.igst_total,
          grand_total: inv.grand_total,
        });
      }

      // HSN breakdown
      if (inv.items) {
        inv.items.forEach((item) => {
          const hsn = item.hsn_code || '8481';
          if (!hsnMap[hsn]) {
            hsnMap[hsn] = {
              hsn_code: hsn,
              description: item.item_name || 'Industrial Equipment',
              uom: item.uom || 'NOS',
              total_qty: 0,
              taxable_value: 0,
              cgst: 0,
              sgst: 0,
              igst: 0,
            };
          }
          hsnMap[hsn].total_qty += item.quantity || 0;
          hsnMap[hsn].taxable_value += item.taxable_amount || 0;
          hsnMap[hsn].cgst += item.cgst_amount || 0;
          hsnMap[hsn].sgst += item.sgst_amount || 0;
          hsnMap[hsn].igst += item.igst_amount || 0;
        });
      }
    });

    // Credit / Debit Notes Section 9B
    const notesQuery = { status: { $ne: 'cancelled' } };
    const notes = await CreditDebitNote.find(notesQuery).populate('customer_id');

    return {
      period: { startDate, endDate },
      summary: {
        total_invoices: invoices.length,
        total_taxable: Math.round(totalTaxable * 100) / 100,
        total_cgst: Math.round(totalCgst * 100) / 100,
        total_sgst: Math.round(totalSgst * 100) / 100,
        total_igst: Math.round(totalIgst * 100) / 100,
        total_tax: Math.round((totalCgst + totalSgst + totalIgst) * 100) / 100,
      },
      sections: {
        b2b,
        b2cl,
        b2cs,
        cdnr: notes,
        hsn_summary: Object.values(hsnMap),
      },
      disclaimer: 'Generated for reporting and review. Government portal API filing requires configured ASP credentials.',
    };
  }

  /**
   * Aggregate GSTR-3B Monthly Return summary.
   */
  static async getGstr3bData({ startDate, endDate }) {
    // 1. Outward taxable supplies
    const invQuery = { status: { $ne: 'cancelled' } };
    if (startDate || endDate) {
      invQuery.invoice_date = {};
      if (startDate) invQuery.invoice_date.$gte = new Date(startDate);
      if (endDate) invQuery.invoice_date.$lte = new Date(endDate);
    }
    const salesInvoices = await Invoice.find(invQuery);

    let outwardTaxable = 0;
    let outwardCgst = 0;
    let outwardSgst = 0;
    let outwardIgst = 0;

    salesInvoices.forEach((inv) => {
      outwardTaxable += inv.taxable_total || 0;
      outwardCgst += inv.cgst_total || 0;
      outwardSgst += inv.sgst_total || 0;
      outwardIgst += inv.igst_total || 0;
    });

    // 2. Inward supplies (Eligible ITC from purchase invoices)
    const purchQuery = { status: { $ne: 'cancelled' } };
    if (startDate || endDate) {
      purchQuery.bill_date = {};
      if (startDate) purchQuery.bill_date.$gte = new Date(startDate);
      if (endDate) purchQuery.bill_date.$lte = new Date(endDate);
    }
    const purchaseBills = await PurchaseInvoice.find(purchQuery);

    let itcTaxable = 0;
    let itcCgst = 0;
    let itcSgst = 0;
    let itcIgst = 0;

    purchaseBills.forEach((p) => {
      itcTaxable += p.taxable_amount || 0;
      itcCgst += p.cgst_total || 0;
      itcSgst += p.sgst_total || 0;
      itcIgst += p.igst_total || 0;
    });

    // 3. Net Tax Payable
    const netCgstPayable = Math.max(0, outwardCgst - itcCgst);
    const netSgstPayable = Math.max(0, outwardSgst - itcSgst);
    const netIgstPayable = Math.max(0, outwardIgst - itcIgst);

    return {
      period: { startDate, endDate },
      outward_supplies_3_1: {
        taxable_value: Math.round(outwardTaxable * 100) / 100,
        igst: Math.round(outwardIgst * 100) / 100,
        cgst: Math.round(outwardCgst * 100) / 100,
        sgst: Math.round(outwardSgst * 100) / 100,
        cess: 0,
      },
      eligible_itc_4: {
        total_itc_available: Math.round((itcCgst + itcSgst + itcIgst) * 100) / 100,
        igst: Math.round(itcIgst * 100) / 100,
        cgst: Math.round(itcCgst * 100) / 100,
        sgst: Math.round(itcSgst * 100) / 100,
        cess: 0,
        purchase_bills_count: purchaseBills.length,
      },
      net_tax_payable_6_1: {
        igst: Math.round(netIgstPayable * 100) / 100,
        cgst: Math.round(netCgstPayable * 100) / 100,
        sgst: Math.round(netSgstPayable * 100) / 100,
        total_payable: Math.round((netCgstPayable + netSgstPayable + netIgstPayable) * 100) / 100,
      },
    };
  }
}

export default GstCalculationService;
