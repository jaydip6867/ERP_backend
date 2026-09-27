import { Product } from '../models/product.model.js';
import { ProductCategory } from '../models/productCategory.model.js';
import { Brand } from '../models/brand.model.js';
import { Uom } from '../models/uom.model.js';
import { Hsn } from '../models/hsn.model.js';
import { PriceList } from '../models/priceList.model.js';
import { Bom } from '../models/bom.model.js';
import { AppError } from '../utils/appError.js';
import { getNextNumber } from './numberSeries.service.js';
import { logAudit } from '../utils/audit.util.js';

class ProductService {
  // --- METADATA & LOOKUPS ---
  async getLookups() {
    const [categories, brands, uoms, hsns] = await Promise.all([
      ProductCategory.find({ is_active: true }).sort({ category_name: 1 }),
      Brand.find({ is_active: true }).sort({ brand_name: 1 }),
      Uom.find({ is_active: true }).sort({ uom_name: 1 }),
      Hsn.find({ is_active: true }).sort({ hsn_code: 1 }),
    ]);

    return {
      categories,
      brands,
      uoms,
      hsns,
      productTypes: [
        { label: 'Finished Good', value: 'finished_good' },
        { label: 'Raw Material', value: 'raw_material' },
        { label: 'Semi Finished', value: 'semi_finished' },
        { label: 'Service', value: 'service' },
        { label: 'Consumable', value: 'consumable' },
      ],
    };
  }

  // --- PRODUCTS ---
  async listProducts(query = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      category_id,
      brand_id,
      product_type,
      status,
      sort = '-createdAt',
    } = query;

