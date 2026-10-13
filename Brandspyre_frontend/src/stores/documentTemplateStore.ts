import { create } from "zustand";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { useAuthStore } from "./authStore";

// ---------------------------------------------------------------
// Types
// ---------------------------------------------------------------
export interface DocumentTemplate {
  _id: string;
  tenant_id: string;
  name: string;
  slug: string;
  document_type: string;
  module: string;
  category: string;
  layout_json: LayoutJson;
  generated_html: string;
  css: string;
  branding_overrides: Record<string, any>;
  pdf_settings: PdfSettings;
  variables_used: string[];
  conditions: any[];
  status: "draft" | "published" | "archived";
  is_default: boolean;
  version: number;
  created_by: string;
  updated_by: string;
  published_by?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LayoutJson {
  components: TemplateComponent[];
  page: Record<string, any>;
}

export interface TemplateComponent {
  id: string;
  type: string;
  props: Record<string, any>;
  style: Record<string, any>;
  content?: string;
  children?: TemplateComponent[];
  conditions?: any[];
  conditionLogic?: "AND" | "OR";
}

export interface PdfSettings {
  orientation: "portrait" | "landscape";
  size: "a4" | "letter";
  margin_top: number;
  margin_right: number;
  margin_bottom: number;
  margin_left: number;
  header_height: number;
  footer_height: number;
  watermark: string;
  background: string;
  show_page_numbers: boolean;
  show_page_breaks: boolean;
}

export interface TemplateVersionRecord {
  _id: string;
  template_id: string;
  version: number;
  layout_json: LayoutJson;
  generated_html: string;
  css: string;
  change_summary: string;
  created_by: any;
  created_at: string;
}

export interface VariableDefinition {
  path: string;
  label: string;
  group: string;
  sample: string;
}

export interface TemplateAsset {
  _id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  file_path: string;
  file_size: number;
  asset_type: string;
  created_at: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface TemplateFilters {
  search: string;
  module: string;
  document_type: string;
  status: string;
  category: string;
}

// ---------------------------------------------------------------
// Store State
// ---------------------------------------------------------------
interface DocumentTemplateState {
  // List
  templates: DocumentTemplate[];
  pagination: Pagination;
  filters: TemplateFilters;
  loading: boolean;
  error: string | null;

  // Builder
  currentTemplate: DocumentTemplate | null;
  selectedComponentId: string | null;
  undoStack: LayoutJson[];
  redoStack: LayoutJson[];

  // Version history
  versions: TemplateVersionRecord[];
  versionsLoading: boolean;

  // Variables
  variableDefinitions: VariableDefinition[];

  // Assets
  assets: TemplateAsset[];

  // Metadata
  metadata: {
    document_types: string[];
    modules: string[];
    categories: any[];
    type_module_map: Record<string, string>;
  } | null;

