import React from "react";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router";

interface PricingCardProps {
  name: string;
  price: number | string;
  cycleText?: string;
  description: string;
  badgeLabel?: string;
  popular?: boolean;
  features: string[];
  limits?: {
    users?: number | string;
    branches?: number | string;
    storage?: number | string;
  };
  ctaLabel?: string;
  ctaHref?: string;
  onSelect?: () => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  name,
  price,
  cycleText = "/month",
  description,
  badgeLabel,
  popular = false,
  features = [],
  limits,
  ctaLabel = "Choose Plan",
  ctaHref = "/tenant-registration",
  onSelect,
}) => {
  const formattedPrice = typeof price === "number" ? `₹${price.toLocaleString("en-IN")}` : price;

  return (
    <div
      className={`rounded-xl bg-white dark:bg-slate-900 border p-6 sm:p-7 flex flex-col justify-between transition-colors ${
        popular
          ? "border-red-600 dark:border-red-500/80 shadow-sm"
          : "border-slate-200 dark:border-slate-800"
      }`}
    >
      <div className="space-y-4">
        {/* Tier Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {name}
            </h3>
            {popular && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/40">
                {badgeLabel || "Recommended"}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed min-h-[32px]">
            {description}
          </p>
        </div>

        {/* Pricing Display */}
        <div className="py-3 border-y border-slate-100 dark:border-slate-800 flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-slate-900 dark:text-white font-mono">
            {formattedPrice}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {cycleText}
          </span>
        </div>

        {/* Quota Limits */}
        {limits && (
          <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-slate-50 dark:bg-slate-950 rounded-lg text-center text-xs border border-slate-100 dark:border-slate-800">
            <div>
              <span className="block font-bold text-slate-900 dark:text-white font-mono">{limits.users || "—"}</span>
              <span className="text-[10px] text-slate-400">Users</span>
            </div>
            <div>
              <span className="block font-bold text-slate-900 dark:text-white font-mono">{limits.branches || "—"}</span>
              <span className="text-[10px] text-slate-400">Branches</span>
            </div>
            <div>
              <span className="block font-bold text-slate-900 dark:text-white font-mono">{limits.storage || "—"}</span>
              <span className="text-[10px] text-slate-400">Storage</span>
            </div>
          </div>
        )}

        {/* Features list */}
        <div className="space-y-2 pt-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Included in this plan:
          </p>
          <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            {features.map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Check size={14} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA Button */}
      <div className="pt-6">
        {onSelect ? (
          <button
            onClick={onSelect}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold transition cursor-pointer ${
              popular
                ? "bg-red-700 hover:bg-red-800 text-white shadow-xs"
                : "bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white"
            }`}
          >
            <span>{ctaLabel}</span>
            <ArrowRight size={13} />
          </button>
        ) : (
          <Link
            to={ctaHref}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold transition ${
              popular
                ? "bg-red-700 hover:bg-red-800 text-white shadow-xs"
                : "bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white"
            }`}
          >
            <span>{ctaLabel}</span>
            <ArrowRight size={13} />
          </Link>
        )}
      </div>
    </div>
  );
};

export default PricingCard;
