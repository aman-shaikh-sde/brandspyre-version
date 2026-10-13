import React from 'react';
import {
  ShoppingBag,
  Home,
  Car,
  Factory,
  Compass,
  Briefcase,
  Palette,
  Wrench,
  Activity,
  GraduationCap,
  Calendar,
  Utensils,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { MarketplaceCategory, TransactionFlow } from '../../types';

const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingBag,
  Home,
  Car,
  Factory,
  Compass,
  Briefcase,
  Palette,
  Wrench,
  Activity,
  GraduationCap,
  Calendar,
  Utensils,
  Layers
};

const FLOW_CONFIG: Record<TransactionFlow, { label: string; bg: string; text: string }> = {
  ECOMMERCE: { label: 'Online Buy', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  ENQUIRY: { label: 'Enquiry & Leads', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  BOOKING: { label: 'Appointments & Slots', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
  RFQ: { label: 'B2B RFQ / Quotes', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  HYBRID: { label: 'Multi-Modal', bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700' }
};

interface CategorySelectorProps {
  categories: MarketplaceCategory[];
  selectedId?: string;
  onSelect: (category: MarketplaceCategory) => void;
  layout?: 'grid' | 'pills' | 'cards';
  className?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedId,
  onSelect,
  layout = 'grid',
  className = ''
}) => {
  if (layout === 'pills') {
    return (
      <div className={`flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none ${className}`}>
        {categories.map(cat => {
          const IconComp = ICON_MAP[cat.icon] || Layers;
          const isSelected = selectedId === cat._id || selectedId === cat.code;
          return (
            <button
              key={cat._id}
              onClick={() => onSelect(cat)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 ${className}`}>
      {categories.map(cat => {
        const IconComp = ICON_MAP[cat.icon] || Layers;
        const isSelected = selectedId === cat._id || selectedId === cat.code;
        const flowInfo = FLOW_CONFIG[cat.transaction_flow] || FLOW_CONFIG.ENQUIRY;

        return (
          <div
            key={cat._id}
            onClick={() => onSelect(cat)}
            className={`relative p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 hover:shadow-md ${
              isSelected
                ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/20'
                : 'border-gray-200 bg-white hover:border-blue-200'
            }`}
          >
            {isSelected && (
              <div className="absolute top-3 right-3 text-blue-600">
                <CheckCircle2 className="w-5 h-5 fill-blue-600 text-white" />
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
                <IconComp className="w-5 h-5" />
              </div>
              <div className="flex-1 pr-4">
                <h4 className="font-semibold text-gray-900 text-sm leading-snug">{cat.name}</h4>
                <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                  {cat.description}
                </p>
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${flowInfo.bg} ${flowInfo.text}`}>
                {flowInfo.label}
              </span>
              {cat.listing_types && cat.listing_types.length > 0 && (
                <span className="text-[11px] text-gray-400">
                  {cat.listing_types.length} listing types
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
