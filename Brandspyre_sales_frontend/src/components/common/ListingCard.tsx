import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Calendar, MessageSquare, ShoppingCart, ArrowRight } from 'lucide-react';
import { UniversalListing } from '../../types';
import { PriceDisplay } from './PriceDisplay';

interface ListingCardProps {
  listing: UniversalListing;
  onEnquire?: (listing: UniversalListing) => void;
  onAddToCart?: (listing: UniversalListing) => void;
  className?: string;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onEnquire,
  onAddToCart,
  className = ''
}) => {
  const category = typeof listing.marketplace_category_id === 'object' ? listing.marketplace_category_id : null;
  const flow = category?.transaction_flow || 'ECOMMERCE';
  const categoryData = listing.category_data?.data || {};

  const detailUrl = listing.slug ? `/listings/${listing.slug}` : `/product/${listing._id || (listing as any).id}`;
  const displayImage = listing.images?.[0] || listing.image_url || 'https://placehold.co/600x400?text=Listing';

  return (
    <div className={`group bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col ${className}`}>
      {/* Media Image */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-gray-100">
        <Link to={detailUrl} className="block w-full h-full">
          <img
            src={displayImage}
            alt={listing.title || listing.name || 'Listing'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
          {category && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/95 text-gray-800 shadow-xs backdrop-blur-xs">
              {category.name}
            </span>
          )}
          {listing.listing_type && listing.listing_type !== 'STANDARD' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-600 text-white shadow-xs">
              {listing.listing_type.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {/* Location badge */}
        {listing.location?.city && (
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium">
            <MapPin className="w-3 h-3 text-red-400" />
            <span>{listing.location.city}{listing.location.state ? `, ${listing.location.state}` : ''}</span>
          </div>
        )}
      </div>

      {/* Body Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Title */}
          <Link to={detailUrl}>
            <h3 className="font-semibold text-gray-900 text-base line-clamp-2 hover:text-blue-600 transition-colors leading-snug">
              {listing.title || listing.name}
            </h3>
          </Link>

          {/* Vertical Dynamic Metadata Highlights */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {categoryData.bedrooms && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[11px] rounded font-medium">
                {categoryData.bedrooms} BHK
              </span>
            )}
            {categoryData.carpet_area && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[11px] rounded font-medium">
                {categoryData.carpet_area} sq.ft
              </span>
            )}
            {categoryData.year && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[11px] rounded font-medium">
                {categoryData.year}
              </span>
            )}
            {categoryData.fuel_type && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[11px] rounded font-medium">
                {categoryData.fuel_type}
              </span>
            )}
            {categoryData.mileage_km && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[11px] rounded font-medium">
                {categoryData.mileage_km.toLocaleString('en-IN')} km
              </span>
            )}
            {categoryData.duration_days && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[11px] rounded font-medium">
                {categoryData.duration_days}D / {categoryData.duration_nights || 0}N
              </span>
            )}
            {categoryData.practice_area && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[11px] rounded font-medium">
                {categoryData.practice_area}
              </span>
            )}
            {categoryData.moq && (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[11px] rounded font-medium">
                MOQ: {categoryData.moq}
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-2.5">
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold text-gray-900">{listing.rating || 4.8}</span>
            </div>
            <span className="text-xs text-gray-400">({listing.rating_count || 12} reviews)</span>
          </div>
        </div>

        {/* Pricing and Action Footer */}
        <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between gap-2">
          <div className="flex-1">
            <PriceDisplay
              pricing={listing.pricing}
              price={listing.listing_price || listing.selling_price}
              comparePrice={listing.compare_price}
              size="md"
            />
          </div>

          <div>
            {flow === 'ECOMMERCE' ? (
              onAddToCart ? (
                <button
                  onClick={() => onAddToCart(listing)}
                  className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                  title="Add to Cart"
                >
                  <ShoppingCart className="w-4 h-4" />
                </button>
              ) : (
                <Link
                  to={detailUrl}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-1"
                >
                  <span>Buy</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )
            ) : flow === 'BOOKING' ? (
              onEnquire ? (
                <button
                  onClick={() => onEnquire(listing)}
                  className="px-3 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book</span>
                </button>
              ) : (
                <Link
                  to={detailUrl}
                  className="px-3 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book</span>
                </Link>
              )
            ) : (
              onEnquire ? (
                <button
                  onClick={() => onEnquire(listing)}
                  className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Enquire</span>
                </button>
              ) : (
                <Link
                  to={detailUrl}
                  className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Enquire</span>
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
