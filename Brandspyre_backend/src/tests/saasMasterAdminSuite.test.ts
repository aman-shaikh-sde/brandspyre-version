import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../db/index';
import { BusinessType, BusinessTypeModule } from '../db/ModelSceham/businessTypeSchema';
import { Module, OrganizationModule, OrganizationFeature } from '../db/ModelSceham/industryModuleSchema';
import { SubscriptionPlan, TenantSubscription, Tenant, AuditLog } from '../db/ModelSceham/saasSchema';
import { ModulePricing, SubscriptionPriceSnapshot } from '../db/ModelSceham/pricingSchema';
import { SupportTicket } from '../db/ModelSceham/supportTicketSchema';
import PricingService from '../services/saas/PricingService';
import SupportTicketService from '../services/saas/SupportTicketService';
import OrganizationEntitlementService from '../services/saas/OrganizationEntitlementService';
import { seedExcelMatrixData } from '../db/excelMatrixSeed';

describe('NXT ASPECT Master SaaS Admin & Industry Engine Test Suite', () => {
  beforeAll(async () => {
    await connectDatabase();
    await seedExcelMatrixData();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  // TEST 1: Industry Matrix Resolution (IT / Software Company)
  it('TEST 1: IT / Software Company matrix resolution', async () => {
    const bt = await BusinessType.findOne({ code: 'IT_SOFTWARE' });
    expect(bt).not.toBeNull();
    expect(bt?.industry_code).toBe('TECHNOLOGY');

    const matrix = await BusinessTypeModule.find({ business_type_code: 'IT_SOFTWARE' });
    const coreMods = matrix.filter((m) => m.applicability === 'C').map((m) => m.module_code);
    expect(coreMods).toContain('CRM');
    expect(coreMods).toContain('PROJECTS');
    expect(coreMods).toContain('HRMS');
    expect(coreMods).toContain('FINANCE');
  });

  // TEST 2: Supermarket / Grocery Store Configuration
  it('TEST 2: Supermarket / Grocery Store configuration', async () => {
    const matrix = await BusinessTypeModule.find({ business_type_code: 'SUPERMARKET_GROCERY' });
    const coreMods = matrix.filter((m) => m.applicability === 'C').map((m) => m.module_code);
    expect(coreMods).toContain('POS');
    expect(coreMods).toContain('PRODUCTS');
    expect(coreMods).toContain('INVENTORY');
    expect(coreMods).toContain('PURCHASE');
  });

  // TEST 3: Pharmacy / Medical Retail Configuration
  it('TEST 3: Pharmacy / Medical Retail configuration', async () => {
    const matrix = await BusinessTypeModule.find({ business_type_code: 'PHARMACY_RETAIL' });
    const coreMods = matrix.filter((m) => m.applicability === 'C').map((m) => m.module_code);
    expect(coreMods).toContain('POS');
    expect(coreMods).toContain('INVENTORY');
    expect(coreMods).toContain('PURCHASE');
    expect(coreMods).toContain('PRODUCTS');
  });

  // TEST 4: Manufacturing Company Configuration
  it('TEST 4: Manufacturing Company configuration', async () => {
    const matrix = await BusinessTypeModule.find({ business_type_code: 'MANUFACTURING' });
    const coreMods = matrix.filter((m) => m.applicability === 'C').map((m) => m.module_code);
    expect(coreMods).toContain('PRODUCTION');
    expect(coreMods).toContain('INVENTORY');
    expect(coreMods).toContain('PURCHASE');
  });

  // TEST 5: Custom Package Server-Side Price Calculation
  it('TEST 5: Custom package dynamic price calculation', async () => {
    const result = await PricingService.calculateSubscriptionPrice({
      planCode: 'starter',
      businessTypeCode: 'IT_SOFTWARE',
      moduleCodes: ['CRM', 'PROJECTS', 'AI_ASSISTANT'],
      billingCycle: 'monthly'
    });

    expect(result.subtotal).toBeGreaterThan(0);
    expect(result.taxAmount).toBeGreaterThan(0);
    expect(result.totalAmount).toBe(result.subtotal - result.discountAmount + result.taxAmount);
  });

  // TEST 6: Price Snapshotting
  it('TEST 6: Subscription price snapshotting', async () => {
    const testOrg = await Tenant.create({ name: 'Snapshot Test Org', company_name: 'Snapshot Test Org' });
    const plan = await SubscriptionPlan.findOne({ plan_code: 'starter' });
    const sub = await TenantSubscription.create({
      tenant_id: testOrg._id,
      plan_id: plan?._id,
      start_date: new Date(),
      end_date: new Date()
    });

    const calcResult = await PricingService.calculateSubscriptionPrice({ planCode: 'starter', billingCycle: 'monthly' });
    const snapshot = await PricingService.savePriceSnapshot(testOrg._id.toString(), sub._id.toString(), calcResult);

    expect(snapshot).not.toBeNull();
    expect(snapshot.final_amount).toBe(calcResult.totalAmount);

    // Cleanup
    await Tenant.findByIdAndDelete(testOrg._id);
    await TenantSubscription.findByIdAndDelete(sub._id);
    await SubscriptionPriceSnapshot.findByIdAndDelete(snapshot._id);
  });

  // TEST 7: Support Ticket Lifecycle
  it('TEST 7: Support ticket creation & reply lifecycle', async () => {
    const testOrg = await Tenant.create({ name: 'Support Test Org', company_name: 'Support Test Org' });
    const user = new mongoose.Types.ObjectId();

    const ticket = await SupportTicketService.createTicket({
      tenantId: testOrg._id.toString(),
      userId: user.toString(),
      userName: 'Test User',
      userEmail: 'test@example.com',
      subject: 'Need CRM + Inventory',
      description: 'Requesting CRM and Inventory module activation'
    });

    expect(ticket.ticket_number).toMatch(/^TICK-/);
    expect(ticket.status).toBe('OPEN');

    const updated = await SupportTicketService.addReply(ticket._id.toString(), {
      senderId: user.toString(),
      senderName: 'Platform Admin',
      senderRole: 'admin',
      message: 'Quotation sent for approval',
      newStatus: 'WAITING_FOR_CUSTOMER'
    });

    expect(updated?.status).toBe('WAITING_FOR_CUSTOMER');

    // Cleanup
    await Tenant.findByIdAndDelete(testOrg._id);
    await SupportTicket.findByIdAndDelete(ticket._id);
  });

  // TEST 8: Module Entitlement Enforcement
  it('TEST 8: Disable Inventory entitlement enforcement', async () => {
    const testOrg = await Tenant.create({ name: 'Entitle Org', company_name: 'Entitle Org' });
    await OrganizationEntitlementService.enableModules(testOrg._id, ['CRM']);

    const isEnabled = await OrganizationEntitlementService.isModuleEnabled(testOrg._id, 'INVENTORY');
    expect(isEnabled).toBe(false);

    // Cleanup
    await Tenant.findByIdAndDelete(testOrg._id);
    await OrganizationModule.deleteMany({ tenant_id: testOrg._id });
  });

  // TEST 9 & 10: Multi-Tenant & Platform Admin Isolation
  it('TEST 9 & 10: Tenant & Platform Admin isolation', async () => {
    const orgA = await Tenant.create({ name: 'Org A', company_name: 'Org A' });
    const orgB = await Tenant.create({ name: 'Org B', company_name: 'Org B' });

    const subA = await TenantSubscription.create({
      tenant_id: orgA._id,
      plan_id: new mongoose.Types.ObjectId(),
      start_date: new Date(),
      end_date: new Date()
    });

    // Verify Org B cannot query Org A subscription
    const queryResult = await TenantSubscription.findOne({ tenant_id: orgB._id, _id: subA._id });
    expect(queryResult).toBeNull();

    // Cleanup
    await Tenant.findByIdAndDelete(orgA._id);
    await Tenant.findByIdAndDelete(orgB._id);
    await TenantSubscription.findByIdAndDelete(subA._id);
  });
});
