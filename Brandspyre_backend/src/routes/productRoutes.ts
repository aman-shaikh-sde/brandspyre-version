import { Router, Request, Response } from 'express';
import authMiddleware from '../middleware/auth';
import { tenantAuth } from '../middleware/tenantAuth';
import { requireModule } from '../middleware/moduleGuard';
import { authorizePermission } from '../middleware/authorize';
import ProductService from '../services/saas/ProductService';
import { ProductCategory, ProductBrand, ProductUnit } from '../db/ModelSceham/commerceSchema';
import mongoose from 'mongoose';

const router = Router();

// All routes require Auth, Tenant Auth, and PRODUCTS module entitlement
router.use(authMiddleware);
router.use(tenantAuth());
router.use(requireModule('PRODUCTS'));

/**
 * GET /api/products/categories
 */
router.get('/categories', authorizePermission('products.categories'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const categories = await ProductCategory.find({ tenant_id: tenantId, is_active: true }).sort({ name: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * POST /api/products/categories
 */
router.post('/categories', authorizePermission('products.categories'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const { name, code, description } = req.body;

    if (!name || !code) {
      res.status(400).json({ success: false, error: 'Category name and code are required.' });
      return;
    }

    const category = await ProductCategory.create({
      tenant_id: tenantId,
      code: code.toUpperCase().trim(),
      name: name.trim(),
      description: description || '',
      is_active: true,
      created_at: new Date()
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * GET /api/products/brands
 */
router.get('/brands', authorizePermission('products.brands'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const brands = await ProductBrand.find({ tenant_id: tenantId, is_active: true }).sort({ name: 1 });
    res.status(200).json({ success: true, data: brands });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * POST /api/products/brands
 */
router.post('/brands', authorizePermission('products.brands'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const { name, code } = req.body;

    if (!name || !code) {
      res.status(400).json({ success: false, error: 'Brand name and code are required.' });
      return;
    }

    const brand = await ProductBrand.create({
      tenant_id: tenantId,
      code: code.toUpperCase().trim(),
      name: name.trim(),
      is_active: true,
      created_at: new Date()
    });

    res.status(201).json({ success: true, data: brand });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * GET /api/products/units
 */
router.get('/units', authorizePermission('products.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const units = await ProductUnit.find({ tenant_id: tenantId, is_active: true }).sort({ name: 1 });
    res.status(200).json({ success: true, data: units });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * POST /api/products/units
 */
router.post('/units', authorizePermission('products.create'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const { name, code } = req.body;

    if (!name || !code) {
      res.status(400).json({ success: false, error: 'Unit name and code are required.' });
      return;
    }

    const unit = await ProductUnit.create({
      tenant_id: tenantId,
      code: code.toUpperCase().trim(),
      name: name.trim(),
      is_active: true,
      created_at: new Date()
    });

    res.status(201).json({ success: true, data: unit });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * GET /api/products/barcode/:barcode (Barcode Fast Scanner Lookup)
 */
router.get('/barcode/:barcode', authorizePermission('products.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const barcode = req.params.barcode;

    const product = await ProductService.getProductByBarcode(tenantId, barcode);
    if (!product) {
      res.status(404).json({ success: false, error: `Product with barcode '${barcode}' not found.` });
      return;
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * GET /api/products (List products with search & pagination)
 */
router.get('/', authorizePermission('products.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const result = await ProductService.getProducts(tenantId, req.query as any);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * POST /api/products (Create product)
 */
router.post('/', authorizePermission('products.create'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).user?.userId;

    if (!req.body.name || !req.body.sku) {
      res.status(400).json({ success: false, error: 'Product name and SKU are required.' });
      return;
    }

    const product = await ProductService.createProduct(tenantId, req.body, userId);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * POST /api/products/bulk (Bulk import products)
 */
router.post('/bulk', authorizePermission('products.create'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).user?.userId;
    const items = req.body.items || req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: 'Request body must contain an array of products in "items".' });
      return;
    }

    const summary = await ProductService.bulkCreateProducts(tenantId, items, userId);
    res.status(200).json({ success: true, ...summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * PUT /api/products/:id (Update product)
 */
router.put('/:id', authorizePermission('products.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).user?.userId;
    const productId = req.params.id;

    const product = await ProductService.updateProduct(tenantId, productId, req.body, userId);
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * DELETE /api/products/:id (Soft delete product)
 */
router.delete('/:id', authorizePermission('products.delete'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).user?.userId;
    const productId = req.params.id;

    await ProductService.deleteProduct(tenantId, productId, userId);
    res.status(200).json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ success: false, error: message });
  }
});

export default router;
