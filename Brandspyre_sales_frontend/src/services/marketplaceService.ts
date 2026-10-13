import api from './api';
import {
  Product,
  Category,
  Brand,
  EcommerceOrder,
  QuotationEnquiry,
  ProductReview,
  MarketplaceListing,
  MarketplaceSellerProfile,
  SellerOrder,
  MarketplaceAdminStats,
  MarketplaceCategory,
  CategoryFormSchema,
  UniversalListing,
  MarketplaceEnquiry,
  MarketplaceBooking
} from '../types';

export const marketplaceService = {
  // ============================================================
  // 1. PUBLIC STOREFRONT & CATALOG
  // ============================================================
  async getCatalog(params?: {
    search?: string;
    category?: string;
    brand?: string;
    min_price?: number;
    max_price?: number;
    in_stock?: boolean;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: Product[]; total: number; page: number; totalPages: number }> {
    const res = await api.get('/products', { params });
    if (res.data?.success) {
      return {
        items: res.data.data || [],
        total: res.data.pagination?.total || (res.data.data || []).length,
        page: res.data.pagination?.page || 1,
        totalPages: res.data.pagination?.totalPages || 1
      };
    }
    return { items: [], total: 0, page: 1, totalPages: 1 };
  },

  async getFeaturedProducts(): Promise<Product[]> {
    const res = await api.get('/products/featured');
    if (res.data?.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  },

  async getProductDetails(id: string): Promise<Product | null> {
    const res = await api.get(`/products/${id}`);
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    return null;
  },

  async getCategories(): Promise<Category[]> {
    const res = await api.get('/categories');
    if (res.data?.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  },

  async getBrands(): Promise<Brand[]> {
    const res = await api.get('/brands');
    if (res.data?.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  },

  async getProductReviews(productId: string): Promise<ProductReview[]> {
    const res = await api.get(`/products/${productId}/reviews`);
    if (res.data?.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  },

  async createProductReview(productId: string, data: { rating: number; comment: string; buyer_name?: string }): Promise<ProductReview> {
    const res = await api.post(`/products/${productId}/reviews`, data);
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data?.error || 'Failed to submit review');
  },

  // ============================================================
  // 2. WISHLIST
  // ============================================================
  async getWishlist(): Promise<Product[]> {
    const res = await api.get('/wishlist');
    if (res.data?.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  },

  async toggleWishlist(productId: string): Promise<boolean> {
    const res = await api.post('/wishlist/toggle', { product_id: productId });
    return !!res.data?.success;
  },

  // ============================================================
  // 3. CHECKOUT & ORDERS
  // ============================================================
  async checkout(payload: any): Promise<{ order: EcommerceOrder; order_access_token?: string }> {
    const res = await api.post('/orders/checkout', payload);
    if (res.data?.success && res.data.order) {
      return {
        order: res.data.order,
        order_access_token: res.data.order_access_token
      };
    }
    throw new Error(res.data?.error || 'Checkout failed');
  },

  async getMyOrders(): Promise<EcommerceOrder[]> {
    const res = await api.get('/orders/my');
    if (res.data?.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  },

  async getOrderByNumber(orderNumber: string, token?: string): Promise<EcommerceOrder | null> {
    const params = token ? { token } : {};
    const res = await api.get(`/orders/${orderNumber}`, { params });
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    return null;
  },

  async cancelOrder(orderNumber: string, token?: string, reason?: string): Promise<boolean> {
    const params = token ? { token } : {};
    const res = await api.post(`/orders/${orderNumber}/cancel`, { reason }, { params });
    return !!res.data?.success;
  },

  // ============================================================
  // 4. RFQ / QUOTATIONS
  // ============================================================
  async requestQuotation(data: any): Promise<QuotationEnquiry> {
    const res = await api.post('/quotations/request', data);
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data?.error || 'Failed to submit quotation inquiry');
  },

  async getMyQuotations(): Promise<QuotationEnquiry[]> {
    const res = await api.get('/quotations/my');
    if (res.data?.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  },

  async getQuotationById(id: string): Promise<QuotationEnquiry | null> {
    const res = await api.get(`/quotations/${id}`);
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    return null;
  },

  // ============================================================
  // 5. PAYMENTS (RAZORPAY)
  // ============================================================
  async createPaymentIntent(orderId: string): Promise<any> {
    const res = await api.post('/payments/create-intent', { order_id: orderId });
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data?.error || 'Payment intent creation failed');
  },

  async verifyPayment(data: {
    order_id: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<boolean> {
    const res = await api.post('/payments/verify', data);
    return !!res.data?.success;
  },

  // ============================================================
  // 6. SELLER WORKSPACE
  // ============================================================
  async getSellerProfile(): Promise<MarketplaceSellerProfile | null> {
    const res = await api.get('/seller/profile');
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    return null;
  },

  async updateSellerProfile(data: Partial<MarketplaceSellerProfile>): Promise<MarketplaceSellerProfile> {
    const res = await api.put('/seller/profile', data);
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data?.error || 'Failed to update seller profile');
  },

  async getSellerListings(): Promise<MarketplaceListing[]> {
    const res = await api.get('/seller/listings');
    if (res.data?.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  },

  async createListing(data: {
    product_id: string;
    title: string;
    description?: string;
    listing_price: number;
    compare_price?: number;
    min_order_quantity?: number;
    tags?: string[];
  }): Promise<MarketplaceListing> {
    const res = await api.post('/seller/listings', data);
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data?.error || 'Failed to create listing');
  },

  async updateListing(id: string, data: Partial<MarketplaceListing>): Promise<MarketplaceListing> {
    const res = await api.put(`/seller/listings/${id}`, data);
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data?.error || 'Failed to update listing');
  },

  async deleteListing(id: string): Promise<boolean> {
    const res = await api.delete(`/seller/listings/${id}`);
    return !!res.data?.success;
  },

  async getSellerOrders(): Promise<SellerOrder[]> {
    const res = await api.get('/seller/orders');
    if (res.data?.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  },

  async fulfillOrder(orderNumber: string, data: { tracking_carrier?: string; tracking_number?: string; notes?: string }): Promise<boolean> {
    const res = await api.post(`/seller/orders/${orderNumber}/fulfill`, data);
    return !!res.data?.success;
  },

  async getSellerQuotations(): Promise<QuotationEnquiry[]> {
    const res = await api.get('/seller/quotations');
    if (res.data?.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  },

  async respondToQuotation(id: string, data: { quoted_unit_price: number; seller_notes?: string; valid_until?: string }): Promise<boolean> {
    const res = await api.post(`/seller/quotations/${id}/respond`, data);
    return !!res.data?.success;
  },

  // ============================================================
  // 7. MARKETPLACE PLATFORM ADMINISTRATION
  // ============================================================
  async getAdminStats(): Promise<MarketplaceAdminStats> {
    const res = await api.get('/admin/stats');
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    return {
      total_sellers: 0,
      verified_sellers: 0,
      total_listings: 0,
      pending_listings: 0,
      published_listings: 0,
      total_orders: 0,
      total_gmv: 0
    };
  },

  async getAdminListings(status?: string): Promise<MarketplaceListing[]> {
    const res = await api.get('/admin/listings', { params: { status } });
    if (res.data?.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  },

  async moderateListing(id: string, action: 'APPROVE' | 'REJECT', reason?: string): Promise<boolean> {
    const res = await api.post(`/admin/listings/${id}/moderate`, { action, reason });
    return !!res.data?.success;
  },

  async getAdminSellers(): Promise<MarketplaceSellerProfile[]> {
    const res = await api.get('/admin/sellers');
    if (res.data?.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  },

  async getAdminOrders(): Promise<EcommerceOrder[]> {
    const res = await api.get('/admin/orders');
    if (res.data?.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  },

  // ============================================================
  // 8. UNIVERSAL CATEGORIES & DYNAMIC SCHEMAS
  // ============================================================
  async getCategoriesAll(): Promise<MarketplaceCategory[]> {
    const res = await api.get('/categories/all');
    if (res.data?.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  },

  async getCategoryByIdentifier(identifier: string): Promise<MarketplaceCategory | null> {
    const res = await api.get(`/categories/${identifier}`);
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    return null;
  },

  async getCategorySchema(identifier: string, listingType: string = '*'): Promise<CategoryFormSchema | null> {
    const res = await api.get(`/categories/${identifier}/schema`, {
      params: { listing_type: listingType }
    });
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    return null;
  },

  async createUniversalListing(data: any): Promise<UniversalListing> {
    const res = await api.post('/seller/listings', data);
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data?.error || 'Failed to create listing');
  },

  // ============================================================
  // 9. ENQUIRIES & CRM INTEGRATION
  // ============================================================
  async submitEnquiry(data: {
    listing_id: string;
    buyer_name: string;
    buyer_email: string;
    buyer_phone: string;
    buyer_company?: string;
    buyer_message: string;
    type?: string;
    requirements?: Record<string, any>;
  }): Promise<any> {
    const res = await api.post('/enquiries', data);
    if (res.data?.success) {
      return res.data.data;
    }
    throw new Error(res.data?.error || 'Failed to submit enquiry');
  },

  async getMyEnquiries(): Promise<MarketplaceEnquiry[]> {
    const res = await api.get('/enquiries/my');
    if (res.data?.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  },

  async getSellerEnquiries(params?: {
    status?: string;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ enquiries: MarketplaceEnquiry[]; pagination: any }> {
    const res = await api.get('/seller/enquiries', { params });
    if (res.data?.success) {
      return {
        enquiries: res.data.enquiries || [],
        pagination: res.data.pagination || {}
      };
    }
    return { enquiries: [], pagination: {} };
  },

  async updateEnquiryStatus(id: string, data: {
    status?: string;
    notes?: string;
    follow_up_date?: string;
    assigned_to?: string;
  }): Promise<MarketplaceEnquiry> {
    const res = await api.put(`/seller/enquiries/${id}`, data);
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data?.error || 'Failed to update enquiry');
  },

  // ============================================================
  // 10. BOOKINGS & APPOINTMENTS
  // ============================================================
  async checkAvailability(listingId: string, startDate: string, endDate?: string, timeSlot?: string): Promise<{ available: boolean; conflictReason?: string }> {
    const res = await api.get(`/listings/${listingId}/availability`, {
      params: { start_date: startDate, end_date: endDate, time_slot: timeSlot }
    });
    if (res.data?.success) {
      return { available: res.data.available, conflictReason: res.data.conflictReason };
    }
    return { available: false };
  },

  async createBooking(data: {
    listing_id: string;
    buyer_name: string;
    buyer_email: string;
    buyer_phone: string;
    start_date: string;
    end_date?: string;
    time_slot?: string;
    participants?: number;
    deposit_amount?: number;
  }): Promise<MarketplaceBooking> {
    const res = await api.post('/bookings', data);
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data?.error || 'Failed to create booking');
  },

  async getMyBookings(): Promise<MarketplaceBooking[]> {
    const res = await api.get('/bookings/my');
    if (res.data?.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  },

  async getSellerBookings(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ bookings: MarketplaceBooking[]; pagination: any }> {
    const res = await api.get('/seller/bookings', { params });
    if (res.data?.success) {
      return {
        bookings: res.data.bookings || [],
        pagination: res.data.pagination || {}
      };
    }
    return { bookings: [], pagination: {} };
  },

  async updateBookingStatus(id: string, data: {
    status?: string;
    payment_status?: string;
    cancelled_reason?: string;
    refund_amount?: number;
  }): Promise<MarketplaceBooking> {
    const res = await api.put(`/seller/bookings/${id}`, data);
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data?.error || 'Failed to update booking');
  },

  // ============================================================
  // 11. PLATFORM ADMIN CATEGORY & SCHEMA MANAGEMENT
  // ============================================================
  async adminGetCategories(): Promise<MarketplaceCategory[]> {
    const res = await api.get('/admin/categories');
    if (res.data?.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  },

  async adminCreateCategory(data: Partial<MarketplaceCategory>): Promise<MarketplaceCategory> {
    const res = await api.post('/admin/categories', data);
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data?.error || 'Failed to create category');
  },

  async adminUpdateCategory(id: string, data: Partial<MarketplaceCategory>): Promise<MarketplaceCategory> {
    const res = await api.put(`/admin/categories/${id}`, data);
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data?.error || 'Failed to update category');
  },

  async adminDeactivateCategory(id: string): Promise<MarketplaceCategory> {
    const res = await api.delete(`/admin/categories/${id}`);
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data?.error || 'Failed to toggle category');
  },

  async adminUpsertCategorySchema(id: string, data: { listing_type?: string; fields: any[] }): Promise<CategoryFormSchema> {
    const res = await api.post(`/admin/categories/${id}/schema`, data);
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data?.error || 'Failed to update category form schema');
  }
};

export default marketplaceService;
