import { productService } from '../services/product.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getLookups = asyncHandler(async (req, res) => {
  const data = await productService.getLookups();
  return ApiResponse.success(res, data, 'Product lookups fetched successfully');
});

export const listProducts = asyncHandler(async (req, res) => {
  const result = await productService.listProducts(req.query);
  return ApiResponse.paginated(res, result.items, result.pagination, 'Products fetched successfully');
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  return ApiResponse.success(res, product, 'Product fetched successfully');
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body, req.user, req);
  return ApiResponse.created(res, product, 'Product created successfully');
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body, req.user, req);
  return ApiResponse.success(res, product, 'Product updated successfully');
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const result = await productService.deleteProduct(req.params.id, req.user, req);
  return ApiResponse.success(res, null, result.message);
});

// Categories
export const listCategories = asyncHandler(async (req, res) => {
  const categories = await productService.listCategories();
  return ApiResponse.success(res, categories, 'Categories fetched successfully');
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await productService.createCategory(req.body);
  return ApiResponse.created(res, category, 'Category created successfully');
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await productService.updateCategory(req.params.id, req.body);
  return ApiResponse.success(res, category, 'Category updated successfully');
});

// Brands
export const listBrands = asyncHandler(async (req, res) => {
  const brands = await productService.listBrands();
  return ApiResponse.success(res, brands, 'Brands fetched successfully');
});

export const createBrand = asyncHandler(async (req, res) => {
  const brand = await productService.createBrand(req.body);
  return ApiResponse.created(res, brand, 'Brand created successfully');
});

export const updateBrand = asyncHandler(async (req, res) => {
  const brand = await productService.updateBrand(req.params.id, req.body);
  return ApiResponse.success(res, brand, 'Brand updated successfully');
});

// UOM
export const listUoms = asyncHandler(async (req, res) => {
  const uoms = await productService.listUoms();
  return ApiResponse.success(res, uoms, 'UOMs fetched successfully');
});

export const createUom = asyncHandler(async (req, res) => {
  const uom = await productService.createUom(req.body);
  return ApiResponse.created(res, uom, 'UOM created successfully');
});

export const updateUom = asyncHandler(async (req, res) => {
  const uom = await productService.updateUom(req.params.id, req.body);
  return ApiResponse.success(res, uom, 'UOM updated successfully');
});

// HSN
export const listHsns = asyncHandler(async (req, res) => {
  const hsns = await productService.listHsns();
  return ApiResponse.success(res, hsns, 'HSN codes fetched successfully');
});

export const createHsn = asyncHandler(async (req, res) => {
  const hsn = await productService.createHsn(req.body);
  return ApiResponse.created(res, hsn, 'HSN created successfully');
});

export const updateHsn = asyncHandler(async (req, res) => {
  const hsn = await productService.updateHsn(req.params.id, req.body);
  return ApiResponse.success(res, hsn, 'HSN updated successfully');
});

// Price Lists
export const listPriceLists = asyncHandler(async (req, res) => {
  const lists = await productService.listPriceLists();
  return ApiResponse.success(res, lists, 'Price lists fetched successfully');
});

export const getPriceListById = asyncHandler(async (req, res) => {
  const pl = await productService.getPriceListById(req.params.id);
  return ApiResponse.success(res, pl, 'Price list fetched successfully');
});

export const createPriceList = asyncHandler(async (req, res) => {
  const pl = await productService.createPriceList(req.body);
  return ApiResponse.created(res, pl, 'Price list created successfully');
});

export const updatePriceList = asyncHandler(async (req, res) => {
  const pl = await productService.updatePriceList(req.params.id, req.body);
  return ApiResponse.success(res, pl, 'Price list updated successfully');
});

// BOM
export const listBoms = asyncHandler(async (req, res) => {
  const boms = await productService.listBoms(req.query);
  return ApiResponse.success(res, boms, 'BOMs fetched successfully');
});

export const getBomById = asyncHandler(async (req, res) => {
  const bom = await productService.getBomById(req.params.id);
  return ApiResponse.success(res, bom, 'BOM fetched successfully');
});

export const createBom = asyncHandler(async (req, res) => {
  const bom = await productService.createBom(req.body);
  return ApiResponse.created(res, bom, 'BOM created successfully');
});

export const updateBom = asyncHandler(async (req, res) => {
  const bom = await productService.updateBom(req.params.id, req.body);
  return ApiResponse.success(res, bom, 'BOM updated successfully');
});
