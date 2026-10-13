import { Permission } from '../../db/ModelSceham/rbacSchema';

export interface ModulePermissionDefinition {
  resource: string;
  action: string;
  code: string;
  description: string;
}

export interface ModuleDefinition {
  moduleKey: string;
  name: string;
  permissions: ModulePermissionDefinition[];
}

export class PermissionRegistry {
  private static modules: Map<string, ModuleDefinition> = new Map();

  /**
   * Register a module and its associated permissions
   */
  static registerModule(moduleDef: ModuleDefinition) {
    this.modules.set(moduleDef.moduleKey, moduleDef);
  }

  /**
   * Synchronize registered module permissions into the MongoDB Permission collection
   */
  static async sync() {
    try {
      console.log('🔄 Syncing PermissionRegistry definitions to database...');
      let totalSynced = 0;

      for (const [moduleKey, moduleDef] of this.modules.entries()) {
        for (const p of moduleDef.permissions) {
          await Permission.findOneAndUpdate(
            { code: p.code },
            {
              module: moduleKey,
              resource: p.resource,
              action: p.action,
              code: p.code,
              description: p.description
            },
            { upsert: true, new: true }
          );
          totalSynced++;
        }
      }

      console.log(`✅ PermissionRegistry successfully synced ${totalSynced} permissions across ${this.modules.size} modules.`);
    } catch (error) {
      console.error('❌ Error syncing PermissionRegistry:', error);
    }
  }

  /**
   * Get all registered modules and permission definitions
   */
  static getRegisteredModules(): ModuleDefinition[] {
    return Array.from(this.modules.values());
  }
}

// -------------------------------------------------------------
// Register Core Modules & Permissions
// -------------------------------------------------------------

// 1. CRM Module
PermissionRegistry.registerModule({
  moduleKey: 'crm',
  name: 'CRM & Customer Relationships',
  permissions: [
    { resource: 'lead', action: 'create', code: 'crm.lead.create', description: 'Create new leads' },
    { resource: 'lead', action: 'read', code: 'crm.lead.read', description: 'View leads' },
    { resource: 'lead', action: 'update', code: 'crm.lead.update', description: 'Edit existing leads' },
    { resource: 'lead', action: 'delete', code: 'crm.lead.delete', description: 'Delete leads' },
    { resource: 'lead', action: 'assign', code: 'crm.lead.assign', description: 'Assign leads to team members' },
    { resource: 'lead', action: 'export', code: 'crm.lead.export', description: 'Export leads to CSV/Excel' },
    { resource: 'campaign', action: 'create', code: 'crm.campaign.create', description: 'Create sales campaigns' },
    { resource: 'campaign', action: 'read', code: 'crm.campaign.read', description: 'View sales campaigns' },
    { resource: 'campaign', action: 'update', code: 'crm.campaign.update', description: 'Edit sales campaigns' },
    { resource: 'campaign', action: 'delete', code: 'crm.campaign.delete', description: 'Delete sales campaigns' },
    { resource: 'client', action: 'create', code: 'crm.client.create', description: 'Create clients' },
    { resource: 'client', action: 'read', code: 'crm.client.read', description: 'View clients' },
    { resource: 'client', action: 'update', code: 'crm.client.update', description: 'Edit clients' },
    { resource: 'client', action: 'delete', code: 'crm.client.delete', description: 'Delete clients' }
  ]
});

// 2. Sales Module
PermissionRegistry.registerModule({
  moduleKey: 'sales',
  name: 'Sales & Quotations',
  permissions: [
    { resource: 'quotation', action: 'create', code: 'sales.quotation.create', description: 'Create sales quotations' },
    { resource: 'quotation', action: 'read', code: 'sales.quotation.read', description: 'View sales quotations' },
    { resource: 'quotation', action: 'update', code: 'sales.quotation.update', description: 'Edit sales quotations' },
    { resource: 'quotation', action: 'approve', code: 'sales.quotation.approve', description: 'Approve sales quotations' },
    { resource: 'order', action: 'create', code: 'sales.order.create', description: 'Create sales orders' },
    { resource: 'order', action: 'read', code: 'sales.order.read', description: 'View sales orders' },
    { resource: 'order', action: 'update', code: 'sales.order.update', description: 'Edit sales orders' },
    { resource: 'order', action: 'delete', code: 'sales.order.delete', description: 'Delete sales orders' },
    { resource: 'order', action: 'export', code: 'sales.order.export', description: 'Export sales orders' }
  ]
});

