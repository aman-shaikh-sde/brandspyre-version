import mongoose from 'mongoose';
import { OnboardingProgress, IOnboardingProgress } from '../../db/ModelSceham/saasSchema';

export class OnboardingService {
  /**
   * Initializes onboarding progress record for a new tenant.
   */
  static async initializeProgress(
    tenantId: mongoose.Types.ObjectId,
    session?: mongoose.ClientSession
  ): Promise<IOnboardingProgress> {
    const progressData = {
      tenant_id: tenantId,
      email_verified: false,
      company_setup: true,
      branch_created: true,
      team_invited: false,
      payment_completed: false,
      completion_percentage: 40,
      updated_at: new Date()
    };

    if (session) {
      const [res] = await OnboardingProgress.create([progressData], { session });
      return res;
    } else {
      return await OnboardingProgress.create(progressData);
    }
  }

  /**
   * Updates specific onboarding steps and calculates completion percentage.
   */
  static async updateStep(
    tenantId: string,
    updates: Partial<Pick<IOnboardingProgress, 'email_verified' | 'company_setup' | 'branch_created' | 'team_invited' | 'payment_completed'>>,
    session?: mongoose.ClientSession
  ): Promise<IOnboardingProgress | null> {
    let query = OnboardingProgress.findOne({ tenant_id: tenantId });
    if (session) query.session(session);
    let progress = await query;

    if (!progress) {
      progress = await this.initializeProgress(new mongoose.Types.ObjectId(tenantId), session);
    }

    if (updates.email_verified !== undefined) progress.email_verified = updates.email_verified;
    if (updates.company_setup !== undefined) progress.company_setup = updates.company_setup;
    if (updates.branch_created !== undefined) progress.branch_created = updates.branch_created;
    if (updates.team_invited !== undefined) progress.team_invited = updates.team_invited;
    if (updates.payment_completed !== undefined) progress.payment_completed = updates.payment_completed;

    // Calculate percentage based on 5 milestones (20% each)
    let score = 0;
    if (progress.email_verified) score += 20;
    if (progress.company_setup) score += 20;
    if (progress.branch_created) score += 20;
    if (progress.team_invited) score += 20;
    if (progress.payment_completed) score += 20;

    progress.completion_percentage = score;
    progress.updated_at = new Date();

    if (session) {
      await progress.save({ session });
    } else {
      await progress.save();
    }

    return progress;
  }

  /**
   * Gets onboarding progress for a tenant.
   */
  static async getProgress(tenantId: string): Promise<IOnboardingProgress | null> {
    return await OnboardingProgress.findOne({ tenant_id: tenantId });
  }
}

export default OnboardingService;
