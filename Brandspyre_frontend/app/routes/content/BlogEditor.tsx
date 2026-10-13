import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Edit3,
  Calendar,
  Image as ImageIcon,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Type,
  Heading,
  Quote as QuoteIcon,
  List,
  AlertCircle,
  CheckCircle2,
  UploadCloud,
  Layers,
  Sparkles,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Info,
  Clock,
} from "lucide-react";
import { authFetch } from "../../../src/utils/authFetch";
import apiClient from "src/services/apiClient";
import { BASE_URL } from "../../constants/api";
import { BlogContentRenderer, type ContentBlock } from "../../components/public/BlogContentRenderer";
import { CategoryManagementModal } from "./CategoryManagementModal";

export default function BlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Active View Tab: 'editor' | 'preview'
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");

  // Post Metadata
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("Operations Architecture");
  const [authorName, setAuthorName] = useState("Brandspyre Editorial");
  const [authorRole, setAuthorRole] = useState("Platform Architecture");
  const [authorAvatar, setAuthorAvatar] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [coverImageAlt, setCoverImageAlt] = useState("");
  const [status, setStatus] = useState<"draft" | "scheduled" | "published">("draft");
  const [scheduledAt, setScheduledAt] = useState("");
  const [featured, setFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);

  // SEO
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [keywords, setKeywords] = useState("");

  // Content Blocks
  const [blocks, setBlocks] = useState<ContentBlock[]>([
    {
      id: "block-1",
      type: "paragraph",
      text: "Start drafting your article perspective here...",
    },
  ]);

  // Categories list
  const [categories, setCategories] = useState<any[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await authFetch(`${BASE_URL}/content/categories`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCategories(data.data);
          if (!categoryId && data.data.length > 0) {
            setCategoryId(data.data[0]._id);
            setCategoryName(data.data[0].name);
          }
        }
      }
    } catch (err) {
      console.warn("Error fetching categories:", err);
    }
  }, [categoryId]);

  // Load existing article if editing
  useEffect(() => {
    fetchCategories();

    if (isEditing && id) {
      setLoading(true);
      authFetch(`${BASE_URL}/content/blog/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            const p = data.data;
            setTitle(p.title || "");
            setSubtitle(p.subtitle || "");
            setSlug(p.slug || "");
            setExcerpt(p.excerpt || "");
            setCategoryId(p.category_id || "");
            setCategoryName(p.category_name || "");
            setAuthorName(p.author_name || "");
            setAuthorRole(p.author_role || "");
            setAuthorAvatar(p.author_avatar || "");
            setCoverImage(p.cover_image || "");
            setCoverImageAlt(p.cover_image_alt || "");
            setStatus(p.status === "archived" ? "draft" : p.status || "draft");
            setScheduledAt(p.scheduled_at ? new Date(p.scheduled_at).toISOString().slice(0, 16) : "");
            setFeatured(Boolean(p.featured));
            setSortOrder(p.sort_order || 0);

            if (p.seo) {
              setMetaTitle(p.seo.meta_title || "");
              setMetaDescription(p.seo.meta_description || "");
              setOgImage(p.seo.og_image || "");
              setKeywords(Array.isArray(p.seo.keywords) ? p.seo.keywords.join(", ") : "");
            }

            if (Array.isArray(p.content_blocks) && p.content_blocks.length > 0) {
              setBlocks(p.content_blocks);
            }
          }
        })
        .catch((err) => {
          setNotification({ type: "error", message: "Failed to load blog post." });
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditing, fetchCategories]);

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing || !slug) {
      const autoSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      setSlug(autoSlug);
    }
  };

  // Word count & read time
  const { wordCount, readTime } = useMemo(() => {
    let text = excerpt;
    blocks.forEach((b) => {
      if (b.text) text += " " + b.text;
      if (b.title) text += " " + b.title;
      if (Array.isArray(b.items)) text += " " + b.items.join(" ");
    });
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const time = Math.max(1, Math.ceil(words / 200));
    return { wordCount: words, readTime: time };
  }, [blocks, excerpt]);

  // Cover Image Upload Handler
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiClient.post('/content/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const data = res.data;
      if (data.success && data.data?.url) {
        setCoverImage(data.data.url);
        setNotification({ type: "success", message: "Cover image uploaded successfully." });
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to upload image." });
    } finally {
      setUploadingCover(false);
    }
  };

  // Block Helpers
  const addBlock = (type: ContentBlock["type"]) => {
    const newId = `block-${Date.now()}`;
    let newBlock: ContentBlock = { id: newId, type };

    if (type === "heading") {
      newBlock.level = 2;
      newBlock.text = "New Section Heading";
    } else if (type === "paragraph") {
      newBlock.text = "Paragraph text...";
    } else if (type === "quote") {
      newBlock.text = "Notable operational quote or insight...";
      newBlock.citation = "Executive Role";
    } else if (type === "list") {
      newBlock.listType = "bullet";
      newBlock.items = ["First item", "Second item", "Third item"];
    } else if (type === "callout") {
      newBlock.title = "Operational Key Point";
      newBlock.text = "Highlighted callout detail...";
      newBlock.variant = "info";
    } else if (type === "cta") {
      newBlock.title = "Ready to unify your business workflow?";
      newBlock.subtitle = "Connect all modules with zero sync lag.";
      newBlock.buttonText = "Start Free 14-Day Trial";
      newBlock.buttonUrl = "/tenant-registration";
      newBlock.variant = "primary";
    } else if (type === "divider") {
      newBlock.variant = "solid";
    } else if (type === "image") {
      newBlock.url = "";
      newBlock.caption = "Visual description";
      newBlock.width = "100%";
      newBlock.alignment = "center";
    }

    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (index: number, updated: Partial<ContentBlock>) => {
    const next = [...blocks];
    next[index] = { ...next[index], ...updated };
    setBlocks(next);
  };

  const removeBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === blocks.length - 1)) {
      return;
    }
    const next = [...blocks];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    setBlocks(next);
  };

  // Save / Publish
  const handleSave = async (overrideStatus?: "draft" | "published" | "scheduled") => {
    if (!title.trim()) {
      setNotification({ type: "error", message: "Please provide an article title." });
      return;
    }

    try {
      setSaving(true);
      setNotification(null);

      const currentStatus = overrideStatus || status;

      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim(),
        category_id: categoryId || undefined,
        category_name: categoryName,
        author_name: authorName.trim(),
        author_role: authorRole.trim(),
        author_avatar: authorAvatar.trim(),
        cover_image: coverImage.trim(),
        cover_image_alt: coverImageAlt.trim(),
        status: currentStatus,
        scheduled_at: currentStatus === "scheduled" && scheduledAt ? new Date(scheduledAt) : undefined,
        featured,
        sort_order: Number(sortOrder),
        content_blocks: blocks,
        seo: {
          meta_title: metaTitle.trim() || title.trim(),
          meta_description: metaDescription.trim() || excerpt.trim(),
          og_image: ogImage.trim() || coverImage.trim(),
          keywords: keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
        },
      };

      const url = isEditing ? `${BASE_URL}/content/blog/${id}` : `${BASE_URL}/content/blog`;
      const method = isEditing ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save article");
      }

      setNotification({
        type: "success",
        message: isEditing
          ? "Article updated successfully."
          : `Article '${title}' created successfully.`,
      });

      if (!isEditing && data.data?._id) {
        navigate(`/content/blog/edit/${data.data._id}`, { replace: true });
      }
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Error saving article" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-sans">
        Loading article editor...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-20">
      {/* Top Action Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/content/blog"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Back to Blog Dashboard"
          >
            <ArrowLeft size={18} />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {isEditing ? "Edit Article" : "New Publication"}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {status}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{readTime} min read</span>
            </div>
          </div>
        </div>

        {/* View Mode & Publish Actions */}
        <div className="flex items-center gap-2.5">
          {/* Mode Tabs */}
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("editor")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === "editor"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Edit3 size={13} />
              <span>Editor</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === "preview"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Eye size={13} />
              <span>Live Preview</span>
            </button>
          </div>

          {/* Save Draft Button */}
          <button
            type="button"
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save size={14} />
            <span>Save Draft</span>
          </button>

          {/* Publish Button */}
          <button
            type="button"
            onClick={() => handleSave("published")}
            disabled={saving}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-red-700 hover:bg-red-800 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send size={14} />
            <span>{status === "published" ? "Update Published" : "Publish Now"}</span>
          </button>
        </div>
      </header>

      {/* Notification Banner */}
      {notification && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div
            className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-700">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Work Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === "preview" ? (
          /* LIVE PREVIEW CANVAS */
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-12 max-w-4xl mx-auto space-y-8">
            <div className="space-y-4 border-b border-slate-100 dark:border-slate-800 pb-8">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
                {categoryName}
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                {title || "Untitled Article"}
              </h1>
              {subtitle && (
                <p className="text-lg text-slate-600 dark:text-slate-400">{subtitle}</p>
              )}
              {excerpt && (
                <p className="text-sm sm:text-base text-slate-500 italic">{excerpt}</p>
              )}
              {coverImage && (
                <img
                  src={coverImage}
                  alt={coverImageAlt || title}
                  className="w-full h-auto object-cover rounded-xl max-h-[400px] mt-4"
                />
              )}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span>
                  By <strong className="text-slate-700 dark:text-slate-300">{authorName}</strong> ({authorRole})
                </span>
                <span>{readTime} min read</span>
              </div>
            </div>

            {/* Render Body */}
            <div className="max-w-[720px] mx-auto">
              <BlogContentRenderer blocks={blocks} />
            </div>
          </div>
        ) : (
          /* EDITOR GRID (2-Columns: Left Metadata & SEO, Right Rich Content Builder) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Metadata, Category, Author, Publishing Controls */}
            <div className="lg:col-span-4 space-y-6">
              {/* Publication Settings */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Publication Settings
                </h3>

                {/* Status Selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600"
                  >
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                  </select>
                </div>

                {/* Scheduled DateTime */}
                {status === "scheduled" && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Publish Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600"
                    />
                  </div>
                )}

                {/* Category Dropdown with Add Modal Trigger */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-[10px] font-semibold text-red-600 hover:text-red-700"
                    >
                      + Manage
                    </button>
                  </div>
                  <select
                    value={categoryName}
                    onChange={(e) => {
                      const selected = categories.find((c) => c.name === e.target.value);
                      setCategoryName(e.target.value);
                      if (selected) setCategoryId(selected._id);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600"
                  >
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    URL Slug *
                  </label>
                  <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5">
                    <span className="font-mono text-[10px]">/blog/</span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="flex-1 bg-transparent text-slate-900 dark:text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {/* Featured Checkbox */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="rounded text-red-600 focus:ring-0"
                    />
                    <span className="font-semibold">Feature on Blog Header & Home</span>
                  </label>
                </div>
              </div>

              {/* Cover Image & Visuals */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Cover Image
                </h3>

                {coverImage ? (
                  <div className="space-y-2">
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-48">
                      <img src={coverImage} alt="Cover preview" className="w-full h-auto object-cover" />
                      <button
                        type="button"
                        onClick={() => setCoverImage("")}
                        className="absolute top-2 right-2 p-1 rounded-md bg-black/60 text-white hover:bg-black transition"
                        title="Remove image"
                      >
                        ✕
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Alt description for cover..."
                      value={coverImageAlt}
                      onChange={(e) => setCoverImageAlt(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-red-500 transition">
                      <UploadCloud size={24} className="text-slate-400" />
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {uploadingCover ? "Uploading Image..." : "Click to upload cover image"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        disabled={uploadingCover}
                        className="hidden"
                      />
                    </label>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Or enter image URL..."
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Author Details */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Author Signature
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Author Name
                    </label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Author Role / Title
                    </label>
                    <input
                      type="text"
                      value={authorRole}
                      onChange={(e) => setAuthorRole(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* SEO & Meta */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Search Engine (SEO) Meta
                </h3>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    placeholder="Defaults to article title"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Defaults to excerpt..."
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Keywords (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CRM, POS, Billing, Manufacturing"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Article Content & Interactive Block Editor */}
            <div className="lg:col-span-8 space-y-6">
              {/* Header Title & Excerpt Panel */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. How Unified Platforms Eliminate the SaaS Fragmentation Tax"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-4 py-2.5 text-base sm:text-lg font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subtitle (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Secondary headline..."
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full px-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Article Summary / Excerpt *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="A compelling 2-sentence summary displayed on cards and search results..."
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    className="w-full px-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                </div>
              </div>

              {/* Interactive Content Blocks Builder */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Structured Content Blocks ({blocks.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Build your story with modular, styled blocks. Reorder and format with ease.
                    </p>
                  </div>

                  {/* Add Block Dropdown / Quick Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => addBlock("paragraph")}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition"
                      title="Add Paragraph"
                    >
                      + Paragraph
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlock("heading")}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition"
                      title="Add Heading"
                    >
                      + Heading
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlock("image")}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition"
                      title="Add Image"
                    >
                      + Image
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlock("quote")}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition"
                      title="Add Quote"
                    >
                      + Quote
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlock("callout")}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition"
                      title="Add Callout Box"
                    >
                      + Callout
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlock("cta")}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 hover:bg-red-100 transition"
                      title="Add CTA Box"
                    >
                      + CTA
                    </button>
                  </div>
                </div>

                {/* Blocks List */}
                <div className="space-y-4">
                  {blocks.map((block, index) => (
                    <div
                      key={block.id || index}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3 relative group"
                    >
                      {/* Block Controls Header */}
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-400">#{index + 1}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                            {block.type}
                          </span>
                        </div>

                        {/* Reorder and Delete Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveBlock(index, "up")}
                            disabled={index === 0}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            title="Move Up"
                          >
                            <MoveUp size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBlock(index, "down")}
                            disabled={index === blocks.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            title="Move Down"
                          >
                            <MoveDown size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBlock(index)}
                            className="p-1 text-red-500 hover:text-red-700"
                            title="Remove Block"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Block Specific Form Fields */}
                      {block.type === "heading" && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <select
                              value={block.level || 2}
                              onChange={(e) => updateBlock(index, { level: Number(e.target.value) as any })}
                              className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                            >
                              <option value={1}>H1 (Major Heading)</option>
                              <option value={2}>H2 (Section Heading)</option>
                              <option value={3}>H3 (Sub Heading)</option>
                              <option value={4}>H4 (Minor Heading)</option>
                            </select>

                            <input
                              type="text"
                              value={block.text || ""}
                              onChange={(e) => updateBlock(index, { text: e.target.value })}
                              placeholder="Enter heading text..."
                              className="flex-1 px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>
                      )}

                      {block.type === "paragraph" && (
                        <div className="space-y-2">
                          <textarea
                            rows={3}
                            value={block.text || ""}
                            onChange={(e) => updateBlock(index, { text: e.target.value })}
                            placeholder="Type paragraph content..."
                            className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white leading-relaxed"
                          />
                        </div>
                      )}

                      {block.type === "image" && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                                Image URL
                              </label>
                              <input
                                type="text"
                                value={block.url || ""}
                                onChange={(e) => updateBlock(index, { url: e.target.value })}
                                placeholder="https://... or /uploads/..."
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                                Caption
                              </label>
                              <input
                                type="text"
                                value={block.caption || ""}
                                onChange={(e) => updateBlock(index, { caption: e.target.value })}
                                placeholder="Figure caption..."
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {block.type === "quote" && (
                        <div className="space-y-2">
                          <textarea
                            rows={2}
                            value={block.text || ""}
                            onChange={(e) => updateBlock(index, { text: e.target.value })}
                            placeholder="Quote text..."
                            className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 italic"
                          />
                          <input
                            type="text"
                            value={block.citation || ""}
                            onChange={(e) => updateBlock(index, { citation: e.target.value })}
                            placeholder="Citation (e.g. Chief Operations Officer, Logistics Group)"
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </div>
                      )}

                      {block.type === "callout" && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <select
                              value={block.variant || "info"}
                              onChange={(e) => updateBlock(index, { variant: e.target.value as any })}
                              className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                            >
                              <option value="info">Info (Blue)</option>
                              <option value="success">Success (Green)</option>
                              <option value="warning">Warning (Amber)</option>
                              <option value="tip">Tip (Purple)</option>
                            </select>

                            <input
                              type="text"
                              value={block.title || ""}
                              onChange={(e) => updateBlock(index, { title: e.target.value })}
                              placeholder="Callout title..."
                              className="flex-1 px-3 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                            />
                          </div>
                          <textarea
                            rows={2}
                            value={block.text || ""}
                            onChange={(e) => updateBlock(index, { text: e.target.value })}
                            placeholder="Callout body text..."
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </div>
                      )}

                      {block.type === "cta" && (
                        <div className="space-y-2 p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={block.title || ""}
                              onChange={(e) => updateBlock(index, { title: e.target.value })}
                              placeholder="CTA Title"
                              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                            />
                            <input
                              type="text"
                              value={block.subtitle || ""}
                              onChange={(e) => updateBlock(index, { subtitle: e.target.value })}
                              placeholder="CTA Subtitle"
                              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={block.buttonText || ""}
                              onChange={(e) => updateBlock(index, { buttonText: e.target.value })}
                              placeholder="Button Label (e.g. Get Started Free)"
                              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                            />
                            <input
                              type="text"
                              value={block.buttonUrl || ""}
                              onChange={(e) => updateBlock(index, { buttonUrl: e.target.value })}
                              placeholder="Button Link URL (e.g. /tenant-registration)"
                              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                            />
                          </div>
                        </div>
                      )}

                      {block.type === "divider" && (
                        <div className="py-2 text-center text-slate-400 text-xs">
                          ──────── Solid Section Divider ────────
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Bottom Add Bar */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => addBlock("paragraph")}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Append Paragraph</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Category Management Modal */}
      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onUpdated={fetchCategories}
      />
    </div>
  );
}