// 3. Project Module
PermissionRegistry.registerModule({
  moduleKey: 'project',
  name: 'Project Management & Tasks',
  permissions: [
    { resource: 'project', action: 'create', code: 'project.project.create', description: 'Create projects' },
    { resource: 'project', action: 'read', code: 'project.project.read', description: 'View projects' },
    { resource: 'project', action: 'update', code: 'project.project.update', description: 'Edit projects' },
    { resource: 'project', action: 'delete', code: 'project.project.delete', description: 'Delete projects' },
    { resource: 'milestone', action: 'create', code: 'project.milestone.create', description: 'Create milestones' },
    { resource: 'milestone', action: 'update', code: 'project.milestone.update', description: 'Edit milestones' },
    { resource: 'task', action: 'create', code: 'project.task.create', description: 'Create tasks' },
    { resource: 'task', action: 'read', code: 'project.task.read', description: 'View tasks' },
    { resource: 'task', action: 'update', code: 'project.task.update', description: 'Edit tasks' },
    { resource: 'task', action: 'approve', code: 'project.task.approve', description: 'Approve tasks' },
    { resource: 'timesheet', action: 'manage', code: 'project.timesheet.manage', description: 'Manage employee timesheets' }
  ]
});

// 4. HR & Payroll Module
PermissionRegistry.registerModule({
  moduleKey: 'hr',
  name: 'Human Resources & Payroll',
  permissions: [
    { resource: 'employee', action: 'create', code: 'hr.employee.create', description: 'Create employee records' },
    { resource: 'employee', action: 'read', code: 'hr.employee.read', description: 'View employee records' },
    { resource: 'employee', action: 'update', code: 'hr.employee.update', description: 'Edit employee records' },
    { resource: 'employee', action: 'delete', code: 'hr.employee.delete', description: 'Delete employee records' },
    { resource: 'attendance', action: 'read', code: 'hr.attendance.read', description: 'View attendance records' },
    { resource: 'attendance', action: 'manage', code: 'hr.attendance.manage', description: 'Manage attendance logs' },
    { resource: 'leave', action: 'create', code: 'hr.leave.create', description: 'Apply for leaves' },
    { resource: 'leave', action: 'approve', code: 'hr.leave.approve', description: 'Approve or reject leave requests' },
    { resource: 'salary', action: 'read', code: 'hr.salary.read', description: 'View salary information' },
    { resource: 'salary', action: 'manage', code: 'hr.salary.manage', description: 'Manage salary structures and slips' },
    { resource: 'salary', action: 'approve', code: 'hr.salary.approve', description: 'Approve salary payouts' }
  ]
});

// 5. Finance & Accounting Module
PermissionRegistry.registerModule({
  moduleKey: 'finance',
  name: 'Finance & Accounting',
  permissions: [
    { resource: 'invoice', action: 'create', code: 'finance.invoice.create', description: 'Create invoices' },
    { resource: 'invoice', action: 'read', code: 'finance.invoice.read', description: 'View invoices' },
    { resource: 'invoice', action: 'update', code: 'finance.invoice.update', description: 'Edit invoices' },
    { resource: 'invoice', action: 'delete', code: 'finance.invoice.delete', description: 'Delete invoices' },
    { resource: 'invoice', action: 'approve', code: 'finance.invoice.approve', description: 'Approve invoices' },
    { resource: 'invoice', action: 'export', code: 'finance.invoice.export', description: 'Export invoices' },
    { resource: 'payment', action: 'create', code: 'finance.payment.create', description: 'Record payment requests' },
    { resource: 'account', action: 'manage', code: 'finance.account.manage', description: 'Manage chart of accounts' }
  ]
});

// 6. Purchase & Procurement Module
PermissionRegistry.registerModule({
  moduleKey: 'purchase',
  name: 'Purchase & Procurement',
  permissions: [
    { resource: 'vendor', action: 'create', code: 'purchase.vendor.create', description: 'Create vendors' },
    { resource: 'vendor', action: 'read', code: 'purchase.vendor.read', description: 'View vendors' },
    { resource: 'order', action: 'create', code: 'purchase.order.create', description: 'Create purchase orders' },
    { resource: 'order', action: 'read', code: 'purchase.order.read', description: 'View purchase orders' },
    { resource: 'order', action: 'approve', code: 'purchase.order.approve', description: 'Approve purchase orders' }
  ]
});

