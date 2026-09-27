import express from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import * as productController from '../controllers/product.controller.js';

const router = express.Router();

router.use(authenticateUser);

// Metadata & Lookups
router.get('/meta/lookups', productController.getLookups);

// Categories
router.get('/categories', requirePermission('Product', 'can_view'), productController.listCategories);
router.post('/categories', requirePermission('Product', 'can_create'), productController.createCategory);
router.put('/categories/:id', requirePermission('Product', 'can_edit'), productController.updateCategory);

// Brands
router.get('/brands', requirePermission('Product', 'can_view'), productController.listBrands);
router.post('/brands', requirePermission('Product', 'can_create'), productController.createBrand);
router.put('/brands/:id', requirePermission('Product', 'can_edit'), productController.updateBrand);

// UOM
router.get('/uoms', requirePermission('Product', 'can_view'), productController.listUoms);
router.post('/uoms', requirePermission('Product', 'can_create'), productController.createUom);
router.put('/uoms/:id', requirePermission('Product', 'can_edit'), productController.updateUom);

// HSN
router.get('/hsns', requirePermission('Product', 'can_view'), productController.listHsns);
router.post('/hsns', requirePermission('Product', 'can_create'), productController.createHsn);
router.put('/hsns/:id', requirePermission('Product', 'can_edit'), productController.updateHsn);

// Price Lists
router.get('/price-lists', requirePermission('Product', 'can_view'), productController.listPriceLists);
router.get('/price-lists/:id', requirePermission('Product', 'can_view'), productController.getPriceListById);
router.post('/price-lists', requirePermission('Product', 'can_create'), productController.createPriceList);
router.put('/price-lists/:id', requirePermission('Product', 'can_edit'), productController.updatePriceList);

// BOM
router.get('/boms', requirePermission('Product', 'can_view'), productController.listBoms);
router.get('/boms/:id', requirePermission('Product', 'can_view'), productController.getBomById);
router.post('/boms', requirePermission('Product', 'can_create'), productController.createBom);
router.put('/boms/:id', requirePermission('Product', 'can_edit'), productController.updateBom);

// Main Products
router.get('/', requirePermission('Product', 'can_view'), productController.listProducts);
router.get('/:id', requirePermission('Product', 'can_view'), productController.getProductById);
router.post('/', requirePermission('Product', 'can_create'), productController.createProduct);
router.put('/:id', requirePermission('Product', 'can_edit'), productController.updateProduct);
router.delete('/:id', requirePermission('Product', 'can_delete'), productController.deleteProduct);

export default router;
