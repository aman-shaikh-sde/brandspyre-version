import React from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

interface CTASectionProps {
  title?: string;
  subtitle?: string;
  primaryButtonLabel?: string;
  primaryButtonHref?: string;
  secondaryButtonLabel?: string;
  secondaryButtonHref?: string;
}

export const CTASection: React.FC<CTASectionProps> = ({
  title = "Ready to simplify the way your business operates?",
  subtitle = "Run CRM, operations, HR, finance, inventory and more from one connected platform.",
  primaryButtonLabel = "Get Started",
  primaryButtonHref = "/tenant-registration",
  secondaryButtonLabel = "Talk to us",
  secondaryButtonHref = "/contact",
}) => {
  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 font-sans transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
          {title}
        </h2>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          {subtitle}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to={primaryButtonHref}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm text-white bg-red-700 hover:bg-red-800 transition shadow-xs"
          >
            <span>{primaryButtonLabel}</span>
            <ArrowRight size={15} />
          </Link>
          <Link
            to={secondaryButtonHref}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition"
          >
            <span>{secondaryButtonLabel}</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