// 7. Inventory Module
PermissionRegistry.registerModule({
  moduleKey: 'inventory',
  name: 'Inventory & Warehouse',
  permissions: [
    { resource: 'item', action: 'create', code: 'inventory.item.create', description: 'Create stock items' },
    { resource: 'item', action: 'read', code: 'inventory.item.read', description: 'View stock items' },
    { resource: 'item', action: 'update', code: 'inventory.item.update', description: 'Edit stock items' },
    { resource: 'stock', action: 'transfer', code: 'inventory.stock.transfer', description: 'Transfer stock between warehouses' }
  ]
});

// 8. Reports Module
PermissionRegistry.registerModule({
  moduleKey: 'report',
  name: 'Reports & Analytics',
  permissions: [
    { resource: 'sales', action: 'read', code: 'report.sales.read', description: 'View sales analytics reports' },
    { resource: 'finance', action: 'read', code: 'report.finance.read', description: 'View financial reports' },
    { resource: 'hr', action: 'read', code: 'report.hr.read', description: 'View HR reports' },
    { resource: 'all', action: 'export', code: 'report.all.export', description: 'Export analytical reports' }
  ]
});

// 9. Settings Module
PermissionRegistry.registerModule({
  moduleKey: 'setting',
  name: 'System & Organization Settings',
  permissions: [
    { resource: 'roles', action: 'manage', code: 'setting.roles.manage', description: 'Manage roles and permissions' },
    { resource: 'company', action: 'update', code: 'setting.company.update', description: 'Edit organization profile' },
    { resource: 'branches', action: 'manage', code: 'setting.branches.manage', description: 'Manage branch locations' },
    { resource: 'documentTemplate', action: 'read', code: 'setting.documentTemplate.read', description: 'View document templates' },
    { resource: 'documentTemplate', action: 'create', code: 'setting.documentTemplate.create', description: 'Create document templates' },
    { resource: 'documentTemplate', action: 'update', code: 'setting.documentTemplate.update', description: 'Edit document templates' },
    { resource: 'documentTemplate', action: 'delete', code: 'setting.documentTemplate.delete', description: 'Delete document templates' },
    { resource: 'documentTemplate', action: 'publish', code: 'setting.documentTemplate.publish', description: 'Publish document templates' },
    { resource: 'documentTemplate', action: 'manage', code: 'setting.documentTemplate.manage', description: 'Manage template defaults and versions' }
  ]
});

// 10. Billing Module
PermissionRegistry.registerModule({
  moduleKey: 'billing',
  name: 'Subscription & Billing',
  permissions: [
    { resource: 'subscription', action: 'read', code: 'billing.subscription.read', description: 'View subscription plan details' },
    { resource: 'subscription', action: 'manage', code: 'billing.subscription.manage', description: 'Upgrade or cancel subscription' }
  ]
});

// 11. Meeting Module
PermissionRegistry.registerModule({
  moduleKey: 'meeting',
  name: 'Meetings & Video Conferencing',
  permissions: [
    { resource: 'meeting', action: 'create', code: 'meeting.create', description: 'Create internal meetings' },
    { resource: 'meeting', action: 'read', code: 'meeting.read', description: 'View authorized meetings' },
    { resource: 'meeting', action: 'update', code: 'meeting.update', description: 'Edit meeting details' },
    { resource: 'meeting', action: 'cancel', code: 'meeting.cancel', description: 'Cancel meetings' },
    { resource: 'meeting', action: 'invite', code: 'meeting.invite', description: 'Invite participants to meeting' },
    { resource: 'meeting', action: 'join', code: 'meeting.join', description: 'Join active meeting room' },
    { resource: 'inter_organization', action: 'create', code: 'meeting.inter_organization.create', description: 'Create inter-organization meetings' },
    { resource: 'inter_organization', action: 'invite', code: 'meeting.inter_organization.invite', description: 'Invite external tenant participants' },
    { resource: 'notes', action: 'read', code: 'meeting.notes.read', description: 'Read meeting notes' },
    { resource: 'notes', action: 'create', code: 'meeting.notes.create', description: 'Create and update meeting notes' },
    { resource: 'documents', action: 'read', code: 'meeting.documents.read', description: 'Read meeting attachments' },
    { resource: 'documents', action: 'create', code: 'meeting.documents.create', description: 'Upload meeting attachments' }
  ]
});

