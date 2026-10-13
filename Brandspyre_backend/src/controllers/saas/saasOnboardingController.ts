import { Request, Response } from 'express';
import OnboardingService from '../../services/saas/OnboardingService';
import { isPlatformAdminRole } from '../../middleware/securityContext';

const resolveTenant = (req: Request): string | null => {
  const securityContext = (req as any).securityContext;
  const userRole = (req as any).user?.userRole || (req as any).user?.role;
  const isPlatformAdmin = securityContext?.isPlatformAdmin || isPlatformAdminRole(userRole);
  if (isPlatformAdmin) {
    return (
      (req.query?.tenantId as string) ||
      req.body?.tenantId ||
      ((req.headers?.['x-tenant-id'] || req.headers?.['tenant-id']) as string) ||
      securityContext?.tenantId ||
      (req as any).tenant?.id?.toString() ||
      (req as any).user?.tenantId ||
      null
    );
  }
  return securityContext?.tenantId || (req as any).tenant?.id?.toString() || (req as any).user?.tenantId || null;
};

export const getStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = resolveTenant(req);
    const userRole = (req as any).user?.userRole || (req as any).user?.role;
    const isPlatformAdmin = (req as any).securityContext?.isPlatformAdmin || isPlatformAdminRole(userRole);

    if (!tenantId) {
      if (isPlatformAdmin) {
        res.status(200).json({
          success: true,
          data: {
            current_step: 4,
            is_completed: true,
            completed: true,
            completion_percentage: 100,
            isPlatformAdmin: true
          }
        });
        return;
      }
      res.status(400).json({ error: 'Tenant context is required.' });
      return;
    }

    const progress = await OnboardingService.getProgress(tenantId.toString());
    const progressObj = progress ? (progress.toObject ? progress.toObject() : progress) : {};
    const completionPercentage = progress?.completion_percentage ?? 0;
    const completed = completionPercentage >= 100;

    res.status(200).json({
      success: true,
      data: {
        ...progressObj,
        completion_percentage: completionPercentage,
        completed,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
};

export const updateStep = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = resolveTenant(req);
    const { email_verified, company_setup, branch_created, team_invited, payment_completed } = req.body;

    if (!tenantId) {
      res.status(400).json({ error: 'Tenant context is required.' });
      return;
    }

    const updatedProgress = await OnboardingService.updateStep(tenantId.toString(), {
      email_verified,
      company_setup,
      branch_created,
      team_invited,
      payment_completed
    });

    res.status(200).json({ success: true, data: updatedProgress });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
};

export default {
  getStatus,
  updateStep
};
