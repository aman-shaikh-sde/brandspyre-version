import { Router } from 'express';
import { MarketplacePublicController } from '../controllers/marketplace/marketplacePublicController';
import { MarketplaceAuthController } from '../controllers/marketplace/marketplaceAuthController';
import { MarketplaceCheckoutController } from '../controllers/marketplace/marketplaceCheckoutController';
import { MarketplaceQuotationController } from '../controllers/marketplace/marketplaceQuotationController';
import { MarketplaceSellerController } from '../controllers/marketplace/marketplaceSellerController';
import { MarketplaceAdminController } from '../controllers/marketplace/marketplaceAdminController';
import { MarketplacePaymentController } from '../controllers/marketplace/marketplacePaymentController';
import { MarketplaceCategoryController } from '../controllers/marketplace/marketplaceCategoryController';
import { MarketplaceEnquiryController } from '../controllers/marketplace/marketplaceEnquiryController';
import { MarketplaceBookingController } from '../controllers/marketplace/marketplaceBookingController';
import { requireBuyerAuth, optionalBuyerAuth } from '../middleware/marketplaceAuth';
import authMiddleware from '../middleware/auth';
import { tenantAuth } from '../middleware/tenantAuth';
import { platformAdminAuth } from '../middleware/platformAdminAuth';

export const marketplaceRouter = Router();

// ============================================================
// 1. PUBLIC CATEGORY ENGINE & SCHEMAS
// ============================================================
marketplaceRouter.get('/categories/all', MarketplaceCategoryController.getAllCategories);
marketplaceRouter.get('/categories/:identifier/schema', MarketplaceCategoryController.getCategorySchema);
marketplaceRouter.get('/categories/:identifier', MarketplaceCategoryController.getCategoryByIdentifier);

// ============================================================
// 2. PUBLIC STOREFRONT ENDPOINTS (Products & Universal Listings)
// ============================================================
marketplaceRouter.get('/products', MarketplacePublicController.getCatalog);
marketplaceRouter.get('/products/featured', MarketplacePublicController.getFeaturedListings);
marketplaceRouter.get('/products/:id', MarketplacePublicController.getProductDetails);
marketplaceRouter.get('/listings', MarketplacePublicController.getCatalog);
marketplaceRouter.get('/listings/:id', MarketplacePublicController.getProductDetails);
marketplaceRouter.get('/categories', MarketplacePublicController.getCategories);
marketplaceRouter.get('/brands', MarketplacePublicController.getBrands);
marketplaceRouter.get('/products/:id/reviews', MarketplacePublicController.getProductReviews);
marketplaceRouter.post('/products/:id/reviews', optionalBuyerAuth, MarketplacePublicController.createProductReview);

// Wishlist
marketplaceRouter.get('/wishlist', requireBuyerAuth, MarketplacePublicController.getWishlist);
marketplaceRouter.post('/wishlist/toggle', requireBuyerAuth, MarketplacePublicController.toggleWishlist);

// ============================================================
// 3. BUYER AUTHENTICATION & SINGLE SIGN-ON
// ============================================================
marketplaceRouter.post('/auth/register', MarketplaceAuthController.register);
marketplaceRouter.post('/auth/login', MarketplaceAuthController.login);
marketplaceRouter.get('/auth/me', requireBuyerAuth, MarketplaceAuthController.getMe);
marketplaceRouter.put('/auth/profile', requireBuyerAuth, MarketplaceAuthController.updateProfile);

// ============================================================
// 4. CHECKOUT & ECOMMERCE ORDER LIFECYCLE
// ============================================================
marketplaceRouter.post('/orders/checkout', optionalBuyerAuth, MarketplaceCheckoutController.checkout);
marketplaceRouter.get('/orders/my', optionalBuyerAuth, MarketplaceCheckoutController.getMyOrders);
marketplaceRouter.get('/orders/:orderNumber', optionalBuyerAuth, MarketplaceCheckoutController.getOrderByNumber);
marketplaceRouter.post('/orders/:orderNumber/cancel', optionalBuyerAuth, MarketplaceCheckoutController.cancelOrder);

// ============================================================
// 5. CRM ENQUIRIES (Universal Contact / Viewing / Lead Generation)
// ============================================================
marketplaceRouter.post('/enquiries', optionalBuyerAuth, MarketplaceEnquiryController.submitEnquiry);
marketplaceRouter.get('/enquiries/my', requireBuyerAuth, MarketplaceEnquiryController.getMyEnquiries);

// ============================================================
// 6. BOOKINGS & APPOINTMENTS (Services, Stays, Rentals, Events)
// ============================================================
marketplaceRouter.get('/listings/:id/availability', MarketplaceBookingController.checkAvailability);
marketplaceRouter.post('/bookings', optionalBuyerAuth, MarketplaceBookingController.createBooking);
marketplaceRouter.get('/bookings/my', requireBuyerAuth, MarketplaceBookingController.getMyBookings);

