import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // 🌐 BRANDSPYRE Public Marketing Website (PublicNavbar, PublicFooter)
  {
    file: "routes/marketing/PublicLayout.tsx",
    children: [
      index("routes/RootDispatcher.tsx"),
      route("/features", "routes/marketing/FeaturesPage.tsx"),
      route("/solutions", "routes/marketing/SolutionsPage.tsx"),
      route("/pricing", "routes/PricingPage.tsx"),
      route("/about", "routes/marketing/AboutPage.tsx"),
      route("/testimonials", "routes/marketing/TestimonialsPage.tsx"),
      route("/blog", "routes/marketing/BlogPage.tsx"),
      route("/blog/:slug", "routes/marketing/BlogPostPage.tsx"),
      route("/contact", "routes/marketing/ContactPage.tsx"),
      route("/privacy", "routes/marketing/PrivacyPolicyPage.tsx"),
      route("/privacy-policy", "routes/marketing/PrivacyPolicyPage.tsx", { id: "privacy-policy-alias" }),

      // 🎟️ Public Event Marketplace & Ticketing Routes (under Marketing Navbar & Footer)
      route("/explore-events", "routes/events/PublicEventMarketplace.tsx"),
      route("/explore-events/:slugOrId", "routes/events/PublicEventDetail.tsx"),
      route("/explore-events/:slugOrId/checkout", "routes/events/PublicEventCheckout.tsx"),
      route("/tickets/confirmation/:orderId", "routes/events/PublicTicketConfirmation.tsx"),
      route("/tickets/verify/:qrToken", "routes/events/PublicTicketVerify.tsx"),
    ],
  },

  // 🔓 Public standalone routes (no Layout, no auth required)
  route("/login", "routes/Login.tsx"),
  route("/forgot-password", "routes/ForgotPassword.tsx"),
  route("/reset-password", "routes/ResetPassword.tsx"),
  route("/verify-email", "routes/VerifyEmail.tsx"),
  route("/tenant-registration", "routes/OrganizationWizard.tsx", { id: "tenant-registration-wizard" }),
  route("/org-register", "routes/OrganizationWizard.tsx", { id: "org-register-wizard" }),
  route("/tenant-plans", "routes/TenantPlans.tsx"),
  route("/subscription-expired", "routes/SubscriptionExpired.tsx"),
  route("/subscription-locked", "routes/SubscriptionLocked.tsx"),
  route("/tenant-approval", "routes/TenantApproval.tsx"),
  route("/meetings/room/:id", "routes/MeetingRoom.tsx"),
  route("/pay/:token", "routes/Payments/PublicPaymentCheckout.tsx"),
  route("/unauthorized", "routes/Unauthorized.tsx"),

  // 🔓 SaaS onboarding flow routes (public, no sidebar Layout)
  route("/select-workspace", "routes/WorkspaceSelector.tsx"),
  route("/payment", "routes/PaymentPage.tsx"),

  {
    path: "/",
    file: "routes/Layout.tsx", // has <Sidebar />, <Header />, <Outlet />
    children: [
      route("/dashboard", "routes/home.tsx"),
      route("/home", "routes/HomeRedirect.tsx", { id: "legacy-home-redirect" }),
      route("/onboarding", "routes/Onboarding.tsx"),
      route("/branch", "routes/Branch/BranchList.tsx"),
      route("/branch/:id", "routes/Branch/BranchViewPage.tsx"),

      // Employee Workflow
      route("/employee", "routes/Employee/Employee.tsx"),
      route("/employee/salary_slip", "routes/Employee/Salary/Salary.tsx", { id: "employee-salary-slip-list" }),
      route("/employee/salary_slip/:id", "routes/Employee/Salary/PaySlip.tsx", { id: "employee-salary-slip-detail" }),
      route("/employee/addpage/:id", "routes/Employee/AddNewEmployeeDetail.tsx"),
      route("/employee/editpage/:id", "routes/Employee/EditEmployeeForm.tsx"),
      route("/employee_profile/:id", "routes/Employee/EmployeeProfile.tsx"),
      route("/employee_profile", "routes/Employee/EmployeeProfile.tsx", { id: "employee-profile-self" }),
      route("/profile", "routes/ProfileRedirect.tsx", { id: "legacy-profile-redirect" }),
      route("/employee_report", "routes/Employee/EmployeeReport.tsx"),
      route("/offer-letter-view/:id", "routes/Employee/offerletters/ViewOfferLetter.tsx"),
      route("/employee/:id/joining-letter", "routes/Employee/EmployeeJoiningLetter/ViewJoiningLetter.tsx"),
      route("/View-certificate/:id/:resign_id", "routes/Employee/termination/ExperienceCertification.tsx"),

      route("/leave", "routes/Leave/Leave.tsx"),
      route("/time_sheet", "routes/Project/Timesheet/EmployeeTimeSheet.tsx"),
      route("/reportAnaysis", "routes/Report.tsx"),
      route("/attandance", "routes/Attendance/Attandance.tsx"),

      // Project & Tasks
      route("/project", "routes/Project/Project.tsx"),
      route("/revisedproject", "routes/Project/revised_projects.tsx"),
      route("/project/:id", "routes/Project/ProjectOverview.tsx"),
      route("/projectaccount/:id", "routes/Project/ProjectAccountOverview.tsx"),
      route("/milestone/:id", "routes/Project/Task/MilestoneTaskList.tsx"),
      route("/milestonepayment/:id", "routes/Project/Task/MilestonePaymentList.tsx"),
      route("/project_tasklist", "routes/Project/Task/ProjectTaskList.tsx"),
      route("/task_view/:id", "routes/Project/Task/TaskViewPage.tsx"),
      route("/task_view", "routes/Project/Task/TaskViewRedirect.tsx", { id: "legacy-task-view-redirect" }),
      route("/member_view/:id", "routes/Project/Task/TaskMember/TaskMemberCheckInOutView.tsx"),
      route("/revised_projects", "routes/Project/revised_projects_overall.tsx"),

      // Leads & CRM
      route("/leads", "routes/Leads/Leads.tsx"),
      route("/leadscovert", "routes/Leads/LeadConvertion.tsx"),
      route("/leadsview/:id", "routes/Leads/LeadsPage.tsx"),
      route("/campaign", "routes/Campaign/Campaign.tsx"),
      route("/campaignview/:id", "routes/Campaign/ViewCampaignDetails.tsx"),

      // Clients / Customers Workflow (Canonical: /clients)
      route("/clients", "routes/Clients/Client.tsx", { id: "canonical-clients-route" }),
      route("/client", "routes/Clients/ClientRedirect.tsx", { id: "legacy-client-redirect" }),
      route("/customers", "routes/Clients/ClientRedirect.tsx", { id: "legacy-customers-redirect" }),
      route("/client_add", "routes/Clients/ClientAddForm.tsx"),
      route("/client_view", "routes/Clients/ClientPage.tsx"),
      route("/meeting_view/:id", "routes/Clients/MomViewPage.tsx"),
      route("/meetings/:id", "routes/Clients/EditMeetingModal.tsx"),
      route("/events", "routes/Clients/overallMOM.tsx"),
      route("/meetings", "routes/Meetings.tsx"),

      // Accounts & Invoices
      route("/account", "routes/Accounts/AccountsProject.tsx"),
      route("/invoice_create", "routes/Accounts/Invoice/CreateInvoice.tsx"),
      route("/invoice_view/:id", "routes/Accounts/Invoice/ViewInvoice.tsx", { id: "canonical-invoice-view" }),
      route("/invoice_view", "routes/Accounts/Invoice/InvoiceRedirect.tsx", { id: "invoice-view-no-id-redirect" }),
      route("/view_invoice/:id", "routes/Accounts/Invoice/InvoiceRedirect.tsx", { id: "legacy-view-invoice-redirect" }),
      route("/view_invoice", "routes/Accounts/Invoice/InvoiceRedirect.tsx", { id: "legacy-view-invoice-no-id-redirect" }),
      route("/payreq_view/:id", "routes/Accounts/PayRequestList.tsx"),

      // Operations & Reports
      route("/account_profile", "routes/AccountProfile.tsx"),
      route("/team", "routes/Team/TeamList.tsx"),
      route("/teamview/:id", "routes/Team.tsx"),
      route("/report_analysis", "routes/ReportAnalysis.tsx"),
      route("/notification", "routes/Notification.tsx"),
      route("/calendar", "routes/calendar/EventCalandar.tsx"),
      route("/mom_report", "routes/MomReport.tsx"),
      route("/active_log", "routes/ActiveLog.tsx"),
      route("/cumulative", "routes/Report&anaysis/ProjectCumulative.tsx"),
      route("/marketing", "routes/Marketing.tsx"),
      route("/websites", "routes/Websites.tsx"),
      route("/ai-assistant", "routes/AIAssistant.tsx"),
      route("/ai-report", "routes/AIReport.tsx"),

      // 📝 Public Website CMS & Editorial Management Routes
      route("/content/blog", "routes/content/BlogManagement.tsx"),
      route("/content/blog/new", "routes/content/BlogEditor.tsx", { id: "content-blog-new" }),
      route("/content/blog/edit/:id", "routes/content/BlogEditor.tsx", { id: "content-blog-edit" }),
      route("/content/testimonials", "routes/content/TestimonialsManagement.tsx"),

      // Sales & Procurement Workspace Routes
      route("/sales", "routes/Sales/SalesWorkspace.tsx"),
      route("/sales/orders", "routes/Sales/SalesOrders.tsx"),
      route("/sales/invoices", "routes/Sales/SalesInvoices.tsx"),
      route("/sales/returns", "routes/Sales/SalesReturns.tsx"),
      route("/purchases", "routes/Purchases/PurchaseWorkspace.tsx"),
      route("/products", "routes/Products/Products.tsx"),
      route("/inventory", "routes/Inventory/Inventory.tsx"),
      route("/suppliers", "routes/Suppliers/Suppliers.tsx"),
      route("/pos", "routes/POS/POSTerminal.tsx"),
      route("/dashboard/retail", "routes/dashboard/RetailDashboard.tsx"),
      route("/production", "routes/Production/ProductionWorkspace.tsx"),

      // 🛍️ Brandspyre Multi-Tenant Marketplace Seller Workspace
      route("/marketplace/seller", "routes/Marketplace/SellerMarketplaceWorkspace.tsx"),
      route("/marketplace/listings", "routes/Marketplace/SellerMarketplaceWorkspace.tsx", { id: "marketplace-listings-alias" }),

      // B2B Success-Based Client Billing Engine routes
      route("/billing/dashboard", "routes/Billing/BillingDashboard.tsx"),
      route("/billing/contracts", "routes/Billing/ContractsList.tsx"),
      route("/billing/agreements", "routes/Billing/AgreementsList.tsx"),
      route("/billing/transactions", "routes/Billing/BillableTransactionsList.tsx"),
      route("/billing/disputes", "routes/Billing/DisputesList.tsx"),
      route("/billing/success-stages", "routes/Billing/SuccessStageConfig.tsx"),

      // Support Portal
      route("/support", "routes/support/CustomerSupportPortal.tsx"),

      // 🎟️ Brandspyre Events Organizer Workspace
      route("/event-management/dashboard", "routes/events/OrganizerEventDashboard.tsx"),
      route("/event-management/events", "routes/events/OrganizerEventsList.tsx"),
      route("/event-management/events/create", "routes/events/OrganizerEventWizard.tsx"),
      route("/event-management/events/:id", "routes/events/OrganizerEventManage.tsx"),
      route("/event-management/orders", "routes/events/OrganizerOrdersList.tsx"),
      route("/event-management/attendees", "routes/events/OrganizerAttendeesList.tsx"),
      route("/event-management/checkin", "routes/events/OrganizerCheckinTerminal.tsx"),
      route("/event-management/settlements", "routes/events/OrganizerSettlements.tsx"),

      // Platform Admin Routing Group
      route("/admin/saas", "routes/admin/SuperAdminDashboard.tsx", { id: "legacy-admin-saas" }),
      route("/tenant-dashboard", "routes/admin/TenantDashboardRedirect.tsx", { id: "legacy-tenant-dashboard-redirect" }),
      {
        path: "/admin",
        file: "routes/admin/PlatformAdminLayout.tsx",
        children: [
          index("routes/admin/PlatformAdminDashboard.tsx", { id: "admin-index" }),
          route("dashboard", "routes/admin/PlatformAdminDashboard.tsx", { id: "admin-dashboard" }),
          route("organizations", "routes/admin/PlatformOrganizationsList.tsx", { id: "admin-orgs" }),
          route("organizations/:id", "routes/admin/PlatformOrganizationDetail.tsx", { id: "admin-org-detail" }),
          route("business-types", "routes/admin/BusinessTypeManagement.tsx", { id: "admin-bts" }),
          route("modules", "routes/admin/BusinessTypeManagement.tsx", { id: "admin-modules" }),
          route("module-pricing", "routes/admin/ModulePricingManagement.tsx", { id: "admin-mod-pricing" }),
          route("plans", "routes/admin/SubscriptionPlansManagement.tsx", { id: "admin-plans" }),
          route("addons", "routes/admin/ModulePricingManagement.tsx", { id: "admin-addons" }),
          route("custom-plans", "routes/admin/SubscriptionPlansManagement.tsx", { id: "admin-custom-plans" }),
          route("support", "routes/admin/PlatformSupportDashboard.tsx", { id: "admin-support" }),
          route("analytics", "routes/admin/PlatformAdminDashboard.tsx", { id: "admin-analytics" }),
          route("audit-logs", "routes/admin/PlatformAuditLogs.tsx", { id: "admin-audit-logs" }),
          route("referrals", "routes/admin/PlatformReferrals.tsx", { id: "admin-referrals" }),
          route("events", "routes/admin/PlatformEventsManagement.tsx", { id: "admin-events" }),
          route("marketplace", "routes/admin/PlatformMarketplaceManagement.tsx", { id: "admin-marketplace" })
        ]
      },

      // Multi-Organization Lead Exchange & Commercial Settlement Platform routes
      route("/lead-exchange/relationships", "routes/LeadExchange/TenantRelationships.tsx"),
      route("/lead-exchange/shared-leads", "routes/LeadExchange/SharedLeads.tsx"),
      route("/lead-exchange/settlements", "routes/LeadExchange/SettlementLedger.tsx"),

      // Business Opportunity Marketplace & Referral Network
      route("/referrals/marketplace", "routes/Referrals/Marketplace.tsx"),
      route("/referrals/my", "routes/Referrals/MyReferrals.tsx"),
      route("/referrals/received", "routes/Referrals/ReceivedReferrals.tsx"),
      route("/referrals/partners", "routes/Referrals/PartnerNetwork.tsx"),
      route("/referrals/settlements", "routes/Referrals/ReferralSettlements.tsx"),

      // Organization-to-Organization Payments workspace
      {
        path: "/payments",
        file: "routes/Payments/PaymentsLayout.tsx",
        children: [
          index("routes/Payments/PaymentDashboard.tsx"),
          route("requests", "routes/Payments/PaymentRequests.tsx"),
          route("received", "routes/Payments/ReceivedPayments.tsx"),
          route("sent", "routes/Payments/SentPayments.tsx"),
          route("reconciliation", "routes/Payments/AdminReconciliation.tsx"),
        ]
      },

      // Settings group
      {
        path: "/settings",
        file: "routes/settings/SettingsLayout.tsx",
        children: [
          index("routes/settings/Settings.tsx"),
          route("security", "routes/settings/SecuritySettings.tsx"),
          route("modules", "routes/settings/ModuleSettings.tsx"),
          route("custom-package", "routes/settings/CustomPackageBuilder.tsx"),
          route("billing", "routes/settings/BillingDashboard.tsx"),
          route("access-permission/roles", "routes/settings/AccessRole.tsx"),
          route("access-permission/user", "routes/settings/UserRoles.tsx"),
          route("access-permission/systemsetting", "routes/settings/SystemSetting.tsx"),
          route("access-permission/departments", "routes/settings/Departments.tsx"),
          route("access-permission/designations", "routes/settings/Designations.tsx"),
          route("access-permission/teams", "routes/settings/SettingTeam.tsx"),
          route("invoice/tax", "routes/settings/Tax.tsx"),
          route("invoice/payment-methods", "routes/settings/PaymentMethod.tsx"),
          route("dynamic-fields", "routes/settings/DynamicFields.tsx"),
          route("joining-letter-template", "routes/settings/JoiningLetterTemplate.tsx"),
          route("integrations/meta", "routes/settings/metaIntegration.tsx"),
          route("document-templates", "routes/settings/DocumentTemplates.tsx"),
          route("document-templates/builder/:id?", "routes/settings/DocumentTemplateBuilder.tsx"),
          route("masters", "routes/settings/MasterDataManagement.tsx"),
          route("payment-account", "routes/settings/PaymentAccount.tsx"),
        ],
      },

      // Catch-all
      route("*", "routes/NotFound.tsx"),
    ],
  },
] satisfies RouteConfig;