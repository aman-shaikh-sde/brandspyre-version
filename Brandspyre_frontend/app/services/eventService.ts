import { apiClient } from "src/services/apiClient";
import axios from "axios";
import { BASE_URL } from "~/constants/api";

// Public unauthenticated axios client
const publicClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" }
});

export const eventService = {
  // ============================================================
  // PUBLIC MARKETPLACE & CHECKOUT
  // ============================================================
  async getPublicEvents(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    city?: string;
    event_type?: string;
    date_filter?: string;
  } = {}) {
    const res = await publicClient.get("/public/events", { params });
    return res.data;
  },

  async getPublicEventDetails(slugOrId: string) {
    const res = await publicClient.get(`/public/events/${slugOrId}`);
    return res.data;
  },

  async initiateCheckout(payload: {
    event_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    items: Array<{
      type: 'TICKET' | 'ADDON';
      item_id: string;
      variant_name?: string;
      quantity: number;
      attendee_info?: {
        name: string;
        email: string;
        phone?: string;
        answers?: Record<string, any>;
      };
    }>;
  }) {
    const res = await publicClient.post("/public/events/checkout/initiate", payload);
    return res.data;
  },

  async verifyCheckoutPayment(payload: {
    order_id: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) {
    const res = await publicClient.post("/public/events/checkout/verify", payload);
    return res.data;
  },

  async getOrderDetails(orderId: string) {
    const res = await publicClient.get(`/public/events/orders/${orderId}`);
    return res.data;
  },

  async resendOrderConfirmation(orderId: string) {
    const res = await publicClient.post(`/public/events/orders/${orderId}/resend-confirmation`);
    return res.data;
  },

  async verifyTicketQr(qrToken: string) {
    const res = await publicClient.get(`/public/events/tickets/verify/${qrToken}`);
    return res.data;
  },

  // ============================================================
  // ORGANIZER WORKSPACE
  // ============================================================
  async getOrganizerStats() {
    const res = await apiClient.get("/events/dashboard-stats");
    return res.data;
  },

  async getOrganizerEvents(params: { page?: number; limit?: number; search?: string; status?: string } = {}) {
    const res = await apiClient.get("/events", { params });
    return res.data;
  },

  async createEvent(payload: any) {
    const res = await apiClient.post("/events", payload);
    return res.data;
  },

  async getEvent(id: string) {
    const res = await apiClient.get(`/events/${id}`);
    return res.data;
  },

  async updateEvent(id: string, payload: any) {
    const res = await apiClient.put(`/events/${id}`, payload);
    return res.data;
  },

  async publishEvent(id: string) {
    const res = await apiClient.post(`/events/${id}/publish`);
    return res.data;
  },

  async cancelEvent(id: string) {
    const res = await apiClient.post(`/events/${id}/cancel`);
    return res.data;
  },

  // Ticket Types
  async getTickets(eventId: string) {
    const res = await apiClient.get(`/events/${eventId}/tickets`);
    return res.data;
  },

  async createTicket(eventId: string, payload: any) {
    const res = await apiClient.post(`/events/${eventId}/tickets`, payload);
    return res.data;
  },

  async updateTicket(eventId: string, ticketId: string, payload: any) {
    const res = await apiClient.put(`/events/${eventId}/tickets/${ticketId}`, payload);
    return res.data;
  },

  async deleteTicket(eventId: string, ticketId: string) {
    const res = await apiClient.delete(`/events/${eventId}/tickets/${ticketId}`);
    return res.data;
  },

  // Addons
  async getAddons(eventId: string) {
    const res = await apiClient.get(`/events/${eventId}/addons`);
    return res.data;
  },

  async createAddon(eventId: string, payload: any) {
    const res = await apiClient.post(`/events/${eventId}/addons`, payload);
    return res.data;
  },

  // Sessions
  async getSessions(eventId: string) {
    const res = await apiClient.get(`/events/${eventId}/sessions`);
    return res.data;
  },

  async createSession(eventId: string, payload: any) {
    const res = await apiClient.post(`/events/${eventId}/sessions`, payload);
    return res.data;
  },

  // Orders & Attendees
  async getOrganizerOrders(params: { page?: number; limit?: number; event_id?: string; status?: string } = {}) {
    const res = await apiClient.get("/events/orders/all", { params });
    return res.data;
  },

  async getOrganizerAttendees(params: { page?: number; limit?: number; event_id?: string; search?: string } = {}) {
    const res = await apiClient.get("/events/attendees/all", { params });
    return res.data;
  },

  // Checkin
  async checkinAttendee(payload: { qr_token?: string; ticket_number?: string; event_id?: string; device_info?: string }) {
    const res = await apiClient.post("/events/checkin", payload);
    return res.data;
  },

  // Refunds
  async refundOrder(orderId: string, payload: { ticket_ids?: string[]; reason: string }) {
    const res = await apiClient.post(`/events/orders/${orderId}/refund`, payload);
    return res.data;
  },

  // Finance & Settlements
  async getFinancialSummary() {
    const res = await apiClient.get("/events/finance/summary");
    return res.data;
  },

  async getOrganizerSettlements() {
    const res = await apiClient.get("/events/finance/settlements");
    return res.data;
  },

  // ============================================================
  // PLATFORM ADMIN
  // ============================================================
  async getAdminOverview() {
    const res = await apiClient.get("/platform-admin/events/overview");
    return res.data;
  },

  async getAdminEvents(params: { page?: number; limit?: number; search?: string; status?: string } = {}) {
    const res = await apiClient.get("/platform-admin/events", { params });
    return res.data;
  },

  async moderateEvent(id: string, payload: { status?: string; is_featured?: boolean; rejection_reason?: string }) {
    const res = await apiClient.put(`/platform-admin/events/${id}/moderate`, payload);
    return res.data;
  },

  async getCommissionRules() {
    const res = await apiClient.get("/platform-admin/events/commissions");
    return res.data;
  },

  async saveCommissionRule(payload: any) {
    const res = await apiClient.post("/platform-admin/events/commissions", payload);
    return res.data;
  },

  async getAdminSettlements(params: { page?: number; limit?: number; status?: string } = {}) {
    const res = await apiClient.get("/platform-admin/events/settlements", { params });
    return res.data;
  },

  async generateSettlementBatch(payload: { tenant_id: string; period_start: string; period_end: string; event_id?: string; notes?: string }) {
    const res = await apiClient.post("/platform-admin/events/settlements/generate", payload);
    return res.data;
  },

  async approveSettlement(id: string) {
    const res = await apiClient.post(`/platform-admin/events/settlements/${id}/approve`);
    return res.data;
  },

  async disburseSettlement(id: string, payload: { payout_method: string; payout_reference: string; notes?: string }) {
    const res = await apiClient.post(`/platform-admin/events/settlements/${id}/disburse`, payload);
    return res.data;
  },

  async cancelSettlement(id: string, reason?: string) {
    const res = await apiClient.post(`/platform-admin/events/settlements/${id}/cancel`, { reason });
    return res.data;
  },

  async deleteSettlement(id: string) {
    const res = await apiClient.delete(`/platform-admin/events/settlements/${id}`);
    return res.data;
  }
};

export default eventService;
