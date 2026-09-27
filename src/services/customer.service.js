import { Customer } from '../models/customer.model.js';
import { CustomerContact } from '../models/customerContact.model.js';
import { CustomerAddress } from '../models/customerAddress.model.js';
import { CustomerDocument } from '../models/customerDocument.model.js';
import { CustomerInteraction } from '../models/customerInteraction.model.js';
import { AppError } from '../utils/appError.js';
import { getNextNumber } from './numberSeries.service.js';
import { logAudit } from '../utils/audit.util.js';

class CustomerService {
  async listCustomers(query = {}, scopeFilter = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      customer_type,
      segment,
      stage,
      status,
      sales_person_id,
      branch_id,
      dormant_only,
      sort = '-createdAt',
    } = query;

    const filter = { ...scopeFilter, merged_into_id: null };

    if (search) {
      filter.$or = [
        { company_name: { $regex: search, $options: 'i' } },
        { customer_code: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { gstin: { $regex: search, $options: 'i' } },
      ];
    }

    if (customer_type) filter.customer_type = customer_type;
    if (segment) filter.segment = segment;
    if (stage) filter.stage = stage;
    if (status) filter.status = status;
    if (sales_person_id) filter.sales_person_id = sales_person_id;
    if (branch_id) filter.branch_id = branch_id;

    if (dormant_only === 'true' || dormant_only === true) {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      filter.$and = [
        {
          $or: [
            { last_order_date: { $lt: ninetyDaysAgo } },
            { last_order_date: null, createdAt: { $lt: ninetyDaysAgo } },
          ],
        },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .populate('sales_person_id', 'full_name email user_code')
        .populate('branch_id', 'branch_name branch_code')
        .populate('price_list_id', 'price_list_name price_list_code')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Customer.countDocuments(filter),
    ]);

    return {
      items: customers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async getCustomerById(id) {
    const customer = await Customer.findById(id)
      .populate('sales_person_id', 'full_name email mobile user_code')
      .populate('branch_id', 'branch_name branch_code')
      .populate('price_list_id', 'price_list_name price_list_code');

    if (!customer) throw new AppError('Customer not found', 404);
    return customer;
  }

  async getCustomer360(id) {
    const customer = await this.getCustomerById(id);

    const [contacts, addresses, documents, interactions] = await Promise.all([
      CustomerContact.find({ customer_id: id }).sort({ is_primary: -1, createdAt: 1 }),
      CustomerAddress.find({ customer_id: id }).sort({ is_primary: -1, createdAt: 1 }),
      CustomerDocument.find({ customer_id: id }).populate('verified_by', 'full_name').sort({ createdAt: -1 }),
      CustomerInteraction.find({ customer_id: id }).populate('conducted_by', 'full_name').sort({ interaction_date: -1 }),
    ]);

    return {
      customer,
      contacts,
      addresses,
      documents,
      interactions,
      metrics: {
        total_interactions: interactions.length,
        verified_documents: documents.filter((d) => d.verification_status === 'verified').length,
        primary_contact: contacts.find((c) => c.is_primary) || contacts[0] || null,
        primary_billing_address: addresses.find((a) => a.address_type === 'billing') || addresses[0] || null,
        primary_shipping_address: addresses.find((a) => a.address_type === 'shipping') || addresses[0] || null,
      },
    };
  }

  async createCustomer(payload, currentUser, req) {
    if (!payload.customer_code) {
      payload.customer_code = await getNextNumber('CUSTOMER', { prefix: 'CUST-' });
    }

    if (!payload.company_name && payload.name) {
      payload.company_name = payload.name;
    }
    let custType = (payload.customer_type || 'dealer').toLowerCase();
    const validCustTypes = ['retail', 'dealer', 'distributor', 'corporate', 'institutional'];
    if (!validCustTypes.includes(custType)) {
      custType = custType === 'b2b' ? 'corporate' : 'dealer';
    }
    payload.customer_type = custType;

    if (!payload.sales_person_id && currentUser) {
      payload.sales_person_id = currentUser._id;
    }
    if (!payload.branch_id && currentUser?.branch_id) {
      payload.branch_id = currentUser.branch_id;
    }

    const customer = await Customer.create({
      ...payload,
      created_by: currentUser?._id,
    });

    // Optionally create primary contact if provided in payload
    if (payload.primary_contact && payload.primary_contact.contact_name) {
      await CustomerContact.create({
        customer_id: customer._id,
        contact_name: payload.primary_contact.contact_name,
        email: payload.primary_contact.email || payload.email,
        phone: payload.primary_contact.phone || payload.phone,
        designation: payload.primary_contact.designation || 'Primary Contact',
        is_primary: true,
        created_by: currentUser?._id,
      });
    }

    // Optionally create billing address if provided in payload
    if (payload.billing_address && payload.billing_address.address_line1) {
      await CustomerAddress.create({
        customer_id: customer._id,
        address_type: 'billing',
        address_title: 'Billing Address',
        address_line1: payload.billing_address.address_line1,
        address_line2: payload.billing_address.address_line2 || '',
        city: payload.billing_address.city || '',
        state: payload.billing_address.state || '',
        pincode: payload.billing_address.pincode || '',
        gstin: payload.gstin || '',
        is_primary: true,
        created_by: currentUser?._id,
      });
    }

    await logAudit({
      user: currentUser,
      action: 'CREATE',
      module: 'Customer',
      record_id: customer._id,
      after: customer.toObject(),
      req,
    });

    return customer;
  }

  async updateCustomer(id, payload, currentUser, req) {
    const customer = await Customer.findById(id);
    if (!customer) throw new AppError('Customer not found', 404);

    const before = customer.toObject();
    Object.assign(customer, payload);
    customer.updated_by = currentUser?._id;
    await customer.save();

    await logAudit({
      user: currentUser,
      action: 'UPDATE',
      module: 'Customer',
      record_id: customer._id,
      before,
      after: customer.toObject(),
      req,
    });

    return customer;
  }

  async approveCredit(id, { credit_limit, credit_days, credit_status, notes }, currentUser, req) {
    const customer = await Customer.findById(id);
    if (!customer) throw new AppError('Customer not found', 404);

    const before = customer.toObject();
    if (credit_limit !== undefined) customer.credit_limit = credit_limit;
    if (credit_days !== undefined) customer.credit_days = credit_days;
    customer.credit_status = credit_status || 'approved';
    customer.updated_by = currentUser?._id;
    await customer.save();

    await logAudit({
      user: currentUser,
      action: 'APPROVE',
      module: 'Customer',
      record_id: customer._id,
      before,
      after: customer.toObject(),
      req,
    });

    return customer;
  }

  async mergeDuplicates({ sourceCustomerId, targetCustomerId, reason }, currentUser, req) {
    if (sourceCustomerId === targetCustomerId) {
      throw new AppError('Source and target customer cannot be the same', 400);
    }

    const source = await Customer.findById(sourceCustomerId);
    const target = await Customer.findById(targetCustomerId);

    if (!source || !target) {
      throw new AppError('One or both customers could not be found', 404);
    }

    // Repoint contacts, addresses, documents, interactions
    await CustomerContact.updateMany({ customer_id: source._id }, { customer_id: target._id });
    await CustomerAddress.updateMany({ customer_id: source._id }, { customer_id: target._id });
    await CustomerDocument.updateMany({ customer_id: source._id }, { customer_id: target._id });
    await CustomerInteraction.updateMany({ customer_id: source._id }, { customer_id: target._id });

    // Mark source as merged
    source.merged_into_id = target._id;
    source.status = 'inactive';
    source.notes = `${source.notes}\n[MERGED]: Merged into ${target.company_name} (${target.customer_code}). Reason: ${reason || 'Duplicate record'}`;
    await source.save();

    await logAudit({
      user: currentUser,
      action: 'MERGE',
      module: 'Customer',
      record_id: target._id,
      before: { source_id: source._id },
      after: { target_id: target._id, reason },
      req,
    });

    return { message: 'Customers successfully merged', targetCustomer: target };
  }

  // --- CONTACTS ---
  async addContact(customerId, payload, currentUser) {
    if (payload.is_primary) {
      await CustomerContact.updateMany({ customer_id: customerId }, { is_primary: false });
    }
    return CustomerContact.create({
      ...payload,
      customer_id: customerId,
      created_by: currentUser?._id,
    });
  }

  async updateContact(contactId, payload) {
    if (payload.is_primary) {
      const contact = await CustomerContact.findById(contactId);
      if (contact) {
        await CustomerContact.updateMany({ customer_id: contact.customer_id }, { is_primary: false });
      }
    }
    const updated = await CustomerContact.findByIdAndUpdate(contactId, payload, { new: true });
    if (!updated) throw new AppError('Contact not found', 404);
    return updated;
  }

  async deleteContact(contactId) {
    const contact = await CustomerContact.findByIdAndDelete(contactId);
    if (!contact) throw new AppError('Contact not found', 404);
    return { message: 'Contact deleted' };
  }

  // --- ADDRESSES ---
  async addAddress(customerId, payload, currentUser) {
    if (payload.is_primary) {
      await CustomerAddress.updateMany({ customer_id: customerId, address_type: payload.address_type }, { is_primary: false });
    }
    return CustomerAddress.create({
      ...payload,
      customer_id: customerId,
      created_by: currentUser?._id,
    });
  }

  async updateAddress(addressId, payload) {
    if (payload.is_primary) {
      const addr = await CustomerAddress.findById(addressId);
      if (addr) {
        await CustomerAddress.updateMany({ customer_id: addr.customer_id, address_type: addr.address_type }, { is_primary: false });
      }
    }
    const updated = await CustomerAddress.findByIdAndUpdate(addressId, payload, { new: true });
    if (!updated) throw new AppError('Address not found', 404);
    return updated;
  }

  async deleteAddress(addressId) {
    const addr = await CustomerAddress.findByIdAndDelete(addressId);
    if (!addr) throw new AppError('Address not found', 404);
    return { message: 'Address deleted' };
  }

  // --- DOCUMENTS / KYC ---
  async addDocument(customerId, payload, currentUser) {
    return CustomerDocument.create({
      ...payload,
      customer_id: customerId,
      created_by: currentUser?._id,
    });
  }

  async verifyDocument(docId, { verification_status, verification_remarks }, currentUser) {
    const doc = await CustomerDocument.findById(docId);
    if (!doc) throw new AppError('Document not found', 404);

    doc.verification_status = verification_status;
    doc.verification_remarks = verification_remarks || '';
    doc.verified_by = currentUser?._id;
    doc.verified_at = new Date();
    await doc.save();
    return doc;
  }

  // --- INTERACTIONS ---
  async addInteraction(customerId, payload, currentUser) {
    const interaction = await CustomerInteraction.create({
      ...payload,
      customer_id: customerId,
      conducted_by: payload.conducted_by || currentUser?._id,
      created_by: currentUser?._id,
    });

    // Update customer last interaction date
    await Customer.findByIdAndUpdate(customerId, {
      last_interaction_date: payload.interaction_date || new Date(),
    });

    return interaction;
  }
}

export const customerService = new CustomerService();
export default customerService;