// 12. Products & Catalog Module
PermissionRegistry.registerModule({
  moduleKey: 'products',
  name: 'Products & Catalog',
  permissions: [
    { resource: 'products', action: 'read', code: 'products.read', description: 'View product catalog' },
    { resource: 'products', action: 'create', code: 'products.create', description: 'Create products' },
    { resource: 'products', action: 'update', code: 'products.update', description: 'Edit products' },
    { resource: 'products', action: 'delete', code: 'products.delete', description: 'Delete products' },
    { resource: 'categories', action: 'manage', code: 'products.categories', description: 'Manage product categories' },
    { resource: 'brands', action: 'manage', code: 'products.brands', description: 'Manage product brands' }
  ]
});

// 13. Suppliers & Purchase Module
PermissionRegistry.registerModule({
  moduleKey: 'purchase',
  name: 'Purchase & Procurement',
  permissions: [
    { resource: 'suppliers', action: 'read', code: 'suppliers.read', description: 'View suppliers' },
    { resource: 'suppliers', action: 'create', code: 'suppliers.create', description: 'Create suppliers' },
    { resource: 'suppliers', action: 'update', code: 'suppliers.update', description: 'Edit suppliers' },
    { resource: 'suppliers', action: 'delete', code: 'suppliers.delete', description: 'Delete suppliers' },
    { resource: 'purchase', action: 'read', code: 'purchase.read', description: 'View purchase orders and receiving logs' },
    { resource: 'purchase', action: 'create', code: 'purchase.create', description: 'Create purchase orders and receive goods' },
    { resource: 'purchase', action: 'update', code: 'purchase.update', description: 'Edit purchase orders' },
    { resource: 'purchase', action: 'approve', code: 'purchase.approve', description: 'Approve purchase orders' },
    { resource: 'purchase', action: 'delete', code: 'purchase.delete', description: 'Delete purchase orders' },
    { resource: 'purchase', action: 'return', code: 'purchase.return', description: 'Process purchase returns' }
  ]
});

// 14. Additional Inventory Permissions
PermissionRegistry.registerModule({
  moduleKey: 'inventory_extended',
  name: 'Extended Inventory Management',
  permissions: [
    { resource: 'stock', action: 'read', code: 'inventory.stock.read', description: 'View inventory stock levels and movements' },
    { resource: 'stock', action: 'adjust', code: 'inventory.stock.adjust', description: 'Create stock adjustments' },
    { resource: 'stock', action: 'transfer', code: 'inventory.stock.transfer', description: 'Transfer stock between warehouses' },
    { resource: 'warehouse', action: 'read', code: 'inventory.warehouse.read', description: 'View warehouses' },
    { resource: 'warehouse', action: 'manage', code: 'inventory.warehouse.manage', description: 'Create and edit warehouses' },
    { resource: 'batch', action: 'read', code: 'inventory.batch.read', description: 'View batch and expiry tracking' }
  ]
});

// 15. Sales & POS Module
PermissionRegistry.registerModule({
  moduleKey: 'pos',
  name: 'Point of Sale (POS) & Sales',
  permissions: [
    { resource: 'sales', action: 'read', code: 'sales.read', description: 'View sales orders and invoices' },
    { resource: 'sales', action: 'create', code: 'sales.create', description: 'Create sales orders and invoices' },
    { resource: 'sales', action: 'return', code: 'sales.return', description: 'Process sales returns' },
    { resource: 'pos', action: 'access', code: 'pos.access', description: 'Access POS terminal register' },
    { resource: 'pos', action: 'create', code: 'pos.sale.create', description: 'Complete POS checkout' },
    { resource: 'pos', action: 'return', code: 'pos.sale.return', description: 'Process POS sale return' }
  ]
});

