import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CartDrawer } from '../cart/CartDrawer';
import { AuthModal } from '../auth/AuthModal';

export const MarketplaceLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-red-500 selection:text-white">
      {/* Public / Buyer Storefront Header */}
      <Navbar />

      {/* Slide-over Mini Cart Drawer */}
      <CartDrawer />

      {/* Global Auth Sign In / Register Modal */}
      <AuthModal />

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Restrained, Professional Footer */}
      <Footer />
    </div>
  );
};

export default MarketplaceLayout;
