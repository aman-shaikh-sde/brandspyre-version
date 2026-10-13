import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

// Layouts
import { MarketplaceLayout } from './components/layout/MarketplaceLayout';
import { BusinessLayout } from './components/layout/BusinessLayout';

// Public & Buyer Pages
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { BuyerDashboardPage } from './pages/BuyerDashboardPage';

// Business Workspace Pages
import { SellerDashboardPage } from './pages/SellerDashboardPage';
import { ListingCreationWizard } from './pages/ListingCreationWizard';
import { SellerEnquiriesPage } from './pages/SellerEnquiriesPage';
import { SellerBookingsPage } from './pages/SellerBookingsPage';
import { MarketplaceAdminPage } from './pages/MarketplaceAdminPage';
import { CategoryAdminPage } from './pages/CategoryAdminPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Routes>
              {/* Experience A & B: Public Marketplace & Buyer Shopping */}
              <Route element={<MarketplaceLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/listings/:slug" element={<ListingDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order/:orderNumber" element={<OrderConfirmationPage />} />
                <Route path="/account" element={<BuyerDashboardPage />} />
              </Route>

              {/* Experience C: Seller Workspace & Marketplace Platform Admin */}
              <Route element={<BusinessLayout />}>
                <Route path="/seller" element={<SellerDashboardPage />} />
                <Route path="/seller/listings/new" element={<ListingCreationWizard />} />
                <Route path="/seller/enquiries" element={<SellerEnquiriesPage />} />
                <Route path="/seller/bookings" element={<SellerBookingsPage />} />
                <Route path="/admin" element={<MarketplaceAdminPage />} />
                <Route path="/admin/categories" element={<CategoryAdminPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