  // Actions
  setFilters: (filters: Partial<TemplateFilters>) => void;
  fetchTemplates: (page?: number) => Promise<void>;
  fetchTemplate: (id: string) => Promise<void>;
  createTemplate: (data: Partial<DocumentTemplate>) => Promise<DocumentTemplate | null>;
  updateTemplate: (id: string, data: Partial<DocumentTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  duplicateTemplate: (id: string) => Promise<void>;
  publishTemplate: (id: string) => Promise<void>;
  archiveTemplate: (id: string) => Promise<void>;
  restoreTemplate: (id: string) => Promise<void>;
  setDefaultTemplate: (id: string) => Promise<void>;
  seedTemplates: () => Promise<void>;

  // Builder actions
  setCurrentTemplate: (template: DocumentTemplate | null) => void;
  setSelectedComponentId: (id: string | null) => void;
  updateLayoutJson: (layout: LayoutJson) => void;
  pushUndo: () => void;
  undo: () => void;
  redo: () => void;

  // Version history
  fetchVersions: (templateId: string) => Promise<void>;
  restoreVersion: (templateId: string, versionNumber: number) => Promise<void>;

  // Variables
  fetchVariables: (documentType: string) => Promise<void>;

  // Assets
  fetchAssets: () => Promise<void>;
  uploadAsset: (file: File, assetType: string) => Promise<TemplateAsset | null>;

  // Metadata
  fetchMetadata: () => Promise<void>;

  // Preview
  previewTemplate: (id: string) => Promise<any>;
  renderTemplate: (id: string, contextData?: any) => Promise<any>;
}

// ---------------------------------------------------------------
// Helper: get auth headers
// ---------------------------------------------------------------
function getHeaders() {
  const state = useAuthStore.getState();
  const headers: Record<string, string> = {};
  if (state.accessToken) headers.Authorization = `Bearer ${state.accessToken}`;
  if (state.tenantId) headers["x-tenant-id"] = state.tenantId;
  return headers;
}

// ---------------------------------------------------------------
// Store
// ---------------------------------------------------------------
export const useDocumentTemplateStore = create<DocumentTemplateState>((set, get) => ({
  // Initial state
  templates: [],
  pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
  filters: { search: "", module: "", document_type: "", status: "", category: "" },
  loading: false,
  error: null,

  currentTemplate: null,
  selectedComponentId: null,
  undoStack: [],
  redoStack: [],

  versions: [],
  versionsLoading: false,

  variableDefinitions: [],
  assets: [],
  metadata: null,

  // ---------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------
  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  // ---------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------
  fetchTemplates: async (page = 1) => {
    set({ loading: true, error: null });
    try {
      const { filters, pagination } = get();
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pagination.pageSize));
      if (filters.search) params.set("search", filters.search);
      if (filters.module) params.set("module", filters.module);
      if (filters.document_type) params.set("document_type", filters.document_type);
      if (filters.status) params.set("status", filters.status);
      if (filters.category) params.set("category", filters.category);

      const res = await apiClient.get(`/document-templates?${params.toString()}`, { headers: getHeaders() });
      if (res.data.status) {
        set({
          templates: res.data.data || [],
          pagination: res.data.pagination || { page, pageSize: 20, total: 0, totalPages: 0 },
        });
      }
    } catch (err: any) {
      set({ error: err?.response?.data?.error || err.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchTemplate: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.get(`/document-templates/${id}`, { headers: getHeaders() });
      if (res.data.status) {
        set({ currentTemplate: res.data.data, undoStack: [], redoStack: [] });
      }
    } catch (err: any) {
      set({ error: err?.response?.data?.error || err.message });
    } finally {
      set({ loading: false });
    }
  },

  createTemplate: async (data) => {
    try {
      const res = await apiClient.post(`/document-templates`, data, { headers: getHeaders() });
      if (res.data.status) {
        get().fetchTemplates();
        return res.data.data;
      }
      return null;
    } catch (err: any) {
      set({ error: err?.response?.data?.error || err.message });
      return null;
    }
  },

  updateTemplate: async (id, data) => {
    try {
      const res = await apiClient.put(`/document-templates/${id}`, data, { headers: getHeaders() });
      if (res.data.status) {
        set({ currentTemplate: res.data.data });
      }
    } catch (err: any) {
      set({ error: err?.response?.data?.error || err.message });
    }
  },

  deleteTemplate: async (id) => {
    try {
      await apiClient.delete(`/document-templates/${id}`, { headers: getHeaders() });
      get().fetchTemplates();
    } catch (err: any) {
      set({ error: err?.response?.data?.error || err.message });
    }
  },

  duplicateTemplate: async (id) => {
    try {
      await apiClient.post(`/document-templates/${id}/duplicate`, {}, { headers: getHeaders() });
      get().fetchTemplates();
    } catch (err: any) {
      set({ error: err?.response?.data?.error || err.message });
    }
  },

  publishTemplate: async (id) => {
    try {
      const res = await apiClient.post(`/document-templates/${id}/publish`, {}, { headers: getHeaders() });
      if (res.data.status) {
        set({ currentTemplate: res.data.data });
        get().fetchTemplates();
      }
    } catch (err: any) {
      set({ error: err?.response?.data?.error || err.message });
    }
  },

  archiveTemplate: async (id) => {
    try {
      await apiClient.post(`/document-templates/${id}/archive`, {}, { headers: getHeaders() });
      get().fetchTemplates();
    } catch (err: any) {
      set({ error: err?.response?.data?.error || err.message });
    }
  },

  restoreTemplate: async (id) => {
    try {
      await apiClient.post(`/document-templates/${id}/restore`, {}, { headers: getHeaders() });
      get().fetchTemplates();
    } catch (err: any) {
      set({ error: err?.response?.data?.error || err.message });
    }
  },

  setDefaultTemplate: async (id) => {
    try {
      await apiClient.post(`/document-templates/${id}/set-default`, {}, { headers: getHeaders() });
      get().fetchTemplates();
    } catch (err: any) {
      set({ error: err?.response?.data?.error || err.message });
    }
  },

  seedTemplates: async () => {
    set({ loading: true, error: null });
    try {
      await apiClient.post(`/document-templates/seed`, {}, { headers: getHeaders() });
      await get().fetchTemplates();
    } catch (err: any) {
      set({ error: err?.response?.data?.error || err.message });
    } finally {
      set({ loading: false });
    }
  },

  // ---------------------------------------------------------------
  // Builder actions
  // ---------------------------------------------------------------
  setCurrentTemplate: (template) => set({ currentTemplate: template, undoStack: [], redoStack: [], selectedComponentId: null }),

  setSelectedComponentId: (id) => set({ selectedComponentId: id }),

  updateLayoutJson: (layout) => {
    const { currentTemplate } = get();
    if (!currentTemplate) return;
    set({
      currentTemplate: { ...currentTemplate, layout_json: layout },
      redoStack: [],
    });
  },

  pushUndo: () => {
    const { currentTemplate, undoStack } = get();
    if (!currentTemplate) return;
    set({ undoStack: [...undoStack.slice(-49), currentTemplate.layout_json] });
  },

  undo: () => {
    const { currentTemplate, undoStack, redoStack } = get();
    if (!currentTemplate || undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    set({
      redoStack: [...redoStack, currentTemplate.layout_json],
      undoStack: undoStack.slice(0, -1),
      currentTemplate: { ...currentTemplate, layout_json: prev },
    });
  },

  redo: () => {
    const { currentTemplate, undoStack, redoStack } = get();
    if (!currentTemplate || redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    set({
      undoStack: [...undoStack, currentTemplate.layout_json],
      redoStack: redoStack.slice(0, -1),
      currentTemplate: { ...currentTemplate, layout_json: next },
    });
  },

  // ---------------------------------------------------------------
  // Version History
  // ---------------------------------------------------------------
  fetchVersions: async (templateId) => {
    set({ versionsLoading: true });
    try {
      const res = await apiClient.get(`/document-templates/${templateId}/versions`, { headers: getHeaders() });
      if (res.data.status) {
        set({ versions: res.data.data || [] });
      }
    } catch (err: any) {
      set({ error: err?.response?.data?.error || err.message });
    } finally {
      set({ versionsLoading: false });
    }
  },

  restoreVersion: async (templateId, versionNumber) => {
    try {
      const res = await apiClient.post(`/document-templates/${templateId}/versions/${versionNumber}/restore`, {}, { headers: getHeaders() });
      if (res.data.status) {
        set({ currentTemplate: res.data.data });
        get().fetchVersions(templateId);
      }
    } catch (err: any) {
      set({ error: err?.response?.data?.error || err.message });
    }
  },

  // ---------------------------------------------------------------
  // Variables
  // ---------------------------------------------------------------
  fetchVariables: async (documentType) => {
    try {
      const res = await apiClient.get(`/document-templates/variables/${documentType}`, { headers: getHeaders() });
      if (res.data.status) {
        set({ variableDefinitions: res.data.data || [] });
      }
    } catch (err: any) {
      set({ error: err?.response?.data?.error || err.message });
    }
  },

  // ---------------------------------------------------------------
  // Assets
  // ---------------------------------------------------------------
  fetchAssets: async () => {
    try {
      const res = await apiClient.get(`/document-templates/assets`, { headers: getHeaders() });
      if (res.data.status) {
        set({ assets: res.data.data || [] });
      }
    } catch (err: any) {
      set({ error: err?.response?.data?.error || err.message });
    }
  },

  uploadAsset: async (file, assetType) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("asset_type", assetType);
      const res = await apiClient.post(`/document-templates/assets/upload`, formData, {
        headers: { ...getHeaders(), "Content-Type": "multipart/form-data" },
      });
      if (res.data.status) {
        get().fetchAssets();
        return res.data.data;
      }
      return null;
    } catch (err: any) {
      set({ error: err?.response?.data?.error || err.message });
      return null;
    }
  },

  // ---------------------------------------------------------------
  // Metadata
  // ---------------------------------------------------------------
  fetchMetadata: async () => {
    try {
      const res = await apiClient.get(`/document-templates/metadata`, { headers: getHeaders() });
      if (res.data.status) {
        set({ metadata: res.data.data });
      }
    } catch (err: any) {
      set({ error: err?.response?.data?.error || err.message });
    }
  },

  // ---------------------------------------------------------------
  // Preview & Render
  // ---------------------------------------------------------------
  previewTemplate: async (id) => {
    try {
      const res = await apiClient.post(`/document-templates/${id}/preview`, {}, { headers: getHeaders() });
      return res.data.status ? res.data.data : null;
    } catch (err: any) {
      set({ error: err?.response?.data?.error || err.message });
      return null;
    }
  },

  renderTemplate: async (id, contextData) => {
    try {
      const res = await apiClient.post(`/document-templates/${id}/render`, contextData || {}, { headers: getHeaders() });
      return res.data.status ? res.data.data : null;
    } catch (err: any) {
      set({ error: err?.response?.data?.error || err.message });
      return null;
    }
  },
}));
