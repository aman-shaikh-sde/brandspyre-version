import { useState } from "react";
import PageHeader from "src/component/ui/PageHeader";
import FilterBar from "src/component/ui/FilterBar";
import CrmBadge from "src/component/ui/CrmBadge";
import DataTable from "src/component/DataTable";
import Modal from "src/component/Modal";
import { Plus, SquarePen, Trash2, Percent } from "lucide-react";
import { notify } from "~/services/notificationService";

interface TaxRate {
  id: string;
  name: string;
  code: string;
  rate: number;
  type: "inclusive" | "exclusive";
  description: string;
  isDefault: boolean;
  status: "active" | "inactive";
}

export default function Tax() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTax, setSelectedTax] = useState<TaxRate | null>(null);

  const [taxRates, setTaxRates] = useState<TaxRate[]>([
    {
      id: "tax-1",
      name: "GST 18%",
      code: "GST_18",
      rate: 18,
      type: "exclusive",
      description: "Standard Goods and Services Tax rate for services and hardware.",
      isDefault: true,
      status: "active",
    },
    {
      id: "tax-2",
      name: "CGST 9%",
      code: "CGST_9",
      rate: 9,
      type: "exclusive",
      description: "Central Goods and Services Tax for intra-state billing.",
      isDefault: false,
      status: "active",
    },
    {
      id: "tax-3",
      name: "SGST 9%",
      code: "SGST_9",
      rate: 9,
      type: "exclusive",
      description: "State Goods and Services Tax for intra-state billing.",
      isDefault: false,
      status: "active",
    },
    {
      id: "tax-4",
      name: "IGST 18%",
      code: "IGST_18",
      rate: 18,
      type: "exclusive",
      description: "Integrated Goods and Services Tax for inter-state customer billing.",
      isDefault: false,
      status: "active",
    },
    {
      id: "tax-5",
      name: "Zero Rated (0%)",
      code: "ZERO_0",
      rate: 0,
      type: "exclusive",
      description: "Zero tax rate for export contracts and SEZ billing.",
      isDefault: false,
      status: "active",
    },
  ]);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    rate: 18,
    type: "exclusive" as "inclusive" | "exclusive",
    description: "",
    isDefault: false,
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTax: TaxRate = {
      id: `tax-${Date.now()}`,
      name: formData.name,
      code: formData.code || formData.name.toUpperCase().replace(/\s+/g, "_"),
      rate: Number(formData.rate),
      type: formData.type,
      description: formData.description,
      isDefault: formData.isDefault,
      status: "active",
    };

    setTaxRates((prev) => [newTax, ...prev]);
    notify.success("Tax rate policy added successfully!");
    setShowCreateModal(false);
    setFormData({ name: "", code: "", rate: 18, type: "exclusive", description: "", isDefault: false });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTax) return;

    setTaxRates((prev) =>
      prev.map((t) =>
        t.id === selectedTax.id
          ? {
              ...t,
              name: formData.name,
              code: formData.code,
              rate: Number(formData.rate),
              type: formData.type,
              description: formData.description,
              isDefault: formData.isDefault,
            }
          : t
      )
    );

    notify.success("Tax rate updated successfully!");
    setShowEditModal(false);
    setSelectedTax(null);
  };

  const handleDeleteTax = (id: string) => {
    setTaxRates((prev) => prev.filter((t) => t.id !== id));
    notify.success("Tax rate removed!");
  };

  const openEditModal = (tax: TaxRate) => {
    setSelectedTax(tax);
    setFormData({
      name: tax.name,
      code: tax.code,
      rate: tax.rate,
      type: tax.type,
      description: tax.description,
      isDefault: tax.isDefault,
    });
    setShowEditModal(true);
  };

  const filteredRates = taxRates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const thead = () => [
    { data: "Tax Policy Name" },
    { data: "Tax Code" },
    { data: "Percentage Rate" },
    { data: "Tax Calculation" },
    { data: "Default Status" },
    { data: "Actions", className: "text-center" },
  ];

  const tbody = () => {
    return filteredRates.map((t) => ({
      id: t.id,
      data: [
        {
          data: (
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{t.name}</p>
              <p className="text-xs text-slate-500">{t.description}</p>
            </div>
          ),
        },
        { data: <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{t.code}</span> },
        {
          data: (
            <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
              <Percent size={14} className="text-blue-600" /> {t.rate}%
            </span>
          ),
        },
        { data: <CrmBadge label={t.type === "inclusive" ? "Inclusive" : "Exclusive"} variant={t.type === "inclusive" ? "purple" : "blue"} /> },
        { data: t.isDefault ? <CrmBadge label="Default Tax Rate" variant="green" /> : <span className="text-xs text-slate-400">—</span> },
        {
          data: (
            <div className="flex justify-center gap-1.5">
              <button
                onClick={() => openEditModal(t)}
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                title="Edit Tax Rate"
              >
                <SquarePen size={16} />
              </button>
              <button
                onClick={() => handleDeleteTax(t.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                title="Delete Tax Rate"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ),
        },
      ],
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax & GST Rate Configurations"
        description="Define standard tax rates, GST rules, and tax calculation types for customer invoicing."
        primaryAction={{
          label: "New Tax Policy",
          onClick: () => {
            setFormData({ name: "", code: "", rate: 18, type: "exclusive", description: "", isDefault: false });
            setShowCreateModal(true);
          },
          icon: <Plus size={16} />,
        }}
      />

      <FilterBar
        searchQuery={searchTerm}
        onSearchChange={(val) => setSearchTerm(val)}
        searchPlaceholder="Search tax policy name or tax code..."
        filters={[]}
        onClearAll={() => setSearchTerm("")}
      />

      <DataTable
        thead={thead}
        tbody={tbody}
        isLoading={false}
        noDataText="No tax rate policies configured"
        enableSorting={true}
      />

      {/* Create Tax Modal */}
      <Modal isVisible={showCreateModal} maxWidth="md" onClose={() => setShowCreateModal(false)} title="Create New Tax Policy" closeOnOutsideClick={false}>
        <form onSubmit={handleCreateSubmit} className="space-y-4 p-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tax Name (e.g. GST 18%)</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tax Code</label>
              <input
                type="text"
                placeholder="GST_18"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Rate (%)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                className="mt-1 w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Calculation Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="mt-1 w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            >
              <option value="exclusive">Exclusive (Added on top of price)</option>
              <option value="inclusive">Inclusive (Included in item price)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <label htmlFor="isDefault" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Set as default tax rate for new invoices</label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700">Cancel</button>
            <button type="submit" className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">Add Policy</button>
          </div>
        </form>
      </Modal>

      {/* Edit Tax Modal */}
      <Modal isVisible={showEditModal} maxWidth="md" onClose={() => setShowEditModal(false)} title="Edit Tax Policy" closeOnOutsideClick={false}>
        <form onSubmit={handleEditSubmit} className="space-y-4 p-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tax Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tax Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Rate (%)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                className="mt-1 w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700">Cancel</button>
            <button type="submit" className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">Save Changes</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}