    const filter = {};
    if (search) {
      filter.$or = [
        { product_name: { $regex: search, $options: 'i' } },
        { product_code: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }
    if (category_id) filter.category_id = category_id;
    if (brand_id) filter.brand_id = brand_id;
    if (product_type) filter.product_type = product_type;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category_id', 'category_name category_code')
        .populate('brand_id', 'brand_name')
        .populate('uom_id', 'uom_code uom_name')
        .populate('hsn_id', 'hsn_code tax_rate')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    return {
      items: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async getProductById(id) {
    const product = await Product.findById(id)
      .populate('category_id')
      .populate('brand_id')
      .populate('uom_id')
      .populate('hsn_id')
      .populate('bom_id');

    if (!product) throw new AppError('Product not found', 404);
    return product;
  }

  async createProduct(payload, currentUser, req) {
    if (!payload.product_code) {
      payload.product_code = await getNextNumber('PRODUCT', { prefix: 'PRD-' });
    }

    if (!payload.product_name && payload.name) {
      payload.product_name = payload.name;
    }

    if (!payload.sku) {
      payload.sku = payload.product_code;
    }

    if (!payload.category_id) {
      let cat = null;
      if (payload.category) {
        cat = await ProductCategory.findOne({
          $or: [{ category_name: payload.category }, { category_code: payload.category }],
        });
      }
      if (!cat) cat = await ProductCategory.findOne();
      if (cat) payload.category_id = cat._id;
    }

    if (!payload.uom_id) {
      let uom = null;
      if (payload.uom) {
        uom = await Uom.findOne({
          $or: [{ uom_name: payload.uom }, { uom_code: payload.uom }],
        });
      }
      if (!uom) uom = await Uom.findOne();
      if (uom) payload.uom_id = uom._id;
    }

    const existingSku = await Product.findOne({ sku: payload.sku.toUpperCase() });
    if (existingSku) {
      throw new AppError(`Product with SKU '${payload.sku}' already exists`, 409);
    }

    const product = await Product.create({
      ...payload,
      created_by: currentUser?._id,
      current_stock: payload.opening_stock || 0,
    });

    await logAudit({
      user: currentUser,
      action: 'CREATE',
      module: 'Product',
      record_id: product._id,
      after: product.toObject(),
      req,
    });

    return product;
  }

  async updateProduct(id, payload, currentUser, req) {
    const product = await Product.findById(id);
    if (!product) throw new AppError('Product not found', 404);

    const before = product.toObject();

    if (payload.sku && payload.sku !== product.sku) {
      const existing = await Product.findOne({ sku: payload.sku.toUpperCase(), _id: { $ne: id } });
      if (existing) throw new AppError(`SKU '${payload.sku}' is already taken`, 409);
    }

    Object.assign(product, payload);
    product.updated_by = currentUser?._id;
    await product.save();

    await logAudit({
      user: currentUser,
      action: 'UPDATE',
      module: 'Product',
      record_id: product._id,
      before,
      after: product.toObject(),
      req,
    });

    return product;
  }

  async deleteProduct(id, currentUser, req) {
    const product = await Product.findById(id);
    if (!product) throw new AppError('Product not found', 404);

    product.is_deleted = true;
    product.deleted_at = new Date();
    product.deleted_by = currentUser?._id;
    await product.save();

    await logAudit({
      user: currentUser,
      action: 'DELETE',
      module: 'Product',
      record_id: product._id,
      before: product.toObject(),
      req,
    });

    return { message: 'Product deleted successfully' };
  }

  // --- CATEGORIES ---
  async listCategories() {
    return ProductCategory.find().populate('parent_category_id', 'category_name').sort({ category_name: 1 });
  }

  async createCategory(payload) {
    return ProductCategory.create(payload);
  }

  async updateCategory(id, payload) {
    const item = await ProductCategory.findByIdAndUpdate(id, payload, { new: true });
    if (!item) throw new AppError('Category not found', 404);
    return item;
  }

  // --- BRANDS ---
  async listBrands() {
    return Brand.find().sort({ brand_name: 1 });
  }

  async createBrand(payload) {
    return Brand.create(payload);
  }

  async updateBrand(id, payload) {
    const item = await Brand.findByIdAndUpdate(id, payload, { new: true });
    if (!item) throw new AppError('Brand not found', 404);
    return item;
  }

  // --- UOM ---
  async listUoms() {
    return Uom.find().sort({ uom_code: 1 });
  }

  async createUom(payload) {
    return Uom.create(payload);
  }

  async updateUom(id, payload) {
    const item = await Uom.findByIdAndUpdate(id, payload, { new: true });
    if (!item) throw new AppError('UOM not found', 404);
    return item;
  }

  // --- HSN ---
  async listHsns() {
    return Hsn.find().sort({ hsn_code: 1 });
  }

  async createHsn(payload) {
    return Hsn.create(payload);
  }

  async updateHsn(id, payload) {
    const item = await Hsn.findByIdAndUpdate(id, payload, { new: true });
    if (!item) throw new AppError('HSN not found', 404);
    return item;
  }

  // --- PRICE LISTS ---
  async listPriceLists() {
    return PriceList.find().populate('items.product_id', 'product_name product_code sku selling_rate');
  }

  async getPriceListById(id) {
    const pl = await PriceList.findById(id).populate('items.product_id');
    if (!pl) throw new AppError('Price list not found', 404);
    return pl;
  }

  async createPriceList(payload) {
    if (!payload.price_list_code) {
      payload.price_list_code = await getNextNumber('PRICE_LIST', { prefix: 'PL-' });
    }
    return PriceList.create(payload);
  }

  async updatePriceList(id, payload) {
    const pl = await PriceList.findByIdAndUpdate(id, payload, { new: true });
    if (!pl) throw new AppError('Price list not found', 404);
    return pl;
  }

  // --- BOM ---
  async listBoms(query = {}) {
    const filter = {};
    if (query.product_id) filter.product_id = query.product_id;
    return Bom.find(filter)
      .populate('product_id', 'product_name product_code')
      .populate('items.item_product_id', 'product_name product_code purchase_rate')
      .populate('items.uom_id', 'uom_code')
      .populate('uom_id', 'uom_code');
  }

  async getBomById(id) {
    const bom = await Bom.findById(id)
      .populate('product_id')
      .populate('items.item_product_id')
      .populate('items.uom_id')
      .populate('uom_id');
    if (!bom) throw new AppError('BOM not found', 404);
    return bom;
  }

  async createBom(payload) {
    if (!payload.bom_number) {
      payload.bom_number = await getNextNumber('BOM', { prefix: 'BOM-' });
    }
    // Calculate total cost
    if (Array.isArray(payload.items)) {
      payload.total_estimated_cost = payload.items.reduce(
        (sum, item) => sum + (Number(item.total_cost) || (Number(item.quantity) * Number(item.unit_cost)) || 0),
        0
      ) + (Number(payload.overhead_cost) || 0) + (Number(payload.labor_cost) || 0);
    }
    return Bom.create(payload);
  }

  async updateBom(id, payload) {
    if (Array.isArray(payload.items)) {
      payload.total_estimated_cost = payload.items.reduce(
        (sum, item) => sum + (Number(item.total_cost) || (Number(item.quantity) * Number(item.unit_cost)) || 0),
        0
      ) + (Number(payload.overhead_cost) || 0) + (Number(payload.labor_cost) || 0);
    }
    const bom = await Bom.findByIdAndUpdate(id, payload, { new: true });
    if (!bom) throw new AppError('BOM not found', 404);
    return bom;
  }
}

export const productService = new ProductService();
export default productService;
