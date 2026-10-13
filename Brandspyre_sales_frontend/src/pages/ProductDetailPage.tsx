import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Heart,
  Star,
  FileSpreadsheet,
  Building2,
  ShieldCheck,
  Truck,
  Plus,
  Minus,
  CheckCircle2,
  ChevronRight,
  Send,
  Package,
  Layers,
  ArrowLeft,
  Share2
} from 'lucide-react';
import { Product, ProductReview } from '../types';
import { ProductCard } from '../components/product/ProductCard';
import { QuotationModal } from '../components/quotation/QuotationModal';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { marketplaceService } from '../services/marketplaceService';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated, setIsAuthModalOpen } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'seller' | 'reviews'>('desc');
  const [selectedImage, setSelectedImage] = useState<string>('');

  // RFQ Modal
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  // Review Form
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await marketplaceService.getProductDetails(id);
        if (data) {
          setProduct(data);
          setSelectedImage(data.image_url || '');
        }

        const revData = await marketplaceService.getProductReviews(id);
        setReviews(revData || []);
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!reviewComment.trim() || !id) return;

    setReviewSubmitting(true);
    try {
      const newReview = await marketplaceService.createProductReview(id, {
        rating: reviewRating,
        comment: reviewComment.trim()
      });
      setReviews((prev) => [newReview, ...prev]);
      setReviewComment('');
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 4000);
    } catch (e: any) {
      alert(e.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
          <div className="lg:col-span-6 aspect-square bg-slate-200 rounded-2xl" />
          <div className="lg:col-span-6 space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/4" />
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="h-10 bg-slate-200 rounded w-1/3" />
            <div className="h-24 bg-slate-200 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <Package className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Product Not Found</h2>
        <p className="text-xs text-slate-500">The requested listing may have been moved, delisted, or removed.</p>
        <Link to="/catalog" className="crm-btn-primary inline-flex !h-9 !text-xs">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const isFavorited = isInWishlist(product._id);
  const sellerName = product.tenant_id?.company_name || product.tenant_id?.name || 'Verified Merchant';
  const availableStock = typeof product.available_stock === 'number' ? product.available_stock : 100;
  const isOutOfStock = availableStock <= 0;

  const hasRealImages = (product.images && product.images.length > 0) || Boolean(product.image_url);
  const imagesList = product.images && product.images.length > 0
    ? product.images
    : product.image_url
      ? [product.image_url]
      : [];

  const currentDisplayImage = selectedImage || (imagesList.length > 0 ? imagesList[0] : null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* 1. Breadcrumb Path */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/" className="hover:text-red-700 transition-colors font-medium">Home</Link>
        <ChevronRight size={12} className="text-slate-400" />
        <Link to="/catalog" className="hover:text-red-700 transition-colors font-medium">Catalog</Link>
        {product.category_id && (
          <>
            <ChevronRight size={12} className="text-slate-400" />
            <Link
              to={`/catalog?category=${product.category_id._id}`}
              className="hover:text-red-700 transition-colors font-medium"
            >
              {product.category_id.name}
            </Link>
          </>
        )}
        <ChevronRight size={12} className="text-slate-400" />
        <span className="text-slate-700 font-semibold truncate max-w-[200px] sm:max-w-md">{product.name}</span>
      </nav>

      {/* 2. Main Dual-Column Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Gallery Area */}
        <div className="lg:col-span-6 space-y-3">
          <div className="relative aspect-square rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shadow-2xs flex items-center justify-center">
            {currentDisplayImage ? (
              <img
                src={currentDisplayImage}
                alt={product.name}
                className="w-full h-full object-contain p-4"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 p-8">
                <Package className="w-16 h-16 stroke-[1.2] text-slate-400 mb-2" />
                <span className="text-xs font-medium text-slate-500">No product image available</span>
                <span className="text-[11px] text-slate-400 font-mono mt-1">SKU: {product.sku}</span>
              </div>
            )}

            {/* Category tag */}
            {product.category_id && (
              <span className="absolute top-3 left-3 px-2 py-0.5 bg-white/95 text-[11px] font-bold text-slate-800 rounded border border-slate-200 shadow-2xs">
                {product.category_id.name}
              </span>
            )}

            {/* Wishlist button */}
            <button
              onClick={() => toggleWishlist(product)}
              className={`absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                isFavorited
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-white/95 text-slate-600 hover:text-rose-600 hover:bg-white border border-slate-200 shadow-2xs'
              }`}
              title={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-600 text-rose-600' : ''}`} />
            </button>
          </div>

          {/* Thumbnail Selector */}
          {imagesList.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {imagesList.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-14 h-14 rounded-lg border-2 overflow-hidden shrink-0 transition-all ${
                    (selectedImage || imagesList[0]) === img ? 'border-red-600 ring-2 ring-red-100' : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <img src={img} alt={`${product.name} ${idx}`} className="w-full h-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Buy Box & Product Technical Info */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-3">
            {/* Seller Organization Card */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-800">{sellerName}</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified Organization</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">SKU: {product.sku}</span>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Rating & Brand Strip */}
            <div className="flex items-center gap-4 text-xs">
              {typeof product.rating === 'number' && product.rating_count && product.rating_count > 0 ? (
                <div className="flex items-center gap-1.5 text-amber-600 font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{product.rating.toFixed(1)}</span>
                  <span className="text-slate-400 font-normal">({product.rating_count} customer reviews)</span>
                </div>
              ) : (
                <span className="text-slate-500 font-medium">Enterprise Certified Listing</span>
              )}

              {product.brand_id && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600 font-medium">Brand: <span className="font-bold text-slate-800">{product.brand_id.name}</span></span>
                </>
              )}
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900">
                ₹{product.selling_price.toLocaleString()}
              </span>
              {product.purchase_price && product.purchase_price > product.selling_price && (
                <span className="text-sm text-slate-400 line-through">
                  ₹{product.purchase_price.toLocaleString()}
                </span>
              )}
              <span className="text-xs font-semibold text-slate-500">
                {product.tax_inclusive ? 'Includes all applicable GST' : '+ Applicable Taxes at Checkout'}
              </span>
            </div>

            {/* Stock Availability Indicator */}
            <div className="flex items-center gap-2 pt-1">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  Out of Stock
                </span>
              ) : availableStock <= 5 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Low Stock — Only {availableStock} Units Remaining
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>In Stock — Ready for Immediate Dispatch</span>
                </span>
              )}
            </div>

            {/* Quantity Stepper & Add to Cart Controls */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700">Quantity:</span>
                <div className="flex items-center border border-slate-300 rounded-lg bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="p-2 text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center text-xs font-bold text-slate-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                    disabled={quantity >= availableStock || isOutOfStock}
                    className="p-2 text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-[11px] text-slate-400">Total: ₹{(product.selling_price * quantity).toLocaleString()}</span>
              </div>

              {/* Action Buttons: Add to Cart & RFQ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => addToCart(product, quantity)}
                  disabled={isOutOfStock}
                  className="crm-btn-primary !h-11 !text-sm w-full"
                >
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span>Add to Cart</span>
                </button>

                <button
                  onClick={() => setIsQuoteModalOpen(true)}
                  className="crm-btn-secondary !h-11 !text-sm border-red-300 text-red-700 hover:bg-red-50 w-full"
                >
                  <FileSpreadsheet className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Request Bulk Quote (RFQ)</span>
                </button>
              </div>
            </div>

            {/* Direct Trust Badges */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-red-600 shrink-0" />
                <span>Verified Escrow</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-red-600 shrink-0" />
                <span>Tracked Transit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Package className="w-4 h-4 text-red-600 shrink-0" />
                <span>GST Tax Invoice</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Detailed Tabbed Content (Specs, Description, Seller, Reviews) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        {/* Tab Headers */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50/50 px-4 sm:px-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('desc')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'desc'
                ? 'border-red-700 text-red-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Product Overview
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'specs'
                ? 'border-red-700 text-red-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Technical Specifications
          </button>
          <button
            onClick={() => setActiveTab('seller')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'seller'
                ? 'border-red-700 text-red-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Supplier Credentials
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'border-red-700 text-red-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Verified Reviews ({reviews.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {activeTab === 'desc' && (
            <div className="space-y-4 max-w-3xl text-xs sm:text-sm text-slate-700 leading-relaxed">
              <p>{product.description || 'No detailed description provided by the vendor for this listing.'}</p>
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Commercial Terms:</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs">
                  <li>Orders placed through this platform are bridged directly to the supplier's ERP ledger.</li>
                  <li>Invoices reflect GST registration details of the supplier organization.</li>
                  <li>For custom purchase orders or scheduled deliveries, use the Request Quote (RFQ) tool.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="max-w-2xl crm-table-container">
              <table className="crm-table">
                <tbody>
                  <tr>
                    <td className="w-1/3 font-bold text-slate-600 bg-slate-50">Stock Keeping Unit (SKU)</td>
                    <td className="font-mono text-slate-900">{product.sku}</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-slate-600 bg-slate-50">Product Classification</td>
                    <td className="capitalize text-slate-900">{product.product_type}</td>
                  </tr>
                  {product.category_id && (
                    <tr>
                      <td className="font-bold text-slate-600 bg-slate-50">Department Category</td>
                      <td className="text-slate-900">{product.category_id.name}</td>
                    </tr>
                  )}
                  {product.brand_id && (
                    <tr>
                      <td className="font-bold text-slate-600 bg-slate-50">Brand Origin</td>
                      <td className="text-slate-900">{product.brand_id.name}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="font-bold text-slate-600 bg-slate-50">Applicable Tax Rate</td>
                    <td className="text-slate-900">{product.tax_rate}% {product.tax_inclusive ? '(Inclusive)' : '(Exclusive)'}</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-slate-600 bg-slate-50">Inventory Tracking</td>
                    <td className="text-slate-900">{product.track_inventory ? 'Tracked in ERP' : 'Standard Fulfillment'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'seller' && (
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{sellerName}</h4>
                  <p className="text-xs text-slate-500">Verified Organization on Brandspyre Platform</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                This supplier is authenticated through Brandspyre's SaaS platform. Payments are held in escrow until dispatch verification, and orders are fulfilled directly from the merchant's warehouse.
              </p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6 max-w-3xl">
              {/* Write Review Form */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Submit Product Review</h4>
                {reviewSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Your review was submitted successfully!</span>
                  </div>
                )}
                <form onSubmit={handleReviewSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">Rating</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setReviewRating(s)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              s <= reviewRating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience with product quality, specifications, and fulfillment..."
                      className="crm-input h-20 resize-none text-xs"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={reviewSubmitting || !reviewComment.trim()}
                    className="crm-btn-primary !h-8 !px-4 !text-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{reviewSubmitting ? 'Submitting...' : 'Post Review'}</span>
                  </button>
                </form>
              </div>

              {/* Reviews List */}
              <div className="space-y-3">
                {reviews.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">No reviews submitted yet for this product. Be the first to review!</p>
                ) : (
                  reviews.map((r, i) => (
                    <div key={r._id || i} className="p-4 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{r.buyer_name || 'Verified Buyer'}</span>
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: r.rating || 5 }).map((_, idx) => (
                            <Star key={idx} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600">{r.comment}</p>
                      <span className="text-[10px] text-slate-400 block pt-1">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RFQ Quotation Modal */}
      <QuotationModal
        product={product}
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        onSuccess={() => setIsQuoteModalOpen(false)}
      />
    </div>
  );
};

export default ProductDetailPage;
