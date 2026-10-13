import React, { useState, useEffect } from "react";
import { apiClient } from "src/services/apiClient";
import { Zap, Check, Plus, Trash2 } from "lucide-react";

export default function SuccessStageConfigPage() {
  const [stages, setStages] = useState<string[]>([
    "won",
    "Qualified Lead Accepted",
    "Booking Amount Received",
    "Admission Paid",
    "Treatment Completed",
    "Policy Issued"
  ]);
  const [newStage, setNewStage] = useState("");
  const [clientCode, setClientCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await apiClient.get("billing/success-stages");
      if (res.data.success && res.data.data.length > 0) {
        setStages(res.data.data[0].success_stages || []);
      }
    } catch (err) {
      console.error("Fetch success stage config error:", err);
    }
  };

  const handleAddStage = () => {
    if (!newStage.trim()) return;
    if (!stages.includes(newStage.trim())) {
      setStages([...stages, newStage.trim()]);
    }
    setNewStage("");
  };

  const handleRemoveStage = (stageToRemove: string) => {
    setStages(stages.filter((s) => s !== stageToRemove));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSavedSuccess(false);
      const res = await apiClient.post("billing/success-stages", {
        client_code: clientCode || undefined,
        success_stages: stages
      });
      if (res.data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Save config error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-500" /> Configurable Commercial Success Stages
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Define which Lead Stages trigger automatic B2B client success billing calculations when reached.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Optional Client Specific Override</label>
          <input
            type="text"
            placeholder="Leave empty for tenant default (e.g. ABC_BUILDERS)"
            value={clientCode}
            onChange={(e) => setClientCode(e.target.value)}
            className="w-full max-w-md border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Active Success Trigger Stages</label>
          <div className="flex flex-wrap gap-2 mb-4">
            {stages.map((stg) => (
              <span
                key={stg}
                className="bg-indigo-50 text-indigo-700 font-semibold px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 border border-indigo-100"
              >
                {stg}
                <button onClick={() => handleRemoveStage(stg)} className="text-indigo-400 hover:text-indigo-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 max-w-md">
            <input
              type="text"
              placeholder="Add new stage name (e.g. Site Visit Completed)..."
              value={newStage}
              onChange={(e) => setNewStage(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleAddStage}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Configuration"}
          </button>
          {savedSuccess && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <Check className="w-4 h-4" /> Configuration saved successfully!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
