import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Supplier } from '../models/supplier.model.js';
import { PurchaseRequisition } from '../models/purchaseRequisition.model.js';
import { PurchaseOrder } from '../models/purchaseOrder.model.js';
import { GoodsReceiptNote } from '../models/grn.model.js';
import { PurchaseInvoice } from '../models/purchaseInvoice.model.js';
import { PurchaseReturn } from '../models/purchaseReturn.model.js';
import { StockTransactionService } from './stockTransaction.service.js';
import { GstCalculationService } from './gstCalculation.service.js';
import { Batch } from '../models/batch.model.js';
import { Warehouse } from '../models/warehouse.model.js';
import { Branch } from '../models/branch.model.js';
import { User } from '../models/user.model.js';
import { AppError } from '../utils/appError.js';

const __serviceFilename = fileURLToPath(import.meta.url);
const __serviceDirname = path.dirname(__serviceFilename);
const GRN_UPLOADS_DIR = path.resolve(__serviceDirname, '../uploads/grn');

export class PurchaseService {
  /**
   * Supplier Management
   */
  static async getSuppliers({ search, category, status, page = 1, limit = 20 } = {}) {
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { supplier_name: { $regex: search, $options: 'i' } },
        { supplier_code: { $regex: search, $options: 'i' } },
        { gstin: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [suppliers, total] = await Promise.all([
      Supplier.find(filter).sort({ supplier_name: 1 }).skip(skip).limit(limit),
      Supplier.countDocuments(filter),
    ]);

    return { suppliers, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getSupplierById(id) {
    const supplier = await Supplier.findById(id);
    if (!supplier) throw AppError.notFound('Supplier not found');

    const purchaseOrders = await PurchaseOrder.find({ supplier_id: id })
      .populate('warehouse_id', 'warehouse_name')
      .populate('items.product_id', 'product_name product_code')
      .sort({ po_date: -1 })
      .limit(50);

    const invoices = await PurchaseInvoice.find({ supplier_id: id, status: { $ne: 'cancelled' } });
    const pendingInvoicesAmount = invoices.reduce((sum, inv) => {
      const balance = typeof inv.balance_amount === 'number' ? inv.balance_amount : ((inv.grand_total || 0) - (inv.paid_amount || 0));
      return sum + Math.max(0, balance);
    }, 0);

    const pendingPayment = Math.max(supplier.current_balance || 0, pendingInvoicesAmount);

    return {
      ...supplier.toObject(),
      pending_payment: pendingPayment,
      purchase_orders: purchaseOrders,
      total_orders_count: purchaseOrders.length,
    };
  }

  static async createSupplier(data, userId) {
    let code = data.supplier_code;
    if (!code) {
      const count = await Supplier.countDocuments();
      code = `SUP-${String(count + 1).padStart(4, '0')}`;
    }
    return Supplier.create({ ...data, supplier_code: code, created_by: userId });
  }

  static async updateSupplier(id, data, userId) {
    const supplier = await Supplier.findByIdAndUpdate(id, { ...data, updated_by: userId }, { new: true });
    if (!supplier) throw AppError.notFound('Supplier not found');
    return supplier;
  }

  /**
   * Purchase Requisitions
   */
  static async getRequisitions({ status, page = 1, limit = 20 } = {}) {
    const filter = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [requisitions, total] = await Promise.all([
      PurchaseRequisition.find(filter)
        .populate('requested_by', 'full_name email')
        .populate('sales_order_id', 'order_number')
        .populate('warehouse_id', 'warehouse_name')
        .populate('items.product_id', 'product_name product_code')
        .sort({ pr_date: -1 })
        .skip(skip)
        .limit(limit),
      PurchaseRequisition.countDocuments(filter),
    ]);

    return { requisitions, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async createRequisition(data, userId) {
    let prNumber = data.pr_number;
    if (!prNumber) {
      const count = await PurchaseRequisition.countDocuments();
      prNumber = `PR-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    }

    return PurchaseRequisition.create({
      ...data,
      pr_number: prNumber,
      requested_by: userId,
      status: 'pending_approval',
      created_by: userId,
    });
  }

  static async approveRequisition(id, { approve, remarks }, userId) {
    const pr = await PurchaseRequisition.findById(id);
    if (!pr) throw AppError.notFound('Purchase requisition not found');

    pr.status = approve ? 'approved' : 'rejected';
    pr.approved_by = userId;
    pr.approved_at = new Date();
    pr.approval_remarks = remarks || '';
    await pr.save();
    return pr;
  }

  /**
   * Purchase Orders
   */
  static async getOrders({ status, supplier_id, page = 1, limit = 20 } = {}) {
    const filter = {};
    if (status) filter.status = status;
    if (supplier_id) filter.supplier_id = supplier_id;

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      PurchaseOrder.find(filter)
        .populate('supplier_id', 'supplier_name supplier_code gstin mobile')
        .populate('warehouse_id', 'warehouse_name')
        .populate('items.product_id', 'product_name product_code')
        .sort({ po_date: -1 })
        .skip(skip)
        .limit(limit),
      PurchaseOrder.countDocuments(filter),
    ]);

    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getOrderById(id) {
    const po = await PurchaseOrder.findById(id)
      .populate('supplier_id')
      .populate('pr_id')
      .populate('sales_order_id')
      .populate('warehouse_id')
      .populate('items.product_id')
      .populate('items.uom_id');
    if (!po) throw AppError.notFound('Purchase order not found');
    return po;
  }

  static async createOrder(data, userId) {
    let poNumber = data.po_number;
    if (!poNumber) {
      const count = await PurchaseOrder.countDocuments();
      poNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    }

    // Auto-resolve warehouse_id and branch_id if missing
    if (!data.warehouse_id) {
      const defaultWh = await Warehouse.findOne({ is_active: { $ne: false } }) || await Warehouse.findOne();
      if (defaultWh) {
        data.warehouse_id = defaultWh._id;
        if (!data.branch_id && defaultWh.branch_id) {
          data.branch_id = defaultWh.branch_id;
        }
      }
    }

    if (!data.branch_id && data.warehouse_id) {
      const wh = await Warehouse.findById(data.warehouse_id);
      if (wh?.branch_id) {
        data.branch_id = wh.branch_id;
      }
    }

    if (!data.branch_id && userId) {
      const u = await User.findById(userId);
      if (u?.branch_id) {
        data.branch_id = u.branch_id;
      }
    }

    if (!data.branch_id) {
      const defBranch = await Branch.findOne();
      if (defBranch) {
        data.branch_id = defBranch._id;
      }
    }

    const isInterstate = Boolean(data.is_interstate);
    const taxCalc = GstCalculationService.calculateItemTaxes(data.items || [], isInterstate);

    const items = taxCalc.items.map((item) => ({
      ...item,
      ordered_qty: Number(item.ordered_qty || 1),
      received_qty: 0,
      pending_qty: Number(item.ordered_qty || 1),
    }));

    return PurchaseOrder.create({
      ...data,
      po_number: poNumber,
      items,
      subtotal: taxCalc.subtotal,
      taxable_amount: taxCalc.taxable_total,
      cgst_total: taxCalc.cgst_total,
      sgst_total: taxCalc.sgst_total,
      igst_total: taxCalc.igst_total,
      round_off: taxCalc.round_off,
      grand_total: taxCalc.grand_total,
      status: 'approved',
      created_by: userId,
    });
  }

  /**
   * Goods Receipt Notes (GRN)
   */
  static async getGrns({ status, page = 1, limit = 20 } = {}) {
    const filter = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [grns, total] = await Promise.all([
      GoodsReceiptNote.find(filter)
        .populate('supplier_id', 'supplier_name')
        .populate('po_id', 'po_number')
        .populate('warehouse_id', 'warehouse_name')
        .populate('items.product_id', 'product_name product_code')
        .sort({ grn_date: -1 })
        .skip(skip)
        .limit(limit),
      GoodsReceiptNote.countDocuments(filter),
    ]);

    return { grns, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getGrnById(id) {
    const grn = await GoodsReceiptNote.findById(id)
      .populate('supplier_id')
      .populate('po_id')
      .populate('warehouse_id')
      .populate('items.product_id')
      .populate('received_by', 'full_name');
    if (!grn) throw AppError.notFound('GRN not found');
    return grn;
  }

  static saveBase64Attachment(base64Data, originalFileName, prefix = 'grn') {
    if (!base64Data || typeof base64Data !== 'string') return null;

    try {
      let mimeType = 'application/octet-stream';
      let base64Content = base64Data;

      if (base64Data.startsWith('data:')) {
        const matches = base64Data.match(/^data:([A-Za-z0-9-+./]+);base64,(.+)$/s);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          base64Content = matches[2];
        }
      }

      let ext = '.bin';
      if (mimeType.includes('pdf')) ext = '.pdf';
      else if (mimeType.includes('png')) ext = '.png';
      else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = '.jpg';
      else if (mimeType.includes('webp')) ext = '.webp';
      else if (originalFileName && originalFileName.includes('.')) {
        ext = path.extname(originalFileName);
      }

      if (!fs.existsSync(GRN_UPLOADS_DIR)) {
        fs.mkdirSync(GRN_UPLOADS_DIR, { recursive: true });
      }

      const safeName = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e4)}${ext}`;
      const filePath = path.join(GRN_UPLOADS_DIR, safeName);
      const buffer = Buffer.from(base64Content, 'base64');
      fs.writeFileSync(filePath, buffer);

      return {
        file_url: `/uploads/grn/${safeName}`,
        file_name: originalFileName || safeName,
        file_type: mimeType,
      };
    } catch (err) {
      console.error('Error saving base64 attachment:', err);
      return null;
    }
  }

  static async createGrn(data, userId) {
    let grnNumber = data.grn_number;
    if (!grnNumber) {
      const count = await GoodsReceiptNote.countDocuments();
      grnNumber = `GRN-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    }

    let po = null;
    if (data.po_id) {
      po = await PurchaseOrder.findById(data.po_id);
    }

    if (!data.supplier_id && po?.supplier_id) {
      data.supplier_id = po.supplier_id;
    }

    if (!data.warehouse_id && po?.warehouse_id) {
      data.warehouse_id = po.warehouse_id;
    }

    if (!data.warehouse_id) {
      const defaultWh = (await Warehouse.findOne({ is_active: { $ne: false } })) || (await Warehouse.findOne());
      if (defaultWh) {
        data.warehouse_id = defaultWh._id;
      }
    }

    // Process attachment if provided
    if (data?.file_data || data?.attachment_file) {
      const saved = PurchaseService.saveBase64Attachment(
        data.file_data || data.attachment_file,
        data.attachment_name,
        'grn'
      );
      if (saved) {
        data.attachment_url = saved.file_url;
        data.attachment_name = saved.file_name;
        data.attachment_type = saved.file_type;
        data.documents = [
          {
            file_url: saved.file_url,
            file_name: saved.file_name,
            file_type: saved.file_type,
            uploaded_at: new Date(),
          },
        ];
      }
    } else if (data?.attachment_url) {
      data.documents = [
        {
          file_url: data.attachment_url,
          file_name: data.attachment_name || 'Attached Document',
          file_type: data.attachment_type || 'document',
          uploaded_at: new Date(),
        },
      ];
    }

    // Ensure items have proper rate and accepted_qty
    const sanitizedItems = (data.items || []).map((item) => {
      const poItem = po?.items?.find((pi) => String(pi.product_id) === String(item.product_id));
      const receivedQty = Number(item.received_qty || 0);
      return {
        ...item,
        received_qty: receivedQty,
        accepted_qty: Number(item.accepted_qty !== undefined ? item.accepted_qty : receivedQty),
        unit_rate: Number(item.unit_rate || poItem?.rate || 0),
        uom_id: item.uom_id || poItem?.uom_id || null,
        po_item_id: item.po_item_id || poItem?._id || null,
      };
    });

    const grn = await GoodsReceiptNote.create({
      ...data,
      items: sanitizedItems,
      grn_number: grnNumber,
      received_by: userId,
      status: 'received',
      created_by: userId,
    });

    // Update PO item received/pending quantities
    if (po) {
      let allFulfilled = true;
      for (const item of sanitizedItems) {
        const poItem = po.items.find((pi) => String(pi.product_id) === String(item.product_id));
        if (poItem) {
          poItem.received_qty = (poItem.received_qty || 0) + Number(item.received_qty);
          poItem.pending_qty = Math.max(0, poItem.ordered_qty - poItem.received_qty);
          if (poItem.pending_qty > 0) allFulfilled = false;
        }
      }
      po.status = allFulfilled ? 'completed' : 'partially_received';
      await po.save();
    }

    return grn;
  }

  /**
   * Post accepted GRN items to Inventory Stock Ledger upon QC Approval.
   */
  static async postGrnToStock(grnId, userId, data = {}) {
    const grn = await GoodsReceiptNote.findById(grnId);
    if (!grn) throw AppError.notFound('GRN not found');
    if (grn.stock_posted) {
      throw AppError.badRequest('GRN stock already posted');
    }

    if (data?.warehouse_id) {
      grn.warehouse_id = data.warehouse_id;
    }
    if (userId) {
      grn.received_by = userId;
    }
    if (data?.remarks) {
      grn.remarks = grn.remarks ? `${grn.remarks} | ${data.remarks}` : data.remarks;
    }

    // Process uploaded document/file (PDF or Image)
    if (data?.file_data || data?.attachment_file) {
      const saved = PurchaseService.saveBase64Attachment(
        data.file_data || data.attachment_file,
        data.attachment_name,
        `grn-${grn._id}`
      );
      if (saved) {
        grn.attachment_url = saved.file_url;
        grn.attachment_name = saved.file_name;
        grn.attachment_type = saved.file_type;
        if (!grn.documents) grn.documents = [];
        grn.documents.push({
          file_url: saved.file_url,
          file_name: saved.file_name,
          file_type: saved.file_type,
          uploaded_at: new Date(),
        });
      }
    } else if (data?.attachment_url) {
      grn.attachment_url = data.attachment_url;
      grn.attachment_name = data.attachment_name || 'Attached Document';
      grn.attachment_type = data.attachment_type || 'document';
      if (!grn.documents) grn.documents = [];
      grn.documents.push({
        file_url: data.attachment_url,
        file_name: data.attachment_name || 'Attached Document',
        file_type: data.attachment_type || 'document',
        uploaded_at: new Date(),
      });
    }

    const targetWarehouseId = grn.warehouse_id;

    for (const item of grn.items) {
      const acceptedQty = item.accepted_qty > 0 ? item.accepted_qty : item.received_qty;
      if (acceptedQty <= 0) continue;

      // 1. Create or update batch in destination warehouse
      let batchNumber = item.batch_number || `BATCH-${grn.grn_number.slice(-4)}-${String(item.product_id).slice(-4)}`;
      let batch = await Batch.findOne({
        batch_number: batchNumber,
        product_id: item.product_id,
        warehouse_id: targetWarehouseId,
      });

      if (!batch) {
        batch = await Batch.create({
          batch_number: batchNumber,
          product_id: item.product_id,
          warehouse_id: targetWarehouseId,
          initial_qty: acceptedQty,
          current_qty: acceptedQty,
          cost_rate: item.unit_rate || 0,
          status: 'active',
          supplier_id: grn.supplier_id,
          grn_id: grn._id,
          created_by: userId,
        });
      }

      // 2. Post atomic inventory transaction
      await StockTransactionService.recordTransaction({
        transaction_type: 'GRN',
        product_id: item.product_id,
        warehouse_id: targetWarehouseId,
        batch_id: batch._id,
        batch_number: batch.batch_number,
        qty: acceptedQty,
        unit_cost: item.unit_rate,
        reference_type: 'GoodsReceiptNote',
        reference_id: grn._id,
        reference_no: grn.grn_number,
        remarks: data?.remarks || `GRN received from supplier`,
        performed_by: userId,
      });

      item.batch_id = batch._id;
      item.batch_number = batch.batch_number;
      item.qc_status = 'passed';
    }

    grn.stock_posted = true;
    grn.status = 'stocked';
    await grn.save();
    return grn;
  }

  /**
   * Purchase Invoices (Supplier Bills)
   */
  static async getInvoices({ status, supplier_id, page = 1, limit = 20 } = {}) {
    const filter = {};
    if (status) filter.status = status;
    if (supplier_id) filter.supplier_id = supplier_id;

    const skip = (page - 1) * limit;
    const [invoices, total] = await Promise.all([
      PurchaseInvoice.find(filter)
        .populate('supplier_id', 'supplier_name gstin')
        .populate('po_id', 'po_number')
        .sort({ bill_date: -1 })
        .skip(skip)
        .limit(limit),
      PurchaseInvoice.countDocuments(filter),
    ]);

    return { invoices, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async createInvoice(data, userId) {
    let invoiceNumber = data.invoice_number;
    if (!invoiceNumber) {
      const count = await PurchaseInvoice.countDocuments();
      invoiceNumber = `PINV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    }

    const invoice = await PurchaseInvoice.create({
      ...data,
      invoice_number: invoiceNumber,
      status: 'posted',
      created_by: userId,
    });

    // Update supplier ledger balance
    await Supplier.findByIdAndUpdate(data.supplier_id, {
      $inc: { current_balance: invoice.grand_total },
    });

    return invoice;
  }

  /**
   * Purchase Returns
   */
  static async getReturns({ page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [returns, total] = await Promise.all([
      PurchaseReturn.find()
        .populate('supplier_id', 'supplier_name')
        .populate('warehouse_id', 'warehouse_name')
        .populate('items.product_id', 'product_name')
        .sort({ return_date: -1 })
        .skip(skip)
        .limit(limit),
      PurchaseReturn.countDocuments(),
    ]);

    return { returns, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async createReturn(data, userId) {
    let returnNumber = data.return_number;
    if (!returnNumber) {
      const count = await PurchaseReturn.countDocuments();
      returnNumber = `PRET-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    }

    const pret = await PurchaseReturn.create({
      ...data,
      return_number: returnNumber,
      status: 'dispatched',
      created_by: userId,
    });

    // Deduct stock via StockTransactionService
    for (const item of data.items || []) {
      await StockTransactionService.recordTransaction({
        transaction_type: 'RETURN',
        product_id: item.product_id,
        warehouse_id: data.warehouse_id,
        batch_id: item.batch_id,
        qty: item.return_qty,
        unit_cost: item.unit_rate,
        reference_type: 'PurchaseReturn',
        reference_id: pret._id,
        reference_no: pret.return_number,
        remarks: 'Goods returned to supplier',
        performed_by: userId,
      });
    }

    pret.stock_deducted = true;
    await pret.save();
    return pret;
  }
}

export default PurchaseService;
