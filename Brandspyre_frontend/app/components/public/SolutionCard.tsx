import React from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

interface SolutionCardProps {
  icon?: LucideIcon;
  category: string;
  title: string;
  description: string;
  problemSolved?: string;
  workflowBenefit?: string;
  modulesInvolved?: string[];
  points?: string[];
  ctaLink?: string;
  ctaLabel?: string;
}

export const SolutionCard: React.FC<SolutionCardProps> = ({
  icon: Icon,
  category,
  title,
  description,
  problemSolved,
  workflowBenefit,
  modulesInvolved = [],
  points = [],
  ctaLink = "/solutions",
  ctaLabel = "Explore solution",
}) => {
  return (
    <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      <div className="space-y-4">
        {/* Category & Icon */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
            {category}
          </span>
          {Icon && (
            <div className="text-slate-400">
              <Icon size={18} />
            </div>
          )}
        </div>

        {/* Title & Short Description */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Problem vs Improvement structure if provided */}
        {(problemSolved || workflowBenefit) && (
          <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            {problemSolved && (
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">The Problem: </span>
                <span className="text-slate-500 dark:text-slate-400">{problemSolved}</span>
              </div>
            )}
            {workflowBenefit && (
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">The Workflow: </span>
                <span className="text-slate-500 dark:text-slate-400">{workflowBenefit}</span>
              </div>
            )}
          </div>
        )}

        {/* Bullet points fallback */}
        {points.length > 0 && !problemSolved && (
          <ul className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400">
            {points.map((pt, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-slate-400 mt-0.5">•</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Modules Involved */}
        {modulesInvolved.length > 0 && (
          <div className="pt-2 flex flex-wrap gap-1.5 items-center text-[11px] text-slate-500">
            <span className="font-mono text-slate-400">Modules:</span>
            {modulesInvolved.map((mod, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px]"
              >
                {mod}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Link */}
      <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
        <Link
          to={ctaLink}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white hover:text-red-700 dark:hover:text-red-400 transition"
        >
          <span>{ctaLabel}</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
};

export default SolutionCard;
