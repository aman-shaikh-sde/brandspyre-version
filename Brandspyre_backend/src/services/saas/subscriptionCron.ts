import mongoose from 'mongoose';
import { TenantSubscription, SubscriptionPlan, Tenant } from '../../db/ModelSceham/saasSchema';
import { UserInfo } from '../../db/ModelSceham/userSchema';
import SubscriptionLifecycleService from './SubscriptionLifecycleService';
import NotificationService from './NotificationService';
import EmailService from '../email/EmailService';

export class SubscriptionCronService {
  private static timerId: NodeJS.Timeout | null = null;
  private static isRunning = false;

  /**
   * Start the background cron runner (checks hourly, runs daily logic)
   */
  static start(intervalMs: number = 60 * 60 * 1000) { // Default 1 hour
    if (this.timerId) return;

    console.log('⏰ Starting Subscription System Background Cron Worker...');
    
    // Run immediately on boot
    this.runJob().catch(err => console.error('Initial cron job failed:', err));

    // Schedule periodic execution
    this.timerId = setInterval(() => {
      this.runJob().catch(err => console.error('Periodic cron job failed:', err));
    }, intervalMs);
  }

  /**
   * Stop the background worker
   */
  static stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
      console.log('🛑 Stopped Subscription System Background Cron Worker.');
    }
  }

  /**
   * Execute full subscription lifecycle check and notification dispatch
   */
  static async runJob() {
    if (this.isRunning) return;

    // SECURITY: Distributed Lock Check for Multi-Instance Deployments
    const lockKey = `cron_subscription_lock_${new Date().toISOString().slice(0, 10)}`;
    const hasLock = await this.acquireDistributedLock(lockKey, 45 * 60 * 1000); // 45 minute lock
    if (!hasLock) {
      console.log(`[SubscriptionCron] Skipped: Lock '${lockKey}' already held by another server pod.`);
      return;
    }

    this.isRunning = true;

    try {
      const now = new Date();
      console.log(`[SubscriptionCron] Running daily lifecycle check at ${now.toISOString()}...`);

      // 1. Process active/trial subscriptions past end date
      const expiredSubs = await TenantSubscription.find({
        status: { $in: ['active', 'trial'] },
        $or: [
          { status: 'trial', trial_end_date: { $lt: now } },
          { status: 'active', end_date: { $lt: now } }
        ]
      });

      for (const sub of expiredSubs) {
        const graceDays = sub.grace_period_days || 7;
        console.log(`[SubscriptionCron] Subscription for tenant ${sub.tenant_id} expired. Entering ${graceDays}-day grace period.`);
        await SubscriptionLifecycleService.enterGracePeriod(sub.tenant_id.toString());
        await NotificationService.sendExpiredNotice(sub.tenant_id.toString(), graceDays);
      }

      // 2. Process grace subscriptions past grace_end_date -> lock account
      const graceExpiredSubs = await TenantSubscription.find({
        status: 'grace',
        grace_end_date: { $lt: now }
      });

      for (const sub of graceExpiredSubs) {
        console.log(`[SubscriptionCron] Grace period expired for tenant ${sub.tenant_id}. Locking account.`);
        await SubscriptionLifecycleService.lockAccount(
          sub.tenant_id.toString(),
          'Subscription and grace period have expired. Account locked.'
        );
        await NotificationService.sendAccountLockedNotice(sub.tenant_id.toString());
      }

      // 3. Process 30, 15, 7, 5, 3, 1 day expiry warnings
      const warningIntervals = [30, 15, 7, 5, 3, 1];
      const activeSubs = await TenantSubscription.find({
        status: { $in: ['active', 'trial'] }
      });

      for (const sub of activeSubs) {
        const endDate = sub.status === 'trial' ? (sub.trial_end_date || sub.end_date) : sub.end_date;
        if (!endDate) continue;

        const diffMs = endDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (warningIntervals.includes(daysLeft)) {
          let plan = null;
          if (sub.plan_id && mongoose.Types.ObjectId.isValid(sub.plan_id)) {
            plan = await SubscriptionPlan.findById(sub.plan_id);
          } else if (sub.plan_id) {
            plan = await SubscriptionPlan.findOne({ plan_code: sub.plan_id.toString().toLowerCase() });
          }
          const planName = plan?.plan_name || 'Subscription';
          await NotificationService.sendExpiryWarning(sub.tenant_id.toString(), daysLeft, planName);

          // Asynchronously send email expiry reminder to tenant admin
          (async () => {
            try {
              const tenant = await Tenant.findById(sub.tenant_id);
              if (tenant) {
                const adminUser = await UserInfo.findOne({
                  tenant_id: sub.tenant_id,
                  role: { $in: ['admin', 'owner', 'org_owner', 'Super Admin'] }
                });
                const recipientEmail = tenant.billing_email || adminUser?.email;
                if (recipientEmail) {
                  await EmailService.sendSubscriptionExpiryWarningEmail({
                    tenant,
                    recipientEmail,
                    adminName: adminUser ? `${adminUser.firstname} ${adminUser.lastname || ''}`.trim() : 'Admin',
                    daysRemaining: daysLeft,
                    planName,
                    endDate
                  });
                }
              }
            } catch (emailErr) {
              console.warn('[SubscriptionCron] Expiry email dispatch notice:', emailErr);
            }
          })();
        }
      }

      console.log('[SubscriptionCron] Daily subscription lifecycle check completed cleanly.');
    } catch (error) {
      console.error('[SubscriptionCron] Error running subscription cron job:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Atomic MongoDB lock acquisition for multi-instance deployments
   */
  private static async acquireDistributedLock(lockKey: string, lockDurationMs: number): Promise<boolean> {
    try {
      const { WebhookEventLog } = require('../../db/ModelSceham/saasSchema');
      const now = new Date();
      await WebhookEventLog.create({
        event_id: lockKey,
        provider: 'cron',
        event_type: 'subscription_lifecycle',
        status: 'locked',
        created_at: now
      });
      return true;
    } catch (err: any) {
      if (err.code === 11000 || (err.message && err.message.includes('duplicate key'))) {
        return false;
      }
      return false;
    }
  }
}

export default SubscriptionCronService;
