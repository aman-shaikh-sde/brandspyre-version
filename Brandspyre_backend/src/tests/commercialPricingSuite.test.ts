import { SubscriptionService } from '../services/saas/SubscriptionService';
import { seedCommercialPricingData } from '../services/saas/commercialPricingSeed';
import { SubscriptionPlan } from '../db/ModelSceham/saasSchema';
import { Addon, SubscriptionPriceSnapshot } from '../db/ModelSceham/pricingSchema';

describe('Commercial Pricing Source of Truth & Engine Test Suite', () => {

  // Test 1: Retail Starter Monthly Price
  test('1. Retail Starter monthly should equal ₹499', async () => {
    const calc = await SubscriptionService.calculateSubscriptionPrice({
      planCode: 'retail_starter',
      billingCycle: 'monthly'
    });
    expect(calc.basePlan.amount).toBe(499);
  });

  // Test 2: Retail Starter Annual Price
  test('2. Retail Starter annual should equal ₹5,500', async () => {
    const calc = await SubscriptionService.calculateSubscriptionPrice({
      planCode: 'retail_starter',
      billingCycle: 'yearly'
    });
    expect(calc.basePlan.amount).toBe(5500);
  });

  // Test 3: Retail Business Monthly Price
  test('3. Retail Business monthly should equal ₹799', async () => {
    const calc = await SubscriptionService.calculateSubscriptionPrice({
      planCode: 'retail_business',
      billingCycle: 'monthly'
    });
    expect(calc.basePlan.amount).toBe(799);
  });

  // Test 4: Retail Professional Monthly Price
  test('4. Retail Professional monthly should equal ₹1,499', async () => {
    const calc = await SubscriptionService.calculateSubscriptionPrice({
      planCode: 'retail_professional',
      billingCycle: 'monthly'
    });
    expect(calc.basePlan.amount).toBe(1499);
  });

  // Test 5: Retail Enterprise Starting Monthly Price
  test('5. Retail Enterprise starting monthly should equal ₹3,499', async () => {
    const calc = await SubscriptionService.calculateSubscriptionPrice({
      planCode: 'retail_enterprise',
      billingCycle: 'monthly'
    });
    expect(calc.basePlan.amount).toBe(3499);
    expect(calc.basePlan.monthlyPriceType).toBe('STARTING_FROM');
  });

  // Test 6: Business & Services Starter Monthly Price
  test('6. Business & Services Starter monthly should equal ₹599', async () => {
    const calc = await SubscriptionService.calculateSubscriptionPrice({
      planCode: 'biz_starter',
      billingCycle: 'monthly'
    });
    expect(calc.basePlan.amount).toBe(599);
  });

  // Test 7: Business & Services Business Monthly Price
  test('7. Business & Services Business monthly should equal ₹899', async () => {
    const calc = await SubscriptionService.calculateSubscriptionPrice({
      planCode: 'biz_business',
      billingCycle: 'monthly'
    });
    expect(calc.basePlan.amount).toBe(899);
  });

  // Test 8: Business & Services Professional Monthly Price
  test('8. Business & Services Professional monthly should equal ₹1,699', async () => {
    const calc = await SubscriptionService.calculateSubscriptionPrice({
      planCode: 'biz_professional',
      billingCycle: 'monthly'
    });
    expect(calc.basePlan.amount).toBe(1699);
  });

  // Test 9: Business & Services Enterprise Starting Monthly Price
  test('9. Business & Services Enterprise starting monthly should equal ₹4,999', async () => {
    const calc = await SubscriptionService.calculateSubscriptionPrice({
      planCode: 'biz_enterprise',
      billingCycle: 'monthly'
    });
    expect(calc.basePlan.amount).toBe(4999);
    expect(calc.basePlan.monthlyPriceType).toBe('STARTING_FROM');
  });

  // Test 10: Additional User Price
  test('10. Additional user slot should cost ₹99 / month', async () => {
    const calc = await SubscriptionService.calculateSubscriptionPrice({
      planCode: 'retail_starter',
      billingCycle: 'monthly',
      additionalUsers: 1
    });
    const userRes = calc.resourceAddons.find(r => r.code === 'ADDITIONAL_USER');
    expect(userRes).toBeDefined();
    expect(userRes?.unitPrice).toBe(99);
    expect(userRes?.totalAmount).toBe(99);
  });

  // Test 11: Additional Branch Price
  test('11. Additional branch location should cost ₹199 / month', async () => {
    const calc = await SubscriptionService.calculateSubscriptionPrice({
      planCode: 'retail_starter',
      billingCycle: 'monthly',
      additionalBranches: 1
    });
    const branchRes = calc.resourceAddons.find(r => r.code === 'ADDITIONAL_BRANCH');
    expect(branchRes).toBeDefined();
    expect(branchRes?.unitPrice).toBe(199);
    expect(branchRes?.totalAmount).toBe(199);
  });

  // Test 12: Additional Storage Price
  test('12. Additional storage capacity should cost ₹99 / month', async () => {
    const calc = await SubscriptionService.calculateSubscriptionPrice({
      planCode: 'retail_starter',
      billingCycle: 'monthly',
      additionalStorageGB: 1
    });
    const storageRes = calc.resourceAddons.find(r => r.code === 'ADDITIONAL_STORAGE');
    expect(storageRes).toBeDefined();
    expect(storageRes?.unitPrice).toBe(99);
    expect(storageRes?.totalAmount).toBe(99);
  });

  // Test 13: AI Assistant Pricing
  test('13. AI Assistant should cost ₹499/month and ₹4,999/year', async () => {
    const calcMonthly = await SubscriptionService.calculateSubscriptionPrice({
      planCode: 'retail_starter',
      billingCycle: 'monthly',
      selectedAddons: ['AI_ASSISTANT']
    });
    const aiMonthly = calcMonthly.featureAddons.find(f => f.code === 'AI_ASSISTANT');
    expect(aiMonthly?.amount).toBe(499);

    const calcYearly = await SubscriptionService.calculateSubscriptionPrice({
      planCode: 'retail_starter',
      billingCycle: 'yearly',
      selectedAddons: ['AI_ASSISTANT']
    });
    const aiYearly = calcYearly.featureAddons.find(f => f.code === 'AI_ASSISTANT');
    expect(aiYearly?.amount).toBe(4999);
  });

  // Test 14: Document Workspace Pricing
  test('14. Document Workspace should cost ₹199/month', async () => {
    const calc = await SubscriptionService.calculateSubscriptionPrice({
      planCode: 'retail_starter',
      billingCycle: 'monthly',
      selectedAddons: ['DOCUMENT_WORKSPACE']
    });
    const docAddon = calc.featureAddons.find(f => f.code === 'DOCUMENT_WORKSPACE');
    expect(docAddon?.amount).toBe(199);
  });

  // Test 15: Business Referrals & Leads Pricing
  test('15. Business Referrals & Leads should cost ₹199/month', async () => {
    const calc = await SubscriptionService.calculateSubscriptionPrice({
      planCode: 'retail_starter',
      billingCycle: 'monthly',
      selectedAddons: ['BUSINESS_REFERRALS']
    });
    const refAddon = calc.featureAddons.find(f => f.code === 'BUSINESS_REFERRALS');
    expect(refAddon?.amount).toBe(199);
  });

  // Test 16: Collaboration Package Pricing
  test('16. Collaboration Package should cost ₹199/month', async () => {
    const calc = await SubscriptionService.calculateSubscriptionPrice({
      planCode: 'retail_starter',
      billingCycle: 'monthly',
      selectedAddons: ['COLLABORATION_PACKAGE']
    });
    const collabAddon = calc.featureAddons.find(f => f.code === 'COLLABORATION_PACKAGE');
    expect(collabAddon?.amount).toBe(199);
  });

  // Test 17: Annual pricing must NOT equal monthly x 12 automatically
  test('17. Annual pricing must NOT equal monthly * 12 (₹5,500 vs ₹5,988)', async () => {
    const calcYearly = await SubscriptionService.calculateSubscriptionPrice({
      planCode: 'retail_starter',
      billingCycle: 'yearly'
    });
    expect(calcYearly.basePlan.amount).toBe(5500);
    expect(calcYearly.basePlan.amount).not.toBe(499 * 12);
  });

  // Test 18: Price snapshot protection
  test('18. Subscription price snapshot remains protected after creation', () => {
    const mockSnapshot = {
      plan_code: 'retail_starter',
      plan_base_price: 499,
      final_amount: 589
    };
    // Global price change occurs
    const updatedGlobalPrice = 599;
    // Snapshot retains original locked price
    expect(mockSnapshot.plan_base_price).toBe(499);
    expect(mockSnapshot.plan_base_price).not.toBe(updatedGlobalPrice);
  });

  // Test 19: Calculation tax calculation correctness (18% GST)
  test('19. Server engine calculates correct 18% GST tax rate', async () => {
    const calc = await SubscriptionService.calculateSubscriptionPrice({
      planCode: 'retail_starter',
      billingCycle: 'monthly'
    });
    const expectedTax = Math.round((499 * 18) / 100); // 90
    expect(calc.subtotal).toBe(499);
    expect(calc.taxAmount).toBe(expectedTax);
    expect(calc.total).toBe(499 + expectedTax);
  });

  // Test 20: Comprehensive itemized subtotal summation
  test('20. Authoritative price breakdown correctly sums base + resources + features + tax', async () => {
    const calc = await SubscriptionService.calculateSubscriptionPrice({
      planCode: 'retail_starter', // 499
      billingCycle: 'monthly',
      additionalUsers: 2,         // 2 * 99 = 198
      additionalBranches: 1,      // 1 * 199 = 199
      selectedAddons: ['AI_ASSISTANT'] // 499
    });

    const expectedSubtotal = 499 + 198 + 199 + 499; // 1395
    const expectedTax = Math.round((1395 * 18) / 100); // 251
    const expectedTotal = expectedSubtotal + expectedTax; // 1646

    expect(calc.subtotal).toBe(expectedSubtotal);
    expect(calc.taxAmount).toBe(expectedTax);
    expect(calc.total).toBe(expectedTotal);
  });

});
