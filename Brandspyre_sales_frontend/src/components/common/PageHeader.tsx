import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick?: () => void;
    icon?: React.ReactNode;
    href?: string;
  };
  secondaryActions?: {
    label: string;
    onClick?: () => void;
    icon?: React.ReactNode;
    href?: string;
  }[];
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs = [],
  actions,
  primaryAction,
  secondaryActions = [],
}) => {
  return (
    <div className="mb-6 space-y-2">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          {breadcrumbs.map((item, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight size={12} className="text-slate-400" />}
              {item.path ? (
                <Link to={item.path} className="hover:text-red-700 transition-colors font-medium">
                  {item.label}
                </Link>
              ) : (
                <span className="text-slate-700 font-semibold">{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Main Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          {description && (
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{description}</p>
          )}
        </div>

        {/* Actions Container */}
        {(actions || primaryAction || secondaryActions.length > 0) && (
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {actions}
            {secondaryActions.map((act, i) =>
              act.href ? (
                <Link key={i} to={act.href} className="crm-btn-secondary">
                  {act.icon}
                  {act.label}
                </Link>
              ) : (
                <button key={i} onClick={act.onClick} className="crm-btn-secondary">
                  {act.icon}
                  {act.label}
                </button>
              )
            )}

            {primaryAction &&
              (primaryAction.href ? (
                <Link to={primaryAction.href} className="crm-btn-primary">
                  {primaryAction.icon}
                  {primaryAction.label}
                </Link>
              ) : (
                <button onClick={primaryAction.onClick} className="crm-btn-primary">
                  {primaryAction.icon}
                  {primaryAction.label}
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
