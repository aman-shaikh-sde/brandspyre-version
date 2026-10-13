import {
  BlogCategory,
  BlogPost,
  Testimonial,
  ContentBlock,
} from "./ModelSceham/publicContentSchema";
import PublicContentService from "../services/saas/PublicContentService";

export async function seedPublicContentData(): Promise<void> {
  try {
    console.log("🌱 Checking and seeding Public Website CMS data (idempotent)...");

    // =========================================================================
    // 1. SEED BLOG CATEGORIES
    // =========================================================================
    const initialCategories = [
      {
        name: "Operations Architecture",
        slug: "operations-architecture",
        description: "Perspectives on unified enterprise operations, data structures, and eliminating software fragmentation.",
        sort_order: 1,
      },
      {
        name: "Retail & Commerce",
        slug: "retail-commerce",
        description: "Modern retail point of sale, multi-branch balancing, and storefront inventory synchronization.",
        sort_order: 2,
      },
      {
        name: "Financial Technology",
        slug: "financial-technology",
        description: "Success-stage commercial billing, milestone verification, and automated enterprise ledgers.",
        sort_order: 3,
      },
      {
        name: "Manufacturing",
        slug: "manufacturing",
        description: "Shop-floor work orders, digital Bills of Materials (BOM), and raw material allocation.",
        sort_order: 4,
      },
      {
        name: "Artificial Intelligence",
        slug: "artificial-intelligence",
        description: "Context-aware operational intelligence, localized LLM workflows, and data governance.",
        sort_order: 5,
      },
    ];

    const categoryMap = new Map<string, any>();

    for (const cat of initialCategories) {
      let existing = await BlogCategory.findOne({
        $or: [{ slug: cat.slug }, { name: cat.name }],
      });

      if (!existing) {
        existing = await BlogCategory.create({
          ...cat,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        });
        console.log(`  + Seeded Blog Category: ${cat.name}`);
      }
      categoryMap.set(cat.name, existing);
    }

    // =========================================================================
    // 2. SEED INITIAL BLOG POSTS
    // =========================================================================
    const initialBlogPosts = [
      {
        slug: "saas-fragmentation-tax",
        title: "How Unified Business Platforms Eliminate the SaaS Fragmentation Tax",
        subtitle: "The hidden cost of fragmented software tools and how unified data models fix it.",
        excerpt:
          "Growing companies often pay a hidden operational tax: five different subscriptions, fragile sync integrations, and hours spent manually reconciling CSV files. Here is how unified systems solve it.",
        category_name: "Operations Architecture",
        author_name: "Engineering Team",
        author_role: "Platform Architecture",
        featured: true,
        sort_order: 10,
        published_at: new Date("2026-08-24T09:00:00Z"),
        content_blocks: [
          {
            type: "paragraph",
            text: "As small businesses mature into mid-market enterprises, their software stack tends to evolve organically—and chaotically. The sales team signs up for a specialized CRM. The HR manager adopts an attendance app. Retail managers purchase a standalone point-of-sale terminal, and operations managers coordinate projects on separate spreadsheets.",
          },
          {
            type: "paragraph",
            text: "While each individual tool might solve a specific tactical problem, the holistic cost to the business is staggering. We call this the 'SaaS Fragmentation Tax'.",
          },
          {
            type: "heading",
            level: 3,
            text: "The Three Dimensions of Fragmentation Tax",
          },
          {
            type: "callout",
            title: "1. Financial Waste",
            text: "Paying multiple software licenses per seat, often duplicating user seats across platforms that don't speak to one another.",
            variant: "warning",
          },
          {
            type: "callout",
            title: "2. Integration Fragility",
            text: "Webhooks fail, APIs deprecate, and synchronization scripts break, leaving departments operating on contradictory copies of business truth.",
            variant: "warning",
          },
          {
            type: "callout",
            title: "3. Latency in Executive Decisions",
            text: "Leadership cannot view live revenue, inventory, and payroll numbers simultaneously without hours of manual data export and manipulation.",
            variant: "info",
          },
          {
            type: "paragraph",
            text: "By unifying CRM, Workforce HRMS, Commerce, and Manufacturing into a single database schema with multi-tenant isolation, Brandspyre eliminates the seams entirely. When an invoice is paid, customer records, inventory accounts, and sales rep commission logs update in the same transactional cycle.",
          },
          {
            type: "cta",
            title: "Ready to eliminate software fragmentation?",
            subtitle: "Experience all modules connected in one unified workspace.",
            buttonText: "Start 14-Day Free Evaluation",
            buttonUrl: "/tenant-registration",
          },
        ] as ContentBlock[],
      },
      {
        slug: "modern-retail-pos",
        title: "Modernizing Retail POS: Why Offline-Resilience & Multi-Branch Inventory Matter",
        subtitle: "High-speed checkouts without inventory drift across store locations.",
        excerpt:
          "Retailers with multiple physical stores face a constant battle between high-speed checkout counters and central warehouse inventory accuracy. Learn how to bridge the gap.",
        category_name: "Retail & Commerce",
        author_name: "Product Design",
        author_role: "Commerce Solutions",
        featured: false,
        sort_order: 9,
        published_at: new Date("2026-08-18T09:00:00Z"),
        content_blocks: [
          {
            type: "paragraph",
            text: "Physical retail checkouts demand split-second speed. Customers waiting in line do not care about server network latency or database locks. If a POS terminal freezes for four seconds during an internet blip, cart abandonment spikes and store clerks get frustrated.",
          },
          {
            type: "heading",
            level: 3,
            text: "Two Architectural Non-Negotiables",
          },
          {
            type: "quote",
            text: "First, offline-resilient register sessions. POS registers must be able to scan barcodes, tender cash and card payments, and print thermal receipts even during temporary network interruptions, synchronizing batches the instant connectivity returns.",
          },
          {
            type: "quote",
            text: "Second, real-time multi-branch inventory tracking. When store branch A runs out of a particular SKU, cashier staff should immediately be able to verify whether branch B or the central regional warehouse has stock in transit.",
          },
          {
            type: "paragraph",
            text: "Brandspyre POS is built from the ground up to solve these physical retail realities, offering barcode scanning, split tender support, and daily cash shift balancing tightly coupled with central inventory.",
          },
        ] as ContentBlock[],
      },
      {
        slug: "success-based-billing",
        title: "Success-Based Commercial Billing: The Future of B2B Agreements",
        subtitle: "Why milestone validation and automated ledgers eliminate invoice disputes.",
        excerpt:
          "Flat monthly retainers and manual hourly billing are giving way to success-stage milestone billing. How automated commercial ledgers protect both parties.",
        category_name: "Financial Technology",
        author_name: "Finance Architecture",
        author_role: "Billing Systems",
        featured: false,
        sort_order: 8,
        published_at: new Date("2026-08-10T09:00:00Z"),
        content_blocks: [
          {
            type: "paragraph",
            text: "Traditional B2B commercial agreements are often burdened by adversarial invoice disputes. Service providers bill for hours worked, while client finance departments scrutinize timesheets and contest whether agreed milestones were truly delivered.",
          },
          {
            type: "paragraph",
            text: "The next generation of commercial billing is built on verifiable success stages. Under this model, contract master agreements define clear milestone criteria, verification checklists, and automatic invoice release conditions.",
          },
          {
            type: "paragraph",
            text: "Brandspyre's Commercial Billing Engine introduces structured transaction ledgers where every billing stage is validated against signed deliverable records before an invoice is generated.",
          },
          {
            type: "paragraph",
            text: "Furthermore, built-in dispute resolution flows allow partial credit adjustments and clear audit trails, enabling organizations to settle payments directly with complete transparency.",
          },
        ] as ContentBlock[],
      },
      {
        slug: "digital-bom-work-orders",
        title: "Connecting the Shop Floor: How Digital BOM and Work Orders Reduce Waste",
        subtitle: "Real-time raw material reservations and actual unit production costing.",
        excerpt:
          "Manual Bill of Materials spreadsheets lead to raw material shortages and unpredictable finished goods costing. Here is how digital production routing changes the game.",
        category_name: "Manufacturing",
        author_name: "Operations Team",
        author_role: "Industrial Engineering",
        featured: false,
        sort_order: 7,
        published_at: new Date("2026-07-28T09:00:00Z"),
        content_blocks: [
          {
            type: "paragraph",
            text: "In manufacturing and custom assembly operations, precision on the shop floor determines whether an order produces healthy margins or an unexpected loss.",
          },
          {
            type: "paragraph",
            text: "When Bills of Materials (BOM) are managed in desktop spreadsheets, changes made by engineering don't reach assembly managers in time. As a result, assembly lines start work on outdated component specs, leading to scrapped parts and expensive rework.",
          },
          {
            type: "paragraph",
            text: "Digital BOM management links the sales quote directly to component reservations. When a customer confirms an order, raw material requirements are calculated instantly with component scrap factors.",
          },
          {
            type: "paragraph",
            text: "Work orders route sequentially through assembly stages, logging workforce timesheets and deducting materials in real time. Plant managers know the exact unit cost of every finished good before it enters the warehouse.",
          },
        ] as ContentBlock[],
      },
      {
        slug: "enterprise-ai-permissions",
        title: "Context-Aware Enterprise AI: Why Permissions and Data Governance Come First",
        subtitle: "How localized, role-scoped AI transforms business analytics without security compromises.",
        excerpt:
          "Integrating AI into business operations requires more than connecting an LLM. Data isolation, role-based permissions, and localized inference are critical for enterprise trust.",
        category_name: "Artificial Intelligence",
        author_name: "AI Systems",
        author_role: "Intelligence Engineering",
        featured: false,
        sort_order: 6,
        published_at: new Date("2026-07-15T09:00:00Z"),
        content_blocks: [
          {
            type: "paragraph",
            text: "Large Language Models are only as valuable as the context they possess. In an enterprise environment, raw LLMs without strict authorization boundaries present major security and data leakage risks.",
          },
          {
            type: "paragraph",
            text: "Context-aware enterprise AI strictly respects each user's RBAC permissions. When an employee asks for a project summary, the AI agent only queries records that the employee is authorized to view.",
          },
          {
            type: "paragraph",
            text: "Brandspyre AI integrates directly with our multi-tenant role-based data filters, ensuring executive financial metrics remain confidential while operational staff receive real-time answers for their active tasks.",
          },
        ] as ContentBlock[],
      },
    ];

    let createdPostsCount = 0;
    for (const post of initialBlogPosts) {
      const existing = await BlogPost.findOne({ slug: post.slug });
      if (!existing) {
        const categoryObj = categoryMap.get(post.category_name);
        const readTime = PublicContentService.calculateReadTime(post.content_blocks, post.excerpt);

        await BlogPost.create({
          slug: post.slug,
          title: post.title,
          subtitle: post.subtitle,
          excerpt: post.excerpt,
          category_id: categoryObj?._id,
          category_name: post.category_name,
          author_name: post.author_name,
          author_role: post.author_role,
          status: "published",
          published_at: post.published_at,
          read_time_minutes: readTime,
          featured: post.featured,
          sort_order: post.sort_order,
          content_blocks: post.content_blocks,
          seo: {
            meta_title: `${post.title} | Brandspyre Operations`,
            meta_description: post.excerpt,
            og_title: post.title,
            og_description: post.excerpt,
            keywords: [post.category_name, "Brandspyre", "Enterprise", "Operations"],
          },
          scope: "global",
          created_at: post.published_at,
          updated_at: post.published_at,
        });
        createdPostsCount++;
        console.log(`  + Seeded Blog Post: ${post.title}`);
      }
    }

    // =========================================================================
    // 3. SEED INITIAL CASE STUDIES / TESTIMONIALS
    // =========================================================================
    const initialCaseStudies = [
      {
        person_name: "Vikram Malhotra",
        person_role: "Operations Director",
        company_name: "Apex Retail & Logistics Ltd.",
        sector: "Multi-Store Retail & Distribution",
        industry: "Retail & Supply Chain",
        headline: "Connecting storefront POS checkouts with central warehouse inventory.",
        testimonial_quote:
          "Connecting our project milestones directly to client billing eliminated our month-end reconciliation delays. Our operations and finance teams now work from the exact same numbers.",
        challenge:
          "Store managers struggled with stock mismatches between physical store shelves and the central distribution center. Customers frequently experienced checkout delays due to manual inventory balance checks.",
        solution:
          "Deployed Brandspyre POS terminals across branch locations with real-time synchronization to central inventory. Low-stock triggers automatically draft purchase orders for approval.",
        outcome:
          "Eliminated store-to-warehouse stock discrepancies and enabled cashier staff to check branch inventory in real time.",
        modules_used: ["Retail Point of Sale", "Multi-Warehouse Inventory", "Purchase Orders"],
        featured: true,
        sort_order: 1,
        rating: 5,
        status: "published",
      },
      {
        person_name: "Sarah Jenkins",
        person_role: "Managing Principal",
        company_name: "Apex Engineering Consultants",
        sector: "Professional Engineering & Contracting",
        industry: "Engineering & Consulting",
        headline: "Linking milestone deliverables directly to commercial client billing.",
        testimonial_quote:
          "With Brandspyre, billing is no longer an adversarial month-end battle. Clients can see verified progress sign-offs alongside every invoice.",
        challenge:
          "Consultants logged hours on disconnected spreadsheets while project milestones were tracked in separate task software. Month-end billing took days of manual reconciliation between operations and finance.",
        solution:
          "Configured milestone deliverables with clear verification checkpoints. When milestone deliverables are signed off, client invoices and payment ledgers generate automatically.",
        outcome:
          "Month-end billing closure reduced from days to minutes with zero invoice discrepancy disputes.",
        modules_used: ["Projects & Milestones", "Timesheets", "Commercial Billing Engine"],
        featured: true,
        sort_order: 2,
        rating: 5,
        status: "published",
      },
      {
        person_name: "Rajesh Kulkarni",
        person_role: "Plant Head",
        company_name: "Precision Assemblies Group",
        sector: "Assembly & Manufacturing",
        industry: "Manufacturing & Industrial",
        headline: "Synchronizing Bills of Materials with shop-floor work orders.",
        testimonial_quote:
          "We have complete clarity on scrap factors, unit costs, and inventory allocations before jobs even start on the line.",
        challenge:
          "Engineering changes to product component specifications failed to reach assembly managers in time, leading to component shortages and assembly line stoppages.",
        solution:
          "Implemented digital multi-tier Bills of Materials linked to sales quotes. Confirmed orders automatically reserve raw materials and route work orders through sequential assembly stages.",
        outcome:
          "Real-time raw material traceability and complete visibility into actual unit production costs.",
        modules_used: ["Bill of Materials (BOM)", "Work Orders", "Raw Material Deduction"],
        featured: false,
        sort_order: 3,
        rating: 5,
        status: "published",
      },
    ];

    let createdTestimonialsCount = 0;
    for (const cs of initialCaseStudies) {
      const existing = await Testimonial.findOne({ headline: cs.headline });
      if (!existing) {
        await Testimonial.create({
          ...cs,
          published_at: new Date(),
          scope: "global",
          created_at: new Date(),
          updated_at: new Date(),
        });
        createdTestimonialsCount++;
        console.log(`  + Seeded Case Study / Testimonial: ${cs.headline}`);
      }
    }

    console.log(
      `✅ Public Website CMS data checked (${createdPostsCount} new posts, ${createdTestimonialsCount} new testimonials seeded).`
    );
  } catch (err: any) {
    console.error("❌ Error seeding public content data:", err);
  }
}

export default seedPublicContentData;
