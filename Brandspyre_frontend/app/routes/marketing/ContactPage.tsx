import React, { useState } from "react";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { notify } from "~/services/notificationService";
import { CTASection } from "../../components/public/CTASection";
import contactLoungeImg from "../../assets/contact_reception_lounge.jpg";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    primaryInterest: "all",
    message: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      notify.error("Please complete all required fields (Name, Work Email, and Message).");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate inquiry submission
      await new Promise((resolve) => setTimeout(resolve, 600));
      setIsSubmitted(true);
      notify.success("Inquiry received. A team member will respond within 24 business hours.");
    } catch (err) {
      notify.error("Failed to send inquiry. Please email support@brandspyre.com directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="font-sans text-slate-900 dark:text-slate-100 selection:bg-red-500 selection:text-white">
      {/* Header with High-End Advisory Lounge Background */}
      <section className="relative pt-18 pb-16 border-b border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950">
        {/* Advisory Lounge Background Environment */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
          <div
            className="w-full h-full bg-cover bg-top bg-no-repeat opacity-85 dark:opacity-25"
            style={{
              backgroundImage: `url(${contactLoungeImg})`,
              backgroundAttachment: "fixed",
            }}
          />
          {/* Luminous center mask for maximum typography readability */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 38%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.75) 52%, rgba(255, 255, 255, 0.15) 86%)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white dark:from-slate-950/70 dark:via-transparent dark:to-slate-950" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400">
            Contact Brandspyre
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            Let's talk.
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
            Tell us what you're trying to improve in your business operations.
          </p>
        </div>
      </section>

      {/* Main Content: Info & Form */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            {/* Left Column: Direct Inquiry Channels */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Direct Inquiries
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Connect directly with the right department, or submit the form and we'll route your request to a specialist.
                </p>
              </div>

              {/* Clean Channel List */}
              <div className="space-y-6 text-xs sm:text-sm">
                <div className="space-y-1 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white block">Enterprise Sales & Migration</span>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">For multi-branch quotes, pricing tiers, and legacy migration.</p>
                  <a href="mailto:sales@brandspyre.com" className="text-red-700 dark:text-red-400 font-semibold hover:underline inline-block pt-1">
                    sales@brandspyre.com
                  </a>
                </div>

                <div className="space-y-1 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white block">General Enquiries & Support</span>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">For technical help, questions, and workspace guidance.</p>
                  <a href="mailto:support@brandspyre.com" className="text-red-700 dark:text-red-400 font-semibold hover:underline inline-block pt-1">
                    support@brandspyre.com
                  </a>
                </div>

                <div className="space-y-1 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white block">Partnerships & Integrations</span>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">For solution consultants and ecosystem partners.</p>
                  <a href="mailto:partners@brandspyre.com" className="text-red-700 dark:text-red-400 font-semibold hover:underline inline-block pt-1">
                    partners@brandspyre.com
                  </a>
                </div>

                <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Response Commitment:</span>
                  <p>All inquiries receive a response within 1 business day.</p>
                </div>
              </div>
            </div>

            {/* Right Column: Contact Form */}
            <div className="lg:col-span-7">
              <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 sm:p-10 shadow-xs">
                {isSubmitted ? (
                  <div className="py-10 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Message Received
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Thank you, <span className="font-semibold text-slate-900 dark:text-white">{formData.name}</span>.
                      We have logged your request and will contact you via {formData.email} shortly.
                    </p>
                    <button
                      onClick={() => {
                        setIsSubmitted(false);
                        setFormData({
                          name: "",
                          email: "",
                          company: "",
                          phone: "",
                          primaryInterest: "all",
                          message: ""
                        });
                      }}
                      className="mt-2 text-xs font-semibold text-red-700 dark:text-red-400 hover:underline cursor-pointer"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Your name"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition"
                        />
                      </div>

                      {/* Work Email */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Work Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="you@company.com"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Company */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Company Name
                        </label>
                        <input
                          type="text"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          placeholder="Organization name"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition"
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+91"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition"
                        />
                      </div>
                    </div>

                    {/* Area of Interest */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Primary Area of Interest
                      </label>
                      <select
                        name="primaryInterest"
                        value={formData.primaryInterest}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition"
                      >
                        <option value="all">Full Unified Platform</option>
                        <option value="crm">CRM & Sales Pipelines</option>
                        <option value="operations">Projects & Milestone Delivery</option>
                        <option value="pos">Retail Point of Sale & Multi-Branch</option>
                        <option value="manufacturing">Manufacturing, BOM & Work Orders</option>
                        <option value="hrms">Workforce Management & Payroll</option>
                        <option value="billing">Commercial Billing & Contracts</option>
                      </select>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        How can we help your operations? *
                      </label>
                      <textarea
                        name="message"
                        required
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us about your current tool challenges or specific modules you are evaluating..."
                        className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition"
                      ></textarea>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-xs text-white bg-red-700 hover:bg-red-800 transition shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <span>Sending message...</span>
                        ) : (
                          <>
                            <span>Send message</span>
                            <ArrowRight size={13} />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <CTASection />
    </div>
  );
}
