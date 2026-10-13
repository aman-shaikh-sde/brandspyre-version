import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Search,
  Check
} from 'lucide-react';
import { Product, Category, Brand, MarketplaceCategory, UniversalListing } from '../types';
import { ProductCard } from '../components/product/ProductCard';
import { ListingCard } from '../components/common/ListingCard';
import { CategorySelector } from '../components/common/CategorySelector';
import { EnquiryModal } from '../components/common/EnquiryModal';
import { QuotationModal } from '../components/quotation/QuotationModal';
import { EmptyState } from '../components/common/EmptyState';
import { marketplaceService } from '../services/marketplaceService';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [universalCategories, setUniversalCategories] = useState<MarketplaceCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filter values
  const selectedCategory = searchParams.get('category') || 'ALL';
  const selectedBrand = searchParams.get('brand') || 'ALL';
  const searchQuery = searchParams.get('search') || '';
  const inStockOnly = searchParams.get('in_stock') === 'true';
  const [minPrice, setMinPrice] = useState<string>(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState<string>(searchParams.get('max_price') || '');
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') || 'newest');

  // Mobile Filter Drawer
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // RFQ Quotation Modal
  const [selectedProductForQuote, setSelectedProductForQuote] = useState<Product | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  // Universal Enquiry Modal
  const [selectedListingForEnquiry, setSelectedListingForEnquiry] = useState<UniversalListing | null>(null);
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);

  const fetchFilters = async () => {
    try {
      const [catData, brData, uCatData] = await Promise.all([
        marketplaceService.getCategories().catch(() => []),
        marketplaceService.getBrands().catch(() => []),
        marketplaceService.getCategoriesAll().catch(() => [])
      ]);
      setCategories(catData || []);
      setBrands(brData || []);
      setUniversalCategories(uCatData || []);
    } catch (e) {
      console.error('Failed to load filter metadata:', e);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await marketplaceService.getCatalog({
        search: searchQuery || undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        brand: selectedBrand !== 'ALL' ? selectedBrand : undefined,
        min_price: minPrice ? Number(minPrice) : undefined,
        max_price: maxPrice ? Number(maxPrice) : undefined,
        in_stock: inStockOnly || undefined,
        sort: sortBy,
        page: currentPage,
        limit: 20
      });

      setProducts(result.items || []);
      setTotalCount(result.total || 0);
      setTotalPages(result.totalPages || 1);
    } catch (err: any) {
      console.error('Failed to load products:', err);
      setError(err.message || 'Unable to load products. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchParams, currentPage, sortBy]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'ALL') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    next.set('page', '1');
    setCurrentPage(1);
    setSearchParams(next);
  };

  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (minPrice) next.set('min_price', minPrice);
    else next.delete('min_price');
    if (maxPrice) next.set('max_price', maxPrice);
    else next.delete('max_price');
    next.set('page', '1');
    setCurrentPage(1);
    setSearchParams(next);
  };

  const toggleInStock = () => {
    const next = new URLSearchParams(searchParams);
    if (inStockOnly) {
      next.delete('in_stock');
    } else {
      next.set('in_stock', 'true');
    }
    next.set('page', '1');
    setCurrentPage(1);
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setCurrentPage(1);
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    const next = new URLSearchParams(searchParams);
    next.set('page', newPage.toString());
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeFilterCount =
    (selectedCategory !== 'ALL' ? 1 : 0) +
    (selectedBrand !== 'ALL' ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    (minPrice || maxPrice ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-4">
      {/* 1. COMPACT CONVENTIONAL PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            {searchQuery ? `Search results for "${searchQuery}"` : 'All Products'}
          </h1>
          <span className="text-xs text-slate-500">
            Showing {totalCount} verified products
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className="md:hidden crm-btn-secondary !h-8 !px-3 !text-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
            <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-md px-2.5 py-1 text-xs">
            <span className="text-slate-500 font-medium hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                updateParam('sort', e.target.value);
              }}
              className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* UNIVERSAL VERTICAL PILLS BAR */}
      {universalCategories.length > 0 && (
        <div className="pb-1">
          <CategorySelector
            categories={universalCategories}
            selectedId={selectedCategory}
            onSelect={(cat) => updateParam('category', cat._id)}
            layout="pills"
          />
        </div>
      )}

      {/* 2. MAIN 2-COLUMN CATALOG BODY */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* LEFT COMPACT FILTER SIDEBAR (Desktop) */}
        <aside className="hidden md:block space-y-4">
          <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
              </span>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="font-semibold text-red-700 hover:text-red-800 text-[11px]"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* In-Stock Only Toggle */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={toggleInStock}
                  className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                <span className="font-semibold text-slate-700">In-Stock Only</span>
              </label>
            </div>

            {/* Departments */}
            <div className="border-t border-slate-100 pt-3">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                Departments
              </h4>
              <div className="space-y-0.5 max-h-56 overflow-y-auto pr-1">
                <button
                  onClick={() => updateParam('category', 'ALL')}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                    selectedCategory === 'ALL'
                      ? 'bg-slate-100 font-bold text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>All Departments</span>
                  <span className="text-[10px] text-slate-400">{totalCount}</span>
                </button>

                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => updateParam('category', cat._id)}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                      selectedCategory === cat._id
                        ? 'bg-slate-100 font-bold text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate max-w-[140px]">{cat.name}</span>
                    {typeof cat.product_count === 'number' && (
                      <span className="text-[10px] text-slate-400">{cat.product_count}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="border-t border-slate-100 pt-3">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                Price (₹)
              </h4>
              <form onSubmit={handlePriceApply} className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full h-8 px-2 border border-slate-200 rounded text-xs outline-none focus:border-red-600"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full h-8 px-2 border border-slate-200 rounded text-xs outline-none focus:border-red-600"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full crm-btn-secondary !h-7 !text-xs !rounded"
                >
                  Apply
                </button>
              </form>
            </div>

            {/* Brands Filter (if available) */}
            {brands.length > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                  Brands
                </h4>
                <div className="space-y-0.5 max-h-40 overflow-y-auto pr-1">
                  <button
                    onClick={() => updateParam('brand', 'ALL')}
                    className={`w-full text-left px-2 py-1 rounded text-xs ${
                      selectedBrand === 'ALL' ? 'font-bold text-slate-900 bg-slate-100' : 'text-slate-600'
                    }`}
                  >
                    All Brands
                  </button>
                  {brands.map((br) => (
                    <button
                      key={br._id}
                      onClick={() => updateParam('brand', br._id)}
                      className={`w-full text-left px-2 py-1 rounded text-xs truncate ${
                        selectedBrand === br._id ? 'font-bold text-slate-900 bg-slate-100' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {br.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT CONTENT: ACTIVE CHIPS + PRODUCT GRID + PAGINATION (3 cols) */}
        <div className="md:col-span-3 space-y-4">
          {/* Active Filter Chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-400 font-medium mr-1">Active:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700">
                  Search: "{searchQuery}"
                  <button onClick={() => updateParam('search', '')}><X className="w-3 h-3 text-slate-400 hover:text-slate-700" /></button>
                </span>
              )}
              {selectedCategory !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700">
                  Dept: {categories.find(c => c._id === selectedCategory)?.name || 'Filtered'}
                  <button onClick={() => updateParam('category', 'ALL')}><X className="w-3 h-3 text-slate-400 hover:text-slate-700" /></button>
                </span>
              )}
              {selectedBrand !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700">
                  Brand: {brands.find(b => b._id === selectedBrand)?.name || 'Filtered'}
                  <button onClick={() => updateParam('brand', 'ALL')}><X className="w-3 h-3 text-slate-400 hover:text-slate-700" /></button>
                </span>
              )}
              {inStockOnly && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700">
                  In-Stock Only
                  <button onClick={toggleInStock}><X className="w-3 h-3 text-slate-400 hover:text-slate-700" /></button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700">
                  ₹{minPrice || '0'} - ₹{maxPrice || '∞'}
                  <button onClick={() => { setMinPrice(''); setMaxPrice(''); updateParam('min_price', ''); }}><X className="w-3 h-3 text-slate-400 hover:text-slate-700" /></button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs font-semibold text-red-700 hover:underline ml-auto"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={fetchProducts}
                className="font-bold underline hover:no-underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white rounded-lg border border-slate-200 p-3 space-y-3 animate-pulse">
                  <div className="aspect-square bg-slate-100 rounded" />
                  <div className="h-3.5 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-7 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            /* Empty State */
            <EmptyState
              title="No Products Match Your Filter"
              description="Try adjusting your filter selection, search query, or price range."
              actionText="Reset All Filters"
              onAction={clearAllFilters}
            />
          ) : (
            /* Product Grid */
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((prod) => {
                  const isUniversal = Boolean(
                    (prod as any).marketplace_category_id ||
                    (prod as any).listing_type ||
                    (prod as any).category_data
                  );

                  if (isUniversal) {
                    return (
                      <ListingCard
                        key={prod._id}
                        listing={prod as unknown as UniversalListing}
                        onEnquire={(l) => {
                          setSelectedListingForEnquiry(l);
                          setIsEnquiryModalOpen(true);
                        }}
                      />
                    );
                  }

                  return (
                    <ProductCard
                      key={prod._id}
                      product={prod}
                      onRequestQuote={(p) => {
                        setSelectedProductForQuote(p);
                        setIsQuoteModalOpen(true);
                      }}
                    />
                  );
                })}
              </div>

              {/* Pagination Bar */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-5 border-t border-slate-200 text-xs">
                  <span className="text-slate-500">
                    Page <span className="font-bold text-slate-800">{currentPage}</span> of{' '}
                    <span className="font-bold text-slate-800">{totalPages}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="crm-btn-secondary !h-7 !px-2.5 !text-xs disabled:opacity-40"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>

                    <div className="hidden sm:flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-7 h-7 rounded text-xs font-semibold ${
                              currentPage === pageNum
                                ? 'bg-red-700 text-white'
                                : 'text-slate-700 hover:bg-slate-100 border border-slate-200'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="crm-btn-secondary !h-7 !px-2.5 !text-xs disabled:opacity-40"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MOBILE FILTER MODAL DRAWER */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xs bg-white h-full p-4 overflow-y-auto space-y-4 animate-in slide-in-from-right duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-900 text-sm">Filters</span>
              <button onClick={() => setIsMobileFiltersOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* In-stock toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={toggleInStock}
                className="w-4 h-4 rounded border-slate-300 text-red-600"
              />
              <span>In-Stock Only</span>
            </label>

            {/* Department list */}
            <div className="space-y-1">
              <span className="font-bold text-slate-700 text-xs block mb-1">Department</span>
              <button
                onClick={() => { updateParam('category', 'ALL'); setIsMobileFiltersOpen(false); }}
                className={`w-full text-left px-2 py-1.5 rounded text-xs ${
                  selectedCategory === 'ALL' ? 'bg-slate-100 font-bold' : 'text-slate-600'
                }`}
              >
                All Departments
              </button>
              {categories.map((c) => (
                <button
                  key={c._id}
                  onClick={() => { updateParam('category', c._id); setIsMobileFiltersOpen(false); }}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs ${
                    selectedCategory === c._id ? 'bg-slate-100 font-bold' : 'text-slate-600'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 flex gap-2">
              <button
                onClick={clearAllFilters}
                className="flex-1 crm-btn-secondary !h-8 !text-xs"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="flex-1 crm-btn-primary !h-8 !text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RFQ Quotation Modal */}
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

      {/* Universal Listing Enquiry Modal */}
      {selectedListingForEnquiry && (
        <EnquiryModal
          isOpen={isEnquiryModalOpen}
          onClose={() => {
            setIsEnquiryModalOpen(false);
            setSelectedListingForEnquiry(null);
          }}
          listing={selectedListingForEnquiry}
        />
      )}
    </div>
  );
};

export default CatalogPage;
