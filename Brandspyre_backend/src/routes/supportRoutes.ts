import { Router, Request, Response } from 'express';
import authMiddleware from '../middleware/auth';
import { tenantAuth } from '../middleware/tenantAuth';
import SupportTicketService from '../services/saas/SupportTicketService';
import { Tenant } from '../db/ModelSceham/saasSchema';
import mongoose from 'mongoose';

const router = Router();

router.use(authMiddleware);
router.use(tenantAuth());

// GET all tickets for logged-in organization or global admin queue
router.get('/tickets', async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = ((req as any).user?.userRole || (req as any).user?.role || '').toLowerCase();
    const isPlatformAdmin = ['superadmin', 'platform_superadmin', 'master_super_admin', 'platform_admin', 'super admin'].includes(userRole);
    let tenantId = (req as any).tenant?.id || (req as any).user?.tenantId;

    const { status, priority, search, page, limit } = req.query;

    const result = await SupportTicketService.getTickets({
      tenantId: (!isPlatformAdmin && tenantId) ? tenantId.toString() : (tenantId ? tenantId.toString() : undefined),
      status: status as string,
      priority: priority as string,
      search: search as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20
    });

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error in GET /tickets:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin Ticket Queue
router.get('/admin/tickets', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, priority, search, page, limit } = req.query;
    const result = await SupportTicketService.getTickets({
      status: status as string,
      priority: priority as string,
      search: search as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50
    });
    const metrics = await SupportTicketService.getSupportMetrics();

    res.status(200).json({ success: true, data: { tickets: result.tickets, total: result.total, metrics } });
  } catch (error: any) {
    console.error('Error in GET /admin/tickets:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create a new support ticket
router.post('/tickets', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    let tenantId = (req as any).securityContext?.tenantId || (req as any).tenant?.id || user?.tenantId;

    if (!tenantId) {
      res.status(403).json({ success: false, error: 'Tenant context required to create support ticket' });
      return;
    }

    const { subject, category, priority, description, attachments } = req.body;
    const ticket = await SupportTicketService.createTicket({
      tenantId: tenantId.toString(),
      userId: (user?.userId || user?.id || 'admin').toString(),
      userName: `${user?.firstname || ''} ${user?.lastname || ''}`.trim() || user?.email || 'User',
      userEmail: user?.email || '',
      subject: subject || 'Support Inquiry',
      category: category || 'TECHNICAL',
      priority: priority || 'MEDIUM',
      description: description || '',
      attachments
    });

    res.status(201).json({ success: true, data: ticket });
  } catch (error: any) {
    console.error('Error in POST /tickets:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST reply to a ticket
router.post('/tickets/:id/reply', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const { message, attachments, isInternalNote, newStatus, status } = req.body;

    const userRole = (user?.userRole || user?.role || '').toLowerCase();
    const isAdmin = ['platform_admin', 'master_super_admin', 'platform_superadmin', 'superadmin', 'super admin'].includes(userRole);

    const ticket = await SupportTicketService.addReply(id, {
      senderId: (user?.userId || user?.id || 'admin').toString(),
      senderName: `${user?.firstname || ''} ${user?.lastname || ''}`.trim() || user?.email || 'User',
      senderRole: isAdmin ? 'admin' : 'customer',
      message: message || 'Status updated',
      attachments,
      isInternalNote: isAdmin ? !!isInternalNote : false,
      newStatus: newStatus || status
    });

    if (!ticket) {
      res.status(404).json({ success: false, error: 'Support ticket not found' });
      return;
    }

    res.status(200).json({ success: true, data: ticket });
  } catch (error: any) {
    console.error('Error in POST /tickets/:id/reply:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
