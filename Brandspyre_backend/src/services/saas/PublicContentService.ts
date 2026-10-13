import { BlogPost, BlogCategory, ContentBlock, ContentStyle } from "../../db/ModelSceham/publicContentSchema";

export class PublicContentService {
  /**
   * Sanitize string against XSS, scripts, and javascript: protocols
   */
  static sanitizeString(input?: string): string {
    if (!input || typeof input !== "string") return "";
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
      .replace(/on\w+\s*=\s*[^\s>]+/gi, "")
      .replace(/javascript\s*:/gi, "")
      .trim();
  }

  /**
   * Validate and sanitize URL (allow only http, https, mailto, relative /)
   */
  static sanitizeUrl(url?: string): string {
    if (!url || typeof url !== "string") return "";
    const trimmed = url.trim();
    if (trimmed.startsWith("/") || trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("mailto:")) {
      return trimmed.replace(/[<>"'()]/g, "");
    }
    return "";
  }

  /**
   * Sanitize styling properties to safe values
   */
  static sanitizeStyle(style?: ContentStyle): ContentStyle | undefined {
    if (!style || typeof style !== "object") return undefined;
    const clean: ContentStyle = {};

    if (style.fontSize !== undefined) {
      const num = parseInt(String(style.fontSize), 10);
      if (!isNaN(num) && num >= 8 && num <= 72) {
        clean.fontSize = num;
      }
    }

    if (style.fontWeight && ["normal", "medium", "semibold", "bold", "800", "900"].includes(String(style.fontWeight))) {
      clean.fontWeight = style.fontWeight;
    }

    if (style.fontStyle && ["normal", "italic"].includes(style.fontStyle)) {
      clean.fontStyle = style.fontStyle;
    }

    if (style.textDecoration && ["none", "underline", "line-through"].includes(style.textDecoration)) {
      clean.textDecoration = style.textDecoration;
    }

    if (style.textAlign && ["left", "center", "right", "justify"].includes(style.textAlign)) {
      clean.textAlign = style.textAlign;
    }

    if (style.color && typeof style.color === "string") {
      // Hex or standard rgb
      if (/^(#[0-9a-fA-F]{3,8}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\))$/.test(style.color.trim())) {
        clean.color = style.color.trim();
      }
    }

    if (style.backgroundColor && typeof style.backgroundColor === "string") {
      if (/^(#[0-9a-fA-F]{3,8}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\))$/.test(style.backgroundColor.trim())) {
        clean.backgroundColor = style.backgroundColor.trim();
      }
    }

    return Object.keys(clean).length > 0 ? clean : undefined;
  }

  /**
   * Sanitize structured content blocks
   */
  static sanitizeContentBlocks(blocks: any[]): ContentBlock[] {
    if (!Array.isArray(blocks)) return [];

    const allowedTypes = ["heading", "paragraph", "image", "quote", "list", "divider", "callout", "cta", "table"];
    const sanitized: ContentBlock[] = [];

    for (const b of blocks) {
      if (!b || typeof b !== "object" || !allowedTypes.includes(b.type)) continue;

      const item: ContentBlock = {
        type: b.type,
      };

      if (b.id) item.id = String(b.id);

      if (b.type === "heading") {
        item.level = [1, 2, 3, 4, 5, 6].includes(Number(b.level)) ? (Number(b.level) as any) : 2;
        item.text = this.sanitizeString(b.text);
        item.style = this.sanitizeStyle(b.style);
      } else if (b.type === "paragraph") {
        item.text = this.sanitizeString(b.text);
        item.style = this.sanitizeStyle(b.style);
      } else if (b.type === "image") {
        item.url = this.sanitizeUrl(b.url);
        item.alt = this.sanitizeString(b.alt);
        item.caption = this.sanitizeString(b.caption);
        item.width = b.width && ["25%", "50%", "75%", "100%"].includes(b.width) ? b.width : "100%";
        item.alignment = b.alignment && ["left", "center", "right"].includes(b.alignment) ? b.alignment : "center";
      } else if (b.type === "quote") {
        item.text = this.sanitizeString(b.text);
        item.citation = this.sanitizeString(b.citation);
        item.style = this.sanitizeStyle(b.style);
      } else if (b.type === "list") {
        item.listType = b.listType === "ordered" ? "ordered" : "bullet";
        item.items = Array.isArray(b.items) ? b.items.map((it: any) => this.sanitizeString(it)).filter(Boolean) : [];
        item.style = this.sanitizeStyle(b.style);
      } else if (b.type === "divider") {
        item.variant = ["solid", "dashed", "dotted"].includes(b.variant) ? b.variant : "solid";
      } else if (b.type === "callout") {
        item.title = this.sanitizeString(b.title);
        item.text = this.sanitizeString(b.text);
        item.variant = ["info", "success", "warning", "tip"].includes(b.variant) ? b.variant : "info";
      } else if (b.type === "cta") {
        item.title = this.sanitizeString(b.title);
        item.subtitle = this.sanitizeString(b.subtitle);
        item.buttonText = this.sanitizeString(b.buttonText) || "Learn More";
        item.buttonUrl = this.sanitizeUrl(b.buttonUrl) || "/tenant-registration";
        item.variant = b.variant === "secondary" ? "secondary" : "primary";
      } else if (b.type === "table") {
        item.headers = Array.isArray(b.headers) ? b.headers.map((h: any) => this.sanitizeString(h)) : [];
        item.rows = Array.isArray(b.rows)
          ? b.rows.map((row: any) => (Array.isArray(row) ? row.map((cell: any) => this.sanitizeString(cell)) : []))
          : [];
      }

      sanitized.push(item);
    }

    return sanitized;
  }

  /**
   * Calculate reading time in minutes based on content blocks and excerpt
   */
  static calculateReadTime(blocks: ContentBlock[], excerpt?: string): number {
    let totalText = excerpt || "";

    for (const b of blocks) {
      if (b.text) totalText += " " + b.text;
      if (b.title) totalText += " " + b.title;
      if (b.subtitle) totalText += " " + b.subtitle;
      if (b.citation) totalText += " " + b.citation;
      if (b.caption) totalText += " " + b.caption;
      if (Array.isArray(b.items)) totalText += " " + b.items.join(" ");
      if (Array.isArray(b.headers)) totalText += " " + b.headers.join(" ");
      if (Array.isArray(b.rows)) {
        for (const r of b.rows) {
          if (Array.isArray(r)) totalText += " " + r.join(" ");
        }
      }
    }

    const words = totalText.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  }

  /**
   * Generate an SEO-friendly unique slug for a blog post or category
   */
  static async generateUniqueSlug(title: string, currentId?: string, isCategory: boolean = false): Promise<string> {
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

    let slug = baseSlug || "article";
    let counter = 1;

    while (true) {
      const query: any = { slug };
      if (currentId) {
        query._id = { $ne: currentId };
      }

      const existing = isCategory
        ? await BlogCategory.findOne(query).lean()
        : await BlogPost.findOne(query).lean();

      if (!existing) {
        return slug;
      }

      counter++;
      slug = `${baseSlug}-${counter}`;
    }
  }

  /**
   * Automatically publish scheduled posts that have reached their scheduled_at time
   */
  static async autoPublishScheduledPosts(): Promise<number> {
    const now = new Date();
    const result = await BlogPost.updateMany(
      {
        status: "scheduled",
        scheduled_at: { $lte: now }
      },
      {
        $set: {
          status: "published",
          published_at: now,
          updated_at: now
        }
      }
    );

    return result.modifiedCount || 0;
  }
}

export default PublicContentService;
