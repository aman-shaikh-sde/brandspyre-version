import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Upload,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  FileText,
  DollarSign,
  Sliders,
  CheckCheck
} from 'lucide-react';
import { MarketplaceCategory, CategoryFormSchema } from '../types';
import { CategorySelector } from '../components/common/CategorySelector';
import { DynamicFormRenderer } from '../components/common/DynamicFormRenderer';
import marketplaceService from '../services/marketplaceService';

export const ListingCreationWizard: React.FC = () => {
  const navigate = useNavigate();

  // Wizard Steps: 1: Category, 2: Basics, 3: Pricing & Location, 4: Vertical Specs, 5: Review
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Form State
  const [selectedCategory, setSelectedCategory] = useState<MarketplaceCategory | null>(null);
  const [selectedListingType, setSelectedListingType] = useState<string>('STANDARD');

  // Basics
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Location
  const [location, setLocation] = useState({
    address: '',
    city: '',
    state: '',
    country: 'India',
    postal_code: ''
  });

  // Pricing
  const [pricingMode, setPricingMode] = useState<string>('FIXED');
  const [pricingAmount, setPricingAmount] = useState<number | ''>('');
  const [compareAmount, setCompareAmount] = useState<number | ''>('');
  const [pricingUnit, setPricingUnit] = useState<string>('PER_UNIT');
  const [negotiable, setNegotiable] = useState<boolean>(false);

  // Dynamic Vertical Schema & Data
  const [schema, setSchema] = useState<CategoryFormSchema | null>(null);
  const [categoryData, setCategoryData] = useState<Record<string, any>>({});
  const [schemaErrors, setSchemaErrors] = useState<Record<string, string>>({});
  const [loadingSchema, setLoadingSchema] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Load Categories on mount
  useEffect(() => {
    async function loadCats() {
      try {
        setLoadingCategories(true);
        const cats = await marketplaceService.getCategoriesAll();
        setCategories(cats);
      } catch (err: any) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCats();
  }, []);

  // When category or listing type changes, fetch dynamic schema
  useEffect(() => {
    if (!selectedCategory) return;

    async function loadSchema() {
      try {
        setLoadingSchema(true);
        const res = await marketplaceService.getCategorySchema(
          selectedCategory!._id || selectedCategory!.code,
          selectedListingType
        );
        setSchema(res);
        setCategoryData({});
        setSchemaErrors({});
      } catch (err) {
        console.error('Failed to load schema:', err);
      } finally {
        setLoadingSchema(false);
      }
    }

    loadSchema();
  }, [selectedCategory, selectedListingType]);

  const handleCategorySelect = (cat: MarketplaceCategory) => {
    setSelectedCategory(cat);
    setSelectedListingType(cat.default_listing_type || cat.listing_types?.[0] || 'STANDARD');
    setPricingMode(cat.default_pricing_mode || 'FIXED');
    setPricingUnit(cat.default_pricing_unit || 'PER_UNIT');
  };

  const handleAddImage = () => {
    if (!imageUrlInput.trim()) return;
    setImages(prev => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateBasics = () => {
    if (!title.trim()) return 'Listing title is required.';
    if (selectedCategory?.requires_location && !location.city.trim()) {
      return 'City is required for this category.';
    }
    return null;
  };

  const validatePricing = () => {
    if (pricingMode !== 'PRICE_ON_REQUEST' && (pricingAmount === '' || Number(pricingAmount) < 0)) {
      return 'Please enter a valid listing price amount.';
    }
    return null;
  };

  const validateCategorySpecs = () => {
    if (!schema?.fields) return true;
    const errors: Record<string, string> = {};

    schema.fields.forEach(field => {
      if (field.required && (categoryData[field.key] === undefined || categoryData[field.key] === '')) {
        errors[field.key] = `${field.label} is required.`;
      }
    });

    setSchemaErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    setSubmitError(null);

    if (currentStep === 1) {
      if (!selectedCategory) {
        setSubmitError('Please select a business category to continue.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const err = validateBasics();
      if (err) {
        setSubmitError(err);
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      const err = validatePricing();
      if (err) {
        setSubmitError(err);
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      const isValid = validateCategorySpecs();
      if (!isValid) {
        setSubmitError('Please fill in all mandatory category specifications.');
        return;
      }
      setCurrentStep(5);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setSubmitError(null);

      const payload = {
        marketplace_category_id: selectedCategory?._id,
        listing_type: selectedListingType,
        title: title.trim(),
        description: description.trim(),
        images,
        location: location.city ? location : undefined,
        pricing: {
          mode: pricingMode,
          amount: pricingAmount !== '' ? Number(pricingAmount) : 0,
          currency: 'INR',
          unit: pricingUnit,
          compare_amount: compareAmount !== '' ? Number(compareAmount) : undefined,
          negotiation_allowed: negotiable
        },
        listing_price: pricingAmount !== '' ? Number(pricingAmount) : 0,
        compare_price: compareAmount !== '' ? Number(compareAmount) : undefined,
        category_data: Object.keys(categoryData).length > 0 ? categoryData : undefined
      };

      await marketplaceService.createUniversalListing(payload);
      setSubmitSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: 'Category', icon: Layers },
    { num: 2, label: 'Basics', icon: FileText },
    { num: 3, label: 'Pricing', icon: DollarSign },
    { num: 4, label: 'Specs', icon: Sliders },
    { num: 5, label: 'Review', icon: CheckCheck }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/seller')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Seller Dashboard</span>
        </button>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Create New Listing</h1>
        <p className="text-sm text-gray-500 mt-1">
          Universal multi-industry listing creation engine with configurable forms and workflows.
        </p>
      </div>

      {/* Stepper Progress Bar */}
      <div className="mb-8 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          {steps.map((st, i) => {
            const IconComp = st.icon;
            const isCompleted = currentStep > st.num;
            const isCurrent = currentStep === st.num;

            return (
              <React.Fragment key={st.num}>
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-blue-600 text-white shadow-sm ring-4 ring-blue-500/10'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : <IconComp className="w-4 h-4" />}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className={`text-xs font-bold leading-none ${isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                      {st.label}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Step 0{st.num}</p>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 ${currentStep > st.num ? 'bg-emerald-600' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Error banner */}
      {submitError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p>{submitError}</p>
        </div>
      )}

      {/* SUCCESS SCREEN */}
      {submitSuccess ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Listing Submitted for Review!</h2>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            Your listing has been submitted for platform moderation. Once verified, it will go live across the marketplace.
          </p>
          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/seller')}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              Go to Listings
            </button>
            <button
              onClick={() => {
                setSubmitSuccess(false);
                setCurrentStep(1);
                setSelectedCategory(null);
                setTitle('');
                setDescription('');
                setImages([]);
                setCategoryData({});
              }}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Create Another
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* STEP 1: CATEGORY SELECTION */}
          {currentStep === 1 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-900">Select Business Vertical</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Choose the industry category that best represents your offering.
                </p>
              </div>

              {loadingCategories ? (
                <div className="py-12 text-center text-gray-400">Loading categories...</div>
              ) : (
                <CategorySelector
                  categories={categories}
                  selectedId={selectedCategory?._id}
                  onSelect={handleCategorySelect}
                  layout="grid"
                />
              )}

              {selectedCategory && (
                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Listing Subtype for {selectedCategory.name}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCategory.listing_types.map(lt => (
                      <button
                        key={lt}
                        type="button"
                        onClick={() => setSelectedListingType(lt)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          selectedListingType === lt
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {lt.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: BASIC DETAILS */}
          {currentStep === 2 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
              <div>
                <h2 className="text-base font-bold text-gray-900">Basic Information</h2>
                <p className="text-xs text-gray-500 mt-1">Provide an engaging title, description, and images.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Listing Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Luxury 3 BHK Sea View Apartment in Worli"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  placeholder="Describe your property, vehicle, service package, or offering..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 resize-y"
                />
              </div>

              {/* Media URLs */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Listing Images (URLs)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={imageUrlInput}
                    onChange={e => setImageUrlInput(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mt-3">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border aspect-square bg-gray-100">
                        <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                  Location {selectedCategory?.requires_location && <span className="text-red-500">*</span>}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-3">
                    <label className="block text-xs text-gray-600 mb-1">Street Address</label>
                    <input
                      type="text"
                      placeholder="e.g. 402, High Street Towers"
                      value={location.address}
                      onChange={e => setLocation({ ...location, address: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">City *</label>
                    <input
                      type="text"
                      placeholder="e.g. Mumbai"
                      value={location.city}
                      onChange={e => setLocation({ ...location, city: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">State</label>
                    <input
                      type="text"
                      placeholder="e.g. Maharashtra"
                      value={location.state}
                      onChange={e => setLocation({ ...location, state: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">PIN / Postal Code</label>
                    <input
                      type="text"
                      placeholder="e.g. 400018"
                      value={location.postal_code}
                      onChange={e => setLocation({ ...location, postal_code: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PRICING & COMMERCIAL TERMS */}
          {currentStep === 3 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-900">Pricing Model & Commercial Terms</h2>
                <p className="text-xs text-gray-500 mt-1">Configurable pricing modes adapted to your business.</p>
              </div>

              {/* Pricing Mode */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Pricing Mode</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'FIXED', label: 'Fixed Price' },
                    { id: 'STARTING_FROM', label: 'Starting From' },
                    { id: 'NEGOTIABLE', label: 'Negotiable' },
                    { id: 'PRICE_ON_REQUEST', label: 'Price on Request' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPricingMode(m.id)}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                        pricingMode === m.id
                          ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-2 ring-blue-500/10'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {pricingMode !== 'PRICE_ON_REQUEST' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Price Amount (₹) *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-gray-400 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={pricingAmount}
                        onChange={e => setPricingAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-300 text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Pricing Unit</label>
                    <select
                      value={pricingUnit}
                      onChange={e => setPricingUnit(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white"
                    >
                      {selectedCategory?.pricing_units?.map(u => (
                        <option key={u} value={u}>
                          {u.replace(/_/g, ' ')}
                        </option>
                      )) || (
                        <option value="PER_UNIT">PER UNIT</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Compare / MRP Price (Optional)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-gray-400 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 50000"
                        value={compareAmount}
                        onChange={e => setCompareAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-300 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Negotiation Checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-700 select-none">
                <input
                  type="checkbox"
                  checked={negotiable}
                  onChange={e => setNegotiable(e.target.checked)}
                  className="rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span>Allow buyers to submit counter-offers / negotiate on this price.</span>
              </label>
            </div>
          )}

          {/* STEP 4: DYNAMIC VERTICAL-SPECIFIC FORM */}
          {currentStep === 4 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {selectedCategory?.name} Specifications
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Field schema tailored for {selectedListingType.replace(/_/g, ' ')}.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                  Dynamic Schema v{schema?.version || 1}
                </span>
              </div>

              {loadingSchema ? (
                <div className="py-12 text-center text-gray-400">Loading form schema...</div>
              ) : schema ? (
                <DynamicFormRenderer
                  fields={schema.fields}
                  values={categoryData}
                  errors={schemaErrors}
                  onChange={(k, v) => setCategoryData({ ...categoryData, [k]: v })}
                />
              ) : (
                <div className="p-6 text-center text-gray-500 border border-dashed rounded-xl">
                  No additional specifications defined for this vertical.
                </div>
              )}
            </div>
          )}

          {/* STEP 5: REVIEW & PUBLISH */}
          {currentStep === 5 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-900">Review & Confirmation</h2>
                <p className="text-xs text-gray-500 mt-1">Verify all details before submitting for moderation.</p>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Category & Type</span>
                  <span className="text-xs font-bold text-gray-900">
                    {selectedCategory?.name} — {selectedListingType}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Listing Title</span>
                  <span className="text-xs font-bold text-gray-900">{title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Pricing</span>
                  <span className="text-xs font-bold text-blue-700">
                    {pricingMode === 'PRICE_ON_REQUEST'
                      ? 'Price on Request'
                      : `₹${Number(pricingAmount).toLocaleString('en-IN')} (${pricingUnit})`}
                  </span>
                </div>
                {location.city && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Location</span>
                    <span className="text-xs font-medium text-gray-800">
                      {location.city}, {location.state}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Media</span>
                  <span className="text-xs font-medium text-gray-800">{images.length} images added</span>
                </div>
              </div>

              {/* Dynamic specs summary */}
              {Object.keys(categoryData).length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Specifications</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(categoryData).map(([k, v]) => (
                      <div key={k} className="p-2.5 rounded-lg border bg-white text-xs">
                        <span className="text-gray-400 block capitalize">{k.replace(/_/g, ' ')}</span>
                        <span className="font-semibold text-gray-800">{String(Array.isArray(v) ? v.join(', ') : v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-4">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : <div />}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="px-8 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-md flex items-center gap-2 disabled:opacity-60"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Submit Listing</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingCreationWizard;
