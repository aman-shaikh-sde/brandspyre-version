import { Module, Feature, ModuleDependency } from '../../db/ModelSceham/industryModuleSchema';

export class ModuleRegistryService {
  /**
   * Get all active modules
   */
  static async getModules(includeFuture: boolean = false) {
    const filter: any = { is_active: true };
    if (!includeFuture) {
      filter.is_future = false;
    }
    return await Module.find(filter).sort({ sort_order: 1 });
  }

  /**
   * Get module by code
   */
  static async getModuleByCode(code: string) {
    return await Module.findOne({ code: code.toUpperCase(), is_active: true });
  }

  /**
   * Get features for a specific module
   */
  static async getModuleFeatures(moduleCode: string, includeFuture: boolean = false) {
    const filter: any = { module_code: moduleCode.toUpperCase(), is_active: true };
    if (!includeFuture) {
      filter.is_future = false;
    }
    return await Feature.find(filter).sort({ sort_order: 1 });
  }

  /**
   * Get direct dependencies for a module
   */
  static async getModuleDependencies(moduleCode: string): Promise<string[]> {
    const deps = await ModuleDependency.find({ module_code: moduleCode.toUpperCase() });
    return deps.map((d) => d.required_module_code);
  }

  /**
   * Resolve selected modules by automatically appending all required dependencies
   */
  static async resolveWithDependencies(selectedModuleCodes: string[]): Promise<string[]> {
    const resolved = new Set<string>(selectedModuleCodes.map((c) => c.toUpperCase()));
    
    // Core modules must always be included
    const coreModules = await Module.find({ is_core: true, is_active: true });
    coreModules.forEach((m) => resolved.add(m.code));

    let addedNew = true;
    while (addedNew) {
      addedNew = false;
      const currentList = Array.from(resolved);
      for (const modCode of currentList) {
        const deps = await this.getModuleDependencies(modCode);
        for (const depCode of deps) {
          if (!resolved.has(depCode)) {
            resolved.add(depCode);
            addedNew = true;
          }
        }
      }
    }

    return Array.from(resolved);
  }

  /**
   * Validate if a selection of module codes satisfies dependency constraints
   */
  static async validateModuleSelection(selectedModuleCodes: string[]): Promise<{
    valid: boolean;
    missingDependencies: Array<{ module: string; requires: string }>;
  }> {
    const selectedSet = new Set(selectedModuleCodes.map((c) => c.toUpperCase()));
    const missing: Array<{ module: string; requires: string }> = [];

    for (const modCode of selectedSet) {
      const deps = await this.getModuleDependencies(modCode);
      for (const depCode of deps) {
        if (!selectedSet.has(depCode)) {
          missing.push({ module: modCode, requires: depCode });
        }
      }
    }

    return {
      valid: missing.length === 0,
      missingDependencies: missing
    };
  }
}

export default ModuleRegistryService;
