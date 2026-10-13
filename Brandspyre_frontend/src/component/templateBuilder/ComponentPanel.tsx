import React, { useState, useCallback } from "react";
import {
  Type, Image, Minus, Square, Circle, Table2, PenTool, QrCode,
  Hash, FileText, LayoutTemplate, Building2, Users, Banknote,
  StickyNote, AlignLeft, Heading1, Columns, ChevronDown, ChevronRight,
  Stamp, GitBranch
} from "lucide-react";

// ---------------------------------------------------------------
// Component Type Definitions
// ---------------------------------------------------------------
export interface ComponentDef {
  type: string;
  label: string;
  icon: React.ElementType;
  defaultProps: Record<string, any>;
  defaultStyle: Record<string, any>;
  defaultContent?: string;
}

const COMPONENT_GROUPS: { label: string; items: ComponentDef[] }[] = [
  {
    label: "Layout",
    items: [
      { type: "header", label: "Header", icon: LayoutTemplate, defaultProps: {}, defaultStyle: { width: "100%", minHeight: "60px", padding: "12px", borderBottom: "1px solid #e5e7eb" }, defaultContent: "" },
      { type: "footer", label: "Footer", icon: LayoutTemplate, defaultProps: {}, defaultStyle: { width: "100%", minHeight: "40px", padding: "12px", borderTop: "1px solid #e5e7eb" }, defaultContent: "" },
      { type: "divider", label: "Divider", icon: Minus, defaultProps: {}, defaultStyle: { width: "100%", height: "2px", backgroundColor: "#e5e7eb", margin: "12px 0" }, defaultContent: "" },
      { type: "columns", label: "Columns", icon: Columns, defaultProps: { columns: 2 }, defaultStyle: { width: "100%", display: "flex", gap: "16px" }, defaultContent: "" },
    ],
  },
  {
    label: "Text",
    items: [
      { type: "heading", label: "Heading", icon: Heading1, defaultProps: {}, defaultStyle: { fontSize: "24px", fontWeight: "700", color: "#111827", padding: "8px 0" }, defaultContent: "Heading Text" },
      { type: "text", label: "Text Block", icon: Type, defaultProps: {}, defaultStyle: { fontSize: "14px", color: "#374151", lineHeight: "1.6", padding: "4px 0" }, defaultContent: "Enter your text here..." },
      { type: "richtext", label: "Rich Text", icon: AlignLeft, defaultProps: {}, defaultStyle: { fontSize: "14px", color: "#374151", lineHeight: "1.6", padding: "8px" }, defaultContent: "<p>Rich text content...</p>" },
    ],
  },
  {
    label: "Media",
    items: [
      { type: "logo", label: "Logo", icon: Image, defaultProps: { src: "", alt: "Logo" }, defaultStyle: { width: "120px", height: "auto", objectFit: "contain" }, defaultContent: "" },
      { type: "image", label: "Image", icon: Image, defaultProps: { src: "", alt: "Image" }, defaultStyle: { width: "200px", height: "150px", objectFit: "cover", borderRadius: "8px" }, defaultContent: "" },
    ],
  },
  {
    label: "Data",
    items: [
      { type: "dynamic_field", label: "Dynamic Field", icon: Hash, defaultProps: { variable: "", label: "" }, defaultStyle: { fontSize: "14px", color: "#374151", padding: "4px 0" }, defaultContent: "{{variable}}" },
      { type: "table", label: "Table", icon: Table2, defaultProps: { columns: [{ key: "item", label: "Item", width: "auto" }, { key: "qty", label: "Qty", width: "80px" }, { key: "rate", label: "Rate", width: "100px" }, { key: "total", label: "Total", width: "100px" }], rows: [] }, defaultStyle: { width: "100%", borderCollapse: "collapse" }, defaultContent: "" },
      { type: "conditional", label: "Conditional Block", icon: GitBranch, defaultProps: { conditions: [], conditionLogic: "AND" }, defaultStyle: { width: "100%", padding: "8px", border: "1px dashed #9ca3af", borderRadius: "4px" }, defaultContent: "" },
    ],
  },
  {
    label: "Business",
    items: [
      { type: "company_block", label: "Company Block", icon: Building2, defaultProps: {}, defaultStyle: { padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px" }, defaultContent: "{{company.name}}\n{{company.address}}\n{{company.phone}}" },
      { type: "customer_block", label: "Customer Block", icon: Users, defaultProps: {}, defaultStyle: { padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px" }, defaultContent: "{{client.name}}\n{{client.address}}\n{{client.phone}}" },
      { type: "bank_details", label: "Bank Details", icon: Banknote, defaultProps: {}, defaultStyle: { padding: "12px", backgroundColor: "#f9fafb", borderRadius: "8px" }, defaultContent: "Bank: \nAccount No: \nIFSC: \nBranch: " },
      { type: "terms", label: "Terms & Conditions", icon: FileText, defaultProps: {}, defaultStyle: { fontSize: "12px", color: "#6b7280", padding: "12px", borderTop: "1px solid #e5e7eb" }, defaultContent: "1. Payment is due within 30 days.\n2. Late payments attract 2% interest per month." },
      { type: "notes", label: "Notes", icon: StickyNote, defaultProps: {}, defaultStyle: { fontSize: "12px", color: "#6b7280", padding: "8px", backgroundColor: "#fffbeb", borderRadius: "6px" }, defaultContent: "Notes..." },
    ],
  },
  {
    label: "Signatures",
    items: [
      { type: "signature", label: "Signature", icon: PenTool, defaultProps: { label: "Authorized Signatory" }, defaultStyle: { width: "200px", height: "80px", borderBottom: "1px solid #374151", display: "flex", alignItems: "flex-end", justifyContent: "center", fontSize: "12px", color: "#6b7280" }, defaultContent: "" },
      { type: "stamp", label: "Stamp", icon: Stamp, defaultProps: { src: "" }, defaultStyle: { width: "100px", height: "100px", objectFit: "contain", opacity: "0.7" }, defaultContent: "" },
      { type: "qrcode", label: "QR Code", icon: QrCode, defaultProps: { value: "" }, defaultStyle: { width: "100px", height: "100px" }, defaultContent: "" },
    ],
  },
  {
    label: "Shapes",
    items: [
      { type: "rectangle", label: "Rectangle", icon: Square, defaultProps: {}, defaultStyle: { width: "200px", height: "100px", backgroundColor: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "8px" }, defaultContent: "" },
      { type: "circle", label: "Circle", icon: Circle, defaultProps: {}, defaultStyle: { width: "100px", height: "100px", backgroundColor: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "50%" }, defaultContent: "" },
    ],
  },
];

// ---------------------------------------------------------------
// Component Panel (Left Sidebar)
// ---------------------------------------------------------------
export default function ComponentPanel({
  onDragStart,
}: {
  onDragStart: (def: ComponentDef) => void;
}) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(COMPONENT_GROUPS.map((g) => [g.label, true]))
  );

  const toggleGroup = useCallback((label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }, []);

  return (
    <div className="w-[250px] min-w-[250px] h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Components</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Drag to canvas</p>
      </div>

      <div className="p-2 space-y-1">
        {COMPONENT_GROUPS.map((group) => (
          <div key={group.label}>
            <button
              onClick={() => toggleGroup(group.label)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
            >
              {group.label}
              {expandedGroups[group.label] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {expandedGroups[group.label] && (
              <div className="grid grid-cols-2 gap-1.5 px-1 pb-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("application/template-component", JSON.stringify(item));
                        e.dataTransfer.effectAllowed = "copy";
                        onDragStart(item);
                      }}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 cursor-grab hover:border-red-300 dark:hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all active:cursor-grabbing select-none"
                    >
                      <Icon size={18} className="text-gray-500 dark:text-gray-400" />
                      <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300 text-center leading-tight">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export { COMPONENT_GROUPS };
