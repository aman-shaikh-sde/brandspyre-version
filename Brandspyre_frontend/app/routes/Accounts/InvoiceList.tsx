import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import Modal from "src/component/Modal";
import { FileDown, Eye, DollarSign, Plus } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { useAuthStore } from "src/stores/authStore";
import { useNavigate } from "react-router";
import PageHeader from "src/component/ui/PageHeader";
import FilterBar from "src/component/ui/FilterBar";
import CrmBadge from "src/component/ui/CrmBadge";

const InvoiceList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectStatus, setSelectStatus] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [sheetData, setSheetData] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const [paymentForm, setPaymentForm] = useState({
    invoice_id: "",
    paid_amount: "",
    payment_mode: "upi",
    notes: "",
  });

  const [summary, setSummary] = useState<any>(null);
  const [dueStart, setDueStart] = useState("");
  const [dueEnd, setDueEnd] = useState("");

  const accesstoken = useAuthStore((state) => state.accessToken);
  const userRole = useAuthStore((state) => state.role);
  const staticBranchCode = "BRANCH-03";
  const navigate = useNavigate();

  const statusOptions = [
    { value: "raised", label: "Raised" },
    { value: "partially_paid", label: "Partially Paid" },
    { value: "paid", label: "Paid" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const paymentModeOptions = [
    { value: "upi", label: "UPI" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "cash", label: "Cash" },
    { value: "cheque", label: "Cheque" },
  ];

  const getPayments = async (
    page = currentPage,
    limit = pageSize,
    search = searchTerm,
    status = selectStatus,
    branchcode = selectedBranchCode
  ) => {
    setLoading(true);
    try {
      let url = `/project/invoice/read?page=${page}&limit=${limit}`;

      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status) url += `&status=${status}`;

      const branchFilter = userRole === "superadmin" ? branchcode : staticBranchCode;
      if (branchFilter) url += `&branchcode=${branchFilter}`;

      if (dueStart && dueEnd) url += `&start_date=${dueStart}&end_date=${dueEnd}`;
      else if (dueStart) url += `&start_date=${dueStart}`;
      else if (dueEnd) url += `&end_date=${dueEnd}`;

      const response = await apiClient.get(url);

      setData(response?.data?.data || []);
      setTotalItem(response?.data?.totalDocuments || response?.data?.length || 0);

      const flatData = (response?.data?.data || []).map((item: any) => item.invoice);
      setSheetData(flatData);

      if (response?.data?.summary) {
        setSummary(response.data.summary);
      }
    } catch (err) {
      console.error("Error fetching invoice list", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPayments(currentPage, pageSize, searchTerm, selectStatus, selectedBranchCode);
  }, [currentPage, pageSize, searchTerm, selectStatus, selectedBranchCode, dueStart, dueEnd]);

  const handlePaymentUpdate = (item: any) => {
    setSelectedInvoice(item);
    setPaymentForm({
      invoice_id: item.invoice.invoice_id,
      paid_amount: "",
      payment_mode: "upi",
      notes: "",
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e: any) => {
    e.preventDefault();
    if (!paymentForm.paid_amount || parseFloat(paymentForm.paid_amount) <= 0) {
      notify.error("Please enter a valid payment amount");
      return;
    }

    try {
      setLoading(true);
      const url = `/project/invoice/payment`;
      await apiClient.post(url, paymentForm);

      notify.success("Payment recorded successfully!");
      setShowPaymentModal(false);
      getPayments();
    } catch (error: any) {
      notify.error(error?.response?.data?.error || "Error recording payment");
    } finally {
      setLoading(false);
    }
  };

  const handleOnExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Payment & Invoice Directory Summary", 14, 20);

    const tableColumn = [
      "Invoice No",
      "Client",
      "Project",
      "Amount",
      "Paid",
      "Balance",
      "Status",
      "Due Date",
    ];

    const tableRows = sheetData.map((invoice: any) => [
      invoice.invoice_no,
      invoice.client_name,
      invoice.project_title,
      invoice.final_amount,
      invoice.paid_amount,
      invoice.balance_amount,
      invoice.status,
      new Date(invoice.due_date).toLocaleDateString(),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 23, 42] },
    });

    doc.save("InvoiceList.pdf");
  };

  const handleOnExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");
    XLSX.writeFile(wb, "InvoiceList.xlsx");
  };

  const formatCurrency = (amount: any) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(parseFloat(amount || "0"));
  };

  const thead = () => [
    { data: "Invoice #" },
    { data: "Client" },
    { data: "Project Title" },
    { data: "Total Amount" },
    { data: "Paid Amount" },
    { data: "Balance" },
    { data: "Status" },
    { data: "Due Date" },
    { data: "Actions", className: "text-center" },
  ];

  const tbody = () => {
    if (!data) return [];

    return data.map((item: any) => {
      const invoice = item.invoice;
      const isOverdue = new Date(invoice.due_date) < new Date() && parseFloat(invoice.balance_amount || 0) > 0;

      return {
        id: invoice.invoice_id,
        data: [
          { data: <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">{invoice.invoice_no}</span> },
          { data: <span className="font-semibold text-slate-900 dark:text-slate-100">{invoice.client_name}</span> },
          { data: <span className="text-slate-700 dark:text-slate-300">{invoice.project_title}</span> },
          { data: <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">{formatCurrency(invoice.final_amount)}</span> },
          { data: <span className="font-mono text-xs font-bold text-emerald-600">{formatCurrency(invoice.paid_amount)}</span> },
          { data: <span className="font-mono text-xs font-bold text-amber-600">{formatCurrency(invoice.balance_amount)}</span> },
          {
            data: (
              <CrmBadge
                label={invoice.status || "pending"}
                variant={
                  invoice.status === "paid"
                    ? "green"
                    : isOverdue
                    ? "red"
                    : "amber"
                }
              />
            ),
          },
          { data: <span className={`text-xs font-mono ${isOverdue ? "text-red-600 font-bold" : "text-slate-600 dark:text-slate-400"}`}>{new Date(invoice.due_date).toLocaleDateString()}</span> },
          {
            data: (
              <div className="flex justify-center gap-1.5">
                <button
                  onClick={() => handlePaymentUpdate(item)}
                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                  title="Record Payment"
                >
                  <DollarSign size={16} />
                </button>
                <button
                  onClick={() => navigate(`/invoice_view/${invoice.invoice_id}`)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                  title="View Invoice Details"
                >
                  <Eye size={16} />
                </button>
              </div>
            ),
          },
        ],
      };
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment & Invoice Directory"
        description="Comprehensive portal for tracking issued invoices, receiving payments, and managing outstanding customer balances."
        secondaryActions={[
          { label: "Export PDF", onClick: handleOnExportPDF, icon: <FileDown size={14} /> },
          { label: "Export Excel", onClick: handleOnExportExcel, icon: <FileDown size={14} /> },
        ]}
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Total Invoices</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{summary?.total_invoices ?? totalItem}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Total Amount Billed</span>
          <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(summary?.total_amount ?? 0)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Total Amount Collected</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(summary?.total_paid ?? 0)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Outstanding Balance</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(summary?.total_balance ?? 0)}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchQuery={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search invoice # or client name..."
        filters={[
          {
            key: "status",
            label: "Status",
            options: statusOptions,
            value: selectStatus,
            onChange: (val) => {
              setSelectStatus(val);
              setCurrentPage(1);
            },
          },
          ...(userRole === "superadmin"
            ? [
                {
                  key: "branch",
                  label: "Branch",
                  options: [
                    { value: "BRANCH-03", label: "BRANCH-03" },
                    { value: "BRCH_02", label: "BRCH_02" },
                  ],
                  value: selectedBranchCode,
                  onChange: (val: string) => {
                    setSelectedBranchCode(val);
                    setCurrentPage(1);
                  },
                },
              ]
            : []),
        ]}
        onClearAll={() => {
          setSearchTerm("");
          setSelectStatus("");
          setSelectedBranchCode("");
          setDueStart("");
          setDueEnd("");
          setCurrentPage(1);
        }}
      />

      {/* Table Data */}
      <DataTable
        thead={thead}
        tbody={tbody}
        isLoading={loading}
        noDataText="No invoice or payment records match your filters"
        enableSorting={true}
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
        <CustomPagination
          total={totalItem}
          currentPage={currentPage}
          defaultPageSize={pageSize}
          onChange={(page) => setCurrentPage(page)}
          paginationLabel="invoices"
          isScroll={true}
        />
      </div>

      {/* Payment Entry Modal */}
      <Modal isVisible={showPaymentModal} maxWidth="md" onClose={() => setShowPaymentModal(false)} title="Record Invoice Payment" closeOnOutsideClick={false}>
        <form onSubmit={handlePaymentSubmit} className="space-y-4 p-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Invoice Number</label>
            <input
              type="text"
              readOnly
              value={selectedInvoice?.invoice?.invoice_no || ""}
              className="mt-1 w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Payment Amount (₹)</label>
            <input
              type="number"
              required
              placeholder="Enter amount paid"
              value={paymentForm.paid_amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, paid_amount: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Payment Mode</label>
            <select
              value={paymentForm.payment_mode}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            >
              {paymentModeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Transaction Notes</label>
            <textarea
              rows={2}
              placeholder="Transaction ref #, cheque #, or remarks..."
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs">{loading ? "Processing..." : "Submit Payment"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InvoiceList;
