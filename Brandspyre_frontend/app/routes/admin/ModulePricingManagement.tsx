import React, { useEffect, useState } from 'react';
import apiClient from "src/services/apiClient";
import PageHeader from 'src/component/ui/PageHeader';
import CrmBadge from 'src/component/ui/CrmBadge';
import FormModal from 'src/component/ui/FormModal';
import { Edit2, RefreshCw } from 'lucide-react';

export default function ModulePricingManagement() {
  const [pricingList, setPricingList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/v1/platform-admin/module-pricing');
      if (res.data?.success) {
        setPricingList(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching module pricing:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem({ ...item });
    setModalOpen(true);
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setSaving(true);
      await apiClient.put(`/v1/platform-admin/module-pricing/${editingItem.module_code}`, {
        monthly_price: Number(editingItem.monthly_price),
        yearly_price: Number(editingItem.yearly_price),
        is_active: editingItem.is_active,
        is_addon_available: editingItem.is_addon_available
      });
      setModalOpen(false);
      fetchPricing();
    } catch (err) {
      alert('Failed to save module price.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading Commercial Module Pricing...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 text-slate-900 dark:text-slate-100">
      {/* Standard Page Header */}
      <PageHeader
        title="Module Pricing"
        description="Configure standalone module and add-on pricing. Changes apply to future subscriptions while existing price snapshots remain protected."
        actions={
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700">
              Currency: INR (₹)
            </span>
            <button
              onClick={fetchPricing}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Rates
            </button>
          </div>
        }
      />

      {/* Pricing Grid Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold">
              <th className="p-4">Module</th>
              <th className="p-4">Monthly Rate</th>
              <th className="p-4">Annual Rate</th>
              <th className="p-4">Availability</th>
              <th className="p-4">Last Updated</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {pricingList.map((item) => (
              <tr key={item.module_code} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                <td className="p-4">
                  <div className="font-extrabold text-slate-900 dark:text-white">{item.module_code}</div>
                  <div className="text-[11px] text-slate-500">Standalone Addon</div>
                </td>
                <td className="p-4 font-bold text-slate-900 dark:text-white">
                  ₹{(item.monthly_price || 0).toLocaleString('en-IN')}
                </td>
                <td className="p-4 font-bold text-slate-900 dark:text-white">
                  ₹{(item.yearly_price || 0).toLocaleString('en-IN')}
                </td>
                <td className="p-4">
                  <CrmBadge label={item.is_addon_available ? 'ACTIVE' : 'DISABLED'} />
                </td>
                <td className="p-4 text-slate-500 text-xs">
                  {new Date(item.updated_at || Date.now()).toLocaleDateString('en-IN')}
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 ml-auto border border-slate-200 dark:border-slate-700 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Pricing Modal */}
      {modalOpen && editingItem && (
        <FormModal
          isVisible={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`Edit Module Pricing — ${editingItem.module_code}`}
          subtitle="Configure rates and availability for this standalone module add-on."
          onSubmit={handleSavePrice}
          submitLabel="Save Changes"
          isSubmitting={saving}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Monthly Price (₹)</label>
              <input
                type="number"
                required
                value={editingItem.monthly_price}
                onChange={(e) => setEditingItem({ ...editingItem, monthly_price: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Annual Price (₹)</label>
              <input
                type="number"
                required
                value={editingItem.yearly_price}
                onChange={(e) => setEditingItem({ ...editingItem, yearly_price: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold outline-none focus:border-red-600"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is_addon_available"
                checked={editingItem.is_addon_available}
                onChange={(e) => setEditingItem({ ...editingItem, is_addon_available: e.target.checked })}
                className="rounded border-slate-300 text-red-600 focus:ring-red-500"
              />
              <label htmlFor="is_addon_available" className="text-xs font-bold text-slate-700 dark:text-slate-300 select-none">
                Module Available as Add-on
              </label>
            </div>
          </div>
        </FormModal>
      )}
    </div>
  );
}
