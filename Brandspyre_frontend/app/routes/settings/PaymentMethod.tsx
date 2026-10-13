import { useState } from "react";
import PageHeader from "src/component/ui/PageHeader";
import FilterBar from "src/component/ui/FilterBar";
import CrmBadge from "src/component/ui/CrmBadge";
import DataTable from "src/component/DataTable";
import Modal from "src/component/Modal";
import { Plus, SquarePen, Trash2, CreditCard } from "lucide-react";
import { notify } from "~/services/notificationService";

interface PaymentGateway {
  id: string;
  name: string;
  code: string;
  type: "online" | "offline" | "bank";
  accountDetails: string;
  status: "active" | "inactive";
}

export default function PaymentMethod() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [methods, setMethods] = useState<PaymentGateway[]>([
    {
      id: "pm-1",
      name: "Razorpay Checkout",
      code: "RAZORPAY_IN",
      type: "online",
      accountDetails: "Live API Key (rzp_live_****)",
      status: "active",
    },
    {
      id: "pm-[#2]",
      name: "Corporate Bank Transfer (NEFT/RTGS)",
      code: "BANK_TRANSFER",
      type: "bank",
      accountDetails: "HDFC Bank | Acc: 502000**** | IFSC: HDFC0000240",
      status: "active",
    },
    {
      id: "pm-[#3]",
      name: "UPI Direct QR / VPA",
      code: "UPI_VPA",
      type: "online",
      accountDetails: "nxtaspect@hdfcbank",
      status: "active",
    },
    {
      id: "pm-[#4]",
      name: "Cash Counter Collection",
      code: "CASH_COUNTER",
      type: "offline",
      accountDetails: "Physical Counter Receipt Slip",
      status: "active",
    },
  ]);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "online" as "online" | "offline" | "bank",
    accountDetails: "",
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newMethod: PaymentGateway = {
      id: `pm-${Date.now()}`,
      name: formData.name,
      code: formData.code || formData.name.toUpperCase().replace(/\s+/g, "_"),
      type: formData.type,
      accountDetails: formData.accountDetails,
      status: "active",
    };

    setMethods((prev) => [newMethod, ...prev]);
    notify.success("Payment method added!");
    setShowCreateModal(false);
    setFormData({ name: "", code: "", type: "online", accountDetails: "" });
  };

  const handleDeleteMethod = (id: string) => {
    setMethods((prev) => prev.filter((m) => m.id !== id));
    notify.success("Payment method removed!");
  };

  const filteredMethods = methods.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const thead = () => [
    { data: "Payment Gateway / Method" },
    { data: "Method Code" },
    { data: "Channel Type" },
    { data: "Account / Integration Details" },
    { data: "Status" },
    { data: "Actions", className: "text-center" },
  ];

  const tbody = () => {
    return filteredMethods.map((m) => ({
      id: m.id,
      data: [
        {
          data: (
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-slate-600 dark:text-slate-400" />
              <span className="font-semibold text-slate-900 dark:text-slate-100">{m.name}</span>
            </div>
          ),
        },
        { data: <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{m.code}</span> },
        {
          data: (
            <CrmBadge
              label={m.type === "online" ? "Online Gateway" : m.type === "bank" ? "Bank Wire" : "Offline Cash"}
              variant={m.type === "online" ? "blue" : m.type === "bank" ? "purple" : "amber"}
            />
          ),
        },
        { data: <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{m.accountDetails}</span> },
        { data: <CrmBadge label={m.status} variant="green" /> },
        {
          data: (
            <div className="flex justify-center">
              <button
                onClick={() => handleDeleteMethod(m.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                title="Delete Method"
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
        title="Payment Gateways & Collection Methods"
        description="Configure active payment collection channels, bank account details, UPI endpoints, and offline receipt modes."
        primaryAction={{
          label: "New Payment Channel",
          onClick: () => setShowCreateModal(true),
          icon: <Plus size={16} />,
        }}
      />

      <FilterBar
        searchQuery={searchTerm}
        onSearchChange={(val) => setSearchTerm(val)}
        searchPlaceholder="Search payment gateway or channel code..."
        filters={[]}
        onClearAll={() => setSearchTerm("")}
      />

      <DataTable
        thead={thead}
        tbody={tbody}
        isLoading={false}
        noDataText="No payment methods configured"
        enableSorting={true}
      />

      <Modal isVisible={showCreateModal} maxWidth="md" onClose={() => setShowCreateModal(false)} title="Add Payment Channel" closeOnOutsideClick={false}>
        <form onSubmit={handleCreateSubmit} className="space-y-4 p-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Method Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Razorpay Integration"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Channel Code</label>
              <input
                type="text"
                placeholder="RAZORPAY_IN"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Channel Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="mt-1 w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="online">Online Gateway</option>
                <option value="bank">Bank Transfer</option>
                <option value="offline">Offline Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Account / Integration Details</label>
            <textarea
              rows={2}
              placeholder="API Key, Bank Acc #, or VPA address..."
              value={formData.accountDetails}
              onChange={(e) => setFormData({ ...formData, accountDetails: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700">Cancel</button>
            <button type="submit" className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">Add Channel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}