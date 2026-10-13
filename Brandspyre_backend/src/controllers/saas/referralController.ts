import { Request, Response } from 'express';
import ReferralService from '../../services/saas/ReferralService';

export const createReferral = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).user?.tenantId || (req as any).tenant?.id || req.body.sourceTenantId;
    const userId = (req as any).user?.userId || req.body.createdByUserId;

    if (!userId) {
      res.status(400).json({ success: false, error: 'User context is required.' });
      return;
    }

    const referral = await ReferralService.createReferral({
      ...req.body,
      sourceTenantId: tenantId,
      createdByUserId: userId
    });

    res.status(201).json({ success: true, data: referral });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMarketplace = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).user?.tenantId || (req as any).tenant?.id;
    const referrals = await ReferralService.getMarketplace(tenantId, req.query);
    res.status(200).json({ success: true, data: referrals });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMyPublishedReferrals = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).user?.tenantId || (req as any).tenant?.id;
    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Tenant context is required.' });
      return;
    }
    const referrals = await ReferralService.getMyPublishedReferrals(tenantId);
    res.status(200).json({ success: true, data: referrals });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getReceivedReferrals = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).user?.tenantId || (req as any).tenant?.id;
    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Tenant context is required.' });
      return;
    }
    const referrals = await ReferralService.getReceivedReferrals(tenantId);
    res.status(200).json({ success: true, data: referrals });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getReferralById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user?.tenantId || (req as any).tenant?.id;
    const userRole = (req as any).user?.role || '';
    const isPlatformAdmin = ['superadmin', 'platform_superadmin', 'master_super_admin'].includes(userRole.toLowerCase());

    const referral = await ReferralService.getReferralById(id, tenantId, isPlatformAdmin);
    res.status(200).json({ success: true, data: referral });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
};

export const togglePublishState = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user?.tenantId || (req as any).tenant?.id;
    const userRole = (req as any).user?.role || '';
    const isPlatformAdmin = ['superadmin', 'platform_superadmin', 'master_super_admin'].includes(userRole.toLowerCase());

    const referral = await ReferralService.togglePublishState(id, tenantId, isPlatformAdmin);
    res.status(200).json({ success: true, data: referral });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const requestReferral = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user?.tenantId || (req as any).tenant?.id;
    const userId = (req as any).user?.userId;
    const { message, proposedTerms } = req.body;

    if (!tenantId || !userId) {
      res.status(400).json({ success: false, error: 'User and tenant context are required.' });
      return;
    }

    const requestRecord = await ReferralService.requestReferral(id, tenantId, userId, message, proposedTerms);
    res.status(201).json({ success: true, data: requestRecord });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const approveRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // Request ID
    const tenantId = (req as any).user?.tenantId || (req as any).tenant?.id;
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role || '';
    const isPlatformAdmin = ['superadmin', 'platform_superadmin', 'master_super_admin'].includes(userRole.toLowerCase());

    const result = await ReferralService.approveRequest(id, tenantId, userId, isPlatformAdmin);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const rejectRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // Request ID
    const { rejectionReason } = req.body;
    const tenantId = (req as any).user?.tenantId || (req as any).tenant?.id;
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role || '';
    const isPlatformAdmin = ['superadmin', 'platform_superadmin', 'master_super_admin'].includes(userRole.toLowerCase());

    const result = await ReferralService.rejectRequest(id, rejectionReason, tenantId, userId, isPlatformAdmin);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const assignProcessor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // Referral ID
    const { processorUserId } = req.body;
    const tenantId = (req as any).user?.tenantId || (req as any).tenant?.id;

    if (!tenantId || !processorUserId) {
      res.status(400).json({ success: false, error: 'Tenant context and processor user ID are required.' });
      return;
    }

    const participant = await ReferralService.assignProcessor(id, processorUserId, tenantId);
    res.status(200).json({ success: true, data: participant });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // Referral ID
    const { status } = req.body;
    const tenantId = (req as any).user?.tenantId || (req as any).tenant?.id;
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role || '';
    const isPlatformAdmin = ['superadmin', 'platform_superadmin', 'master_super_admin'].includes(userRole.toLowerCase());

    const result = await ReferralService.updateStatus(id, status, tenantId, userId, isPlatformAdmin);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).user?.tenantId || (req as any).tenant?.id;
    const userRole = (req as any).user?.role || '';
    const isPlatformAdmin = ['superadmin', 'platform_superadmin', 'master_super_admin'].includes(userRole.toLowerCase());

    const analytics = await ReferralService.getAnalytics(tenantId, isPlatformAdmin);
    res.status(200).json({ success: true, data: analytics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPartnerNetwork = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).user?.tenantId || (req as any).tenant?.id;
    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Tenant context is required.' });
      return;
    }
    const partners = await ReferralService.getPartnerNetwork(tenantId);
    res.status(200).json({ success: true, data: partners });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllRequestsForAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const requests = await ReferralService.getAllRequestsForAdmin();
    res.status(200).json({ success: true, data: requests });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
