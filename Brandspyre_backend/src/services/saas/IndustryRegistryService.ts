import { Industry, IndustryModule, IndustryFeature, Module, Feature } from '../../db/ModelSceham/industryModuleSchema';

export class IndustryRegistryService {
  /**
   * Get all active industries sorted by sort_order
   */
  static async getIndustries() {
    return await Industry.find({ is_active: true }).sort({ sort_order: 1 });
  }

  /**
   * Get an industry by code
   */
  static async getIndustryByCode(code: string) {
    return await Industry.findOne({ code: code.toUpperCase(), is_active: true });
  }

  /**
   * Get recommended modules for an industry
   */
  static async getRecommendedModules(industryCode: string) {
    const recommendations = await IndustryModule.find({
      industry_code: industryCode.toUpperCase(),
      is_recommended: true
    }).sort({ sort_order: 1 });

    const moduleCodes = recommendations.map((r) => r.module_code);

    // Always include core modules if not present
    const coreModules = await Module.find({ is_core: true, is_active: true });
    const coreCodes = coreModules.map((m) => m.code);

    const allModuleCodes = Array.from(new Set([...coreCodes, ...moduleCodes]));

    return await Module.find({
      code: { $in: allModuleCodes },
      is_active: true
    }).sort({ sort_order: 1 });
  }

  /**
   * Get recommended features for an industry
   */
  static async getRecommendedFeatures(industryCode: string) {
    const recFeatures = await IndustryFeature.find({
      industry_code: industryCode.toUpperCase(),
      is_recommended: true
    });

    const recFeatureCodes = recFeatures.map((rf) => rf.feature_code);

    // Also include default features for recommended modules
    const recModules = await this.getRecommendedModules(industryCode);
    const recModuleCodes = recModules.map((m) => m.code);

    const defaultFeatures = await Feature.find({
      module_code: { $in: recModuleCodes },
      is_default: true,
      is_active: true
    });

    const defaultFeatureCodes = defaultFeatures.map((f) => f.code);
    const allFeatureCodes = Array.from(new Set([...defaultFeatureCodes, ...recFeatureCodes]));

    return await Feature.find({
      code: { $in: allFeatureCodes },
      is_active: true
    }).sort({ sort_order: 1 });
  }
}

export default IndustryRegistryService;
