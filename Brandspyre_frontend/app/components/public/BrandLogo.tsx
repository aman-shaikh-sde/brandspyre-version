import React from "react";
import { Link } from "react-router";
import brandspyreLogoHorizontal from "~/assets/brandspyre_logo_horizontal.png";
import brandspyreLogoStacked from "~/assets/brandspyre_logo.png";
import brandspyreIcon from "~/assets/brandspyre_icon.png";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  subtitle?: string;
  className?: string;
  href?: string;
  variant?: "dark" | "light" | "auto";
  layout?: "horizontal" | "stacked";
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = "md",
  showText = true,
  subtitle,
  className = "",
  href = "/",
  variant = "auto",
  layout = "horizontal",
}) => {
  const heightMap = {
    sm: { icon: "h-6", horiz: "h-7", stacked: "h-10", text: "text-base", sub: "text-[8px]" },
    md: { icon: "h-8", horiz: "h-9", stacked: "h-12", text: "text-xl", sub: "text-[9px]" },
    lg: { icon: "h-10", horiz: "h-11", stacked: "h-16", text: "text-2xl", sub: "text-[10px]" },
    xl: { icon: "h-12", horiz: "h-14", stacked: "h-20", text: "text-3xl", sub: "text-xs" },
  };

  const current = heightMap[size];

  // If icon-only (e.g. collapsed sidebar)
  if (!showText) {
    const iconContent = (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <img
          src={brandspyreIcon}
          alt="Brandspyre"
          className={`${current.icon} w-auto object-contain transition-opacity duration-200 group-hover:opacity-90`}
        />
      </div>
    );
    return href ? (
      <Link to={href} className="group inline-flex items-center">
        {iconContent}
      </Link>
    ) : (
      iconContent
    );
  }

  // If stacked layout (icon on top of Brandspyre, matching original upload)
  if (layout === "stacked") {
    const stackedContent = (
      <div className={`inline-flex flex-col items-center select-none ${className}`}>
        <img
          src={brandspyreLogoStacked}
          alt="Brandspyre"
          className={`${current.stacked} w-auto object-contain transition-opacity duration-200 group-hover:opacity-90`}
        />
        {subtitle && (
          <span
            className={`font-semibold tracking-wider uppercase mt-1 ${current.sub} ${
              variant === "light"
                ? "text-slate-300"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {subtitle}
          </span>
        )}
      </div>
    );
    return href ? (
      <Link to={href} className="group inline-flex items-center">
        {stackedContent}
      </Link>
    ) : (
      stackedContent
    );
  }

  // Default horizontal layout
  const isLight = variant === "light";

  const horizontalContent = (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {isLight ? (
        <div className="flex items-center gap-2.5">
          <img
            src={brandspyreIcon}
            alt="Brandspyre"
            className={`${current.icon} w-auto object-contain transition-opacity duration-200 group-hover:opacity-90`}
          />
          <div className="flex flex-col leading-tight">
            <span className={`font-bold tracking-tight ${current.text} text-white`}>
              Brand<span className="text-[#eb3939]">spyre</span>
            </span>
            {subtitle && (
              <span
                className={`font-semibold tracking-wider uppercase ${current.sub} text-slate-400`}
              >
                {subtitle}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <img
            src={brandspyreLogoHorizontal}
            alt="Brandspyre"
            className={`${current.horiz} w-auto object-contain transition-opacity duration-200 group-hover:opacity-90`}
          />
          {subtitle && (
            <span
              className={`font-semibold tracking-wider uppercase ml-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ${current.sub}`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="group inline-flex items-center">
        {horizontalContent}
      </Link>
    );
  }

  return horizontalContent;
};

export default BrandLogo;
