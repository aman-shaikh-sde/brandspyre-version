import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, FileSpreadsheet, Building2, Check } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { ProductImage } from '../common/ProductImage';

interface ProductCardProps {
  product: Product;
  onRequestQuote?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onRequestQuote }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const isFavorited = isInWishlist(product._id);
  const sellerName = product.tenant_id?.company_name || product.tenant_id?.name || 'Verified Supplier';
  const availableStock = typeof product.available_stock === 'number' ? product.available_stock : null;

  return (
    <div className="group bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all duration-150 flex flex-col overflow-hidden">
      {/* Product Image Area with Neutral Fallback (No Hardcoded Stock Photos) */}
      <div className="relative aspect-square bg-slate-50 border-b border-slate-100 overflow-hidden">
        <Link to={`/product/${product._id}`} className="block w-full h-full">
          <ProductImage
            src={product.image_url || product.images?.[0]}
            alt={product.name}
            className="w-full h-full"
            imgClassName="w-full h-full object-contain p-3 group-hover:scale-102 transition-transform duration-200"
          />
        </Link>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product);
          }}
          className={`absolute top-2 right-2 w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
            isFavorited
              ? 'bg-rose-50 text-rose-600 border border-rose-200'
              : 'bg-white/90 text-slate-400 hover:text-rose-600 hover:bg-white border border-slate-200 shadow-2xs'
          }`}
          title={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-label={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-rose-600 text-rose-600' : ''}`} />
        </button>

        {/* Stock indicator badge if low stock */}
        {availableStock !== null && availableStock > 0 && availableStock <= 5 && (
          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded">
            Only {availableStock} left
          </span>
        )}
      </div>

      {/* Product Content Details */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          {/* Seller / Organization Info */}
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-1">
            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{sellerName}</span>
          </div>

          {/* Product Title */}
          <Link
            to={`/product/${product._id}`}
            className="block text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-red-700 transition-colors line-clamp-2 leading-snug"
          >
            {product.name}
          </Link>

          {/* SKU / Department Info */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1">
            <span>SKU: {product.sku}</span>
            {availableStock !== null && availableStock > 0 ? (
              <span className="text-emerald-700 font-sans font-medium flex items-center gap-0.5">
                <Check className="w-3 h-3" /> In Stock
              </span>
            ) : null}
          </div>
        </div>

        {/* Price & Primary Purchasing Actions */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          {/* Price display */}
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-slate-900">
                ₹{product.selling_price.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400">
                {product.tax_inclusive ? 'incl. tax' : '+ tax'}
              </span>
            </div>
          </div>

          {/* Action buttons: Add to Cart and RFQ */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => addToCart(product, 1)}
              className="crm-btn-primary !h-8 !px-2 !text-xs !rounded-md"
            >
              <ShoppingBag className="w-3 h-3 shrink-0" />
              <span>Cart</span>
            </button>

            <button
              onClick={() => onRequestQuote && onRequestQuote(product)}
              className="crm-btn-secondary !h-8 !px-2 !text-xs !rounded-md hover:border-red-300 hover:text-red-700"
              title="Request bulk discount quotation"
            >
              <FileSpreadsheet className="w-3 h-3 text-slate-600 shrink-0" />
              <span>RFQ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
