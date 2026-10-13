import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Package,
  Layers,
  Wrench,
  Cpu,
  Armchair,
  HardHat,
  Box,
  FileSpreadsheet,
  Store,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Product, Category, MarketplaceCategory } from '../types';
import { ProductCard } from '../components/product/ProductCard';
import { QuotationModal } from '../components/quotation/QuotationModal';
import { CategorySelector } from '../components/common/CategorySelector';
import { marketplaceService } from '../services/marketplaceService';
import { useNavigate } from 'react-router-dom';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [universalCategories, setUniversalCategories] = useState<MarketplaceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // RFQ Modal State
  const [selectedProductForQuote, setSelectedProductForQuote] = useState<Product | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [featData, catData, uCatData] = await Promise.all([
        marketplaceService.getFeaturedProducts().catch(() => []),
        marketplaceService.getCategories().catch(() => []),
        marketplaceService.getCategoriesAll().catch(() => [])
      ]);

      if (featData && featData.length > 0) {
        setFeaturedProducts(featData);
      } else {
        const catalog = await marketplaceService.getCatalog({ limit: 12 });
        setFeaturedProducts(catalog.items || []);
      }

      setCategories(catData || []);
      setUniversalCategories(uCatData || []);
    } catch (err) {
      console.error('Error loading homepage data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getCategoryIcon = (code: string) => {
    switch (code) {
      case 'CAT-IND': return <Wrench className="w-4 h-4 text-slate-700" />;
      case 'CAT-ELEC': return <Cpu className="w-4 h-4 text-slate-700" />;
      case 'CAT-OFFICE': return <Armchair className="w-4 h-4 text-slate-700" />;
      case 'CAT-CONST': return <HardHat className="w-4 h-4 text-slate-700" />;
      case 'CAT-SAFETY': return <ShieldCheck className="w-4 h-4 text-slate-700" />;
      default: return <Box className="w-4 h-4 text-slate-700" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* 1. UNIVERSAL MULTI-INDUSTRY MARKETPLACE BANNER */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xs">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span>Universal Business Platform</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Procure Commercial Goods, Professional Services & Book Appointments
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Direct commerce engine connecting verified organizations across retail, industrial, real estate, automotive, and consulting with native CRM lead routing.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <Link
            to="/catalog"
            className="crm-btn-primary !h-9 !px-4 !text-xs w-full sm:w-auto text-center"
          >
            <span>Explore Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/seller/listings/new"
            className="crm-btn-secondary !h-9 !px-3.5 !text-xs w-full sm:w-auto text-center"
          >
            <Store className="w-3.5 h-3.5 text-slate-500" />
            <span>List Your Business</span>
          </Link>
        </div>
      </section>

      {/* 2. UNIVERSAL INDUSTRY VERTICALS */}
      {universalCategories.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Layers className="w-4 h-4 text-red-600" />
                <span>Explore Marketplace Verticals</span>
              </h2>
              <p className="text-xs text-slate-500">
                Configurable business sectors with custom specifications, booking schedules, and CRM enquiry workflows
              </p>
            </div>
            <Link
              to="/catalog"
              className="text-xs font-semibold text-red-700 hover:text-red-800 flex items-center gap-0.5 shrink-0"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <CategorySelector
            categories={universalCategories}
            onSelect={(cat) => navigate(`/catalog?category=${cat._id}`)}
            layout="cards"
          />
        </section>
      ) : categories.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              <span>Shop by Department</span>
            </h2>
            <Link
              to="/catalog"
              className="text-xs font-semibold text-red-700 hover:text-red-800 flex items-center gap-0.5"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/catalog?category=${cat._id}`}
                className="group p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-2xs transition-all flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-red-50 transition-colors">
                  {getCategoryIcon(cat.code)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-slate-900 group-hover:text-red-700 transition-colors truncate">
                    {cat.name}
                  </h3>
                  {typeof cat.product_count === 'number' && (
                    <span className="text-[10px] text-slate-400">
                      {cat.product_count} items
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* 3. FEATURED PRODUCTS & POPULAR INVENTORY (Accessible without excessive scrolling) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Featured Products & Available Inventory
            </h2>
            <p className="text-xs text-slate-500">
              Verified commercial items ready for direct order and wholesale quotations
            </p>
          </div>
          <Link
            to="/catalog"
            className="text-xs font-semibold text-red-700 hover:text-red-800 flex items-center gap-1"
          >
            <span>See entire catalog ({featuredProducts.length}+)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-slate-200 p-3 space-y-3 animate-pulse">
                <div className="aspect-square bg-slate-100 rounded" />
                <div className="h-3.5 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-7 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredProducts.map((prod) => (
              <ProductCard
                key={prod._id}
                product={prod}
                onRequestQuote={(p) => {
                  setSelectedProductForQuote(p);
                  setIsQuoteModalOpen(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">No Listings Available Currently</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Check back soon as organizations publish verified listings to the storefront.
            </p>
          </div>
        )}
      </section>

      {/* 4. COMPACT SELLER & RFQ ENTRY POINT */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* RFQ Callout */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 flex flex-col justify-between space-y-3 shadow-2xs">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-red-600" />
              <h3 className="text-sm font-bold text-slate-900">Custom Bulk Quantities & RFQ Inquiries</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Require high-volume shipments or special project pricing? Request a direct quotation from suppliers with your target unit price and timeline.
            </p>
          </div>
          <div>
            <Link
              to="/catalog"
              className="text-xs font-semibold text-red-700 hover:text-red-800 inline-flex items-center gap-1"
            >
              <span>Browse items and request quotes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Seller Callout */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 flex flex-col justify-between space-y-3 shadow-2xs">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">Sell on Brandspyre Marketplace</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Publish products directly from your ERP inventory, review incoming purchase orders, and reply to commercial RFQs.
            </p>
          </div>
          <div>
            <Link
              to="/seller"
              className="text-xs font-semibold text-slate-800 hover:text-red-700 inline-flex items-center gap-1"
            >
              <span>Open Seller Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Quotation Modal */}
      {selectedProductForQuote && (
        <QuotationModal
          isOpen={isQuoteModalOpen}
          onClose={() => {
            setIsQuoteModalOpen(false);
            setSelectedProductForQuote(null);
          }}
          product={selectedProductForQuote}
        />
      )}
    </div>
  );
};

export default HomePage;
