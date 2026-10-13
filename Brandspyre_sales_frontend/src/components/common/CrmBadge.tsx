import React from 'react';

export interface CrmBadgeProps {
  label: string;
  variant?: 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo' | 'amber' | 'emerald' | 'rose';
  icon?: React.ReactNode;
  className?: string;
}

const colorMap: Record<string, string> = {
  gray: 'bg-slate-100 text-slate-700 border-slate-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  yellow: 'bg-amber-50 text-amber-800 border-amber-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  red: 'bg-rose-50 text-rose-700 border-rose-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

const statusMap: Record<string, keyof typeof colorMap> = {
  active: 'green',
  approved: 'green',
  published: 'green',
  completed: 'green',
  paid: 'green',
  delivered: 'green',
  pending: 'amber',
  pending_approval: 'amber',
  under_review: 'amber',
  quoted: 'blue',
  draft: 'gray',
  inactive: 'gray',
  cancelled: 'red',
  rejected: 'red',
  unpaid: 'red',
  dispatched: 'blue',
  shipped: 'blue',
  in_transit: 'blue',
  low_stock: 'amber',
  out_of_stock: 'red',
  suspended: 'red'
};

export const CrmBadge: React.FC<CrmBadgeProps> = ({
  label,
  variant,
  icon,
  className = '',
}) => {
  const normalizedKey = (label || '').toLowerCase().replace(/\s+/g, '_');
  const resolvedVariant = variant || statusMap[normalizedKey] || 'gray';
  const colorStyle = colorMap[resolvedVariant] || colorMap.gray;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorStyle} ${className}`}
    >
      {icon && <span className="text-xs">{icon}</span>}
      <span className="capitalize">{label.replace(/_/g, ' ')}</span>
    </span>
  );
};

export default CrmBadge;
