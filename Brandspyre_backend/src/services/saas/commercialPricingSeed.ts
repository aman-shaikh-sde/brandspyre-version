import { SubscriptionPlan } from '../../db/ModelSceham/saasSchema';
import { Addon, ModulePricing } from '../../db/ModelSceham/pricingSchema';

/**
 * Commercial Pricing Source of Truth Seeder
 * Seeds exact retail, business & services subscription plans, resource add-ons,
 * feature add-ons, and collaboration package into the database.
 */
export async function seedCommercialPricingData() {
  try {
    console.log('🌱 Seeding Commercial Pricing Source of Truth...');

    // 1. RETAIL PACKAGE PLANS
    const retailPlans = [
      {
        plan_code: 'retail_starter',
        plan_name: 'Retail Starter',
        commercial_category: 'RETAIL_PACKAGE',
        monthly_price_type: 'FIXED',
        yearly_price_type: 'FIXED',
        users_limit_type: 'FIXED',
        branches_limit_type: 'FIXED',
        price_monthly: 499,
        price_yearly: 5500,
        max_users: 5,
        max_branches: 1,
        description: 'Ideal for single-store retail counters & small shop owners.',
        badge_label: 'Popular for Retail',
        sort_order: 10,
        is_active: true,
        is_public: true
      },
      {
        plan_code: 'retail_business',
        plan_name: 'Retail Business',
        commercial_category: 'RETAIL_PACKAGE',
        monthly_price_type: 'FIXED',
        yearly_price_type: 'FIXED',
        users_limit_type: 'FIXED',
        branches_limit_type: 'FIXED',
        price_monthly: 799,
        price_yearly: 8500,
        max_users: 20,
        max_branches: 2,
        description: 'Growing multi-counter retail stores & supermarkets.',
        badge_label: 'Best Value',
        sort_order: 20,
        is_active: true,
        is_public: true
      },
      {
        plan_code: 'retail_professional',
        plan_name: 'Retail Professional',
        commercial_category: 'RETAIL_PACKAGE',
        monthly_price_type: 'FIXED',
        yearly_price_type: 'FIXED',
        users_limit_type: 'FIXED',
        branches_limit_type: 'FIXED',
        price_monthly: 1499,
        price_yearly: 16500,
        max_users: 40,
        max_branches: 5,
        description: 'Multi-branch retail chains & large warehouses.',
        sort_order: 30,
        is_active: true,
        is_public: true
      },
      {
        plan_code: 'retail_enterprise',
        plan_name: 'Retail Enterprise',
        commercial_category: 'RETAIL_PACKAGE',
        monthly_price_type: 'STARTING_FROM',
        yearly_price_type: 'STARTING_FROM',
        users_limit_type: 'CUSTOM',
        branches_limit_type: 'CUSTOM',
        price_monthly: 3499,
        price_yearly: 36500,
        max_users: 50,
        max_branches: 10,
        description: 'Custom multi-region retail enterprises.',
        badge_label: 'Enterprise',
        sort_order: 40,
        is_active: true,
        is_public: true
      }
    ];

    // 2. BUSINESS & SERVICES PACKAGE PLANS
    const bizServicesPlans = [
      {
        plan_code: 'biz_starter',
        plan_name: 'Business & Services Starter',
        commercial_category: 'BUSINESS_SERVICES_PACKAGE',
        monthly_price_type: 'FIXED',
        yearly_price_type: 'FIXED',
        users_limit_type: 'FIXED',
        branches_limit_type: 'FIXED',
        price_monthly: 599,
        price_yearly: 6500,
        max_users: 10,
        max_branches: 1,
        description: 'For IT software, consulting & small agency teams.',
        sort_order: 110,
        is_active: true,
        is_public: true
      },
      {
        plan_code: 'biz_business',
        plan_name: 'Business & Services Business',
        commercial_category: 'BUSINESS_SERVICES_PACKAGE',
        monthly_price_type: 'FIXED',
        yearly_price_type: 'FIXED',
        users_limit_type: 'FIXED',
        branches_limit_type: 'FIXED',
        price_monthly: 899,
        price_yearly: 9500,
        max_users: 30,
        max_branches: 2,
        description: 'Mid-sized corporate service companies & B2B vendors.',
        badge_label: 'Popular Services',
        sort_order: 120,
        is_active: true,
        is_public: true
      },
      {
        plan_code: 'biz_professional',
        plan_name: 'Business & Services Professional',
        commercial_category: 'BUSINESS_SERVICES_PACKAGE',
        monthly_price_type: 'FIXED',
        yearly_price_type: 'FIXED',
        users_limit_type: 'FIXED',
        branches_limit_type: 'FIXED',
        price_monthly: 1699,
        price_yearly: 18500,
        max_users: 60,
        max_branches: 5,
        description: 'Large consulting firms, B2B networks & agency hubs.',
        sort_order: 130,
        is_active: true,
        is_public: true
      },
      {
        plan_code: 'biz_enterprise',
        plan_name: 'Business & Services Enterprise',
        commercial_category: 'BUSINESS_SERVICES_PACKAGE',
        monthly_price_type: 'STARTING_FROM',
        yearly_price_type: 'STARTING_FROM',
        users_limit_type: 'CUSTOM',
        branches_limit_type: 'CUSTOM',
        price_monthly: 4999,
        price_yearly: 50000,
        max_users: 60,
        max_branches: 10,
        description: 'Custom corporate B2B enterprises & multi-national groups.',
        badge_label: 'Enterprise',
        sort_order: 140,
        is_active: true,
        is_public: true
      }
    ];

    const allPlans = [...retailPlans, ...bizServicesPlans];
    let createdPlansCount = 0;
    for (const p of allPlans) {
      const existing = await SubscriptionPlan.findOne({ plan_code: p.plan_code });
      if (!existing) {
        await SubscriptionPlan.create({ ...p, created_at: new Date(), updated_at: new Date() });
        createdPlansCount++;
      }
    }
    console.log(`✅ Commercial subscription plans checked (${createdPlansCount} newly seeded).`);

    // 3. RESOURCE & FEATURE ADD-ONS
    const addonsData = [
      {
        addon_code: 'ADDITIONAL_USER',
        name: 'Additional User',
        type: 'RESOURCE',
        monthly_price: 99,
        yearly_price: null,
        currency: 'INR',
        description: 'Add +1 staff user slot to your organization.',
        sort_order: 1,
        is_active: true
      },
      {
        addon_code: 'ADDITIONAL_BRANCH',
        name: 'Additional Branch',
        type: 'RESOURCE',
        monthly_price: 199,
        yearly_price: null,
        currency: 'INR',
        description: 'Add +1 physical branch / office location.',
        sort_order: 2,
        is_active: true
      },
      {
        addon_code: 'ADDITIONAL_STORAGE',
        name: 'Additional Storage',
        type: 'RESOURCE',
        monthly_price: 99,
        yearly_price: null,
        currency: 'INR',
        description: 'Add +10 GB document cloud storage capacity.',
        sort_order: 3,
        is_active: true
      },
      {
        addon_code: 'AI_ASSISTANT',
        name: 'AI Assistant',
        type: 'FEATURE',
        monthly_price: 499,
        yearly_price: 4999,
        currency: 'INR',
        description: 'AI predictive analytics & automated document summaries.',
        sort_order: 10,
        is_active: true
      },
      {
        addon_code: 'DOCUMENT_WORKSPACE',
        name: 'Document Workspace',
        type: 'FEATURE',
        monthly_price: 199,
        yearly_price: null,
        currency: 'INR',
        description: 'Shared enterprise document repository & e-signatures.',
        sort_order: 11,
        is_active: true
      },
      {
        addon_code: 'BUSINESS_REFERRALS',
        name: 'Business Referrals & Leads',
        type: 'FEATURE',
        monthly_price: 199,
        yearly_price: null,
        currency: 'INR',
        description: 'Lead exchange network & partner referral management.',
        sort_order: 12,
        is_active: true
      },
      {
        addon_code: 'COLLABORATION_PACKAGE',
        name: 'Collaboration Package',
        type: 'BUNDLE',
        monthly_price: 199,
        yearly_price: null,
        currency: 'INR',
        description: 'Only Meeting & Calendar, Employees, Events, MOM.',
        included_module_codes: ['MEETINGS', 'CALENDAR', 'EMPLOYEES', 'EVENTS', 'MOM'],
        sort_order: 20,
        is_active: true
      }
    ];

    let createdAddonsCount = 0;
    for (const a of addonsData) {
      const existing = await Addon.findOne({ addon_code: a.addon_code });
      if (!existing) {
        await Addon.create({ ...a, created_at: new Date(), updated_at: new Date() });
        createdAddonsCount++;
      }
    }
    console.log(`✅ Resource & feature add-ons checked (${createdAddonsCount} newly seeded).`);

  } catch (err) {
    console.error('❌ Error seeding commercial pricing data:', err);
  }
}
