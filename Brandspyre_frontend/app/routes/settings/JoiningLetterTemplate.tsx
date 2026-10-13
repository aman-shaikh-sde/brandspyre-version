import React, { useEffect, useState, useRef } from "react";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { useAuthStore } from "src/stores/authStore";
import { notify } from "~/services/notificationService";
import {
  Loader2,
  Save,
  FileText,
  HelpCircle,
  Eye,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  RotateCcw,
  Trash2,
  Plus
} from "lucide-react";

interface CustomField {
  key: string;
  label: string;
  value: string;
}

const JoiningLetterTemplate = () => {
  const token = useAuthStore((state) => state.accessToken);
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"visual" | "html">("visual");
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");

  const editorRef = useRef<HTMLDivElement>(null);
  const lastRangeRef = useRef<Range | null>(null);

  const placeholders = [
    { token: "{firstname}", desc: "First Name" },
    { token: "{lastname}", desc: "Last Name" },
    { token: "{presentaddress}", desc: "Present Address" },
    { token: "{designation}", desc: "Designation" },
    { token: "{dateofjoining}", desc: "Date of Joining" },
    { token: "{staff_id}", desc: "Employee ID" },
    { token: "{department}", desc: "Department" },
    { token: "{reporting_to_name}", desc: "Reporting Manager Name" },
    { token: "{branch_name}", desc: "Branch Name" },
    { token: "{basicsalary}", desc: "Basic Salary" },
    { token: "{hra}", desc: "HRA" },
    { token: "{other_allowance}", desc: "Other Allowance" },
    { token: "{gross_salary}", desc: "Gross Salary" },
  ];

  const fallbackTemplate = `<div class="relative z-10">
  <img src="{logo_url}" alt="Watermark" class="absolute opacity-10 z-0 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] pointer-events-none" />

  <div class="flex justify-between items-center mb-4 border-b border-gray-400 pb-4">
    <img src="{logo_url}" alt="Almino Logo" class="h-20" />
    <div class="text-right text-sm">
      <p class="font-bold text-lg">ALMINO STRUCTURAL CONSULTANCY PVT LTD</p>
      <p class="text-red-500 font-semibold">GST NO : 33AASCA3262R1Z2</p>
    </div>
  </div>

  <div class="text-center mb-4">
    <h2 class="text-xl font-bold underline">JOINING LETTER</h2>
    <p class="text-sm mt-1">GET NO: 330A562A0508172</p>
  </div>

  <p>To,</p>
  <p class="font-semibold">{firstname} {lastname}</p>
  <p>{presentaddress}</p>

  <p class="mt-6 font-semibold">Subject: Joining Letter for the Position of {designation}</p>

  <p class="mt-4">Dear {firstname},</p>
  <p class="mt-2 text-justify">
    We are pleased to confirm your appointment as <strong>{designation}</strong> atBrandsypre Groups Pvt Ltd, effective from <strong>{dateofjoining}</strong>.
  </p>

  <div class="mt-4">
    <p><strong>Employee ID:</strong> {staff_id}</p>
    <p><strong>Department:</strong> {department}</p>
    <p><strong>Designation:</strong> {designation}</p>
    <p><strong>Reporting To:</strong> {reporting_to_name}</p>
    <p><strong>Location:</strong> {branch_name}</p>
  </div>

  <div class="mt-4">
    <p class="underline font-semibold">Compensation Details:</p>
    <ul class="list-disc list-inside ml-4">
      <li><strong>Basic Salary:</strong> ₹{basicsalary}</li>
      <li><strong>HRA:</strong> ₹{hra}</li>
      <li><strong>Other Allowances:</strong> ₹{other_allowance}</li>
      <li><strong>Gross Salary:</strong> ₹{gross_salary}</li>
    </ul>
  </div>

  <p class="mt-4 text-justify">
    Your employment will be subject to the terms and conditions outlined in the company's HR policies. Please review the employee handbook for detailed information about your benefits, leave policies, and other employment terms.
  </p>

  <p class="mt-4 text-justify">
    We are excited to have you on board and look forward to a successful and productive association. If you have any questions, please feel free to contact the HR department.
  </p>

  <p class="mt-6">Sincerely,</p>
  <p class="mt-2 font-semibold">HR Manager</p>
  <p>BRANDSPYRE Technologies Pvt Ltd</p>

  <div class="mt-10 text-right">
    <img src="{seal_url}" alt="Company Seal" class="h-20 inline" />
  </div>

  <footer class="text-sm mt-10 border-t border-gray-300 pt-3">
    <div class="flex justify-between">
      <div>
        <p class="text-red-600">
          📞 +91 95977 46657<br />
          📞 +91 97865 81307
        </p>
      </div>
      <div class="text-right">
        <p>📍 Near King's Palace, Old Check Post,</p>
        <p>Pattinamkathan, Ramanathapuram - 623503</p>
        <p>📧 alminostructure@gmail.com</p>
      </div>
    </div>
  </footer>
</div>`;

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/templates/joining_letter`);
      if (response.data && response.data.data) {
        setContent(response.data.data.content || fallbackTemplate);
        setSubject(response.data.data.subject || "");
        setCustomFields(response.data.data.custom_fields || []);
      } else {
        setContent(fallbackTemplate);
      }
    } catch (error: any) {
      console.error("Error fetching template", error);
      setContent(fallbackTemplate);
      notify.error("Failed to load template, loaded fallback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTemplate();
    }
  }, [token]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiClient.put(
        `/templates/joining_letter`,
        { content, subject, custom_fields: customFields }
      );
      notify.success("Template saved successfully!");
    } catch (error: any) {
      console.error("Error saving template", error);
      notify.error(error.response?.data?.error || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      lastRangeRef.current = selection.getRangeAt(0);
    }
  };

  const execCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    handleEditorInput();
  };

  const insertPlaceholder = (placeholder: string) => {
    const selection = window.getSelection();
    const range = lastRangeRef.current;

    if (range && selection) {
      selection.removeAllRanges();
      selection.addRange(range);
      range.deleteContents();

      const textNode = document.createTextNode(placeholder);
      range.insertNode(textNode);

      // Move cursor after placeholder
      const newRange = document.createRange();
      newRange.setStartAfter(textNode);
      newRange.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(newRange);
      lastRangeRef.current = newRange;
    } else {
      const editor = editorRef.current;
      if (editor) {
        editor.focus();
        const textNode = document.createTextNode(placeholder);
        editor.appendChild(textNode);
      }
    }
    handleEditorInput();
  };

  const handleAddCustomField = () => {
    if (!newFieldLabel || !newFieldValue) {
      notify.error("Both field label and default value are required");
      return;
    }
    const cleanKey = newFieldLabel.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const placeholderKey = `{${cleanKey}}`;

    if (
      placeholders.some((p) => p.token === placeholderKey) ||
      customFields.some((f) => f.key === placeholderKey)
    ) {
      notify.error("A placeholder with this name already exists");
      return;
    }

    setCustomFields([
      ...customFields,
      { key: placeholderKey, label: newFieldLabel, value: newFieldValue }
    ]);
    setNewFieldLabel("");
    setNewFieldValue("");
    notify.success(`Added dynamic placeholder: ${placeholderKey}`);
  };

  const handleRemoveCustomField = (key: string) => {
    setCustomFields(customFields.filter((f) => f.key !== key));
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset the template to the original default layout? Any unsaved edits will be lost.")) {
      setContent(fallbackTemplate);
      setCustomFields([]);
      if (editorRef.current) {
        editorRef.current.innerHTML = fallbackTemplate;
      }
    }
  };

  const compilePreview = (html: string) => {
    let compiled = html
      .replace(/{logo_url}/g, "https://placehold.co/200x80?text=Brandspyre+Logo")
      .replace(/{seal_url}/g, "https://placehold.co/100x80?text=Company+Seal")
      .replace(/{firstname}/g, "John")
      .replace(/{lastname}/g, "Doe")
      .replace(/{presentaddress}/g, "123 Main St, Ramanathapuram, India")
      .replace(/{designation}/g, "Design Engineer")
      .replace(/{dateofjoining}/g, new Date().toLocaleDateString())
      .replace(/{staff_id}/g, "EMP1001")
      .replace(/{department}/g, "Structures")
      .replace(/{reporting_to_name}/g, "Er. Vignesh")
      .replace(/{branch_name}/g, "Ramanathapuram Branch")
      .replace(/{basicsalary}/g, "25,000")
      .replace(/{hra}/g, "5,000")
      .replace(/{other_allowance}/g, "3,000")
      .replace(/{gross_salary}/g, "33,000");

    customFields.forEach((field) => {
      const escapedKey = field.key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escapedKey, "g");
      compiled = compiled.replace(regex, field.value);
    });

    return compiled;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin h-12 w-12 text-red-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header toolbar */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="text-red-700" /> Joining Letter Template
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Customize the joining letter layout visually. Changes are automatically updated in the letter preview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg shadow-sm font-medium transition-colors"
            title="Reset to default template layout"
          >
            <RotateCcw size={16} />
            Reset Default
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-lg shadow-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <Save size={18} />
            )}
            Save Template
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Editor controls & tools - 4 columns */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Email / Letter Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Joining Letter -Brandsypre Groups"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Template Editor Mode
              </label>
              <div className="flex bg-gray-100 dark:bg-gray-700 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setViewMode("visual")}
                  className={`px-3 py-1.5 rounded-md transition-colors ${viewMode === "visual"
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                    }`}
                >
                  Visual Editor
                </button>
                <button
                  onClick={() => setViewMode("html")}
                  className={`px-3 py-1.5 rounded-md transition-colors ${viewMode === "html"
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                    }`}
                >
                  Raw HTML
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
              Use Visual mode to type like a word document. Use HTML mode if you want to paste custom tables or inline styling blocks.
            </p>
          </div>

          {/* Placeholders box */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Available Placeholders
            </label>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 leading-relaxed">
              Place the cursor inside the document editor and click any placeholder block to insert it at that spot.
            </p>
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
              {placeholders.map((p) => (
                <button
                  key={p.token}
                  type="button"
                  onClick={() => insertPlaceholder(p.token)}
                  className="flex justify-between items-center w-full px-3 py-2 text-left text-xs font-medium rounded-lg bg-gray-50 hover:bg-red-50/50 border border-gray-200 dark:bg-gray-700/50 dark:hover:bg-red-950/20 dark:border-gray-600 hover:border-red-200 dark:hover:border-red-900 transition-colors cursor-pointer"
                >
                  <span className="font-mono text-red-700 dark:text-red-400">{p.token}</span>
                  <span className="text-gray-400 dark:text-gray-400 text-[10px]">{p.desc}</span>
                </button>
              ))}
            </div>

            {/* Custom placeholders section */}
            {customFields.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Custom Fields / Information Blocks
                </label>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {customFields.map((f) => (
                    <div
                      key={f.key}
                      className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50/20 border border-red-100 dark:bg-red-950/10 dark:border-red-900/30"
                    >
                      <button
                        type="button"
                        onClick={() => insertPlaceholder(f.key)}
                        className="flex-grow text-left font-mono text-red-700 dark:text-red-400 hover:underline cursor-pointer"
                        title={`Default: ${f.value}`}
                      >
                        {f.key}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomField(f.key)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/55 rounded text-red-600 transition-colors cursor-pointer"
                        title="Delete custom field"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Add custom field form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Plus size={16} className="text-red-700" /> Create Custom Field / Section
            </h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  Field Label / Title
                </label>
                <input
                  type="text"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  placeholder="e.g. Notice Period"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  Default Value / Text Block
                </label>
                <textarea
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  placeholder="e.g. 3 Months, or enter a text paragraph..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <button
                type="button"
                onClick={handleAddCustomField}
                className="w-full py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Add Custom Field
              </button>
            </div>
          </div>
        </div>

        {/* Canvas & Editor Area - 8 columns */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {viewMode === "visual" && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-3 flex flex-wrap gap-1 items-center sticky top-0 z-20">
              <button
                type="button"
                onClick={() => execCommand("bold")}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
                title="Bold"
              >
                <Bold size={16} />
              </button>
              <button
                type="button"
                onClick={() => execCommand("italic")}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
                title="Italic"
              >
                <Italic size={16} />
              </button>
              <button
                type="button"
                onClick={() => execCommand("underline")}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
                title="Underline"
              >
                <Underline size={16} />
              </button>
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
              <button
                type="button"
                onClick={() => execCommand("justifyLeft")}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
                title="Align Left"
              >
                <AlignLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => execCommand("justifyCenter")}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
                title="Align Center"
              >
                <AlignCenter size={16} />
              </button>
              <button
                type="button"
                onClick={() => execCommand("justifyRight")}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
                title="Align Right"
              >
                <AlignRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => execCommand("justifyFull")}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
                title="Justify"
              >
                <AlignJustify size={16} />
              </button>
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
              <button
                type="button"
                onClick={() => execCommand("insertUnorderedList")}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
                title="Bullet List"
              >
                <List size={16} />
              </button>
              <button
                type="button"
                onClick={() => execCommand("insertOrderedList")}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
                title="Numbered List"
              >
                <ListOrdered size={16} />
              </button>
            </div>
          )}

          {viewMode === "visual" ? (
            <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 flex justify-center items-start overflow-y-auto max-h-[850px]">
              <div
                ref={editorRef}
                contentEditable={true}
                onInput={handleEditorInput}
                onBlur={saveSelection}
                onKeyUp={saveSelection}
                onMouseUp={saveSelection}
                className="bg-white text-black p-10 w-[794px] min-h-[1050px] shadow-lg border border-gray-300 rounded font-serif text-[14px] leading-relaxed focus:outline-none select-text"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={30}
                className="w-full font-mono text-sm p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
          )}

          {/* Toggle John Doe Preview */}
          {viewMode === "visual" && (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <Eye size={18} className="text-gray-500" /> Compiled Sample Preview
              </div>
              <div className="bg-white text-black border border-gray-200 rounded p-6 font-serif text-[13px] leading-relaxed max-h-96 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: compilePreview(content) }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoiningLetterTemplate;
