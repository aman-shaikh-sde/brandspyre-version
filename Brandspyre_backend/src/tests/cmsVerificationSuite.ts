import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

import {
  BlogCategory,
  BlogPost,
  Testimonial,
  initializePublicContentSchema,
} from "../db/ModelSceham/publicContentSchema";
import { seedPublicContentData } from "../db/seedPublicContent";
import PublicContentService from "../services/saas/PublicContentService";
import PermissionRegistry from "../services/saas/PermissionRegistry";

async function runCMSVerificationSuite() {
  console.log("=================================================================");
  console.log("🧪 STARTING BRANDSPYRE CMS & PUBLIC WEBSITE VERIFICATION SUITE");
  console.log("=================================================================\n");

  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/CRM_DB";
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB:", mongoUri);

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${details ? ` - ${details}` : ""}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Schema Initialization & Idempotent Seeder
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 1: IDEMPOTENT SEED MIGRATION ---");
    await initializePublicContentSchema();
    await seedPublicContentData();

    const initialCategoriesCount = await BlogCategory.countDocuments({});
    assert(initialCategoriesCount >= 5, "Initial categories seeded into database (>= 5)", `Found ${initialCategoriesCount}`);

    const initialPostsCount = await BlogPost.countDocuments({});
    assert(initialPostsCount >= 5, "Initial 5 blog posts seeded into database (>= 5)", `Found ${initialPostsCount}`);

    const initialTestimonialsCount = await Testimonial.countDocuments({});
    assert(initialTestimonialsCount >= 3, "Initial 3 case studies seeded into database (>= 3)", `Found ${initialTestimonialsCount}`);

    // Re-run seeder to verify idempotency (MUST NOT duplicate or overwrite records)
    await seedPublicContentData();
    const categoriesCountAfterSecondSeed = await BlogCategory.countDocuments({});
    const postsCountAfterSecondSeed = await BlogPost.countDocuments({});
    const testimonialsCountAfterSecondSeed = await Testimonial.countDocuments({});

    assert(
      categoriesCountAfterSecondSeed === initialCategoriesCount,
      "Seeder is 100% idempotent for categories (count unchanged on rerun)",
      `Expected ${initialCategoriesCount}, got ${categoriesCountAfterSecondSeed}`
    );
    assert(
      postsCountAfterSecondSeed === initialPostsCount,
      "Seeder is 100% idempotent for blog posts (count unchanged on rerun)",
      `Expected ${initialPostsCount}, got ${postsCountAfterSecondSeed}`
    );
    assert(
      testimonialsCountAfterSecondSeed === initialTestimonialsCount,
      "Seeder is 100% idempotent for case studies (count unchanged on rerun)",
      `Expected ${initialTestimonialsCount}, got ${testimonialsCountAfterSecondSeed}`
    );

    // -------------------------------------------------------------
    // Test 2: Public Query & Draft Isolation
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 2: PUBLIC QUERY & DRAFT ISOLATION ---");

    const testDraftSlug = `test-draft-${Date.now()}`;
    const draftPost = await BlogPost.create({
      slug: testDraftSlug,
      title: "Confidential Unreleased Product Announcement",
      excerpt: "This is a secret draft that public visitors should NEVER see.",
      category_name: "Operations Architecture",
      status: "draft",
      read_time_minutes: 3,
      content_blocks: [
        {
          type: "paragraph",
          text: "Confidential internal notes only.",
        },
      ],
      scope: "global",
    });

    // Query published posts as the public endpoint does
    const publicVisiblePosts = await BlogPost.find({
      status: "published",
      published_at: { $lte: new Date() },
    }).lean();

    const draftFoundInPublic = publicVisiblePosts.some((p) => p.slug === testDraftSlug);
    assert(!draftFoundInPublic, "Draft articles are strictly isolated from public query results");

    // Publish the draft post
    await BlogPost.findByIdAndUpdate(draftPost._id, {
      status: "published",
      published_at: new Date(),
    });

    const publicVisibleAfterPublish = await BlogPost.find({
      status: "published",
      published_at: { $lte: new Date() },
    }).lean();

    const publishedFound = publicVisibleAfterPublish.some((p) => p.slug === testDraftSlug);
    assert(publishedFound, "Published article immediately becomes visible in public query results");

    // Clean up test post
    await BlogPost.findByIdAndDelete(draftPost._id);

    // -------------------------------------------------------------
    // Test 3: Content Block Sanitization & XSS Protection
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 3: SECURITY & XSS SANITIZATION ---");

    const maliciousBlocks = [
      {
        type: "heading",
        level: 2,
        text: "Safe Heading <script>alert('XSS Attack')</script>",
      },
      {
        type: "paragraph",
        text: "<img src=x onerror=alert('Image XSS')>Safe paragraph body.",
        style: {
          color: "#ff0000",
          fontSize: 16,
        },
      },
      {
        type: "cta",
        title: "Click Here",
        buttonText: "Malicious Link",
        buttonUrl: "javascript:evilFunction()",
      },
      {
        type: "image",
        url: "https://brandspyre.com/assets/safe.jpg",
        caption: "Safe Caption",
      },
    ];

    const sanitizedBlocks = PublicContentService.sanitizeContentBlocks(maliciousBlocks);

    assert(
      !sanitizedBlocks[0].text?.includes("<script>"),
      "Script tags are stripped from heading blocks",
      `Result: ${sanitizedBlocks[0].text}`
    );
    assert(
      !sanitizedBlocks[1].text?.includes("onerror="),
      "Event handlers (onerror) are stripped from paragraph blocks",
      `Result: ${sanitizedBlocks[1].text}`
    );
    assert(
      sanitizedBlocks[2].buttonUrl === "" || !sanitizedBlocks[2].buttonUrl?.includes("javascript:"),
      "javascript: URLs are blocked and sanitized in CTA buttons",
      `Result: ${sanitizedBlocks[2].buttonUrl}`
    );
    assert(
      sanitizedBlocks[3].url === "https://brandspyre.com/assets/safe.jpg",
      "Valid HTTPS image URLs are preserved",
      `Result: ${sanitizedBlocks[3].url}`
    );

    // -------------------------------------------------------------
    // Test 4: Word Count & Read Time Calculation
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 4: READ TIME CALCULATION ---");

    const sampleBlocks = [
      {
        type: "heading" as const,
        text: "Enterprise Operations at Scale",
      },
      {
        type: "paragraph" as const,
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(20), // ~160 words
      },
      {
        type: "paragraph" as const,
        text: "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ".repeat(20), // ~200 words
      },
    ];

    const calculatedTime = PublicContentService.calculateReadTime(sampleBlocks, "An excerpt with several words.");
    assert(calculatedTime >= 2 && calculatedTime <= 3, `Read time accurately calculated (~360 words = ${calculatedTime} min)`);

    // -------------------------------------------------------------
    // Test 5: Unique Slug Generation
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 5: UNIQUE SLUG GENERATION ---");

    const slug1 = await PublicContentService.generateUniqueSlug("Connected Retail POS Architecture");
    assert(slug1 === "connected-retail-pos-architecture", "Base slug generated correctly", `Got: ${slug1}`);

    // Create temporary post with slug1
    const tempPost = await BlogPost.create({
      slug: slug1,
      title: "Connected Retail POS Architecture",
      excerpt: "Sample excerpt",
      category_name: "Retail & Commerce",
      status: "draft",
      read_time_minutes: 2,
      content_blocks: [],
      scope: "global",
    });

    const slug2 = await PublicContentService.generateUniqueSlug("Connected Retail POS Architecture");
    assert(slug2 === "connected-retail-pos-architecture-2", "Collision resolution appends suffix -2", `Got: ${slug2}`);

    await BlogPost.findByIdAndDelete(tempPost._id);

    // -------------------------------------------------------------
    // Test 6: RBAC Module & Permission Registry Verification
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 6: RBAC PERMISSION REGISTRY ---");

    const registeredModules = PermissionRegistry.getRegisteredModules();
    const contentModule = registeredModules.find((m) => m.moduleKey === "content");
    assert(Boolean(contentModule), "Module 'content' is registered in PermissionRegistry");

    const requiredPermissions = [
      "content.blog.read",
      "content.blog.create",
      "content.blog.update",
      "content.blog.delete",
      "content.blog.publish",
      "content.category.manage",
      "content.testimonial.read",
      "content.testimonial.create",
      "content.testimonial.update",
      "content.testimonial.delete",
      "content.testimonial.publish",
      "content.media.upload",
      "content.media.delete",
    ];

    const registeredCodes = contentModule?.permissions.map((p: any) => p.code) || [];
    const hasAll = requiredPermissions.every((code) => registeredCodes.includes(code));
    assert(hasAll, "All 13 Content CMS permissions are registered in PermissionRegistry", `Registered: ${registeredCodes.join(", ")}`);

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log("\n=================================================================");
    console.log(`🏁 VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log("=================================================================\n");

    if (passedTests === totalTests) {
      console.log("🌟 ALL CMS & DYNAMIC MARKETING TESTS PASSED SUCCESSFULLY! 🌟\n");
    } else {
      console.error(`⚠️ ${totalTests - passedTests} tests failed.`);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Unexpected error during CMS verification:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runCMSVerificationSuite();
