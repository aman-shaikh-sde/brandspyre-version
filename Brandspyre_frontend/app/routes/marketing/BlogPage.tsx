import React, { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw, AlertCircle, FileText } from "lucide-react";
import { BlogCard } from "../../components/public/BlogCard";
import { CTASection } from "../../components/public/CTASection";
import { BASE_URL } from "../../constants/api";
import blogStudioImg from "../../assets/blog_editorial_studio.jpg";

export interface BlogCategoryItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  sort_order: number;
}

export interface BlogPostItem {
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
  featured: boolean;
  sort_order: number;
}

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [categories, setCategories] = useState<BlogCategoryItem[]>([]);
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories from backend
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/public/blog/categories`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCategories(data.data);
        }
      }
    } catch (err) {
      console.warn("Could not fetch blog categories:", err);
    }
  }, []);

  // Fetch published blog posts from backend
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let url = `${BASE_URL}/public/blog?limit=50`;
      if (selectedCategory && selectedCategory !== "all") {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Public Blog API returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setPosts(data.data);
      } else {
        setPosts([]);
      }
    } catch (err: any) {
      console.error("Error fetching published blog posts:", err);
      setError("Unable to load articles from the server. Please check your connection and retry.");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPosts();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchPosts]);

  const isBrowsingAll = selectedCategory === "all" && searchQuery === "";
  const featuredPost = isBrowsingAll ? posts.find((p) => p.featured) || posts[0] : null;
  const regularPosts = isBrowsingAll && featuredPost ? posts.filter((p) => p.slug !== featuredPost.slug) : posts;

  // Format post item for BlogCard component
  const formatForBlogCard = (p: BlogPostItem) => {
    const pubDate = p.published_at
      ? new Date(p.published_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Recent";

    return {
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      category: p.category_name,
      author: {
        name: p.author_name,
        role: p.author_role,
      },
      date: pubDate,
      readTime: `${p.read_time_minutes || 5} min read`,
      cover_image: p.cover_image,
    };
  };

  return (
    <div className="font-sans text-slate-900 dark:text-slate-100 selection:bg-red-500 selection:text-white min-h-screen flex flex-col justify-between">
      <div>
        {/* Header with Architectural Publication Studio Background */}
        <section className="relative pt-18 pb-14 border-b border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950">
          {/* Studio Background Environment */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
            <div
              className="w-full h-full bg-cover bg-top bg-no-repeat opacity-85 dark:opacity-25"
              style={{
                backgroundImage: `url(${blogStudioImg})`,
                backgroundAttachment: "fixed",
              }}
            />
            {/* Luminous center mask for maximum typography readability */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 50% 36%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.75) 52%, rgba(255, 255, 255, 0.15) 86%)",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white dark:from-slate-950/70 dark:via-transparent dark:to-slate-950" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400">
              Brandspyre Publication
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white max-w-2xl">
              Operations & Systems
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
              Perspectives on connected enterprise architecture, retail logistics, workforce systems, and eliminating the software fragmentation tax.
            </p>

            {/* Search Box */}
            <div className="pt-4 max-w-md">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search articles on CRM, POS, billing, manufacturing..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition shadow-xs"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Category Filter Bar */}
        <div className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All Topics
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id || cat.slug}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat.name
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Articles Canvas */}
        <section className="py-16 sm:py-20 bg-white dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            {/* 1. Loading Skeleton */}
            {loading && (
              <div className="space-y-8 animate-pulse">
                <div className="h-64 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 flex flex-col justify-between">
                  <div className="space-y-3 max-w-xl">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                  </div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="h-56 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-4/5" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                      </div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Error State */}
            {!loading && error && (
              <div className="text-center py-16 border border-dashed border-red-200 dark:border-red-900/50 rounded-2xl p-8 max-w-md mx-auto space-y-4 bg-white dark:bg-slate-900 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                  <AlertCircle size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Unable to load articles</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{error}</p>
                </div>
                <button
                  onClick={fetchPosts}
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <RefreshCw size={13} />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* 3. Empty State */}
            {!loading && !error && posts.length === 0 && (
              <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-md mx-auto space-y-4 bg-white dark:bg-slate-900 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <FileText size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">No articles published yet</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {searchQuery || selectedCategory !== "all"
                      ? "No articles matched your filter criteria."
                      : "Our editorial team is preparing in-depth operational articles."}
                  </p>
                </div>
                {(searchQuery || selectedCategory !== "all") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            )}

            {/* 4. Dynamic Content Grid */}
            {!loading && !error && posts.length > 0 && (
              <>
                {/* Featured Article on Default View */}
                {featuredPost && (
                  <div className="space-y-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Featured Article
                    </span>
                    <BlogCard post={formatForBlogCard(featuredPost)} featured={true} />
                  </div>
                )}

                {/* Regular Articles Grid */}
                {regularPosts.length > 0 && (
                  <div className="space-y-4">
                    {featuredPost && (
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Recent Articles
                      </span>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {regularPosts.map((post) => (
                        <BlogCard key={post.slug || post._id} post={formatForBlogCard(post)} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {/* Final CTA */}
      <CTASection />
    </div>
  );
}