// 16. Referral Network & Marketplace Module
PermissionRegistry.registerModule({
  moduleKey: 'referral_network',
  name: 'Referral Network & Business Opportunity Marketplace',
  permissions: [
    { resource: 'referral', action: 'read', code: 'referral.view', description: 'View referral marketplace and opportunities' },
    { resource: 'referral', action: 'create', code: 'referral.create', description: 'Create business opportunity referral' },
    { resource: 'referral', action: 'publish', code: 'referral.publish', description: 'Publish referral to marketplace' },
    { resource: 'referral', action: 'request', code: 'referral.request', description: 'Request opportunity from marketplace' },
    { resource: 'referral', action: 'approve', code: 'referral.approve', description: 'Approve or reject referral requests' },
    { resource: 'referral', action: 'assign', code: 'referral.assign', description: 'Assign referral processor user' },
    { resource: 'referral', action: 'view_contact', code: 'referral.view_contact', description: 'Unlock sensitive referral contact details' },
    { resource: 'referral', action: 'manage_settlement', code: 'referral.manage_settlement', description: 'Manage referral commission settlements' },
    { resource: 'referral', action: 'analytics', code: 'referral.analytics', description: 'View referral network performance analytics' },
    { resource: 'referral', action: 'manage_platform', code: 'referral.manage_platform', description: 'Create and manage platform level referrals' }
  ]
});

// 17. Public Website & Content Management (CMS) Module
PermissionRegistry.registerModule({
  moduleKey: 'content',
  name: 'Public Website Content Management (CMS)',
  permissions: [
    { resource: 'blog', action: 'read', code: 'content.blog.read', description: 'View blog posts and drafts' },
    { resource: 'blog', action: 'create', code: 'content.blog.create', description: 'Create new blog posts' },
    { resource: 'blog', action: 'update', code: 'content.blog.update', description: 'Edit existing blog posts' },
    { resource: 'blog', action: 'delete', code: 'content.blog.delete', description: 'Delete blog posts' },
    { resource: 'blog', action: 'publish', code: 'content.blog.publish', description: 'Publish or schedule blog posts' },
    { resource: 'category', action: 'manage', code: 'content.category.manage', description: 'Manage blog categories' },
    { resource: 'testimonial', action: 'read', code: 'content.testimonial.read', description: 'View testimonials and case studies' },
    { resource: 'testimonial', action: 'create', code: 'content.testimonial.create', description: 'Create new testimonials' },
    { resource: 'testimonial', action: 'update', code: 'content.testimonial.update', description: 'Edit existing testimonials' },
    { resource: 'testimonial', action: 'delete', code: 'content.testimonial.delete', description: 'Delete testimonials' },
    { resource: 'testimonial', action: 'publish', code: 'content.testimonial.publish', description: 'Publish customer testimonials' },
    { resource: 'media', action: 'upload', code: 'content.media.upload', description: 'Upload images and media assets for CMS' },
    { resource: 'media', action: 'delete', code: 'content.media.delete', description: 'Delete CMS media assets' }
  ]
});

// 18. Marketplace Module (Multi-Tenant Ecommerce & Seller Management)
PermissionRegistry.registerModule({
  moduleKey: 'marketplace',
  name: 'Ecommerce Marketplace & Seller Network',
  permissions: [
    { resource: 'listing', action: 'create', code: 'marketplace.listing.create', description: 'Create marketplace product listings' },
    { resource: 'listing', action: 'read', code: 'marketplace.listing.read', description: 'View marketplace listings' },
    { resource: 'listing', action: 'update', code: 'marketplace.listing.update', description: 'Edit marketplace product listings' },
    { resource: 'listing', action: 'delete', code: 'marketplace.listing.delete', description: 'Delete marketplace product listings' },
    { resource: 'listing', action: 'publish', code: 'marketplace.listing.publish', description: 'Publish and unpublish marketplace listings' },
    { resource: 'order', action: 'read', code: 'marketplace.order.read', description: 'View received marketplace orders' },
    { resource: 'order', action: 'fulfill', code: 'marketplace.order.fulfill', description: 'Fulfill and update marketplace orders' },
    { resource: 'quotation', action: 'respond', code: 'marketplace.quotation.respond', description: 'Respond to buyer purchase quotes/RFQs' },
    { resource: 'profile', action: 'manage', code: 'marketplace.profile.manage', description: 'Manage seller storefront profile' },
    { resource: 'admin', action: 'moderate', code: 'marketplace.admin.moderate', description: 'Moderate listings and supervise platform marketplace' }
  ]
});

export default PermissionRegistry;

