import React from "react";
import { FolderOpen } from "lucide-react";

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
}) => {
  const renderIcon = (iconInput?: any) => {
    if (!iconInput) return <FolderOpen size={24} />;
    if (React.isValidElement(iconInput)) return iconInput;
    if (typeof iconInput === "function" || (typeof iconInput === "object" && "$$typeof" in iconInput)) {
      const IconComp = iconInput;
      return <IconComp size={24} />;
    }
    return <FolderOpen size={24} />;
  };

  const renderActionIcon = (iconInput?: any) => {
    if (!iconInput) return null;
    if (React.isValidElement(iconInput)) return iconInput;
    if (typeof iconInput === "function" || (typeof iconInput === "object" && "$$typeof" in iconInput)) {
      const IconComp = iconInput;
      return <IconComp size={16} className="mr-1.5 inline flex-shrink-0" />;
    }
    return null;
  };

  return (
    <div className="crm-empty-state my-6">
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
        {renderIcon(icon)}
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4">{description}</p>
      {action && (
        <button onClick={action.onClick} className="crm-btn-primary">
          {renderActionIcon(action.icon)}
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
