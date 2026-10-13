import React from "react";

// ---------------------------------------------------------------
// Style property definitions
// ---------------------------------------------------------------
interface PropertyField {
  key: string;
  label: string;
  type: "text" | "number" | "color" | "select" | "range" | "textarea";
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

const POSITION_FIELDS: PropertyField[] = [
  { key: "width", label: "Width", type: "text" },
  { key: "height", label: "Height", type: "text" },
  { key: "minHeight", label: "Min Height", type: "text" },
];

const SPACING_FIELDS: PropertyField[] = [
  { key: "marginTop", label: "Margin Top", type: "number", min: 0, max: 200 },
  { key: "marginBottom", label: "Margin Bottom", type: "number", min: 0, max: 200 },
  { key: "marginLeft", label: "Margin Left", type: "number", min: 0, max: 200 },
  { key: "marginRight", label: "Margin Right", type: "number", min: 0, max: 200 },
  { key: "paddingTop", label: "Pad Top", type: "number", min: 0, max: 200 },
  { key: "paddingBottom", label: "Pad Bottom", type: "number", min: 0, max: 200 },
  { key: "paddingLeft", label: "Pad Left", type: "number", min: 0, max: 200 },
  { key: "paddingRight", label: "Pad Right", type: "number", min: 0, max: 200 },
];

const TYPOGRAPHY_FIELDS: PropertyField[] = [
  { key: "fontFamily", label: "Font", type: "select", options: [
    { value: "Inter, sans-serif", label: "Inter" },
    { value: "Roboto, sans-serif", label: "Roboto" },
    { value: "Arial, sans-serif", label: "Arial" },
    { value: "Georgia, serif", label: "Georgia" },
    { value: "Times New Roman, serif", label: "Times New Roman" },
    { value: "'Courier New', monospace", label: "Courier New" },
  ]},
  { key: "fontSize", label: "Size", type: "text" },
  { key: "fontWeight", label: "Weight", type: "select", options: [
    { value: "300", label: "Light" }, { value: "400", label: "Normal" },
    { value: "500", label: "Medium" }, { value: "600", label: "Semi Bold" },
    { value: "700", label: "Bold" }, { value: "800", label: "Extra Bold" },
  ]},
  { key: "color", label: "Color", type: "color" },
  { key: "textAlign", label: "Align", type: "select", options: [
    { value: "left", label: "Left" }, { value: "center", label: "Center" },
    { value: "right", label: "Right" }, { value: "justify", label: "Justify" },
  ]},
  { key: "letterSpacing", label: "Letter Spacing", type: "text" },
  { key: "lineHeight", label: "Line Height", type: "text" },
  { key: "textDecoration", label: "Decoration", type: "select", options: [
    { value: "none", label: "None" }, { value: "underline", label: "Underline" },
    { value: "line-through", label: "Strikethrough" },
  ]},
];

const APPEARANCE_FIELDS: PropertyField[] = [
  { key: "backgroundColor", label: "Background", type: "color" },
  { key: "borderWidth", label: "Border Width", type: "text" },
  { key: "borderStyle", label: "Border Style", type: "select", options: [
    { value: "none", label: "None" }, { value: "solid", label: "Solid" },
    { value: "dashed", label: "Dashed" }, { value: "dotted", label: "Dotted" },
  ]},
  { key: "borderColor", label: "Border Color", type: "color" },
  { key: "borderRadius", label: "Radius", type: "text" },
  { key: "opacity", label: "Opacity", type: "range", min: 0, max: 1, step: 0.1 },
  { key: "boxShadow", label: "Shadow", type: "text" },
];

// ---------------------------------------------------------------
// Properties Panel Component
// ---------------------------------------------------------------
export default function PropertiesPanel({
  selectedComponent,
  onStyleChange,
  onContentChange,
  onPropsChange,
}: {
  selectedComponent: any | null;
  onStyleChange: (key: string, value: string) => void;
  onContentChange: (content: string) => void;
  onPropsChange: (key: string, value: any) => void;
}) {
  if (!selectedComponent) {
    return (
      <div className="w-[300px] min-w-[300px] h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl text-gray-400">🎨</span>
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Select a component</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Click on a component to edit its properties</p>
        </div>
      </div>
    );
  }

  const style = selectedComponent.style || {};
  const content = selectedComponent.content || "";
  const props = selectedComponent.props || {};

  return (
    <div className="w-[300px] min-w-[300px] h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Properties</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">{selectedComponent.type?.replace(/_/g, " ")}</p>
      </div>

      <div className="p-4 space-y-5">
        {/* Content */}
        {["heading", "text", "richtext", "company_block", "customer_block", "bank_details", "terms", "notes", "dynamic_field"].includes(selectedComponent.type) && (
          <Section title="Content">
            {selectedComponent.type === "dynamic_field" ? (
              <div className="space-y-2">
                <label className="text-xs text-gray-500 dark:text-gray-400">Variable Path</label>
                <input
                  type="text"
                  value={props.variable || ""}
                  onChange={(e) => onPropsChange("variable", e.target.value)}
                  placeholder="e.g. employee.name"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                />
                <label className="text-xs text-gray-500 dark:text-gray-400">Label</label>
                <input
                  type="text"
                  value={props.label || ""}
                  onChange={(e) => onPropsChange("label", e.target.value)}
                  placeholder="Display label"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => onContentChange(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none resize-none"
              />
            )}
          </Section>
        )}

        {/* Image/Logo props */}
        {["logo", "image", "stamp"].includes(selectedComponent.type) && (
          <Section title="Source">
            <input
              type="text"
              value={props.src || ""}
              onChange={(e) => onPropsChange("src", e.target.value)}
              placeholder="Image URL or path"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
            />
          </Section>
        )}

        {/* Size & Position */}
        <Section title="Size">
          <div className="grid grid-cols-2 gap-2">
            {POSITION_FIELDS.map((f) => (
              <FieldInput key={f.key} field={f} value={style[f.key] || ""} onChange={(v) => onStyleChange(f.key, v)} />
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <div className="space-y-2">
            {TYPOGRAPHY_FIELDS.map((f) => (
              <FieldInput key={f.key} field={f} value={style[f.key] || ""} onChange={(v) => onStyleChange(f.key, v)} />
            ))}
          </div>
        </Section>

        {/* Spacing */}
        <Section title="Spacing">
          <div className="grid grid-cols-2 gap-2">
            {SPACING_FIELDS.map((f) => (
              <FieldInput key={f.key} field={f} value={parseFloat(style[f.key]) || 0} onChange={(v) => onStyleChange(f.key, `${v}px`)} />
            ))}
          </div>
        </Section>

        {/* Appearance */}
        <Section title="Appearance">
          <div className="space-y-2">
            {APPEARANCE_FIELDS.map((f) => (
              <FieldInput key={f.key} field={f} value={style[f.key] || ""} onChange={(v) => onStyleChange(f.key, v)} />
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{title}</h4>
      {children}
    </div>
  );
}

function FieldInput({ field, value, onChange }: { field: PropertyField; value: any; onChange: (v: any) => void }) {
  const baseClass = "w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition";

  return (
    <div>
      <label className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">{field.label}</label>
      {field.type === "select" ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={baseClass}>
          <option value="">—</option>
          {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : field.type === "color" ? (
        <div className="flex gap-2 items-center">
          <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer" />
          <input type="text" value={value || ""} onChange={(e) => onChange(e.target.value)} className={baseClass} placeholder="#000000" />
        </div>
      ) : field.type === "range" ? (
        <div className="flex gap-2 items-center">
          <input type="range" min={field.min} max={field.max} step={field.step} value={value || field.min || 0} onChange={(e) => onChange(e.target.value)} className="flex-1" />
          <span className="text-xs text-gray-500 w-8 text-right">{value || field.min || 0}</span>
        </div>
      ) : field.type === "textarea" ? (
        <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={3} className={`${baseClass} resize-none`} />
      ) : (
        <input type={field.type} value={value || ""} onChange={(e) => onChange(field.type === "number" ? Number(e.target.value) : e.target.value)} className={baseClass} min={field.min} max={field.max} step={field.step} />
      )}
    </div>
  );
}
