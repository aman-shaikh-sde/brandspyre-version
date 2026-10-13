import React from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

export interface BlogPostMeta {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: {
    name: string;
    role: string;
  };
  date: string;
  readTime: string;
}

interface BlogCardProps {
  post: BlogPostMeta;
  featured?: boolean;
}

export const BlogCard: React.FC<BlogCardProps> = ({ post, featured = false }) => {
  if (featured) {
    return (
      <article className="lg:col-span-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 sm:p-10 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold text-red-700 dark:text-red-400">
              {post.category}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-slate-500 dark:text-slate-400">{post.date}</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">{post.readTime}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
            <Link to={`/blog/${post.slug}`} className="hover:text-red-700 dark:hover:text-red-400 transition-colors">
              {post.title}
            </Link>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            {post.excerpt}
          </p>
        </div>

        <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs">
            <span className="font-semibold text-slate-900 dark:text-white">{post.author.name}</span>
            <span className="text-slate-400 ml-2">{post.author.role}</span>
          </div>

          <Link
            to={`/blog/${post.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:text-red-800 transition"
          >
            <span>Read article</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-red-700 dark:text-red-400">
            {post.category}
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-slate-500 dark:text-slate-400 text-[11px]">{post.date}</span>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
          <Link to={`/blog/${post.slug}`} className="hover:text-red-700 dark:hover:text-red-400 transition-colors">
            {post.title}
          </Link>
        </h3>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
          {post.excerpt}
        </p>
      </div>

      <div className="pt-4 mt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="text-slate-500 dark:text-slate-400 text-[11px]">
          {post.readTime}
        </div>

        <Link
          to={`/blog/${post.slug}`}
          className="inline-flex items-center gap-1 font-semibold text-red-700 dark:text-red-400 hover:text-red-800 transition"
        >
          <span>Read</span>
          <ArrowRight size={12} />
        </Link>
      </div>
    </article>
  );
};

export default BlogCard;
