import React from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  highlights?: string[];
  tag?: string;
  link?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  highlights = [],
  tag,
  link = "/features",
}) => {
  return (
    <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      <div className="space-y-4">
        {/* Icon & Optional Subdued Tag */}
        <div className="flex items-center justify-between">
          <div className="text-red-700 dark:text-red-500">
            <Icon size={22} />
          </div>
          {tag && (
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {tag}
            </span>
          )}
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Highlights */}
        {highlights.length > 0 && (
          <ul className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400">
            {highlights.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Check size={13} className="text-slate-400 flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Link */}
      {link && (
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/60">
          <Link
            to={link}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:text-red-800 transition"
          >
            <span>Learn more</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
};

export default FeatureCard;
