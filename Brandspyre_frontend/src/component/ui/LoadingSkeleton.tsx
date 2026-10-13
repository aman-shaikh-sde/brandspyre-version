import React from "react";

export interface LoadingSkeletonProps {
  type?: "table" | "cards" | "dashboard";
  rows?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = "table",
  rows = 5,
}) => {
  if (type === "cards") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="crm-card space-y-3">
            <div className="h-4 w-1/2 crm-skeleton"></div>
            <div className="h-8 w-3/4 crm-skeleton"></div>
            <div className="h-3 w-1/3 crm-skeleton"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "dashboard") {
    return (
      <div className="space-y-6 my-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="crm-card space-y-3">
              <div className="h-4 w-1/2 crm-skeleton"></div>
              <div className="h-8 w-2/3 crm-skeleton"></div>
            </div>
          ))}
        </div>
        <div className="crm-card h-64 crm-skeleton"></div>
      </div>
    );
  }

  // Default: Table skeleton
  return (
    <div className="crm-table-container my-4">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between">
        <div className="h-8 w-48 crm-skeleton"></div>
        <div className="h-8 w-24 crm-skeleton"></div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800 p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="h-4 w-1/4 crm-skeleton"></div>
            <div className="h-4 w-1/6 crm-skeleton"></div>
            <div className="h-4 w-1/5 crm-skeleton"></div>
            <div className="h-4 w-1/12 crm-skeleton"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingSkeleton;
