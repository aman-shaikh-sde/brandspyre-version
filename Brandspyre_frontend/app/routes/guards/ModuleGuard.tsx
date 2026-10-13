import React from "react";
import { Outlet } from "react-router";
import { useHasModule, useOrganizationConfig } from "src/stores/useOrganizationConfig";
import ModuleNotEnabled from "./ModuleNotEnabled";

interface ModuleGuardProps {
  requiredModule: string;
  moduleName?: string;
  children?: React.ReactNode;
}

export const ModuleGuard: React.FC<ModuleGuardProps> = ({
  requiredModule,
  moduleName,
  children
}) => {
  const isEnabled = useHasModule(requiredModule);
  const isLoaded = useOrganizationConfig((state) => state.isLoaded);

  // If state hasn't finished loading yet, render children to avoid flash during initial rehydration
  if (!isLoaded) {
    return <>{children || <Outlet />}</>;
  }

  if (!isEnabled) {
    return <ModuleNotEnabled moduleCode={requiredModule} moduleName={moduleName} />;
  }

  return <>{children || <Outlet />}</>;
};

export default ModuleGuard;
