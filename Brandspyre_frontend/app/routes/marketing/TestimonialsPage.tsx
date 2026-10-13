import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { ArrowRight, Building2, Layers, Check, AlertCircle, RefreshCw, Star, Quote } from "lucide-react";
import { CTASection } from "../../components/public/CTASection";
import { BASE_URL } from "../../constants/api";

export interface TestimonialItem {
  _id: string;
  person_name: string;
  person_role: string;
  company_name: string;
  company_logo?: string;
  person_avatar?: string;
  industry?: string;
  sector: string;
  testimonial_quote: string;
  rating?: number;
  headline?: string;
  challenge?: string;
  solution?: string;
  outcome?: string;
  modules_used?: string[];
  location?: string;
  featured?: boolean;
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${BASE_URL}/public/testimonials?limit=50`);
      if (!res.ok) {
        throw new Error(`Public Testimonials API returned status ${res.status}`);
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTestimonials(data.data);
      } else {
        setTestimonials([]);
      }
    } catch (err: any) {
      console.error("Error fetching testimonials:", err);
      setError("Unable to load customer stories. Please check your network and retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  return (
    <div className="font-sans text-slate-900 dark:text-slate-100 selection:bg-red-500 selection:text-white min-h-screen flex flex-col justify-between">
      <div>
        {/* Header */}
        <section className="pt-16 pb-14 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-red-700 dark:text-red-400">
              Customer Stories & Verification
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
              Customer Stories & Workflows
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
              How operations leaders consolidate departmental tools and connect their real-time workflows with Brandspyre.
            </p>
          </div>
        </section>

        {/* Editorial Workflow Studies */}
        <section className="py-20 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <span className="font-semibold text-slate-900 dark:text-white">Documentation Notice: </span>
              <span>
                The workflow scenarios below represent real-world enterprise deployments managed and verified on the Brandspyre multi-module platform.
              </span>
            </div>

            {/* 1. Loading Skeleton */}
            {loading && (
              <div className="space-y-12 animate-pulse">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="space-y-4 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                    <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. Error State */}
            {!loading && error && (
              <div className="text-center py-16 border border-dashed border-red-200 dark:border-red-900/50 rounded-2xl p-8 max-w-md mx-auto space-y-4 bg-white dark:bg-slate-900 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                  <AlertCircle size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Unable to load stories</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{error}</p>
                </div>
                <button
                  onClick={fetchTestimonials}
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <RefreshCw size={13} />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* 3. Empty State */}
            {!loading && !error && testimonials.length === 0 && (
              <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-md mx-auto space-y-4 bg-white dark:bg-slate-900 shadow-sm">
                <p className="text-xs text-slate-400">Customer stories are being published by our team.</p>
              </div>
            )}

            {/* 4. Dynamic Case Studies */}
            {!loading && !error && testimonials.length > 0 && (
              <div className="space-y-14 divide-y divide-slate-200 dark:divide-slate-800">
                {testimonials.map((study, idx) => (
                  <div key={study._id || idx} className={`space-y-5 ${idx > 0 ? "pt-14" : ""}`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
                        {study.sector}
                      </span>
                      <span className="font-mono text-slate-400">Story 0{idx + 1}</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                      {study.headline || `${study.company_name}: Connected Operations`}
                    </h2>

                    {/* Customer Quote Box */}
                    {study.testimonial_quote && (
                      <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                        <Quote className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="space-y-2 flex-1">
                          <p className="italic text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                            &ldquo;{study.testimonial_quote}&rdquo;
                          </p>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white">{study.person_name}</span>
                            <span>•</span>
                            <span>{study.person_role}</span>
                            {study.company_name && (
                              <>
                                <span>•</span>
                                <span>{study.company_name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Challenge & Solution Cards */}
                    {(study.challenge || study.solution) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        {study.challenge && (
                          <div className="space-y-2 p-5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
                            <span className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider block">
                              The Operational Challenge
                            </span>
                            <p className="leading-relaxed">{study.challenge}</p>
                          </div>
                        )}

                        {study.solution && (
                          <div className="space-y-2 p-5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
                            <span className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider block">
                              How Brandspyre Was Configured
                            </span>
                            <p className="leading-relaxed">{study.solution}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Outcome Highlight */}
                    {study.outcome && (
                      <div className="p-4.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-emerald-800 dark:text-emerald-300">Operational Outcome: </span>
                          <span className="leading-relaxed">{study.outcome}</span>
                        </div>
                      </div>
                    )}

                    {/* Modules Used Badges */}
                    {study.modules_used && study.modules_used.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                        <span className="text-slate-400 font-mono text-[11px] mr-1">Modules deployed:</span>
                        {study.modules_used.map((mod, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] border border-slate-200/60 dark:border-slate-700/60"
                          >
                            {mod}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Final CTA */}
      <CTASection
        title="Want to learn how Brandspyre fits your workflow?"
        subtitle="Talk with a solutions specialist to review your current tool stack."
        primaryButtonLabel="Talk with Us"
        primaryButtonHref="/contact"
        secondaryButtonLabel="Start 14-Day Free Evaluation"
        secondaryButtonHref="/tenant-registration"
      />
    </div>
  );
}
