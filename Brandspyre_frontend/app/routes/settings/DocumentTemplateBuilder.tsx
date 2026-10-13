import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useDocumentTemplateStore } from "../../../src/stores/documentTemplateStore";
import type { TemplateComponent, LayoutJson } from "../../../src/stores/documentTemplateStore";
import ComponentPanel from "../../../src/component/templateBuilder/ComponentPanel";
import CanvasRenderer from "../../../src/component/templateBuilder/CanvasRenderer";
import PropertiesPanel from "../../../src/component/templateBuilder/PropertiesPanel";
import VariablePicker from "../../../src/component/templateBuilder/VariablePicker";
import { getDefaultLayoutForType } from "../../../src/component/templateBuilder/sampleLayouts";
import {
  Save, Undo2, Redo2, Eye, Monitor, Tablet, Printer,
  ZoomIn, ZoomOut, ChevronLeft, Upload, History, Hash,
  Loader2, CheckCircle, Sparkles
} from "lucide-react";

// ---------------------------------------------------------------
// Document Template Builder (Main Page)
// ---------------------------------------------------------------
export default function DocumentTemplateBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    currentTemplate, loading, selectedComponentId,
    variableDefinitions, undoStack, redoStack,
    fetchTemplate, updateTemplate, setSelectedComponentId,
    updateLayoutJson, pushUndo, undo, redo,
    fetchVariables, publishTemplate, fetchVersions, versions, previewTemplate,
  } = useDocumentTemplateStore();

  const [zoom, setZoom] = useState(0.75);
  const [saving, setSaving] = useState(false);
  const [showVariablePicker, setShowVariablePicker] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "print">("desktop");

  // Load template
  useEffect(() => {
    if (id) {
      fetchTemplate(id);
    }
  }, [id]);

  const handleLoadSample = useCallback(() => {
    if (!currentTemplate) return;
    pushUndo();
    const layout = getDefaultLayoutForType(currentTemplate.document_type || "invoice");
    updateLayoutJson(layout);
  }, [currentTemplate, pushUndo, updateLayoutJson]);

  // Auto-populate with sample layout if canvas is empty on initial load
  useEffect(() => {
    if (currentTemplate && (!currentTemplate.layout_json?.components || currentTemplate.layout_json.components.length === 0)) {
      const layout = getDefaultLayoutForType(currentTemplate.document_type || "invoice");
      updateLayoutJson(layout);
    }
  }, [currentTemplate?._id]);

  // Load variables when template loads
  useEffect(() => {
    if (currentTemplate?.document_type) {
      fetchVariables(currentTemplate.document_type);
    }
  }, [currentTemplate?.document_type]);

  const components = useMemo(() => currentTemplate?.layout_json?.components || [], [currentTemplate?.layout_json]);
  const pageSettings = useMemo(() => currentTemplate?.pdf_settings || {}, [currentTemplate?.pdf_settings]);

  const selectedComponent = useMemo(
    () => components.find((c) => c.id === selectedComponentId) || null,
    [components, selectedComponentId]
  );

  // ---------------------------------------------------------------
  // Component Operations
  // ---------------------------------------------------------------
  const generateId = () => `comp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const handleDrop = useCallback((def: any, index: number) => {
    if (!currentTemplate) return;
    pushUndo();

    const newComponent: TemplateComponent = {
      id: generateId(),
      type: def.type,
      props: { ...def.defaultProps },
      style: { ...def.defaultStyle },
      content: def.defaultContent || "",
      children: [],
    };

    const newComponents = [...components];
    newComponents.splice(index, 0, newComponent);

    updateLayoutJson({ ...currentTemplate.layout_json, components: newComponents });
    setSelectedComponentId(newComponent.id);
  }, [currentTemplate, components, pushUndo, updateLayoutJson, setSelectedComponentId]);

  const handleReorder = useCallback((fromIdx: number, toIdx: number) => {
    if (!currentTemplate) return;
    pushUndo();

    const newComponents = [...components];
    const [moved] = newComponents.splice(fromIdx, 1);
    const adjustedTo = toIdx > fromIdx ? toIdx - 1 : toIdx;
    newComponents.splice(adjustedTo, 0, moved);

    updateLayoutJson({ ...currentTemplate.layout_json, components: newComponents });
  }, [currentTemplate, components, pushUndo, updateLayoutJson]);

  const handleDelete = useCallback((id: string) => {
    if (!currentTemplate) return;
    pushUndo();
    const newComponents = components.filter((c) => c.id !== id);
    updateLayoutJson({ ...currentTemplate.layout_json, components: newComponents });
    if (selectedComponentId === id) setSelectedComponentId(null);
  }, [currentTemplate, components, pushUndo, updateLayoutJson, selectedComponentId, setSelectedComponentId]);

  const handleDuplicate = useCallback((id: string) => {
    if (!currentTemplate) return;
    pushUndo();
    const idx = components.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const clone: TemplateComponent = {
      ...JSON.parse(JSON.stringify(components[idx])),
      id: generateId(),
    };
    const newComponents = [...components];
    newComponents.splice(idx + 1, 0, clone);
    updateLayoutJson({ ...currentTemplate.layout_json, components: newComponents });
    setSelectedComponentId(clone.id);
  }, [currentTemplate, components, pushUndo, updateLayoutJson, setSelectedComponentId]);

  const handleStyleChange = useCallback((key: string, value: string) => {
    if (!currentTemplate || !selectedComponentId) return;
    pushUndo();
    const newComponents = components.map((c) =>
      c.id === selectedComponentId ? { ...c, style: { ...c.style, [key]: value } } : c
    );
    updateLayoutJson({ ...currentTemplate.layout_json, components: newComponents });
  }, [currentTemplate, selectedComponentId, components, pushUndo, updateLayoutJson]);

  const handleContentChange = useCallback((content: string) => {
    if (!currentTemplate || !selectedComponentId) return;
    pushUndo();
    const newComponents = components.map((c) =>
      c.id === selectedComponentId ? { ...c, content } : c
    );
    updateLayoutJson({ ...currentTemplate.layout_json, components: newComponents });
  }, [currentTemplate, selectedComponentId, components, pushUndo, updateLayoutJson]);

  const handlePropsChange = useCallback((key: string, value: any) => {
    if (!currentTemplate || !selectedComponentId) return;
    pushUndo();
    const newComponents = components.map((c) =>
      c.id === selectedComponentId ? { ...c, props: { ...c.props, [key]: value } } : c
    );
    updateLayoutJson({ ...currentTemplate.layout_json, components: newComponents });
  }, [currentTemplate, selectedComponentId, components, pushUndo, updateLayoutJson]);

  // ---------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------
  const handleSave = useCallback(async () => {
    if (!currentTemplate || !id) return;
    setSaving(true);
    await updateTemplate(id, {
      layout_json: currentTemplate.layout_json,
      css: currentTemplate.css,
      variables_used: extractVariables(components),
    } as any);
    setSaving(false);
  }, [currentTemplate, id, updateTemplate, components]);

  const handlePublish = useCallback(async () => {
    if (!id) return;
    await handleSave();
    await publishTemplate(id);
  }, [id, handleSave, publishTemplate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "s") { e.preventDefault(); handleSave(); }
        if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
        if (e.key === "z" && e.shiftKey) { e.preventDefault(); redo(); }
        if (e.key === "y") { e.preventDefault(); redo(); }
      }
      if (e.key === "Delete" && selectedComponentId) { handleDelete(selectedComponentId); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave, undo, redo, selectedComponentId, handleDelete]);

  // ---------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------
  if (loading && !currentTemplate) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  if (!currentTemplate) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Template not found</p>
          <button onClick={() => navigate("/settings/document-templates")} className="mt-3 text-red-600 hover:underline text-sm">
            Back to Templates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/settings/document-templates")} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <ChevronLeft size={18} className="text-gray-500" />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">{currentTemplate.name}</h2>
            <p className="text-xs text-gray-400 capitalize">{currentTemplate.document_type.replace(/_/g, " ")} · v{currentTemplate.version}</p>
          </div>
        </div>

        {/* Center: Zoom & Preview */}
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition" title="Zoom Out">
            <ZoomOut size={16} className="text-gray-500" />
          </button>
          <span className="text-xs font-medium text-gray-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition" title="Zoom In">
            <ZoomIn size={16} className="text-gray-500" />
          </button>

          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

          <button onClick={() => setPreviewMode("desktop")} className={`p-1.5 rounded-lg transition ${previewMode === "desktop" ? "bg-gray-100 dark:bg-gray-700" : "hover:bg-gray-100 dark:hover:bg-gray-700"}`} title="Desktop">
            <Monitor size={16} className={previewMode === "desktop" ? "text-red-500" : "text-gray-500"} />
          </button>
          <button onClick={() => setPreviewMode("tablet")} className={`p-1.5 rounded-lg transition ${previewMode === "tablet" ? "bg-gray-100 dark:bg-gray-700" : "hover:bg-gray-100 dark:hover:bg-gray-700"}`} title="Tablet">
            <Tablet size={16} className={previewMode === "tablet" ? "text-red-500" : "text-gray-500"} />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button onClick={handleLoadSample} className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 font-medium text-xs transition inline-flex items-center gap-1" title="Load Sample Template Layout">
            <Sparkles size={14} />
            Sample Layout
          </button>

          <button onClick={() => setShowVariablePicker(true)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition" title="Insert Variable">
            <Hash size={16} className="text-gray-500" />
          </button>
          <button onClick={() => { fetchVersions(id!); setShowVersions(!showVersions); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition" title="Version History">
            <History size={16} className="text-gray-500" />
          </button>

          <button onClick={undo} disabled={undoStack.length === 0} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition" title="Undo (Ctrl+Z)">
            <Undo2 size={16} className="text-gray-500" />
          </button>
          <button onClick={redo} disabled={redoStack.length === 0} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition" title="Redo (Ctrl+Shift+Z)">
            <Redo2 size={16} className="text-gray-500" />
          </button>

          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 transition"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save
          </button>

          <button
            onClick={handlePublish}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
          >
            <CheckCircle size={14} />
            Publish
          </button>
        </div>
      </div>

      {/* Builder Body: 3-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Component Panel */}
        <ComponentPanel onDragStart={() => {}} />

        {/* Center: Canvas */}
        <CanvasRenderer
          components={components}
          selectedId={selectedComponentId}
          zoom={previewMode === "tablet" ? zoom * 0.7 : zoom}
          pageSettings={pageSettings}
          onSelect={setSelectedComponentId}
          onDrop={handleDrop}
          onReorder={handleReorder}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onLoadSample={handleLoadSample}
        />

        {/* Right: Properties Panel */}
        <PropertiesPanel
          selectedComponent={selectedComponent}
          onStyleChange={handleStyleChange}
          onContentChange={handleContentChange}
          onPropsChange={handlePropsChange}
        />
      </div>

      {/* Variable Picker Modal */}
      <VariablePicker
        isOpen={showVariablePicker}
        variables={variableDefinitions}
        onSelect={(varPath) => {
          if (selectedComponentId) {
            handleContentChange((selectedComponent?.content || "") + `{{${varPath}}}`);
          }
        }}
        onClose={() => setShowVariablePicker(false)}
      />

      {/* Version History Slide Panel */}
      {showVersions && (
        <div className="fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 shadow-2xl border-l border-gray-200 dark:border-gray-700 z-40 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Version History</h3>
            <button onClick={() => setShowVersions(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
          </div>
          <div className="p-3 space-y-2">
            {versions.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No versions found</p>}
            {versions.map((v) => (
              <div key={v._id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">v{v.version}</span>
                  <span className="text-xs text-gray-400">{new Date(v.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{v.change_summary}</p>
                <button
                  onClick={async () => {
                    const store = useDocumentTemplateStore.getState();
                    await store.restoreVersion(id!, v.version);
                    setShowVersions(false);
                  }}
                  className="mt-2 text-xs text-red-600 hover:underline font-medium"
                >
                  Restore this version
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// Utility: Extract {{variable}} paths from components
// ---------------------------------------------------------------
function extractVariables(components: TemplateComponent[]): string[] {
  const vars = new Set<string>();
  const regex = /\{\{([^}]+)\}\}/g;

  function walk(comps: TemplateComponent[]) {
    for (const c of comps) {
      if (c.content) {
        let match;
        while ((match = regex.exec(c.content)) !== null) {
          vars.add(match[1].trim());
        }
      }
      if (c.props?.variable) vars.add(c.props.variable);
      if (c.children) walk(c.children);
    }
  }

  walk(components);
  return Array.from(vars);
}
