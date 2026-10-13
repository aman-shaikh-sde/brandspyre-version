import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Heart,
  User,
  Menu,
  X,
  FileSpreadsheet,
  ChevronDown,
  Layers,
  ArrowRight,
  LogOut,
  Package,
  Store,
  Clock
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { marketplaceService } from '../../services/marketplaceService';
import { Category } from '../../types';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount, subtotal, setIsCartOpen } = useCart();
  const { buyer, isAuthenticated, logout, setIsAuthModalOpen, setAuthModalMode } = useAuth();
  const { wishlistCount } = useWishlist();

  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await marketplaceService.getCategories();
        setCategories(data || []);
      } catch (e) {
        // graceful fallback
      }
    };
    fetchCats();
  }, []);

  // Sync search input with URL params if on /catalog
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search');
    if (q) setSearchQuery(q);
    const cat = params.get('category');
    if (cat && cat !== 'ALL') setSelectedCategory(cat);
  }, [location.search]);

  // Close menus on route change or click outside
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCategoryMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (selectedCategory) params.set('category', selectedCategory);
    navigate(`/catalog?${params.toString()}`);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* 1. PRIMARY STOREFRONT ROW */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-6">
        {/* Brand Logo & Mobile Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/brandspyre_icon.png"
              alt="Brandspyre"
              className="h-8 w-auto object-contain"
            />
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">
                Brand<span className="text-red-700">spyre</span>
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 rounded">
                Sales
              </span>
            </div>
          </Link>
        </div>

        {/* Prominent Conventional Product Search */}
        <div className="flex-1 max-w-2xl hidden md:flex items-center">
          <form onSubmit={handleSearchSubmit} className="w-full flex items-center rounded-lg border border-slate-300 bg-white focus-within:border-red-600 focus-within:ring-1 focus-within:ring-red-600 transition-all overflow-hidden shadow-2xs">
            {/* Department Dropdown Selector */}
            <div className="relative" ref={categoryMenuRef}>
              <button
                type="button"
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                className="h-10 px-3 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 border-r border-slate-200 whitespace-nowrap transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span className="max-w-[120px] truncate">
                  {selectedCategory ? categories.find(c => c._id === selectedCategory)?.name || 'Department' : 'All Departments'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isCategoryMenuOpen && (
                <div className="absolute left-0 top-full mt-1 w-60 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('');
                      setIsCategoryMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                      !selectedCategory ? 'bg-red-50 text-red-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>All Departments</span>
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat._id);
                        setIsCategoryMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${
                        selectedCategory === cat._id ? 'bg-red-50 text-red-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      {typeof cat.product_count === 'number' && (
                        <span className="text-[10px] text-slate-400 font-normal">{cat.product_count}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands, model numbers, industrial supplies..."
                className="w-full h-10 px-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
              />
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="h-10 px-4 bg-red-700 hover:bg-red-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
              <span className="hidden lg:inline">Search</span>
            </button>
          </form>
        </div>

        {/* Utility / Account Actions */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          {/* Wishlist Link */}
          <Link
            to="/account?tab=wishlist"
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Saved Wishlist"
            aria-label="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-700 text-white text-[10px] font-bold flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 h-10 px-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
            aria-label="Open Cart"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-slate-700" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-red-700 text-white text-[9px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <span className="text-[10px] text-slate-400 block font-medium">Cart</span>
              <span className="text-xs font-bold text-slate-900">₹{subtotal.toLocaleString()}</span>
            </div>
          </button>

          {/* Account Menu / Sign In */}
          <div className="relative" ref={userMenuRef}>
            {isAuthenticated ? (
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-xs">
                  {buyer?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="hidden md:inline-block max-w-[90px] truncate">{buyer?.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:inline" />
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="crm-btn-primary !h-10 !px-3.5 !text-xs"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {isUserMenuOpen && isAuthenticated && (
              <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{buyer?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{buyer?.email}</p>
                  {buyer?.company_name && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 bg-slate-100 text-[10px] text-slate-600 rounded font-medium">
                      {buyer.company_name}
                    </span>
                  )}
                </div>

                <Link
                  to="/account?tab=orders"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-red-700 transition-colors"
                >
                  <Package className="w-4 h-4 text-slate-400" />
                  <span>My Orders</span>
                </Link>

                <Link
                  to="/account?tab=quotations"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-red-700 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                  <span>My Quotations (RFQs)</span>
                </Link>

                <Link
                  to="/account?tab=wishlist"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-red-700 transition-colors"
                >
                  <Heart className="w-4 h-4 text-slate-400" />
                  <span>Saved Wishlist</span>
                </Link>

                <Link
                  to="/account?tab=profile"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-red-700 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Account Settings</span>
                </Link>

                <div className="border-t border-slate-100 my-1" />

                <Link
                  to="/seller"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <Store className="w-4 h-4 text-slate-500" />
                  <span>Seller Workspace</span>
                </Link>

                <div className="border-t border-slate-100 my-1" />

                <button
                  onClick={() => {
                    logout();
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. SECONDARY CATEGORY & SHOPPING NAVIGATION ROW (Desktop) */}
      <div className="border-t border-slate-200/80 bg-slate-50/70 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-10 flex items-center justify-between text-xs text-slate-700 font-medium">
          {/* Left category shortcuts */}
          <div className="flex items-center gap-5 overflow-x-auto scrollbar-none py-1">
            <Link
              to="/catalog"
              className="flex items-center gap-1.5 font-bold text-slate-900 hover:text-red-700 transition-colors whitespace-nowrap"
            >
              <Layers className="w-3.5 h-3.5 text-red-600" />
              <span>All Products</span>
            </Link>

            {categories.slice(0, 6).map((cat) => (
              <Link
                key={cat._id}
                to={`/catalog?category=${cat._id}`}
                className="hover:text-red-700 transition-colors whitespace-nowrap text-slate-600"
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Right functional navigation */}
          <div className="flex items-center gap-4 text-slate-600 shrink-0">
            <Link
              to="/account?tab=orders"
              className="hover:text-slate-900 transition-colors flex items-center gap-1"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Track Orders</span>
            </Link>

            <span className="text-slate-300">|</span>

            <Link
              to="/account?tab=quotations"
              className="hover:text-slate-900 transition-colors flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
              <span>Bulk RFQs</span>
            </Link>

            <span className="text-slate-300">|</span>

            <Link
              to="/seller"
              className="hover:text-slate-900 font-semibold flex items-center gap-1 transition-colors"
            >
              <Store className="w-3.5 h-3.5 text-slate-500" />
              <span>Seller Portal</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. MOBILE RESPONSIVE DRAWER & SEARCH */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands, SKUs..."
                className="w-full h-10 pl-9 pr-4 rounded-lg bg-slate-50 border border-slate-300 text-xs focus:border-red-600 outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </form>

          <div className="space-y-1 pt-1 text-xs">
            <Link
              to="/catalog"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 font-bold text-red-700 hover:bg-red-50 rounded-lg"
            >
              All Products Catalog
            </Link>
            <Link
              to="/account?tab=orders"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Track Orders
            </Link>
            <Link
              to="/account?tab=quotations"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Request Bulk Quotation (RFQ)
            </Link>
            <Link
              to="/seller"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 font-semibold text-slate-800 hover:bg-slate-50 rounded-lg"
            >
              Seller Workspace
            </Link>

            <div className="text-[10px] font-bold text-slate-400 px-3 pt-2 uppercase tracking-wider">
              Departments
            </div>
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/catalog?category=${cat._id}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
