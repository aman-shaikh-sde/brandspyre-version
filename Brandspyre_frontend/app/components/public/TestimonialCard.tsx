import React from "react";

interface TestimonialCardProps {
  quote: string;
  name: string;
  role: string;
  company: string;
  context?: string;
  metrics?: string;
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({
  quote,
  name,
  role,
  company,
  context,
}) => {
  return (
    <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      <div className="space-y-4">
        {context && (
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            {context}
          </div>
        )}
        <blockquote className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          &ldquo;{quote}&rdquo;
        </blockquote>
      </div>

      <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="font-semibold text-slate-900 dark:text-white">
          {name}
        </div>
        <div className="text-slate-500 dark:text-slate-400 mt-0.5">
          {role}, <span className="text-slate-700 dark:text-slate-300">{company}</span>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;
