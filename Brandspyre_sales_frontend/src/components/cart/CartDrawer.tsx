import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { ProductImage } from '../common/ProductImage';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const {
    isCartOpen,
    setIsCartOpen,
    cartItems,
    updateQuantity,
    removeFromCart,
    subtotal,
    estimatedTax,
    shippingFee,
    grandTotal
  } = useCart();

  if (!isCartOpen) return null;

  const totalCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm sm:max-w-md bg-white shadow-xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-slate-700" />
              <h3 className="font-bold text-slate-900 text-sm">Shopping Cart</h3>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                {totalCount}
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Your cart is empty</h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1 mb-5">
                  Browse products across departments or submit bulk quote requests.
                </p>
                <Link
                  to="/catalog"
                  onClick={() => setIsCartOpen(false)}
                  className="crm-btn-primary !h-8 !text-xs !px-4"
                >
                  <span>Start Browsing</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              cartItems.map(({ product, quantity }) => {
                const availableStock = typeof product.available_stock === 'number' ? product.available_stock : 100;

                return (
                  <div
                    key={product._id}
                    className="flex gap-3 p-3 rounded-lg border border-slate-200 bg-white"
                  >
                    {/* Thumbnail with neutral fallback */}
                    <div className="w-14 h-14 rounded border border-slate-100 overflow-hidden shrink-0">
                      <ProductImage
                        src={product.image_url || product.images?.[0]}
                        alt={product.name}
                        iconSize="sm"
                        className="w-full h-full"
                        imgClassName="w-full h-full object-contain p-1"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <Link
                            to={`/product/${product._id}`}
                            onClick={() => setIsCartOpen(false)}
                            className="text-xs font-semibold text-slate-900 hover:text-red-700 truncate block transition-colors leading-snug"
                          >
                            {product.name}
                          </Link>
                          <button
                            onClick={() => removeFromCart(product._id)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block">SKU: {product.sku}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {/* Stepper */}
                        <div className="flex items-center border border-slate-200 rounded bg-white">
                          <button
                            onClick={() => updateQuantity(product._id, quantity - 1)}
                            className="p-1 text-slate-500 hover:text-slate-900 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-slate-900">{quantity}</span>
                          <button
                            onClick={() => updateQuantity(product._id, quantity + 1)}
                            disabled={quantity >= availableStock}
                            className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-40 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-900">
                            ₹{(product.selling_price * quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Summary & Action CTAs */}
          {cartItems.length > 0 && (
            <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Est. GST & Shipping</span>
                  <span className="font-semibold text-slate-900">₹{(estimatedTax + shippingFee).toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-900 font-bold text-sm">
                  <span>Estimated Total</span>
                  <span className="text-base text-red-700">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/cart');
                  }}
                  className="crm-btn-secondary !h-9 !text-xs"
                >
                  <span>View Cart</span>
                </button>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/checkout');
                  }}
                  className="crm-btn-primary !h-9 !text-xs"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
