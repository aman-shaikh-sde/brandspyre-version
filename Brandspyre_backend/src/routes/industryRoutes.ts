import { Router, Request, Response } from 'express';
import IndustryRegistryService from '../services/saas/IndustryRegistryService';
import ModuleRegistryService from '../services/saas/ModuleRegistryService';

const router = Router();

/**
 * GET /api/industries
 * List all active industries (Public endpoint for onboarding wizard)
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const industries = await IndustryRegistryService.getIndustries();
    res.status(200).json({ success: true, data: industries });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * GET /api/industries/:code
 * Single industry details
 */
router.get('/:code', async (req: Request, res: Response): Promise<void> => {
  try {
    const code = req.params.code;
    const industry = await IndustryRegistryService.getIndustryByCode(code);
    if (!industry) {
      res.status(404).json({ success: false, error: `Industry '${code}' not found.` });
      return;
    }
    res.status(200).json({ success: true, data: industry });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * GET /api/industries/:code/recommendations
 * Recommended modules & features for an industry (Used in onboarding wizard)
 */
router.get('/:code/recommendations', async (req: Request, res: Response): Promise<void> => {
  try {
    const code = req.params.code;
    const modules = await IndustryRegistryService.getRecommendedModules(code);
    const features = await IndustryRegistryService.getRecommendedFeatures(code);

    res.status(200).json({
      success: true,
      data: {
        industryCode: code.toUpperCase(),
        recommendedModules: modules.map((m) => m.code),
        recommendedFeatures: features.map((f) => f.code),
        moduleDetails: modules,
        featureDetails: features
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * GET /api/modules
 * Full module registry
 */
router.get('/registry/modules', async (req: Request, res: Response): Promise<void> => {
  try {
    const includeFuture = req.query.includeFuture === 'true';
    const modules = await ModuleRegistryService.getModules(includeFuture);
    res.status(200).json({ success: true, data: modules });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * GET /api/modules/:code/features
 * Granular features for a module
 */
router.get('/registry/modules/:code/features', async (req: Request, res: Response): Promise<void> => {
  try {
    const code = req.params.code;
    const includeFuture = req.query.includeFuture === 'true';
    const features = await ModuleRegistryService.getModuleFeatures(code, includeFuture);
    res.status(200).json({ success: true, data: features });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * GET /api/modules/:code/dependencies
 * Dependencies for a module
 */
router.get('/registry/modules/:code/dependencies', async (req: Request, res: Response): Promise<void> => {
  try {
    const code = req.params.code;
    const deps = await ModuleRegistryService.getModuleDependencies(code);
    res.status(200).json({ success: true, data: deps });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
