import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { ArrowLeft, RefreshCw, AlertCircle, Calendar, Clock, Share2, Check } from "lucide-react";
import { BlogCard } from "../../components/public/BlogCard";
import { CTASection } from "../../components/public/CTASection";
import { BlogContentRenderer, type ContentBlock } from "../../components/public/BlogContentRenderer";
import { BASE_URL } from "../../constants/api";

interface FullBlogPost {
  _id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  category_name: string;
  author_name: string;
  author_role: string;
  author_avatar?: string;
  cover_image?: string;
  cover_image_alt?: string;
  published_at?: string;
  read_time_minutes: number;
  content_blocks: ContentBlock[];
  seo?: {
    meta_title?: string;
    meta_description?: string;
    og_title?: string;
    og_description?: string;
    og_image?: string;
  };
  related?: Array<{
    _id: string;
    slug: string;
    title: string;
    excerpt: string;
    category_name: string;
    author_name: string;
    author_role: string;
    cover_image?: string;
    published_at?: string;
    read_time_minutes: number;
  }>;
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState<FullBlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) {
      navigate("/blog", { replace: true });
      return;
    }

    let isMounted = true;
    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${BASE_URL}/public/blog/${encodeURIComponent(slug)}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Article not found or not published.");
          }
          throw new Error(`Server returned status ${res.status}`);
        }

        const data = await res.json();
        if (isMounted && data.success && data.data) {
          setPost(data.data);

          // Update document title for SEO dynamically
          const title = data.data.seo?.meta_title || `${data.data.title} | Brandspyre Operations`;
          document.title = title;
        } else {
          throw new Error("Invalid article response from server.");
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load article.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchArticle();

    return () => {
      isMounted = false;
    };
  }, [slug, navigate]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="font-sans text-slate-900 dark:text-slate-100 min-h-screen py-16">
        <div className="max-w-[720px] mx-auto px-4 sm:px-6 space-y-8 animate-pulse">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" />
          <div className="space-y-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32" />
            <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-full" />
            <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-4/5" />
            <div className="h-5 bg-slate-100 dark:bg-slate-800/60 rounded w-full" />
            <div className="h-5 bg-slate-100 dark:bg-slate-800/60 rounded w-3/4" />
          </div>
          <div className="h-72 bg-slate-100 dark:bg-slate-900 rounded-xl" />
          <div className="space-y-4 pt-6">
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" />
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" />
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
        <div className="text-center max-w-md space-y-4 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold">Article Unavailable</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {error || "The requested publication does not exist or has been unpublished."}
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              to="/blog"
              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-semibold transition"
            >
              Browse All Articles
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pubDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recent";

  return (
    <article className="font-sans text-slate-900 dark:text-slate-100 selection:bg-red-500 selection:text-white min-h-screen flex flex-col justify-between">
      <div>
        {/* Top Breadcrumb & Article Header */}
        <section className="pt-12 pb-14 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-[720px] mx-auto px-4 sm:px-6 space-y-6">
            <div className="flex items-center justify-between">
              <Link
                to="/blog"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              >
                <ArrowLeft size={13} />
                <span>All Articles</span>
              </Link>

              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-400 transition cursor-pointer"
              >
                {copied ? <Check size={13} className="text-emerald-500" /> : <Share2 size={13} />}
                <span>{copied ? "Link Copied" : "Share"}</span>
              </button>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
                {post.category_name}
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-slate-900 dark:text-white leading-[1.2]">
                {post.title}
              </h1>

              {post.subtitle && (
                <p className="text-lg text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  {post.subtitle}
                </p>
              )}

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                {post.excerpt}
              </p>

              {/* Cover Image if present */}
              {post.cover_image && (
                <div className="pt-2">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                    <img
                      src={post.cover_image}
                      alt={post.cover_image_alt || post.title}
                      className="w-full h-auto object-cover max-h-[440px]"
                    />
                  </div>
                </div>
              )}

              {/* Author & Meta Row */}
              <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 gap-3">
                <div className="flex items-center gap-2">
                  {post.author_avatar && (
                    <img
                      src={post.author_avatar}
                      alt={post.author_name}
                      className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                  )}
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">{post.author_name}</span>
                    <span className="mx-1.5">•</span>
                    <span>{post.author_role}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {pubDate}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {post.read_time_minutes || 5} min read
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Article Body Content (Rendered via Dynamic Content Block Renderer) */}
        <section className="py-16 sm:py-20 bg-white dark:bg-slate-950">
          <div className="max-w-[720px] mx-auto px-4 sm:px-6">
            <BlogContentRenderer blocks={post.content_blocks || []} />
          </div>

          {/* Closing In-Article Callout */}
          <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-12 mt-12 border-t border-slate-100 dark:border-slate-800">
            <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Connect your business on Brandspyre
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Evaluate our platform with your real workflows for 14 days.
                </p>
              </div>
              <Link
                to="/tenant-registration"
                className="px-4 py-2 rounded-lg font-semibold text-xs text-white bg-red-700 hover:bg-red-800 transition whitespace-nowrap"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </section>

        {/* Suggested Reading / Related Articles */}
        {post.related && post.related.length > 0 && (
          <section className="py-16 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Related Articles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {post.related.map((op) => (
                  <BlogCard
                    key={op.slug || op._id}
                    post={{
                      slug: op.slug,
                      title: op.title,
                      excerpt: op.excerpt,
                      category: op.category_name,
                      author: {
                        name: op.author_name,
                        role: op.author_role,
                      },
                      date: op.published_at
                        ? new Date(op.published_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Recent",
                      readTime: `${op.read_time_minutes || 5} min read`,
                    }}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Final CTA */}
      <CTASection />
    </article>
  );
}
