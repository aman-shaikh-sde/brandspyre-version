import mongoose from 'mongoose';
import { Tenant, UserTenant } from '../../db/ModelSceham/saasSchema';
import { UserInfo } from '../../db/ModelSceham/userSchema';
import { Notification } from '../../db/ModelSceham/Notification/notification';

export class NotificationService {
  /**
   * Send in-app notification to all admins of a tenant
   */
  static async notifyTenantAdmins(params: {
    tenantId: string | mongoose.Types.ObjectId;
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'alert' | 'success';
    category?: string;
  }) {
    try {
      const { tenantId, title, message, type = 'info', category = 'subscription' } = params;
      const tId = new mongoose.Types.ObjectId(tenantId.toString());

      // Find all admin users for this tenant
      const adminAssociations = await UserTenant.find({
        tenant_id: tId,
        role: { $in: ['admin', 'owner', 'org_owner', 'Super Admin'] }
      });

      const adminUserIds = adminAssociations.map(a => a.user_id);

      // Create notification for each admin
      for (const userId of adminUserIds) {
        await Notification.create({
          tenant_id: tId,
          user_id: userId,
          title,
          message,
          type,
          category,
          is_read: false,
          created_at: new Date()
        }).catch(() => {});
      }

      console.log(`[NotificationService] Sent '${title}' to ${adminUserIds.length} admins of tenant ${tenantId}`);
    } catch (err) {
      console.error('[NotificationService] Error sending tenant admin notification:', err);
    }
  }

  /**
   * Send expiry warning notification (30, 15, 7, 5, 3, 1 days)
   */
  static async sendExpiryWarning(tenantId: string, daysRemaining: number, planName: string) {
    const title = daysRemaining === 1 
      ? '⚠️ CRITICAL: Subscription Expires Tomorrow!' 
      : `Subscription Expiring in ${daysRemaining} Days`;
      
    const message = `Your ${planName} subscription will expire in ${daysRemaining} day(s). Please renew now to avoid service interruption and account suspension.`;

    await this.notifyTenantAdmins({
      tenantId,
      title,
      message,
      type: daysRemaining <= 3 ? 'alert' : 'warning',
      category: 'subscription_expiry'
    });
  }

  /**
   * Send subscription expired notice
   */
  static async sendExpiredNotice(tenantId: string, graceDays: number) {
    const title = '🚨 Subscription Expired — Grace Period Active';
    const message = `Your subscription has expired. You have entered a ${graceDays}-day grace period. Renew now to restore full service access and avoid account lockout.`;

    await this.notifyTenantAdmins({
      tenantId,
      title,
      message,
      type: 'alert',
      category: 'subscription_expired'
    });
  }

  /**
   * Send account locked notice
   */
  static async sendAccountLockedNotice(tenantId: string) {
    const title = '🔒 Account Suspended — Subscription & Grace Period Expired';
    const message = 'Your organization account has been suspended due to expired subscription. Please log in and renew your plan immediately to reactivate access.';

    await this.notifyTenantAdmins({
      tenantId,
      title,
      message,
      type: 'alert',
      category: 'account_locked'
    });
  }

  /**
   * Send payment success notice
   */
  static async sendPaymentSuccessNotice(tenantId: string, planName: string, amount: number) {
    const title = '✅ Payment Received & Subscription Activated!';
    const message = `Thank you! Payment of ₹${amount} for your ${planName} subscription was processed successfully. Your account is fully active.`;

    await this.notifyTenantAdmins({
      tenantId,
      title,
      message,
      type: 'success',
      category: 'payment_success'
    });
  }
}

export default NotificationService;
