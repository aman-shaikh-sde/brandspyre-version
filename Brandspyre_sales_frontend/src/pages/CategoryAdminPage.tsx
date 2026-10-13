import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Sliders,
  Settings,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';
import { MarketplaceCategory, CategoryFormSchema, FormFieldDefinition } from '../types';
import marketplaceService from '../services/marketplaceService';

export const CategoryAdminPage: React.FC = () => {
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Schema Inspection Modal
  const [selectedCatForSchema, setSelectedCatForSchema] = useState<MarketplaceCategory | null>(null);
  const [catSchema, setCatSchema] = useState<CategoryFormSchema | null>(null);
  const [loadingSchema, setLoadingSchema] = useState(false);

  // New Category Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCatData, setNewCatData] = useState({
    code: '',
    name: '',
    description: '',
    icon: 'Layers',
    transaction_flow: 'ENQUIRY',
    default_pricing_mode: 'FIXED',
    default_pricing_unit: 'PER_UNIT',
    listing_types: 'STANDARD'
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await marketplaceService.adminGetCategories();
      setCategories(data);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleInspectSchema = async (cat: MarketplaceCategory) => {
    setSelectedCatForSchema(cat);
    try {
      setLoadingSchema(true);
      const schema = await marketplaceService.getCategorySchema(cat._id || cat.code);
      setCatSchema(schema);
    } catch (err) {
      console.error('Failed to load schema:', err);
    } finally {
      setLoadingSchema(false);
    }
  };

  const handleToggleActive = async (cat: MarketplaceCategory) => {
    try {
      await marketplaceService.adminDeactivateCategory(cat._id);
      loadCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle category');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!newCatData.code || !newCatData.name) {
      setModalError('Code and Name are required.');
      return;
    }

    try {
      setCreateLoading(true);
      await marketplaceService.adminCreateCategory({
        code: newCatData.code.toUpperCase().trim(),
        name: newCatData.name.trim(),
        description: newCatData.description.trim(),
        icon: newCatData.icon,
        transaction_flow: newCatData.transaction_flow as any,
        default_pricing_mode: newCatData.default_pricing_mode,
        default_pricing_unit: newCatData.default_pricing_unit,
        listing_types: newCatData.listing_types.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
      });

      setShowCreateModal(false);
      loadCategories();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create category');
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredCats = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
              PLATFORM ADMIN
            </span>
            <span className="text-xs text-gray-500 font-medium">Multi-Vertical Engine</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mt-1">
            Industry Categories & Dynamic Schemas
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage the universal category engine, listing workflows, and dynamic field schemas.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Filter and Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search categories by name or code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
          />
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200 text-center">
          <span className="text-xs text-gray-500">Active Verticals</span>
          <p className="text-lg font-bold text-gray-900">{categories.filter(c => c.is_active).length} / {categories.length}</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200 text-center">
          <span className="text-xs text-gray-500">Dynamic Forms Seeded</span>
          <p className="text-lg font-bold text-emerald-600">{categories.length}</p>
        </div>
      </div>

      {/* Categories Table / Cards */}
      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading categories...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Vertical</th>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Workflow</th>
                  <th className="py-3.5 px-4">Pricing Mode</th>
                  <th className="py-3.5 px-4 text-center">Listings</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCats.map(cat => (
                  <tr key={cat._id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-gray-900 block">{cat.name}</span>
                        <span className="text-xs text-gray-400 line-clamp-1">{cat.description}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-blue-700 font-medium">
                      {cat.code}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                        {cat.transaction_flow}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">
                      {cat.default_pricing_mode} ({cat.default_pricing_unit || 'PER_UNIT'})
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-gray-900">
                      {cat.listing_count || 0}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(cat)}
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          cat.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {cat.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{cat.is_active ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleInspectSchema(cat)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-blue-300 inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <Sliders className="w-3.5 h-3.5 text-blue-600" />
                        <span>Form Schema</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SCHEMA INSPECTION MODAL */}
      {selectedCatForSchema && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border">
            <div className="p-5 border-b flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  Dynamic Form Schema — {selectedCatForSchema.name}
                </h3>
                <p className="text-xs text-gray-500 font-mono">Code: {selectedCatForSchema.code}</p>
              </div>
              <button
                onClick={() => setSelectedCatForSchema(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {loadingSchema ? (
                <div className="py-12 text-center text-gray-400">Loading schema fields...</div>
              ) : catSchema?.fields && catSchema.fields.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 pb-2 border-b">
                    <span>{catSchema.fields.length} dynamic fields configured</span>
                    <span>Schema Version {catSchema.version || 1}</span>
                  </div>
                  {catSchema.fields.map(field => (
                    <div key={field.key} className="p-3.5 rounded-xl border border-gray-200/80 bg-gray-50/40 text-xs">
                      <div className="flex items-center justify-between font-semibold text-gray-900">
                        <span className="flex items-center gap-2">
                          <span>{field.label}</span>
                          {field.required && (
                            <span className="px-1.5 py-0.2 bg-red-100 text-red-700 text-[10px] rounded">Required</span>
                          )}
                        </span>
                        <span className="font-mono text-gray-500 uppercase">{field.type}</span>
                      </div>
                      <div className="mt-1 text-gray-500 flex items-center gap-4 text-[11px]">
                        <span>Key: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">{field.key}</code></span>
                        <span>Group: {field.group || 'General'}</span>
                        {field.options && <span>Options: {field.options.length}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500 border border-dashed rounded-xl">
                  No dynamic form fields configured for this category yet.
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 text-right">
              <button
                onClick={() => setSelectedCatForSchema(null)}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW CATEGORY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border">
            <div className="p-5 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-base">Create New Vertical Category</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LOGISTICS_FLEET"
                    value={newCatData.code}
                    onChange={e => setNewCatData({ ...newCatData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-sm border rounded-lg uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Display Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Logistics & Rentals"
                    value={newCatData.name}
                    onChange={e => setNewCatData({ ...newCatData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short description of businesses and listings in this vertical..."
                  value={newCatData.description}
                  onChange={e => setNewCatData({ ...newCatData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Workflow Model</label>
                  <select
                    value={newCatData.transaction_flow}
                    onChange={e => setNewCatData({ ...newCatData, transaction_flow: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white"
                  >
                    <option value="ENQUIRY">Enquiry / Leads</option>
                    <option value="BOOKING">Booking / Calendar</option>
                    <option value="ECOMMERCE">Cart / Ecommerce</option>
                    <option value="RFQ">B2B RFQ / Quotes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Pricing Mode</label>
                  <select
                    value={newCatData.default_pricing_mode}
                    onChange={e => setNewCatData({ ...newCatData, default_pricing_mode: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white"
                  >
                    <option value="FIXED">Fixed</option>
                    <option value="NEGOTIABLE">Negotiable</option>
                    <option value="STARTING_FROM">Starting From</option>
                    <option value="PRICE_ON_REQUEST">Price on Request</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Listing Types (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. FLEET_RENTAL, CARGO_SHIPPING"
                  value={newCatData.listing_types}
                  onChange={e => setNewCatData({ ...newCatData, listing_types: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-sm disabled:opacity-60"
                >
                  {createLoading ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryAdminPage;
