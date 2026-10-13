import React from "react";
import { Link } from "react-router";
import { Info, CheckCircle2, AlertTriangle, Lightbulb, ArrowRight } from "lucide-react";

export interface ContentStyle {
  fontSize?: number | string;
  fontWeight?: string;
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline" | "line-through";
  color?: string;
  backgroundColor?: string;
  textAlign?: "left" | "center" | "right" | "justify";
}

export interface ContentBlock {
  id?: string;
  type: "heading" | "paragraph" | "image" | "quote" | "list" | "divider" | "callout" | "cta" | "table";
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  text?: string;
  url?: string;
  alt?: string;
  caption?: string;
  width?: string;
  alignment?: "left" | "center" | "right";
  citation?: string;
  listType?: "bullet" | "ordered";
  items?: string[];
  variant?: "info" | "success" | "warning" | "tip" | "primary" | "secondary" | "solid" | "dashed" | "dotted";
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonUrl?: string;
  headers?: string[];
  rows?: string[][];
  style?: ContentStyle;
}

interface BlogContentRendererProps {
  blocks: ContentBlock[];
  className?: string;
}

export const BlogContentRenderer: React.FC<BlogContentRendererProps> = ({ blocks, className = "" }) => {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return null;
  }

  const getStyleObject = (style?: ContentStyle): React.CSSProperties => {
    if (!style) return {};
    const css: React.CSSProperties = {};
    if (style.fontSize) {
      css.fontSize = typeof style.fontSize === "number" ? `${style.fontSize}px` : style.fontSize;
    }
    if (style.fontWeight) css.fontWeight = style.fontWeight as any;
    if (style.fontStyle) css.fontStyle = style.fontStyle;
    if (style.textDecoration) css.textDecoration = style.textDecoration;
    if (style.color) css.color = style.color;
    if (style.backgroundColor) css.backgroundColor = style.backgroundColor;
    if (style.textAlign) css.textAlign = style.textAlign;
    return css;
  };

  const renderBlock = (block: ContentBlock, index: number) => {
    const key = block.id || `block-${index}`;
    const customStyle = getStyleObject(block.style);

    switch (block.type) {
      case "heading": {
        const level = block.level || 2;
        const headingText = block.text || "";

        if (level === 1) {
          return (
            <h1 key={key} style={customStyle} className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-8 mb-4">
              {headingText}
            </h1>
          );
        }
        if (level === 2) {
          return (
            <h2 key={key} style={customStyle} className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-8 mb-4">
              {headingText}
            </h2>
          );
        }
        if (level === 3) {
          return (
            <h3 key={key} style={customStyle} className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-6 mb-3">
              {headingText}
            </h3>
          );
        }
        if (level === 4) {
          return (
            <h4 key={key} style={customStyle} className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-5 mb-2">
              {headingText}
            </h4>
          );
        }
        return (
          <h5 key={key} style={customStyle} className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-4 mb-2">
            {headingText}
          </h5>
        );
      }

      case "paragraph": {
        return (
          <p
            key={key}
            style={customStyle}
            className="text-base sm:text-[17px] text-slate-700 dark:text-slate-300 leading-relaxed sm:leading-8 my-4"
          >
            {block.text || ""}
          </p>
        );
      }

      case "image": {
        if (!block.url) return null;
        const alignClass =
          block.alignment === "left"
            ? "mr-auto"
            : block.alignment === "right"
            ? "ml-auto"
            : "mx-auto";

        const widthStyle: React.CSSProperties = {
          maxWidth: block.width || "100%",
        };

        return (
          <figure key={key} className={`my-8 ${alignClass}`} style={widthStyle}>
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-sm">
              <img
                src={block.url}
                alt={block.alt || block.caption || "Blog visual"}
                className="w-full h-auto object-cover max-h-[500px]"
                loading="lazy"
              />
            </div>
            {block.caption && (
              <figcaption className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2 italic font-mono">
                {block.caption}
              </figcaption>
            )}
          </figure>
        );
      }

      case "quote": {
        return (
          <blockquote
            key={key}
            style={customStyle}
            className="my-6 pl-5 border-l-4 border-red-600 dark:border-red-500 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-r-xl italic text-slate-800 dark:text-slate-200"
          >
            <p className="text-base sm:text-lg leading-relaxed font-medium">"{block.text}"</p>
            {block.citation && (
              <cite className="block mt-2 not-italic text-xs font-semibold text-slate-500 dark:text-slate-400">
                — {block.citation}
              </cite>
            )}
          </blockquote>
        );
      }

      case "list": {
        const items = block.items || [];
        if (items.length === 0) return null;

        if (block.listType === "ordered") {
          return (
            <ol key={key} style={customStyle} className="list-decimal list-inside my-4 space-y-2 text-slate-700 dark:text-slate-300 text-base sm:text-[17px] leading-relaxed">
              {items.map((item, idx) => (
                <li key={idx} className="pl-1">
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          );
        }

        return (
          <ul key={key} style={customStyle} className="list-disc list-inside my-4 space-y-2 text-slate-700 dark:text-slate-300 text-base sm:text-[17px] leading-relaxed">
            {items.map((item, idx) => (
              <li key={idx} className="pl-1">
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );
      }

      case "divider": {
        const borderStyle = block.variant === "dashed" ? "border-dashed" : block.variant === "dotted" ? "border-dotted" : "border-solid";
        return <hr key={key} className={`my-8 border-t ${borderStyle} border-slate-200 dark:border-slate-800`} />;
      }

      case "callout": {
        const variant = block.variant || "info";
        const variantConfig = {
          info: {
            bg: "bg-blue-50/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-200",
            icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />,
          },
          success: {
            bg: "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200",
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />,
          },
          warning: {
            bg: "bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200",
            icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />,
          },
          tip: {
            bg: "bg-purple-50/80 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/50 text-purple-900 dark:text-purple-200",
            icon: <Lightbulb className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />,
          },
        }[variant] || {
          bg: "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200",
          icon: <Info className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />,
        };

        return (
          <div key={key} className={`my-6 p-4.5 rounded-xl border ${variantConfig.bg} flex items-start gap-3 text-sm sm:text-base`}>
            {variantConfig.icon}
            <div className="space-y-1 flex-1">
              {block.title && <h5 className="font-bold">{block.title}</h5>}
              <p className="leading-relaxed">{block.text}</p>
            </div>
          </div>
        );
      }

      case "cta": {
        const isExternal = block.buttonUrl?.startsWith("http://") || block.buttonUrl?.startsWith("https://");
        const btnClass =
          block.variant === "secondary"
            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800"
            : "bg-red-700 hover:bg-red-800 text-white";

        return (
          <div
            key={key}
            className="my-10 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xs"
          >
            {block.title && (
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {block.title}
              </h3>
            )}
            {block.subtitle && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                {block.subtitle}
              </p>
            )}
            {block.buttonText && block.buttonUrl && (
              <div className="pt-2">
                {isExternal ? (
                  <a
                    href={block.buttonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition ${btnClass}`}
                  >
                    <span>{block.buttonText}</span>
                    <ArrowRight size={13} />
                  </a>
                ) : (
                  <Link
                    to={block.buttonUrl}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition ${btnClass}`}
                  >
                    <span>{block.buttonText}</span>
                    <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            )}
          </div>
        );
      }

      case "table": {
        const headers = block.headers || [];
        const rows = block.rows || [];
        if (headers.length === 0 && rows.length === 0) return null;

        return (
          <div key={key} className="my-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs sm:text-sm">
              {headers.length > 0 && (
                <thead className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    {headers.map((h, i) => (
                      <th key={i} className="p-3.5">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-3.5 text-slate-700 dark:text-slate-300">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return <div className={`blog-content-renderer space-y-1 ${className}`}>{blocks.map(renderBlock)}</div>;
};

export default BlogContentRenderer;
