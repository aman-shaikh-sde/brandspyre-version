import React, { useState, useMemo } from "react";
import { Link } from "react-router";
import {
  ShieldCheck,
  Lock,
  Server,
  FileText,
  Users,
  CreditCard,
  Database,
  Sparkles,
  Share2,
  Search,
  Printer,
  ChevronRight,
  Mail,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Globe,
  Sliders,
  HelpCircle,
  Copy,
  Check,
  KeyRound,
  FileCheck2,
  Cpu,
  Layers,
  PhoneCall,
  UserCheck
} from "lucide-react";
import { CTASection } from "../../components/public/CTASection";
import pricingBoardroomImg from "../../assets/pricing_boardroom_bg.jpg";

interface PolicySection {
  id: string;
  category: "overview" | "collection" | "meta" | "security" | "rights" | "compliance";
  title: string;
  subtitle: string;
  icon: React.ElementType;
  readTime: string;
  content: React.ReactNode;
}

export default function PrivacyPolicyPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeSectionId, setActiveSectionId] = useState<string>("section-1");
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const lastUpdatedDate = "September 24, 2026";
  const versionString = "v2.4 (Enterprise Multi-Tenant Release)";

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = (sectionId: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${sectionId}`;
    navigator.clipboard.writeText(url);
    setCopiedSectionId(sectionId);
    setTimeout(() => setCopiedSectionId(null), 2000);
  };

  const sections: PolicySection[] = [
    {
      id: "section-1",
      category: "overview",
      title: "1. Introduction & Operational Scope",
      subtitle: "Roles under global privacy frameworks and architecture boundaries",
      icon: ShieldCheck,
      readTime: "3 min read",
      content: (
        <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          <p>
            Welcome to <strong>BRANDSPYRE</strong> (&ldquo;BrandSpyre&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;).
            BrandSpyre operates a unified cloud enterprise resource planning (ERP) and customer relationship management (CRM) software platform,
            encompassing sales pipelines, human resource management (HRMS), project collaboration, point-of-sale (POS), billing, and inter-organizational commerce networks.
          </p>
          <p>
            This Privacy Policy establishes how we collect, store, process, transfer, and protect personal and proprietary business data across our web application (accessible via our primary domains and subdomains), APIs, background worker daemons, and connected third-party integrations.
          </p>

          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
              <Building2 className="text-red-600 dark:text-red-400" size={18} />
              Our Legal Roles under Data Protection Regulations (GDPR & Indian DPDP Act 2023)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="p-3.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white block mb-1 text-xs uppercase tracking-wider text-red-600 dark:text-red-400">
                  BrandSpyre as Data Processor / Service Provider
                </span>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-normal">
                  When your company (&ldquo;Tenant Organization&rdquo;) registers an account and uses our CRM, HRMS, employee roster, project files, or client billing tools, your organization acts as the <strong>Data Controller / Data Fiduciary</strong>. BrandSpyre processes that data strictly on your instruction and under the terms of our Master Services Agreement.
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white block mb-1 text-xs uppercase tracking-wider text-red-600 dark:text-red-400">
                  BrandSpyre as Data Controller / Data Fiduciary
                </span>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-normal">
                  BrandSpyre acts as the <strong>Data Controller</strong> exclusively for information collected directly from prospective customers, platform tenant administrators (account signup, billing credentials, subscription management), and public marketing website visitors.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "section-2",
      category: "security",
      title: "2. Zero-Trust Multi-Tenancy & Data Isolation",
      subtitle: "Logical and cryptographic separation of organization assets",
      icon: Layers,
      readTime: "3 min read",
      content: (
        <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          <p>
            BrandSpyre is architected from the ground up on strict <strong>Zero-Trust Multi-Tenancy</strong> principles. We understand that your customer leads, employee payroll numbers, trade pricing, and intellectual work products must remain confidential from all other organizations using BrandSpyre.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Lock className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={18} />
              <div>
                <h5 className="font-semibold text-slate-900 dark:text-white text-sm">Tenant Isolation Enforcement</h5>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  Every inbound request across all API endpoints requires a validated cryptographic session context (<code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">securityContext.tenantId</code>). Query engines programmatically inject tenant parameters to ensure cross-tenant data traversal is structurally impossible.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <KeyRound className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={18} />
              <div>
                <h5 className="font-semibold text-slate-900 dark:text-white text-sm">Granular Branch & Role Isolation (RBAC / PBAC)</h5>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  Within an organization, branch codes and user permission matrices restrict internal access. Users assigned to a designated branch or department cannot query or inspect other branch records without explicit administrator authorization.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Server className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={18} />
              <div>
                <h5 className="font-semibold text-slate-900 dark:text-white text-sm">IDOR (Insecure Direct Object Reference) Protection</h5>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  All object identifiers for invoices, documents, employee profiles, and payment requests are checked against the calling tenant&rsquo;s scope. Access attempts outside valid tenant boundaries are rejected and logged in immutable security audit trails.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "section-3",
      category: "collection",
      title: "3. Categories of Information We Collect",
      subtitle: "Comprehensive breakdown of user, operational, and financial data",
      icon: Database,
      readTime: "5 min read",
      content: (
        <div className="space-y-5 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          <p>
            Depending on your subscription tier, enabled modules, and organizational role, BrandSpyre collects and processes the following categories of information:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Account & Identity */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm">
                <UserCheck size={16} className="text-red-600 dark:text-red-400" />
                <span>Account & Credentials</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                Full name, business email address, phone number, designated company role, and salted bcrypt cryptographic password hashes. We never store or transmit plaintext passwords.
              </p>
            </div>

            {/* HRMS & Workforce */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm">
                <Users size={16} className="text-red-600 dark:text-red-400" />
                <span>HRMS & Employee Records</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                Designations, departments, joining dates, salary compensation structures, generated payslips, leave balances, clock-in/attendance timestamps, and emergency contact details supplied by your HR team.
              </p>
            </div>

            {/* CRM & Client Database */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm">
                <Share2 size={16} className="text-red-600 dark:text-red-400" />
                <span>CRM & Customer Inquiries</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                Prospect names, corporate emails, phone numbers, deal stages, client interaction histories, minutes of meetings (MOM), call summaries, and project scope notes.
              </p>
            </div>

            {/* Financials & Invoices */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm">
                <CreditCard size={16} className="text-red-600 dark:text-red-400" />
                <span>Invoicing, GST & Tax Data</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                Billing address, GSTIN, PAN, TDS/TCS rates, payment requests, and itemized invoices. Payment transactions are executed via PCI-DSS Level 1 certified gateways; BrandSpyre does not store complete card numbers or CVVs.
              </p>
            </div>

            {/* Project Documents & File Uploads */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm">
                <FileText size={16} className="text-red-600 dark:text-red-400" />
                <span>Documents & Deliverables</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                Client brief documents, draft deliverables, signed PDF contracts, design schematics, offer letters, and experience certificates uploaded directly by authorized team members.
              </p>
            </div>

            {/* Device & System Logs */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm">
                <Cpu size={16} className="text-red-600 dark:text-red-400" />
                <span>Device Telemetry & Logs</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                IP addresses, browser client fingerprints, access timestamps, HTTP referrer, rate-limiting counters, and immutable administrative audit logs recorded for compliance and threat mitigation.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "section-4",
      category: "meta",
      title: "4. Meta / Facebook Graph API & Lead Ads Integration",
      subtitle: "Specialized disclosures pursuant to Meta Platform Terms & Developer Policies",
      icon: Globe,
      readTime: "4 min read",
      content: (
        <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 space-y-2">
            <span className="font-bold text-red-700 dark:text-red-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={16} /> Meta Developer Compliance Disclosure
            </span>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              BrandSpyre provides a multi-tenant OAuth and Webhook integration with the <strong>Meta Graph API</strong> (including Facebook Lead Ads). If your organization connects its Facebook Business Pages to BrandSpyre, the following specific terms govern all data received through Meta platforms:
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <h5 className="font-bold text-slate-900 dark:text-white text-sm">How Meta Lead Data is Ingested and Processed:</h5>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 list-disc list-inside">
              <li>
                <strong>Tenant-Controlled OAuth:</strong> When your organization connects a Facebook Page, OAuth access tokens are generated specifically for your workspace and stored in encrypted form using AES-256 in your tenant partition.
              </li>
              <li>
                <strong>Cryptographic Webhook Verification:</strong> Inbound Meta lead notifications are validated against your tenant&rsquo;s SHA-256 HMAC signature. Unsigned or mismatched payloads are instantly discarded.
              </li>
              <li>
                <strong>Lead Data Scope:</strong> We only fetch form response fields configured by your marketing team on Meta (e.g., prospect name, phone number, email address, campaign ID, form ID).
              </li>
              <li>
                <strong>Strict Tenant Partitioning:</strong> Meta lead data received for Organization A is never visible, accessible, or shared with Organization B or any other tenant on BrandSpyre.
              </li>
              <li>
                <strong>No Data Reselling or External Profiling:</strong> BrandSpyre strictly prohibits using Meta lead data for cross-tenant algorithmic profiling, commercial reselling, or unauthorized third-party marketing.
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h5 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm mb-1">
              User Data Deletion Callback & Policy
            </h5>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              In accordance with Meta Platform Terms Section 4.b, individuals who submitted personal information through a Facebook Lead Ad connected to BrandSpyre can request immediate deletion at any time. Detailed instructions are provided in Section 13 below.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "section-5",
      category: "overview",
      title: "5. Inter-Organization Lead Exchange & Referral Marketplace",
      subtitle: "Rules governing optional cross-tenant commercial collaborations",
      icon: Share2,
      readTime: "3 min read",
      content: (
        <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          <p>
            BrandSpyre includes an optional B2B <strong>Lead Exchange</strong> and <strong>Referral Marketplace</strong> module that enables verified organizations to collaborate, exchange qualified business opportunities, and settle referral commissions.
          </p>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h5 className="font-semibold text-slate-900 dark:text-white text-sm">
              Strict Rules Governing the Lead Exchange:
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">Explicit Mutual Consent</span>
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  Leads are never shared automatically. Lead transfer requires affirmative, manual action by an authorized user of the originating tenant and an established commercial relationship.
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">Immutable Audit Trails</span>
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  Every shared lead event records a tamper-resistant timestamp, sending user ID, originating tenant, recipient tenant ID, and accepted commission agreement in the settlement ledger.
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">End-User Notice Compliance</span>
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  Organizations participating in the exchange warrant that they have provided adequate notice and obtained valid legal consent from prospects prior to referring their information to partner organizations.
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">Immediate Revocation Capability</span>
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  A tenant may sever an inter-organizational relationship at any time, terminating future data sharing pipelines immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "section-6",
      category: "compliance",
      title: "6. Legal Bases for Processing (GDPR & Indian DPDP Act)",
      subtitle: "Statutory justifications under modern data governance laws",
      icon: FileCheck2,
      readTime: "3 min read",
      content: (
        <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          <p>
            Under Article 6 of the General Data Protection Regulation (GDPR) and the Digital Personal Data Protection Act 2023 (DPDP Act, India), BrandSpyre processes personal data only where a legitimate legal basis exists:
          </p>

          <div className="space-y-2.5">
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-white text-sm block">1. Contractual Necessity (Art. 6(1)(b) GDPR)</span>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                To create tenant workspaces, authenticate staff, generate customer invoices, process salary slips, and render the core software modules requested under your active subscription.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-white text-sm block">2. Statutory & Legal Obligations (Art. 6(1)(c) GDPR)</span>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                To retain tax invoices, compute GST and TDS/TCS records, comply with mandatory accounting and corporate audit standards, and respond to lawful subpoenas or court directives.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-white text-sm block">3. Legitimate Interests (Art. 6(1)(f) GDPR)</span>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                To enforce rate-limiting against automated brute-force attacks, monitor system latency, ensure tenant isolation, and safeguard platform infrastructure against malicious intrusions.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-white text-sm block">4. Explicit Consent (Art. 6(1)(a) GDPR & Sec. 6 DPDP Act)</span>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                For non-essential marketing newsletters, third-party marketplace referrals, and optional pilot feature participation. Consent may be withdrawn at any time.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "section-7",
      category: "compliance",
      title: "7. Third-Party Sub-Processors & Infrastructure Providers",
      subtitle: "Verified service partners assisting in platform delivery",
      icon: Server,
      readTime: "3 min read",
      content: (
        <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          <p>
            BrandSpyre engages vetted, SOC 2 and ISO 27001-certified third-party sub-processors to furnish underlying hosting, networking, payment processing, and messaging infrastructure. All sub-processors are bound by strict Data Processing Agreements (DPAs):
          </p>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Sub-Processor</th>
                  <th className="py-3 px-4">Purpose / Service</th>
                  <th className="py-3 px-4">Data Transferred</th>
                  <th className="py-3 px-4">Location / Certification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-600 dark:text-slate-400">
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">Razorpay Software Pvt Ltd</td>
                  <td className="py-3 px-4">Payment gateway & subscription processing (India)</td>
                  <td className="py-3 px-4">Transaction amounts, invoice ID, billing name/email</td>
                  <td className="py-3 px-4">India / PCI-DSS Level 1</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">Stripe, Inc.</td>
                  <td className="py-3 px-4">International payment processing & card vault</td>
                  <td className="py-3 px-4">Payment tokens, billing address, currency</td>
                  <td className="py-3 px-4">USA / PCI-DSS Level 1</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">Meta Platforms, Inc.</td>
                  <td className="py-3 px-4">Lead Ads integration & Webhooks via Graph API</td>
                  <td className="py-3 px-4">Form leads (name, email, phone) upon user configuration</td>
                  <td className="py-3 px-4">USA / Meta Platform Terms</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">Cloud Hosting & Database Clusters</td>
                  <td className="py-3 px-4">Encrypted database storage, Docker runtime & API clusters</td>
                  <td className="py-3 px-4">Encrypted multi-tenant records, database snapshots</td>
                  <td className="py-3 px-4">Secure Data Centers / SOC 2 Type II</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">Transactional SMTP Providers</td>
                  <td className="py-3 px-4">Password resets, onboarding verification, invoice alerts</td>
                  <td className="py-3 px-4">Recipient email address, system notification payload</td>
                  <td className="py-3 px-4">Global / TLS 1.3 encrypted</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
    {
      id: "section-8",
      category: "security",
      title: "8. Technical Security Safeguards & Encryption Standards",
      subtitle: "Bank-grade defenses protecting systems, databases, and networks",
      icon: Lock,
      readTime: "4 min read",
      content: (
        <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          <p>
            We implement comprehensive organizational and technical security controls designed to prevent accidental or unlawful destruction, loss, alteration, unauthorized disclosure, or access to your data:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Lock className="text-red-600 dark:text-red-400" size={16} />
                Encryption in Transit & at Rest
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                All communications between client browsers and BrandSpyre servers mandate <strong>TLS 1.3 / HTTPS</strong> with high-grade ciphers. Database volumes, backups, and sensitive credentials (including OAuth tokens and integration secrets) are encrypted at rest using <strong>AES-256</strong>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <KeyRound className="text-red-600 dark:text-red-400" size={16} />
                Bcrypt Password Cryptography
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                User passwords are processed through salted <strong>bcrypt</strong> key derivation functions. We never store reversible passwords. Password reset tokens are short-lived (15–60 minutes) and single-use only.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Sliders className="text-red-600 dark:text-red-400" size={16} />
                Adaptive Rate Limiting & DoS Defense
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                Strict request limiters protect authentication endpoints (maximum 10 attempts per 15 minutes), password reset endpoints (5 attempts per hour), and file upload gateways to thwart automated dictionary and brute-force attacks.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <FileCheck2 className="text-red-600 dark:text-red-400" size={16} />
                Continuous Audit Logging
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                Every critical administrative operation (such as role modifications, branch deactivations, billing alterations, and document deletions) is permanently recorded in tenant audit logs with actor identity, timestamp, and source IP.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "section-9",
      category: "overview",
      title: "9. AI Assistant & Dynamic Engine Privacy",
      subtitle: "Zero-training guarantee for proprietary business context and prompts",
      icon: Sparkles,
      readTime: "3 min read",
      content: (
        <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          <p>
            BrandSpyre incorporates intelligent AI Copilot services to assist team members with task generation, lead summarization, report analysis, and meeting synthesis:
          </p>

          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h5 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Sparkles className="text-red-600 dark:text-red-400" size={18} />
              Our Core AI Privacy Commitments:
            </h5>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 list-disc list-inside">
              <li>
                <strong>No Public Model Training:</strong> Your business records, project documents, employee names, and proprietary client proposals are <em>never</em> used to train, retrain, or improve public AI foundation models.
              </li>
              <li>
                <strong>Context Scoped to Session:</strong> Prompts sent to AI microservices only receive runtime context authorized for the requesting user&rsquo;s tenant and branch.
              </li>
              <li>
                <strong>Tenant-Controlled Activation:</strong> Tenant administrators maintain full administrative power to disable AI modules across their workspace at any time via Settings &gt; Module Settings.
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "section-10",
      category: "overview",
      title: "10. Data Retention, Backups & Deletion Lifecycles",
      subtitle: "Policies governing active data, disaster recovery, and account termination",
      icon: Clock,
      readTime: "3 min read",
      content: (
        <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          <p>
            We retain your data for the duration of your active subscription and as required to fulfill statutory tax and legal recordkeeping duties:
          </p>

          <div className="space-y-3">
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-white text-sm block">Active Subscription Period</span>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Data is preserved in real time across active database partitions and encrypted volume storage to support continuous platform functionality.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-white text-sm block">Account Cancellation & 30-Day Export Grace Window</span>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Upon cancellation or non-renewal of an organization subscription, account data enters a 30-day grace period during which tenant administrators may export complete records (invoices, reports, employee registers). After 30 days, tenant databases are scheduled for permanent, irreversible cryptographic wiping.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-white text-sm block">Backup Snapshots & Disaster Recovery Cycles</span>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Automated encrypted database backups are taken on daily and weekly rotations strictly for disaster recovery and operational continuity (as documented in our Disaster Recovery Protocol). Backup snapshots expire and overwrite automatically after 30 to 90 days.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-white text-sm block">Statutory Financial Record Retention</span>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Invoices, payment logs, and tax computations (GST/TDS) are retained for up to 7 years to satisfy mandatory commercial statutory obligations under applicable financial regulations.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "section-11",
      category: "rights",
      title: "11. Your Privacy Rights & Data Subject Access (DSAR)",
      subtitle: "Universal rights granted under GDPR, DPDP Act, and international standards",
      icon: UserCheck,
      readTime: "4 min read",
      content: (
        <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          <p>
            Depending on your jurisdiction, you enjoy specific legal entitlements regarding the personal information maintained by BrandSpyre:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-bold text-slate-900 dark:text-white">Right of Access</span>
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                Request a copy of the personal information we process concerning your account.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-bold text-slate-900 dark:text-white">Right of Rectification</span>
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                Correct inaccurate, outdated, or incomplete personal data via Workspace Settings or official support channels.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-bold text-slate-900 dark:text-white">Right to Erasure (&ldquo;Right to be Forgotten&rdquo;)</span>
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                Request permanent deletion of your personal records, subject to statutory retention obligations.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-bold text-slate-900 dark:text-white">Right to Data Portability</span>
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                Export and obtain customer lists, timesheets, and financial logs in machine-readable formats (CSV, XLSX, PDF).
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-bold text-slate-900 dark:text-white">Right to Restrict Processing</span>
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                Request suspension of automated processing while accuracy or legitimate interest disputes are evaluated.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-bold text-slate-900 dark:text-white">Right to Withdraw Consent</span>
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                Revoke previously granted permissions for marketing notifications or optional feature integrations at any time.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm">
            <h5 className="font-bold text-slate-900 dark:text-white mb-1">
              How to Submit a Data Subject Request:
            </h5>
            <p className="text-slate-600 dark:text-slate-400">
              To exercise any of these rights, email our Data Protection Team at{" "}
              <a href="mailto:privacy@brandspyre.com" className="text-red-600 dark:text-red-400 font-semibold hover:underline">
                privacy@brandspyre.com
              </a>
              . We will verify your identity and respond within thirty (30) days without undue charge.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "section-12",
      category: "meta",
      title: "12. Facebook / Meta User Data Deletion Instructions",
      subtitle: "Explicit procedure for Facebook Lead Ads respondents per Meta Platform Terms",
      icon: Globe,
      readTime: "3 min read",
      content: (
        <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          <p>
            Pursuant to the <strong>Meta Platform Developer Policy</strong>, BrandSpyre provides this dedicated, publicly accessible instruction set for any individual who submitted a lead form on Facebook or Instagram connected to an organization using BrandSpyre:
          </p>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h5 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
              Option A: Delete Data Directly via Your Facebook Account
            </h5>
            <ol className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 list-decimal list-inside leading-relaxed">
              <li>Log into your <strong>Facebook Account</strong>.</li>
              <li>Navigate to <strong>Settings &amp; Privacy &gt; Settings</strong>.</li>
              <li>In the left sidebar, click on <strong>Apps and Websites</strong>.</li>
              <li>Find the relevant business app or <strong>BrandSpyre Integration</strong>.</li>
              <li>Click the <strong>Remove</strong> button.</li>
              <li>Check the box requesting Facebook to notify the developer to delete your activities and data, then click <strong>Done</strong>.</li>
            </ol>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h5 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
              Option B: Direct BrandSpyre Lead Deletion Request
            </h5>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              If you wish to remove your lead record from our servers directly:
            </p>
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm space-y-2">
              <p>
                Send an email with the subject line <strong>&ldquo;Meta Data Deletion Request&rdquo;</strong> to{" "}
                <a href="mailto:privacy@brandspyre.com" className="text-red-600 dark:text-red-400 font-semibold hover:underline">
                  privacy@brandspyre.com
                </a>
                .
              </p>
              <p className="text-slate-500 text-xs">
                Please specify: (1) Your full name, (2) The email address or phone number submitted on the Facebook Lead form, and (3) The name of the business page or ad campaign (if known).
              </p>
              <div className="flex items-center gap-2 pt-1 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                <CheckCircle2 size={16} />
                <span>Our team will locate and scrub the lead record within 48 business hours and issue an official deletion confirmation code.</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "section-13",
      category: "overview",
      title: "13. Cookies, Session State & Local Storage Policy",
      subtitle: "How we utilize necessary session tokens and interface preference keys",
      icon: Sliders,
      readTime: "3 min read",
      content: (
        <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          <p>
            BrandSpyre uses first-party cookies and modern browser storage technologies strictly to ensure functional platform operation and secure authentication:
          </p>

          <div className="space-y-2.5">
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-white text-sm block">Strictly Necessary Authentication Tokens</span>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Cryptographically signed JSON Web Tokens (JWT) stored in HTTP-only, SameSite secure cookie containers to maintain your authenticated session and verify tenant identity.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-white text-sm block">Functional Preferences & UI State</span>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Local storage items that remember your selected workspace context, dark/light display mode, sidebar collapsed state, and filter preferences.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-white text-sm block">No Third-Party Cross-Site Ad Tracking on Workspaces</span>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                We do not sell advertising space within your authenticated tenant workspaces, nor do we deploy third-party behavioral advertising trackers across our CRM or HRMS dashboards.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "section-14",
      category: "compliance",
      title: "14. International Transfers & Cross-Border Processing",
      subtitle: "Safeguards governing distributed cloud compute and multi-region routing",
      icon: Globe,
      readTime: "2 min read",
      content: (
        <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          <p>
            As a global cloud platform, BrandSpyre may store or process operational data in secure, certified data center facilities located across India, the United States, and European jurisdictions.
          </p>
          <p>
            Whenever personal data is transferred across international borders, BrandSpyre ensures that appropriate transfer mechanisms are in effect, including:
          </p>
          <ul className="space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li>Standard Contractual Clauses (SCCs) approved by the European Commission.</li>
            <li>Adherence to the cross-border data transfer directives under the Digital Personal Data Protection Act (DPDP Act, India).</li>
            <li>Mandatory end-to-end TLS 1.3 cryptographic protection during transit.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "section-15",
      category: "compliance",
      title: "15. Grievance Redressal, DPO & Contact Information",
      subtitle: "Designated Data Protection Officer and official dispute resolution channel",
      icon: Mail,
      readTime: "2 min read",
      content: (
        <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          <p>
            In compliance with the Information Technology Act 2000, the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules 2021, and the DPDP Act 2023, BrandSpyre has appointed a designated <strong>Grievance &amp; Data Protection Officer</strong>:
          </p>

          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h5 className="font-bold text-slate-900 dark:text-white text-base">
              Office of the Data Protection &amp; Grievance Redressal Officer
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block text-xs">Designation:</span>
                <span className="font-semibold text-slate-900 dark:text-white">Chief Information Security Officer &amp; Data Protection Officer</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block text-xs">Direct Privacy Inquiries:</span>
                <a href="mailto:privacy@brandspyre.com" className="font-semibold text-red-600 dark:text-red-400 hover:underline">
                  privacy@brandspyre.com
                </a>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block text-xs">General Support Desk:</span>
                <a href="mailto:support@brandspyre.com" className="font-semibold text-slate-800 dark:text-slate-200 hover:underline">
                  support@brandspyre.com
                </a>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block text-xs">Official Grievance SLA:</span>
                <span className="font-semibold text-slate-900 dark:text-white">Response acknowledged within 24 to 48 business hours</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            For security vulnerability disclosures or critical infrastructure reports, please reach out directly with cryptographic details to{" "}
            <a href="mailto:security@brandspyre.com" className="text-red-600 dark:text-red-400 font-semibold hover:underline">
              security@brandspyre.com
            </a>
            .
          </p>
        </div>
      ),
    },
  ];

  // Filtering sections based on search query and category
  const filteredSections = useMemo(() => {
    return sections.filter((sec) => {
      const matchesCategory = activeCategory === "all" || sec.category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sec.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [sections, activeCategory, searchQuery]);

  const faqs = [
    {
      q: "Can another company using BrandSpyre see our customer leads or payroll records?",
      a: "No. BrandSpyre enforces strict Zero-Trust Multi-Tenancy. All database queries programmatically require a verified tenant ID. Your organization's records are logically and cryptographically partitioned and cannot be viewed by other tenants.",
    },
    {
      q: "How does BrandSpyre handle Meta / Facebook Lead Ads data?",
      a: "When you link Facebook Lead Ads, inbound leads flow via signed webhooks directly into your private CRM pipeline. The data is never shared with third parties or other tenants, and individuals can request data deletion at any time.",
    },
    {
      q: "Do you train global AI models on our proprietary business data?",
      a: "Never. BrandSpyre's AI Assistant operates with a strict zero-training policy. Prompts, invoices, employee records, and project files are never used to train or adjust public AI models.",
    },
    {
      q: "How do I request complete deletion of my data upon canceling my account?",
      a: "Upon cancellation, you have a 30-day grace period to export your documents and records. After 30 days, tenant databases and stored assets are scheduled for permanent cryptographic purge, except where tax and legal audit laws mandate retention.",
    },
  ];

  return (
    <div className="font-sans text-slate-900 dark:text-slate-100 selection:bg-red-500 selection:text-white">
      {/* Print-specific style rules */}
      <style>{`
        @media print {
          nav, footer, .no-print, header, .cta-section {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .print-full {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-block {
            break-inside: avoid;
            page-break-inside: avoid;
            border-bottom: 1px solid #ddd;
            padding-bottom: 1.5rem;
            margin-bottom: 1.5rem;
          }
        }
      `}</style>

      {/* Hero Header Section */}
      <section className="relative pt-20 pb-14 border-b border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950">
        {/* Subtle luminous ambient background */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat opacity-40 dark:opacity-15"
            style={{
              backgroundImage: `url(${pricingBoardroomImg})`,
              backgroundAttachment: "fixed",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 75% 65% at 50% 35%, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.8) 55%, rgba(255, 255, 255, 0.3) 100%)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-transparent to-white dark:from-slate-950/80 dark:via-transparent dark:to-slate-950" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Link to="/" className="hover:text-slate-900 dark:hover:text-white transition">
              Home
            </Link>
            <ChevronRight size={12} />
            <span className="text-slate-900 dark:text-white font-medium">Privacy Policy</span>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs font-semibold tracking-wide uppercase">
              <ShieldCheck size={14} />
              <span>Legal, Security &amp; Data Protection Charter</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              BrandSpyre Privacy Policy
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              How we protect, isolate, and responsibly process your organization&rsquo;s workforce records, sales leads, financial ledgers, and client deliverables across our multi-tenant cloud platform.
            </p>
          </div>

          {/* Quick Metadata Bar */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Clock size={14} className="text-red-600 dark:text-red-400" />
                Last Updated: {lastUpdatedDate}
              </span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
              <span className="font-mono text-slate-500 dark:text-slate-400">
                {versionString}
              </span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 size={14} />
                GDPR &amp; DPDP Act (India) Compliant
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 no-print">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-medium transition cursor-pointer"
                title="Print or Save as PDF"
              >
                <Printer size={14} />
                <span>Print / Save PDF</span>
              </button>
              <a
                href="mailto:privacy@brandspyre.com"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition"
              >
                <Mail size={14} />
                <span>Contact DPO</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Core Principles Cards (Executive Summary) */}
      <section className="py-10 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400 mb-4">
            Executive Summary: 4 Core Pillars of BrandSpyre Trust
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                <Layers size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Zero-Trust Multi-Tenancy
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Tenant data is strictly isolated by <code className="text-[11px] bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded">tenantId</code> and branch matrices. No cross-organization leakage.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                No Data Reselling
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                We never monetize or sell customer leads, staff lists, or client databases. Inter-tenant referrals happen solely via affirmative mutual consent.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                <Lock size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Bank-Grade Encryption
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                TLS 1.3 encryption in transit, AES-256 token and storage encryption at rest, and salted bcrypt password hashing for all user accounts.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                <Globe size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Meta Platform Compliance
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Direct Meta Graph API integration with signed webhooks, encrypted OAuth credentials, and automated User Data Deletion Request procedures.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area with Sticky Sidebar */}
      <section className="py-14 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left Column: Interactive Search & Sticky Table of Contents */}
            <aside className="lg:col-span-4 space-y-6 no-print">
              <div className="sticky top-24 space-y-6">
                {/* Search Bar */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search policy clauses (e.g., Meta, Salary, Cookies, Purge)..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Category Filters */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Filter by Subject
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: "all", label: "All Clauses" },
                      { id: "overview", label: "Overview & Scope" },
                      { id: "collection", label: "Data Collection" },
                      { id: "meta", label: "Meta / Ads" },
                      { id: "security", label: "Security" },
                      { id: "rights", label: "Your Rights" },
                      { id: "compliance", label: "Compliance & DPO" },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                          activeCategory === cat.id
                            ? "bg-red-600 text-white shadow-xs"
                            : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table of Contents Navigation List */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Table of Contents
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {filteredSections.length} sections
                    </span>
                  </div>

                  <nav className="max-h-[380px] overflow-y-auto pr-1 space-y-1 scrollbar">
                    {filteredSections.map((sec) => {
                      const Icon = sec.icon;
                      const isActive = activeSectionId === sec.id;
                      return (
                        <a
                          key={sec.id}
                          href={`#${sec.id}`}
                          onClick={() => setActiveSectionId(sec.id)}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition group ${
                            isActive
                              ? "bg-white dark:bg-slate-950 font-semibold text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-800 shadow-2xs"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Icon size={14} className="shrink-0 text-slate-400 group-hover:text-red-500" />
                            <span className="truncate">{sec.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono ml-2">
                            {sec.readTime.split(" ")[0]}m
                          </span>
                        </a>
                      );
                    })}
                  </nav>

                  {/* Fast Action Links */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <a
                      href="#section-12"
                      className="flex items-center justify-between text-xs text-red-600 dark:text-red-400 font-semibold hover:underline"
                    >
                      <span>Meta Lead Data Deletion</span>
                      <ChevronRight size={14} />
                    </a>
                    <a
                      href="#section-15"
                      className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      <span>Grievance Officer Contact</span>
                      <ChevronRight size={14} />
                    </a>
                  </div>
                </div>

                {/* Need Help Card */}
                <div className="p-4 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">
                    <HelpCircle size={15} />
                    <span>Privacy Questions?</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                    Have specific compliance inquiries or need an enterprise DPA signed? Our legal team is available.
                  </p>
                  <a
                    href="mailto:privacy@brandspyre.com"
                    className="inline-block pt-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
                  >
                    Email privacy@brandspyre.com &rarr;
                  </a>
                </div>
              </div>
            </aside>

            {/* Right Column: Policy Clauses */}
            <main className="lg:col-span-8 space-y-12 print-full">
              {filteredSections.length === 0 ? (
                <div className="text-center py-16 p-8 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <AlertTriangle size={32} className="mx-auto text-amber-500" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    No matching clauses found
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                    We couldn&rsquo;t find any policy sections matching &ldquo;{searchQuery}&rdquo;. Try another keyword or clear your filter.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setActiveCategory("all");
                    }}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition"
                  >
                    Reset Search &amp; Filters
                  </button>
                </div>
              ) : (
                filteredSections.map((sec) => {
                  const Icon = sec.icon;
                  return (
                    <article
                      key={sec.id}
                      id={sec.id}
                      className="scroll-mt-24 pb-10 border-b border-slate-200 dark:border-slate-800 last:border-0 print-block space-y-5"
                    >
                      {/* Section Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                              <Icon size={16} />
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                              {sec.category.toUpperCase()}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                            <span className="text-xs text-slate-400">{sec.readTime}</span>
                          </div>
                          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {sec.title}
                          </h2>
                          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            {sec.subtitle}
                          </p>
                        </div>

                        {/* Copy Section Anchor Link Button */}
                        <div className="no-print self-start sm:self-center">
                          <button
                            onClick={() => handleCopyLink(sec.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Copy link to this section"
                          >
                            {copiedSectionId === sec.id ? (
                              <>
                                <Check size={13} className="text-emerald-500" />
                                <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} />
                                <span>Share clause</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Section Body */}
                      <div className="pt-2">{sec.content}</div>
                    </article>
                  );
                })
              )}

              {/* Frequently Asked Privacy Questions Section */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6 no-print">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                    Quick Clarifications
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Frequently Asked Privacy Questions
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Common questions regarding data governance, multi-tenancy, and compliance.
                  </p>
                </div>

                <div className="space-y-3">
                  {faqs.map((faq, idx) => {
                    const isExpanded = expandedFaq === idx;
                    return (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 overflow-hidden"
                      >
                        <button
                          onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                          className="w-full flex items-center justify-between p-4 text-left font-semibold text-xs sm:text-sm text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
                        >
                          <span>{faq.q}</span>
                          <ChevronRight
                            size={16}
                            className={`transform transition-transform text-slate-400 ${
                              isExpanded ? "rotate-90 text-red-500" : ""
                            }`}
                          />
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-200/60 dark:border-slate-800/60">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Policy Signature & Version Assurance */}
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      Official Corporate Policy Document
                    </h4>
                    <p className="text-xs text-slate-500">
                      Governed by BRANDSPYRE Information Security &amp; Legal Compliance Directorate.
                    </p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed">
                  By creating a tenant account, accessing the BrandSpyre dashboard, or integrating your Meta / payment assets, you acknowledge that you have reviewed, understood, and agreed to the practices outlined in this Privacy Policy.
                </p>
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                  <span>Document ID: BSP-SEC-POL-2026-V2</span>
                  <span>Effective Date: {lastUpdatedDate}</span>
                </div>
              </div>
            </main>
          </div>
        </div>
      </section>

      {/* Public Call To Action Banner */}
      <div className="no-print">
        <CTASection />
      </div>
    </div>
  );
}
