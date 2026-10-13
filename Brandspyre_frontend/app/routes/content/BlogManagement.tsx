import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import {
  Plus,
  Search,
  SlidersHorizontal,
  FileText,
  CheckCircle2,
  Clock,
  Archive,
  Edit,
  Trash2,
  Eye,
  Send,
  Calendar,
  Layers,
  AlertCircle,
  ExternalLink,
  MoreVertical,
} from "lucide-react";
import { authFetch } from "../../../src/utils/authFetch";
import { BASE_URL } from "../../constants/api";
import { CategoryManagementModal } from "./CategoryManagementModal";

interface AdminBlogPost {
  _id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  category_name: string;
  author_name: string;
  author_role: string;
  status: "draft" | "scheduled" | "published" | "archived";
  published_at?: string;
  scheduled_at?: string;
  read_time_minutes: number;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export default function BlogManagement() {
  const navigate = useNavigate();

  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState<any[]>([]);

  // Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await authFetch(`${BASE_URL}/content/categories`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCategories(data.data);
        }
      }
    } catch (err) {
      console.warn("Could not load categories:", err);
    }
  }, []);

  // Fetch admin blog posts
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let url = `${BASE_URL}/content/blog?limit=100`;
      if (statusFilter && statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }
      if (categoryFilter && categoryFilter !== "all") {
        url += `&category=${encodeURIComponent(categoryFilter)}`;
      }
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const res = await authFetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load blog posts (status: ${res.status})`);
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setPosts(data.data);
      } else {
        setPosts([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPosts();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchPosts]);

  // Actions
  const handlePublish = async (id: string) => {
    try {
      const res = await authFetch(`${BASE_URL}/content/blog/${id}/publish`, {
        method: "POST",
      });
      if (res.ok) {
        fetchPosts();
      }
    } catch (err) {
      console.error("Error publishing blog post:", err);
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      const res = await authFetch(`${BASE_URL}/content/blog/${id}/unpublish`, {
        method: "POST",
      });
      if (res.ok) {
        fetchPosts();
      }
    } catch (err) {
      console.error("Error unpublishing blog post:", err);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await authFetch(`${BASE_URL}/content/blog/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchPosts();
      }
    } catch (err) {
      console.error("Error deleting blog post:", err);
    }
  };

  // Stats
  const totalCount = posts.length;
  const publishedCount = posts.filter((p) => p.status === "published").length;
  const draftCount = posts.filter((p) => p.status === "draft").length;
  const scheduledCount = posts.filter((p) => p.status === "scheduled").length;

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto font-sans text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 font-bold text-xs">
              CMS Editorial
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">Public Marketing Website</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 text-slate-900 dark:text-white">
            Blog & Editorial Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Create, draft, schedule, and publish rich articles directly to the public Brandspyre marketing website.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Layers size={14} />
            <span>Categories</span>
          </button>

          <Link
            to="/content/blog/new"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-700 hover:bg-red-800 text-white shadow-xs transition flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>New Article</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Articles</span>
            <FileText size={15} className="text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalCount}</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Published Live</span>
            <CheckCircle2 size={15} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{publishedCount}</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Drafts</span>
            <Clock size={15} className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{draftCount}</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Scheduled</span>
            <Calendar size={15} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{scheduledCount}</p>
        </div>
      </div>

      {/* Control Bar: Search & Status Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full md:w-auto">
            {[
              { key: "all", label: "All Posts" },
              { key: "published", label: "Published" },
              { key: "draft", label: "Drafts" },
              { key: "scheduled", label: "Scheduled" },
              { key: "archived", label: "Archived" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  statusFilter === tab.key
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id || cat.slug} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Posts Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Article Title & Excerpt</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date / Read Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading articles...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No articles found for selected criteria.
                  </td>
                </tr>
              ) : (
                posts.map((post) => {
                  const statusConfig = {
                    published: {
                      bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
                      label: "Published",
                    },
                    draft: {
                      bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
                      label: "Draft",
                    },
                    scheduled: {
                      bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
                      label: "Scheduled",
                    },
                    archived: {
                      bg: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
                      label: "Archived",
                    },
                  }[post.status] || {
                    bg: "bg-slate-100 text-slate-700 border-slate-200",
                    label: post.status,
                  };

                  return (
                    <tr
                      key={post._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                    >
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Link
                              to={`/content/blog/edit/${post._id}`}
                              className="font-bold text-slate-900 dark:text-white hover:text-red-700 dark:hover:text-red-400 transition"
                            >
                              {post.title}
                            </Link>
                            {post.featured && (
                              <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 font-bold text-[9px]">
                                FEATURED
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-1">
                            {post.excerpt}
                          </p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {post.category_name}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-[11px]">
                          <span className="font-medium text-slate-900 dark:text-white">
                            {post.author_name}
                          </span>
                          <span className="block text-slate-400 text-[10px]">{post.author_role}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig.bg}`}
                        >
                          {statusConfig.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        <div>
                          {post.status === "published" && post.published_at
                            ? new Date(post.published_at).toLocaleDateString()
                            : post.status === "scheduled" && post.scheduled_at
                            ? `At: ${new Date(post.scheduled_at).toLocaleDateString()}`
                            : `Updated: ${new Date(post.updated_at).toLocaleDateString()}`}
                        </div>
                        <span className="text-[10px] text-slate-400">{post.read_time_minutes} min read</span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* View on public marketing site */}
                          {post.status === "published" && (
                            <a
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="View on Public Site"
                            >
                              <ExternalLink size={13} />
                            </a>
                          )}

                          {/* Quick Publish / Unpublish */}
                          {post.status === "published" ? (
                            <button
                              onClick={() => handleUnpublish(post._id)}
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition cursor-pointer"
                              title="Unpublish to Draft"
                            >
                              <Archive size={13} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePublish(post._id)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition cursor-pointer"
                              title="Publish Now"
                            >
                              <Send size={13} />
                            </button>
                          )}

                          {/* Edit */}
                          <Link
                            to={`/content/blog/edit/${post._id}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Edit Article"
                          >
                            <Edit size={13} />
                          </Link>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(post._id, post.title)}
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 transition cursor-pointer"
                            title="Delete Article"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Categories Management Modal */}
      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onUpdated={() => {
          fetchCategories();
          fetchPosts();
        }}
      />
    </div>
  );
}
