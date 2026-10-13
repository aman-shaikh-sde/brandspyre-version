import { useState } from "react";
import Modal from "src/component/Modal";
import { Send, Loader2 } from "lucide-react";
import { notify } from "~/services/notificationService";
import { organizationPaymentApi } from "src/services/organizationPaymentService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreatePaymentRequestModal({ isOpen, onClose, onCreated }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    payer_name: "",
    payer_email: "",
    payer_phone: "",
    title: "",
    description: "",
    total_amount: "",
    invoice_number: "",
    due_date: ""
  });

  const set = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.payer_name || !form.payer_email || !form.title || !form.total_amount) {
      notify.error("Payer name, email, title, and amount are required.");
      return;
    }
    const amount = Number(form.total_amount);
    if (isNaN(amount) || amount <= 0) {
      notify.error("Amount must be a positive number.");
      return;
    }

    setSaving(true);
    try {
      await organizationPaymentApi.createPaymentRequest({
        payer_name: form.payer_name,
        payer_email: form.payer_email,
        payer_phone: form.payer_phone || undefined,
        title: form.title,
        description: form.description || undefined,
        total_amount: amount,
        invoice_number: form.invoice_number || undefined,
        due_date: form.due_date || undefined
      });
      notify.success("Payment request created! Checkout link generated.");
      setForm({ payer_name: "", payer_email: "", payer_phone: "", title: "", description: "", total_amount: "", invoice_number: "", due_date: "" });
      onCreated();
    } catch (err: any) {
      notify.error(err.response?.data?.error || "Failed to create payment request.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isVisible={isOpen} onClose={onClose} title="Create Payment Request" maxWidth="2xl">
      <form onSubmit={handleSubmit} className="space-y-4 p-2">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">Payer Name *</label>
            <input className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100" value={form.payer_name} onChange={e => set("payer_name", e.target.value)} placeholder="Client / Organization Name" required />
          </div>
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">Payer Email *</label>
            <input className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100" type="email" value={form.payer_email} onChange={e => set("payer_email", e.target.value)} placeholder="client@domain.com" required />
          </div>
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">Phone</label>
            <input className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100" value={form.payer_phone} onChange={e => set("payer_phone", e.target.value)} placeholder="+91 9876543210" />
          </div>
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">Invoice Number (Optional)</label>
            <input className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono" value={form.invoice_number} onChange={e => set("invoice_number", e.target.value)} placeholder="INV-2026-001" />
          </div>
          <div className="col-span-2">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Title / Subject *</label>
            <input className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100" value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Q3 Consulting & Retainer Fee" required />
          </div>
          <div className="col-span-2">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Description</label>
            <textarea className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100" rows={2} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Additional notes or payment instructions..." />
          </div>
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">Amount (₹ INR) *</label>
            <input className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-bold" type="number" min="1" step="0.01" value={form.total_amount} onChange={e => set("total_amount", e.target.value)} placeholder="25000" required />
          </div>
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">Due Date</label>
            <input className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100" type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button type="button" className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50" onClick={onClose}>Cancel</button>
          <button type="submit" className="px-4 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white transition flex items-center gap-1.5 shadow-2xs" disabled={saving}>
            {saving ? <><Loader2 className="animate-spin" size={14} /> Creating...</> : <><Send size={14} /> Create & Generate Link</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}
