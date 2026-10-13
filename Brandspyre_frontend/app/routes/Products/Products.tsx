import React, { useState, useEffect } from "react";
import { apiClient } from "src/services/apiClient";
import { notify } from "~/services/notificationService";
import { Package, Plus, FileSpreadsheet, Download, Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";
import ModuleGuard from "../guards/ModuleGuard";
import { Button } from "src/component/ui/Button";
import PageHeader from "src/component/ui/PageHeader";
import Modal from "src/component/Modal";
import { useOrganizationConfig } from "src/stores/useOrganizationConfig";
import DynamicForm from "src/component/dynamic/DynamicForm";
import DynamicTable from "src/component/dynamic/DynamicTable";

interface ProductItem {
  _id: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  purchase_price: number;
  selling_price: number;
  tax_rate: number;
  reorder_level: number;
  category_id?: { _id: string; name: string };
  is_active: boolean;
  custom_fields?: Record<string, any>;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Bulk Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{ imported: number; failed: number; errors: any[] } | null>(null);

  const { getTerminology, getEntityFields } = useOrganizationConfig();
  const term = getTerminology("PRODUCT", "Product");

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/products?limit=100");
      if (res.data?.success) {
        setProducts(res.data.items || []);
      }
    } catch (err: any) {
      notify.error(`Failed to load ${term.plural_label.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreateProduct = async (formPayload: Record<string, any>) => {
    setSubmitting(true);
    try {
      const res = await apiClient.post("/products", formPayload);
      if (res.data?.success) {
        notify.success(`${term.label} created successfully!`);
        setShowAddModal(false);
 loadProducts();
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.error || `Failed to create ${term.label.toLowerCase()}.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditModal = (product: ProductItem) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleUpdateProduct = async (formPayload: Record<string, any>) => {
    if (!editingProduct?._id) return;
    setSubmitting(true);
    try {
      const res = await apiClient.put(`/products/${editingProduct._id}`, formPayload);
      if (res.data?.success) {
        notify.success(`${term.label} updated successfully!`);
        setShowEditModal(false);
        setEditingProduct(null);
        loadProducts();
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.error || `Failed to update ${term.label.toLowerCase()}.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (product: ProductItem) => {
    if (!window.confirm(`Are you sure you want to delete ${product.name}?`)) return;

    try {
      const res = await apiClient.delete(`/products/${product._id}`);
      if (res.data?.success) {
        notify.success(`${term.label} deleted successfully.`);
        loadProducts();
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.error || `Failed to delete ${term.label.toLowerCase()}.`);
    }
  };

  // Bulk Import Handlers
  const handleDownloadTemplate = () => {
    let fieldDefs = getEntityFields("PRODUCT");

    const systemCols = [
      { code: "sku", label: "SKU / Item Code (Required)", sample: "PROD-101" },
      { code: "name", label: "Product Name (Required)", sample: "Sample Item" },
      { code: "barcode", label: "Barcode / EAN", sample: "8901234567890" },
      { code: "purchase_price", label: "Purchase Price", sample: 100 },
      { code: "selling_price", label: "Selling Price", sample: 150 },
      { code: "tax_rate", label: "Tax Rate (%)", sample: 18 },
      { code: "reorder_level", label: "Reorder Level", sample: 5 },
      { code: "description", label: "Description", sample: "Sample product entry" }
    ];

    const customCols = (fieldDefs || [])
      .filter((f: any) => f.is_system === false || f.scope === 'ORGANIZATION')
      .map((f: any) => ({
        code: f.field_code,
        label: `${f.label} (Custom Field)`,
        sample: f.data_type === 'number' ? 10 : f.data_type === 'boolean' ? 'TRUE' : 'Sample Value'
      }));

    const headers = [...systemCols.map(c => c.code), ...customCols.map(c => c.code)];
    const sampleRow = [...systemCols.map(c => c.sample), ...customCols.map(c => c.sample)];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    XLSX.utils.book_append_sheet(wb, ws, "Products_Import");
    XLSX.writeFile(wb, "Product_Bulk_Import_Template.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "array" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rawJson || rawJson.length === 0) {
          notify.error("The uploaded file is empty.");
          setParsedRows([]);
          return;
        }

        const knownSystemFields = ["sku", "name", "barcode", "purchase_price", "selling_price", "tax_rate", "reorder_level", "description", "product_type", "opening_stock"];

        const processed = rawJson.map((row) => {
          const itemPayload: Record<string, any> = { custom_fields: {} };
          Object.keys(row).forEach((key) => {
            const normalizedKey = key.trim().toLowerCase();
            const val = row[key];

            if (knownSystemFields.includes(normalizedKey)) {
              itemPayload[normalizedKey] = val;
            } else {
              itemPayload.custom_fields[normalizedKey] = val;
            }
          });
          return itemPayload;
        });

        setParsedRows(processed);
        notify.success(`Loaded ${processed.length} rows from ${file.name}`);
      } catch (err) {
        console.error("Excel parse error:", err);
        notify.error("Failed to parse Excel file. Please ensure valid .xlsx or .csv format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) {
      notify.error("No valid product rows to import.");
      return;
    }

    setImporting(true);
    setImportSummary(null);
    try {
      const res = await apiClient.post("/products/bulk", { items: parsedRows });
      if (res.data?.success) {
        setImportSummary({
          imported: res.data.imported,
          failed: res.data.failed,
          errors: res.data.errors || []
        });
        if (res.data.imported > 0) {
          notify.success(`Successfully imported ${res.data.imported} ${term.plural_label.toLowerCase()}!`);
          loadProducts();
        } else {
          notify.error("No products could be imported. Please check error log below.");
        }
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.error || "Bulk import failed.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <ModuleGuard moduleCode="PRODUCTS">
      <div className="space-y-6 p-6 max-w-[1600px] mx-auto">
        <PageHeader
          title={`${term.plural_label} Catalog`}
          description={`Manage organization ${term.plural_label.toLowerCase()}, pricing, custom field metadata, and stock configurations.`}
          icon={Package}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setShowImportModal(true)}>
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Bulk Import
              </Button>
              <Button variant="primary" onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add {term.label}
              </Button>
            </div>
          }
        />

        {/* Dynamic Table Engine */}
        <DynamicTable
          entity="PRODUCT"
          data={products}
          loading={loading}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteProduct}
        />

        {/* Add Product Modal (Dynamic Form Engine) */}
        <Modal
          isVisible={showAddModal}
          onClose={() => setShowAddModal(false)}
          title={`Add New ${term.label}`}
        >
          <DynamicForm
            entity="PRODUCT"
            mode="create"
            onSubmit={handleCreateProduct}
            submitting={submitting}
            onCancel={() => setShowAddModal(false)}
            submitLabel={`Create ${term.label}`}
          />
        </Modal>

        {/* Edit Product Modal (Dynamic Form Engine) */}
        <Modal
          isVisible={showEditModal}
          onClose={() => setShowEditModal(false)}
          title={`Edit ${term.label}`}
        >
          {editingProduct && (
            <DynamicForm
              entity="PRODUCT"
              mode="edit"
              initialValues={editingProduct}
              onSubmit={handleUpdateProduct}
              submitting={submitting}
              onCancel={() => setShowEditModal(false)}
              submitLabel={`Update ${term.label}`}
            />
          )}
        </Modal>

        {/* Bulk Import Modal */}
        <Modal
          isVisible={showImportModal}
          onClose={() => {
            setShowImportModal(false);
            setImportFile(null);
            setParsedRows([]);
            setImportSummary(null);
          }}
          title={`Bulk Import ${term.plural_label}`}
          maxWidth="4xl"
        >
          <div className="space-y-6">
            {/* Step 1: Download Template */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Step 1: Download Import Template
              </h4>
              <p className="text-xs text-slate-500">
                Download a pre-formatted Excel template matching your catalog columns, including any active organization custom fields.
              </p>
              <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="h-3.5 w-3.5 mr-1.5" /> Download Excel Template (.xlsx)
              </Button>
            </div>

            {/* Step 2: Upload File */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Step 2: Upload Completed File
              </h4>

              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer transition shadow-2xs">
                  <Upload size={16} />
                  <span>{importFile ? importFile.name : "Select Excel/CSV File"}</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {importFile && (
                  <span className="text-xs text-slate-500 font-semibold">
                    ({parsedRows.length} rows detected)
                  </span>
                )}
              </div>
            </div>

            {/* Preview Table */}
            {parsedRows.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Data Preview ({parsedRows.length} items ready to import)
                </h4>
                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500 uppercase sticky top-0">
                      <tr>
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">SKU</th>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Barcode</th>
                        <th className="px-3 py-2">Selling Price</th>
                        <th className="px-3 py-2">Custom Fields</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {parsedRows.slice(0, 10).map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-1.5 font-mono text-[11px] text-slate-400">{idx + 1}</td>
                          <td className="px-3 py-1.5 font-semibold">{row.sku || "-"}</td>
                          <td className="px-3 py-1.5">{row.name || "-"}</td>
                          <td className="px-3 py-1.5 text-slate-500">{row.barcode || "-"}</td>
                          <td className="px-3 py-1.5">₹{row.selling_price || 0}</td>
                          <td className="px-3 py-1.5 font-mono text-[11px] text-purple-600 dark:text-purple-400">
                            {JSON.stringify(row.custom_fields)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedRows.length > 10 && (
                  <p className="text-[11px] text-slate-400 italic">
                    Showing first 10 of {parsedRows.length} records.
                  </p>
                )}
              </div>
            )}

            {/* Results / Error Log */}
            {importSummary && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={16} /> Imported: {importSummary.imported}
                  </span>
                  {importSummary.failed > 0 && (
                    <span className="text-rose-600 flex items-center gap-1">
                      <AlertTriangle size={16} /> Failed: {importSummary.failed}
                    </span>
                  )}
                </div>

                {importSummary.errors.length > 0 && (
                  <div className="max-h-40 overflow-y-auto bg-rose-50 dark:bg-rose-950/30 p-3 rounded-lg border border-rose-200 dark:border-rose-900/40 text-xs space-y-1">
                    <p className="font-bold text-rose-700 dark:text-rose-400">Import Errors Log:</p>
                    {importSummary.errors.map((err, errIdx) => (
                      <p key={errIdx} className="text-rose-600 dark:text-rose-300 font-mono text-[11px]">
                        Row {err.row} ({err.sku || "N/A"}): {err.error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setParsedRows([]);
                  setImportSummary(null);
                }}
              >
                Close
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleExecuteImport}
                disabled={importing || parsedRows.length === 0}
              >
                {importing ? "Importing Products..." : `Import ${parsedRows.length} Products`}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </ModuleGuard>
  );
}
