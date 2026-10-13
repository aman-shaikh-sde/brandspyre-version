import mongoose from 'mongoose';
import { SupportTicket, ISupportTicket } from '../../db/ModelSceham/supportTicketSchema';
import { NotificationService } from './NotificationService';
import { UserInfo } from '../../db/ModelSceham/userSchema';
import { Tenant } from '../../db/ModelSceham/saasSchema';

export class SupportTicketService {
  /**
   * Safe helper to convert any string/number/id to a valid mongoose ObjectId
   */
  private static async toObjectId(id: string | any, fallbackModel?: any): Promise<mongoose.Types.ObjectId> {
    if (!id) return new mongoose.Types.ObjectId();
    if (id instanceof mongoose.Types.ObjectId) return id;
    const strId = String(id).trim();

    if (mongoose.Types.ObjectId.isValid(strId) && strId.length === 24) {
      return new mongoose.Types.ObjectId(strId);
    }

    if (fallbackModel) {
      try {
        const doc = await fallbackModel.findOne({
          $or: [
            { staff_id: strId },
            { tenant_code: strId },
            { email: strId },
            { slug: strId }
          ]
        });
        if (doc && doc._id) return doc._id;
      } catch (e) {}
    }

    return new mongoose.Types.ObjectId();
  }

  /**
   * Generate sequential ticket number (e.g. TICK-10042)
   */
  private static async generateTicketNumber(): Promise<string> {
    const count = await SupportTicket.countDocuments();
    const nextSeq = 10001 + count;
    return `TICK-${nextSeq}`;
  }

  /**
   * Create a new support ticket
   */
  static async createTicket(data: {
    tenantId: string;
    userId: string;
    userName: string;
    userEmail: string;
    subject: string;
    category?: string;
    priority?: string;
    description: string;
    attachments?: string[];
  }): Promise<ISupportTicket> {
    const ticketNumber = await this.generateTicketNumber();
    const tenantObjId = await this.toObjectId(data.tenantId, Tenant);
    const userObjId = await this.toObjectId(data.userId, UserInfo);

    let finalEmail = (data.userEmail || '').trim();
    let finalName = (data.userName || '').trim();

    if (!finalEmail || !finalName) {
      try {
        const userDoc = await UserInfo.findById(userObjId).lean() as any;
        if (userDoc) {
          if (!finalEmail && userDoc.email) finalEmail = userDoc.email;
          if (!finalName && (userDoc.firstname || userDoc.username)) {
            finalName = `${userDoc.firstname || ''} ${userDoc.lastname || ''}`.trim() || userDoc.username;
          }
        }
      } catch (e) {}
    }

    if (!finalEmail) finalEmail = 'platformadmin@gmail.com';
    if (!finalName) finalName = 'Support User';

    const ticket = await SupportTicket.create({
      ticket_number: ticketNumber,
      tenant_id: tenantObjId,
      created_by: userObjId,
      created_by_name: finalName,
      created_by_email: finalEmail,
      subject: data.subject || 'Support Inquiry',
      category: data.category || 'TECHNICAL',
      priority: data.priority || 'MEDIUM',
      status: 'OPEN',
      description: data.description || '',
      attachments: data.attachments || [],
      replies: []
    });

    // Notify Platform Admins & Tenant Admins about new ticket
    try {
      await NotificationService.notifyTenantAdmins({
        tenantId: data.tenantId,
        title: `Support Ticket Created: ${ticketNumber}`,
        message: `Support ticket '${data.subject}' has been submitted.`,
        type: 'info',
        category: 'support_ticket'
      });
    } catch (e) {
      // Continue even if notification fails
    }

    return ticket;
  }

  /**
   * Add a reply or internal note to a ticket
   */
  static async addReply(
    ticketId: string,
    replyData: {
      senderId: string;
      senderName: string;
      senderRole: 'customer' | 'admin';
      message: string;
      attachments?: string[];
      isInternalNote?: boolean;
      newStatus?: string;
    }
  ): Promise<ISupportTicket | null> {
    if (!mongoose.Types.ObjectId.isValid(ticketId)) return null;
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) return null;

    const senderObjId = await this.toObjectId(replyData.senderId, UserInfo);

    ticket.replies.push({
      sender_id: senderObjId,
      sender_name: replyData.senderName || 'Support Representative',
      sender_role: replyData.senderRole || 'customer',
      message: replyData.message || '',
      attachments: replyData.attachments || [],
      is_internal_note: !!replyData.isInternalNote,
      created_at: new Date()
    });

    if (replyData.newStatus) {
      ticket.status = replyData.newStatus as any;
      if (replyData.newStatus === 'RESOLVED' || replyData.newStatus === 'CLOSED') {
        ticket.resolved_at = new Date();
      }
    } else if (replyData.senderRole === 'admin' && !replyData.isInternalNote) {
      ticket.status = 'WAITING_FOR_CUSTOMER';
    } else if (replyData.senderRole === 'customer') {
      ticket.status = 'IN_PROGRESS';
    }

    ticket.updated_at = new Date();
    await ticket.save();

    // Send Notification to Customer or Admin
    try {
      if (replyData.senderRole === 'admin' && !replyData.isInternalNote) {
        await NotificationService.notifyTenantAdmins({
          tenantId: ticket.tenant_id.toString(),
          title: `Update on Ticket ${ticket.ticket_number}`,
          message: `Support team replied to your query: '${ticket.subject}'`,
          type: 'info',
          category: 'support_ticket'
        });
      }
    } catch (e) {
      // Continue
    }

    return ticket;
  }

  /**
   * Get tickets with filters & pagination
   */
  static async getTickets(filter: {
    tenantId?: string;
    assignedAdmin?: string;
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const query: any = {};

    if (filter.tenantId && mongoose.Types.ObjectId.isValid(filter.tenantId)) {
      query.tenant_id = new mongoose.Types.ObjectId(filter.tenantId);
    }
    if (filter.assignedAdmin && mongoose.Types.ObjectId.isValid(filter.assignedAdmin)) {
      query.assigned_admin = new mongoose.Types.ObjectId(filter.assignedAdmin);
    }
    if (filter.status) {
      query.status = filter.status;
    }
    if (filter.priority) {
      query.priority = filter.priority;
    }
    if (filter.category) {
      query.category = filter.category;
    }
    if (filter.search) {
      query.$or = [
        { ticket_number: new RegExp(filter.search, 'i') },
        { subject: new RegExp(filter.search, 'i') },
        { description: new RegExp(filter.search, 'i') },
        { created_by_name: new RegExp(filter.search, 'i') }
      ];
    }

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const tickets = await SupportTicket.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate('tenant_id', 'company_name name slug');

    const total = await SupportTicket.countDocuments(query);

    return {
      tickets,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Get platform admin support dashboard summary metrics
   */
  static async getSupportMetrics() {
    const [total, open, inProgress, waitingForCustomer, urgent, resolvedToday] = await Promise.all([
      SupportTicket.countDocuments(),
      SupportTicket.countDocuments({ status: 'OPEN' }),
      SupportTicket.countDocuments({ status: 'IN_PROGRESS' }),
      SupportTicket.countDocuments({ status: 'WAITING_FOR_CUSTOMER' }),
      SupportTicket.countDocuments({ priority: 'URGENT', status: { $nin: ['RESOLVED', 'CLOSED'] } }),
      SupportTicket.countDocuments({
        status: 'RESOLVED',
        resolved_at: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      })
    ]);

    return {
      total,
      open,
      inProgress,
      waitingForCustomer,
      urgent,
      resolvedToday
    };
  }
}

export default SupportTicketService;
