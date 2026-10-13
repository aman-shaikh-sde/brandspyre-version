import React from 'react';
import { ListingPricing } from '../../types';

interface PriceDisplayProps {
  pricing?: ListingPricing;
  price?: number;
  comparePrice?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  pricing,
  price,
  comparePrice,
  className = '',
  size = 'md'
}) => {
  const mode = pricing?.mode || 'FIXED';
  const amount = pricing?.amount !== undefined ? pricing.amount : (price || 0);
  const compareAmount = pricing?.compare_amount !== undefined ? pricing.compare_amount : comparePrice;
  const unit = pricing?.unit;
  const isNegotiable = pricing?.negotiation_allowed || mode === 'NEGOTIABLE';

  const formatAmount = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: pricing?.currency || 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getUnitLabel = (unitStr?: string) => {
    if (!unitStr || unitStr === 'PER_UNIT') return '';
    switch (unitStr) {
      case 'PER_MONTH': return '/ mo';
      case 'PER_NIGHT': return '/ night';
      case 'PER_DAY': return '/ day';
      case 'PER_HOUR': return '/ hr';
      case 'PER_SQFT': return '/ sq.ft';
      case 'PER_ACRE': return '/ acre';
      case 'PER_PERSON': return '/ person';
      case 'FIXED_PROJECT': return '/ project';
      case 'PER_KG': return '/ kg';
      case 'PER_TON': return '/ ton';
      case 'PER_PLATE': return '/ plate';
      case 'PER_VISIT': return '/ visit';
      default: return `/${unitStr.replace('PER_', '').toLowerCase()}`;
    }
  };

  const sizeClasses = {
    sm: { main: 'text-sm font-semibold', sub: 'text-xs text-gray-500' },
    md: { main: 'text-base font-bold text-gray-900', sub: 'text-xs text-gray-500' },
    lg: { main: 'text-xl font-extrabold text-gray-900', sub: 'text-sm text-gray-500' },
    xl: { main: 'text-3xl font-extrabold text-blue-900', sub: 'text-base text-gray-500' }
  }[size];

  if (mode === 'PRICE_ON_REQUEST') {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200`}>
          Price on Request
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-baseline gap-1.5 ${className}`}>
      {mode === 'STARTING_FROM' && (
        <span className="text-xs font-medium text-gray-500">From</span>
      )}

      <span className={sizeClasses.main}>
        {formatAmount(amount)}
        {unit && <span className="font-normal text-gray-500 text-sm ml-0.5">{getUnitLabel(unit)}</span>}
      </span>

      {compareAmount && compareAmount > amount && (
        <span className="text-xs text-gray-400 line-through">
          {formatAmount(compareAmount)}
        </span>
      )}

      {compareAmount && compareAmount > amount && (
        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
          {Math.round(((compareAmount - amount) / compareAmount) * 100)}% OFF
        </span>
      )}

      {isNegotiable && mode !== 'STARTING_FROM' && (
        <span className="text-xs font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
          Negotiable
        </span>
      )}
    </div>
  );
};
