import React from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { DashboardPreview } from "./DashboardPreview";
import darkHeroImg from "../../assets/hero_dark_skyline.jpg";

export const HeroSection: React.FC = () => {
  return (
    <div className="relative font-sans bg-white dark:bg-slate-950 overflow-hidden">
      {/* 1. Dark Cinematic Hero Container */}
      <section className="relative pt-14 sm:pt-20 pb-36 sm:pb-48 bg-slate-950 text-white overflow-hidden select-none">
        {/* Background Image: Luxury High-Rise Office with City Skyline at Dusk */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <img
            src={darkHeroImg}
            alt="Brandspyre modern enterprise operations office with city skyline"
            className="w-full h-full object-cover object-center sm:object-top opacity-90 filter brightness-[0.85] contrast-[1.05]"
          />

          {/* Moody Center Dark Vignette for Pristine Typography Contrast */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 38%, rgba(2, 6, 23, 0.88) 0%, rgba(2, 6, 23, 0.65) 50%, rgba(2, 6, 23, 0.25) 100%)",
            }}
          />

          {/* Top subtle navbar shadow & bottom fade */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950/90" />
        </div>

        {/* Faint Connected Constellation Network Nodes in the Center */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-25 z-1">
          <svg className="w-[850px] h-[450px]" viewBox="0 0 850 450" fill="none">
            <circle cx="160" cy="200" r="3" fill="#ef4444" />
            <circle cx="300" cy="140" r="2.5" fill="#60a5fa" />
            <circle cx="420" cy="240" r="3" fill="#38bdf8" />
            <circle cx="560" cy="150" r="3" fill="#ef4444" />
            <circle cx="700" cy="220" r="2.5" fill="#60a5fa" />
            <line x1="160" y1="200" x2="300" y2="140" stroke="#60a5fa" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="300" y1="140" x2="420" y2="240" stroke="#60a5fa" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="420" y1="240" x2="560" y2="150" stroke="#60a5fa" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="560" y1="150" x2="700" y2="220" stroke="#60a5fa" strokeWidth="1" strokeDasharray="4 4" />
          </svg>
        </div>

        {/* Hero Narrative & Actions */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Eyebrow in Crimson Red */}
          <div className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-red-500">
            Business Operating Platform
          </div>

          {/* Strong White Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12]">
            Run your business from one connected platform.
          </h1>

          {/* Refined Subtitle */}
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            CRM, sales, operations, HR, finance, inventory and more — connected in one place.
            Eliminate fragmented tools and keep teams working from the same information.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/tenant-registration"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition shadow-md cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight size={15} />
            </Link>
            <Link
              to="/features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg text-sm font-semibold text-slate-200 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 transition cursor-pointer"
            >
              <span>Explore Platform</span>
            </Link>
          </div>
        </div>

        {/* Curved Organic Bottom Transition Mask */}
        <div className="absolute -bottom-1 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none z-10">
          <svg
            className="relative block w-full h-16 sm:h-24 lg:h-32 text-white dark:text-slate-950 fill-current"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
          >
            <path d="M0,0 C380,95 1060,95 1440,0 L1440,120 L0,120 Z" />
          </svg>
        </div>
      </section>

      {/* 2. Overlapping Dashboard Container & Matrix Dot Accents */}
      <section className="relative z-20 -mt-28 sm:-mt-36 lg:-mt-44 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
        {/* Subtle Decorative Dot Matrix Patterns on Left and Right Flanks */}
        <div className="hidden lg:block absolute -left-6 bottom-12 w-28 h-28 opacity-40 pointer-events-none">
          <svg width="100%" height="100%" fill="none">
            <pattern id="dot-grid-l" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" className="fill-slate-300 dark:fill-slate-700" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#dot-grid-l)" />
          </svg>
        </div>
        <div className="hidden lg:block absolute -right-6 bottom-12 w-28 h-28 opacity-40 pointer-events-none">
          <svg width="100%" height="100%" fill="none">
            <pattern id="dot-grid-r" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" className="fill-slate-300 dark:fill-slate-700" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#dot-grid-r)" />
          </svg>
        </div>

        {/* Dashboard Preview Component with Premium Elevation Shadow */}
        <div className="shadow-2xl rounded-2xl">
          <DashboardPreview />
        </div>
      </section>
    </div>
  );
};

export default HeroSection;
