import React, { useCallback, useState, useMemo } from "react";
import type { TemplateComponent } from "../../stores/documentTemplateStore";
import { Trash2, GripVertical, Copy } from "lucide-react";

// ---------------------------------------------------------------
// Canvas Renderer — renders the template layout with drag-drop
// ---------------------------------------------------------------
export default function CanvasRenderer({
  components,
  selectedId,
  zoom,
  pageSettings,
  onSelect,
  onDrop,
  onReorder,
  onDelete,
  onDuplicate,
  onLoadSample,
}: {
  components: TemplateComponent[];
  selectedId: string | null;
  zoom: number;
  pageSettings: any;
  onSelect: (id: string | null) => void;
  onDrop: (componentDef: any, index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onLoadSample?: () => void;
}) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const pageWidth = pageSettings?.size === "letter" ? 816 : 794; // A4 = 210mm ≈ 794px, Letter = 8.5" ≈ 816px
  const pageMinHeight = pageSettings?.size === "letter" ? 1056 : 1123; // A4 = 297mm ≈ 1123px

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIndex(null);

    const rawData = e.dataTransfer.getData("application/template-component");
    const reorderData = e.dataTransfer.getData("application/reorder-index");

    if (reorderData && draggingIndex !== null) {
      const targetIndex = dragOverIndex ?? components.length;
      if (draggingIndex !== targetIndex) {
        onReorder(draggingIndex, targetIndex);
      }
      setDraggingIndex(null);
      return;
    }

    if (rawData) {
      try {
        const def = JSON.parse(rawData);
        const insertAt = dragOverIndex ?? components.length;
        onDrop(def, insertAt);
      } catch {}
    }
  }, [dragOverIndex, draggingIndex, components.length, onDrop, onReorder]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleComponentDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setDragOverIndex(e.clientY < midY ? index : index + 1);
  }, []);

  return (
    <div className="flex-1 h-full bg-gray-100 dark:bg-gray-900 overflow-auto flex justify-center py-8 px-4">
      {/* Outer sizing box that claims the scaled space in layout flow */}
      <div
        style={{
          width: `${pageWidth * zoom}px`,
          height: `${pageMinHeight * zoom}px`,
          minHeight: `${pageMinHeight * zoom}px`,
        }}
        className="relative flex-shrink-0"
      >
        {/* Inner A4/Letter paper document rendered at 100% size (794px wide) then scaled */}
        <div
          style={{
            width: `${pageWidth}px`,
            minHeight: `${pageMinHeight}px`,
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            padding: `${pageSettings?.margin_top || 20}px ${pageSettings?.margin_right || 20}px ${pageSettings?.margin_bottom || 20}px ${pageSettings?.margin_left || 20}px`,
          }}
          className="bg-white dark:bg-gray-800 shadow-2xl rounded-sm relative border border-gray-200 dark:border-gray-700"
          onDrop={handleCanvasDrop}
          onDragOver={handleDragOver}
          onClick={(e) => {
            if (e.target === e.currentTarget) onSelect(null);
          }}
        >
          {/* Watermark */}
          {pageSettings?.watermark && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
              <span className="text-8xl font-bold text-gray-400 rotate-[-30deg] select-none">{pageSettings.watermark}</span>
            </div>
          )}

          {/* Drop zone indicator for empty canvas */}
          {components.length === 0 && (
            <div className="w-full h-full min-h-[300px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center p-8">
              <div className="text-center">
                <p className="text-base font-semibold text-gray-700 dark:text-gray-300">Canvas is empty</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 mb-4">Drag components from the left panel or load a pre-designed sample template</p>
                {onLoadSample && (
                  <button
                    onClick={onLoadSample}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium text-xs rounded-xl shadow-sm transition inline-flex items-center gap-1.5"
                  >
                    ✨ Load Pre-Designed Template
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Component Renderer */}
          <div className="relative z-10 space-y-0">
            {components.map((comp, index) => (
              <React.Fragment key={comp.id}>
                {/* Drop indicator line */}
                {dragOverIndex === index && (
                  <div className="h-1 bg-red-500 rounded-full mx-2 transition-all" />
                )}

                <ComponentBlock
                  component={comp}
                  isSelected={selectedId === comp.id}
                  onSelect={() => onSelect(comp.id)}
                  onDelete={() => onDelete(comp.id)}
                  onDuplicate={() => onDuplicate(comp.id)}
                  onDragStart={() => setDraggingIndex(index)}
                  onDragOver={(e) => handleComponentDragOver(e, index)}
                  onDragEnd={() => { setDraggingIndex(null); setDragOverIndex(null); }}
                />
              </React.Fragment>
            ))}

            {/* Bottom drop indicator */}
            {dragOverIndex === components.length && (
              <div className="h-1 bg-red-500 rounded-full mx-2 transition-all" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Individual Component Block
// ---------------------------------------------------------------
function ComponentBlock({
  component,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onDragStart,
  onDragOver,
  onDragEnd,
}: {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  const style: React.CSSProperties = useMemo(() => {
    const s: any = { ...component.style };
    // Convert padding/margin numbers to px
    Object.keys(s).forEach((k) => {
      if (typeof s[k] === "number" && (k.includes("padding") || k.includes("margin") || k.includes("Height") || k.includes("Width"))) {
        s[k] = `${s[k]}px`;
      }
    });
    return s;
  }, [component.style]);

  const renderContent = () => {
    switch (component.type) {
      case "heading":
        return <h2 style={style}>{component.content || "Heading"}</h2>;
      case "text":
      case "company_block":
      case "customer_block":
      case "bank_details":
      case "terms":
      case "notes":
        return <div style={style}><pre className="whitespace-pre-wrap font-[inherit] text-[inherit]">{component.content || "Text"}</pre></div>;
      case "richtext":
        return <div style={style} dangerouslySetInnerHTML={{ __html: component.content || "<p>Rich text...</p>" }} />;
      case "divider":
        return <hr style={{ ...style, border: "none" }} />;
      case "logo":
      case "image":
      case "stamp":
        return component.props?.src
          ? <img src={component.props.src} alt={component.props.alt || ""} style={style} />
          : <div style={{ ...style, backgroundColor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #d1d5db" }}>
              <span className="text-xs text-gray-400">{component.type === "logo" ? "Logo" : "Image"}</span>
            </div>;
      case "dynamic_field":
        return (
          <div style={style}>
            {component.props?.label && <span className="text-xs text-gray-400">{component.props.label}: </span>}
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded text-xs font-mono">
              {`{{${component.props?.variable || "variable"}}}`}
            </span>
          </div>
        );
      case "table":
        const cols = component.props?.columns || [];
        return (
          <table style={{ ...style, width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {cols.map((col: any, i: number) => (
                  <th key={i} style={{ padding: "8px 12px", border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", fontSize: "12px", fontWeight: "600", textAlign: "left", width: col.width }}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {cols.map((_: any, i: number) => (
                  <td key={i} style={{ padding: "8px 12px", border: "1px solid #e5e7eb", fontSize: "12px", color: "#9ca3af" }}>Sample data</td>
                ))}
              </tr>
            </tbody>
          </table>
        );
      case "signature":
        return (
          <div style={style}>
            <div className="mt-auto text-center">
              <div className="border-b border-gray-400 mb-1 h-12" />
              <span className="text-xs text-gray-500">{component.props?.label || "Authorized Signatory"}</span>
            </div>
          </div>
        );
      case "conditional":
        return (
          <div style={style}>
            <span className="text-xs text-purple-500 font-medium">⚡ Conditional Block</span>
            {component.children?.map((child) => (
              <div key={child.id} className="mt-2">
                <ComponentBlock
                  component={child}
                  isSelected={false}
                  onSelect={() => {}}
                  onDelete={() => {}}
                  onDuplicate={() => {}}
                  onDragStart={() => {}}
                  onDragOver={() => {}}
                  onDragEnd={() => {}}
                />
              </div>
            ))}
          </div>
        );
      case "rectangle":
      case "circle":
        return <div style={style} />;
      case "qrcode":
        return (
          <div style={{ ...style, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #d1d5db", borderRadius: "8px" }}>
            <span className="text-xs text-gray-400">QR Code</span>
          </div>
        );
      case "header":
      case "footer":
      case "columns":
        return (
          <div style={style}>
            <span className="text-xs text-gray-400 uppercase">{component.type}</span>
          </div>
        );
      default:
        return <div style={style}>{component.content || component.type}</div>;
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/reorder-index", "true");
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      className={`relative group transition-all ${isSelected ? "ring-2 ring-red-500 ring-offset-1 rounded-sm" : "hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600 hover:ring-offset-1 rounded-sm"}`}
    >
      {/* Toolbar */}
      {isSelected && (
        <div className="absolute -top-8 left-0 flex items-center gap-1 bg-gray-900 text-white rounded-md px-1.5 py-0.5 text-xs z-20 shadow-lg">
          <GripVertical size={12} className="cursor-grab" />
          <span className="capitalize font-medium px-1">{component.type.replace(/_/g, " ")}</span>
          <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="p-0.5 hover:bg-gray-700 rounded" title="Duplicate">
            <Copy size={12} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-0.5 hover:bg-red-600 rounded" title="Delete">
            <Trash2 size={12} />
          </button>
        </div>
      )}

      {renderContent()}
    </div>
  );
}
