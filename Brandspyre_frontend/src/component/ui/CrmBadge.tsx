import React from "react";

export interface CrmBadgeProps {
  label: string;
  variant?: "gray" | "blue" | "green" | "yellow" | "red" | "purple" | "indigo" | "amber" | "cyan" | "emerald" | "rose";
  icon?: React.ReactNode;
  className?: string;
}

const colorMap: Record<string, string> = {
  gray: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  yellow: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  amber: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  red: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  purple: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  cyan: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
};

const statusMap: Record<string, keyof typeof colorMap> = {
  active: "green",
  approved: "green",
  completed: "green",
  paid: "green",
  entitled: "green",
  pending: "amber",
  draft: "gray",
  inactive: "gray",
  cancelled: "red",
  rejected: "red",
  unpaid: "red",
  overdue: "red",
  low_stock: "amber",
  out_of_stock: "red",
  expired: "red",
  disabled: "gray",
  coming_soon: "purple",
};

export const CrmBadge: React.FC<CrmBadgeProps> = ({
  label,
  variant,
  icon,
  className = "",
}) => {
  const normalizedKey = (label || "").toLowerCase().replace(/\s+/g, "_");
  const resolvedVariant = variant || statusMap[normalizedKey] || "gray";
  const colorStyle = colorMap[resolvedVariant] || colorMap.gray;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorStyle} ${className}`}
    >
      {icon && <span className="text-xs">{icon}</span>}
      <span>{label}</span>
    </span>
  );
};

export default CrmBadge;