// ============================================================
// 7. RFQ / PURCHASE QUOTATION ENQUIRIES
// ============================================================
marketplaceRouter.post('/quotations/request', optionalBuyerAuth, MarketplaceQuotationController.requestQuotation);
marketplaceRouter.get('/quotations/my', optionalBuyerAuth, MarketplaceQuotationController.getMyQuotations);
marketplaceRouter.get('/quotations/:id', optionalBuyerAuth, MarketplaceQuotationController.getQuotationById);

// ============================================================
// 8. PAYMENTS & WEBHOOKS
// ============================================================
marketplaceRouter.post('/payments/create-intent', optionalBuyerAuth, MarketplacePaymentController.createPaymentIntent);
marketplaceRouter.post('/payments/verify', optionalBuyerAuth, MarketplacePaymentController.verifyPayment);
marketplaceRouter.post('/payments/webhook', MarketplacePaymentController.handleWebhook);

// ============================================================
// 9. SELLER WORKSPACE (Tenant Authenticated & Isolated)
// ============================================================
marketplaceRouter.get('/seller/profile', authMiddleware, tenantAuth(), MarketplaceSellerController.getProfile);
marketplaceRouter.put('/seller/profile', authMiddleware, tenantAuth(), MarketplaceSellerController.updateProfile);
marketplaceRouter.get('/seller/categories', authMiddleware, tenantAuth(), MarketplaceCategoryController.getAllCategories);
marketplaceRouter.get('/seller/categories/:identifier/schema', authMiddleware, tenantAuth(), MarketplaceCategoryController.getCategorySchema);
marketplaceRouter.get('/seller/listings', authMiddleware, tenantAuth(), MarketplaceSellerController.getMyListings);
marketplaceRouter.post('/seller/listings', authMiddleware, tenantAuth(), MarketplaceSellerController.createListing);
marketplaceRouter.put('/seller/listings/:id', authMiddleware, tenantAuth(), MarketplaceSellerController.updateListing);
marketplaceRouter.delete('/seller/listings/:id', authMiddleware, tenantAuth(), MarketplaceSellerController.deleteListing);
marketplaceRouter.get('/seller/orders', authMiddleware, tenantAuth(), MarketplaceSellerController.getSellerOrders);
marketplaceRouter.post('/seller/orders/:orderNumber/fulfill', authMiddleware, tenantAuth(), MarketplaceSellerController.fulfillOrder);
marketplaceRouter.get('/seller/quotations', authMiddleware, tenantAuth(), MarketplaceSellerController.getSellerQuotations);
marketplaceRouter.post('/seller/quotations/:id/respond', authMiddleware, tenantAuth(), MarketplaceSellerController.respondToQuotation);
marketplaceRouter.get('/seller/enquiries', authMiddleware, tenantAuth(), MarketplaceEnquiryController.getSellerEnquiries);
marketplaceRouter.put('/seller/enquiries/:id', authMiddleware, tenantAuth(), MarketplaceEnquiryController.updateEnquiryStatus);
marketplaceRouter.get('/seller/bookings', authMiddleware, tenantAuth(), MarketplaceBookingController.getSellerBookings);
marketplaceRouter.put('/seller/bookings/:id', authMiddleware, tenantAuth(), MarketplaceBookingController.updateBookingStatus);

// ============================================================
// 10. PLATFORM ADMIN MODERATION & SUPERVISION
// ============================================================
marketplaceRouter.get('/admin/listings', authMiddleware, platformAdminAuth, MarketplaceAdminController.getAllListings);
marketplaceRouter.post('/admin/listings/:id/moderate', authMiddleware, platformAdminAuth, MarketplaceAdminController.moderateListing);
marketplaceRouter.get('/admin/orders', authMiddleware, platformAdminAuth, MarketplaceAdminController.getAllOrders);
marketplaceRouter.get('/admin/sellers', authMiddleware, platformAdminAuth, MarketplaceAdminController.getAllSellers);
marketplaceRouter.get('/admin/stats', authMiddleware, platformAdminAuth, MarketplaceAdminController.getStats);

// Platform Admin Category Management
marketplaceRouter.get('/admin/categories', authMiddleware, platformAdminAuth, MarketplaceCategoryController.getAllCategoriesAdmin);
marketplaceRouter.post('/admin/categories', authMiddleware, platformAdminAuth, MarketplaceCategoryController.createCategory);
marketplaceRouter.put('/admin/categories/:id', authMiddleware, platformAdminAuth, MarketplaceCategoryController.updateCategory);
marketplaceRouter.delete('/admin/categories/:id', authMiddleware, platformAdminAuth, MarketplaceCategoryController.deactivateCategory);
marketplaceRouter.post('/admin/categories/:id/schema', authMiddleware, platformAdminAuth, MarketplaceCategoryController.upsertCategorySchema);

export default marketplaceRouter;
