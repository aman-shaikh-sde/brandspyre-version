import { useEffect, useState } from "react";
import { apiClient } from "src/services/apiClient";
import { Plus, Edit2, Trash2, Database, Search, CheckCircle2, XCircle } from "lucide-react";
import { useAuthStore } from "src/stores/authStore";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import Modal from "src/component/Modal";
import CrmInput from "src/component/ui/CrmInput";
import CrmSelect from "src/component/ui/CrmSelect";
import CrmBadge from "src/component/ui/CrmBadge";

interface MasterItem {
  _id: string;
  category: string;
  key: string;
  label: string;
  badgeColor?: string;
  icon?: string;
  sortOrder?: number;
  isSystem?: boolean;
  isActive?: boolean;
}

const CATEGORIES = [
  { value: "project_type", label: "Project Types" },
  { value: "priority", label: "Priorities" },
  { value: "lead_source", label: "Lead Sources" },
  { value: "lead_status", label: "Lead Statuses" },
  { value: "task_status", label: "Task Statuses" },
  { value: "project_status", label: "Project Statuses" },
  { value: "invoice_status", label: "Invoice / Payment Statuses" },
  { value: "tax_type", label: "Tax Types" },
  { value: "payment_method", label: "Payment Methods" },
  { value: "industry", label: "Industries" },
  { value: "department", label: "Departments" },
  { value: "designation", label: "Designations" },
];

const COLOR_OPTIONS = [
  { value: "gray", label: "Gray" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "yellow", label: "Yellow" },
  { value: "red", label: "Red" },
  { value: "purple", label: "Purple" },
  { value: "indigo", label: "Indigo" },
  { value: "amber", label: "Amber" },
  { value: "cyan", label: "Cyan" },
];

const MasterDataManagement = () => {
  const token = useAuthStore((state) => state.accessToken);
  const [selectedCategory, setSelectedCategory] = useState("priority");
  const [items, setItems] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterItem | null>(null);
  const [formData, setFormData] = useState({
    category: "priority",
    key: "",
    label: "",
    badgeColor: "blue",
    sortOrder: 1,
    isActive: true,
  });

  const fetchItems = async (cat: string) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/masters?category=${cat}`);
      if (res.data?.success) {
        setItems(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching master items:", err);
      notify.error("Failed to load master data items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchItems(selectedCategory);
    }
  }, [selectedCategory, token]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      category: selectedCategory,
      key: "",
      label: "",
      badgeColor: "blue",
      sortOrder: items.length + 1,
      isActive: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: MasterItem) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      key: item.key,
      label: item.label,
      badgeColor: item.badgeColor || "blue",
      sortOrder: item.sortOrder || 1,
      isActive: item.isActive !== false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await apiClient.put(
          `/masters/${editingItem._id}`,
          {
            label: formData.label,
            badgeColor: formData.badgeColor,
            sortOrder: formData.sortOrder,
            isActive: formData.isActive,
          }
        );
        notify.success("Master item updated successfully");
      } else {
        await apiClient.post(
          `/masters`,
          {
            category: formData.category,
            key: formData.key.toLowerCase().replace(/\s+/g, "_"),
            label: formData.label,
            badgeColor: formData.badgeColor,
            sortOrder: formData.sortOrder,
          }
        );
        notify.success("Master item created successfully");
      }
      setShowModal(false);
      fetchItems(selectedCategory);
    } catch (err: any) {
      notify.error(err.response?.data?.message || "Failed to save master item");
    }
  };

  const handleDelete = async (item: MasterItem) => {
    if (item.isSystem) {
      notify.error("System master items cannot be deleted");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete '${item.label}'?`)) return;

    try {
      await apiClient.delete(`/masters/${item._id}`);
      notify.success("Master item deleted");
      fetchItems(selectedCategory);
    } catch (err: any) {
      notify.error(err.response?.data?.message || "Failed to delete item");
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Database className="text-red-700 dark:text-red-500" size={24} />
            Master Data Settings
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Standardize lookup options, dropdown items, badge colors, and status rules across the CRM.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-md text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus size={16} /> Add Master Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Sidebar: Categories */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-2 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 px-3 pb-2">
            Categories
          </h2>
          <div className="space-y-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedCategory === cat.value
                    ? "bg-red-700 text-white"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Main Table */}
        <div className="md:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {CATEGORIES.find((c) => c.value === selectedCategory)?.label || selectedCategory}
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search master items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-700"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">Loading master items...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 font-semibold">
                    <th className="p-3">Key</th>
                    <th className="p-3">Label</th>
                    <th className="p-3">Badge Preview</th>
                    <th className="p-3">Order</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500">
                        No master items found for this category.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="p-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                          {item.key}
                        </td>
                        <td className="p-3 font-semibold text-gray-800 dark:text-gray-100">
                          {item.label}
                        </td>
                        <td className="p-3">
                          <CrmBadge
                            label={item.label}
                            variant={(item.badgeColor as any) || "gray"}
                          />
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-400">
                          {item.sortOrder || 0}
                        </td>
                        <td className="p-3">
                          {item.isActive !== false ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-semibold">
                              <CheckCircle2 size={14} /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-red-500 font-semibold">
                              <XCircle size={14} /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-gray-700"
                            title="Edit Item"
                          >
                            <Edit2 size={16} />
                          </button>
                          {!item.isSystem && (
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-gray-700"
                              title="Delete Item"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        isVisible={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? "Edit Master Item" : "Add New Master Item"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-2">
          {!editingItem && (
            <CrmInput
              label="Key / Machine Code"
              placeholder="e.g. QUALIFIED"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              required
            />
          )}
          <CrmInput
            label="Display Label"
            placeholder="e.g. Qualified Lead"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            required
          />
          <CrmSelect
            label="Badge Color"
            value={formData.badgeColor}
            onChange={(e) => setFormData({ ...formData, badgeColor: e.target.value })}
            options={COLOR_OPTIONS}
          />
          <CrmInput
            label="Sort Order"
            type="number"
            value={formData.sortOrder}
            onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-red-700 border-gray-300 rounded focus:ring-red-600"
            />
            <label htmlFor="isActiveCheck" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Active Status
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-md text-sm font-semibold"
            >
              Save Item
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MasterDataManagement;
