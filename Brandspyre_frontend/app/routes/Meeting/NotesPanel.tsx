import React, { useState, useEffect } from "react";
import { Download, FileText, CheckCircle, Lock, Users } from "lucide-react";
import { notify } from "~/services/notificationService";
import apiClient from "src/services/apiClient";

interface NotesPanelProps {
  meetingId: string;
  notesContent: string;
  emitSocketEvent: (event: string, payload: any) => void;
}

export default function NotesPanel({ meetingId, notesContent, emitSocketEvent }: NotesPanelProps) {
  const [activeNoteTab, setActiveNoteTab] = useState<'SHARED' | 'INTERNAL'>('SHARED');
  const [sharedNotes, setSharedNotes] = useState(notesContent);
  const [internalNotes, setInternalNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSharedNotes(notesContent);
  }, [notesContent]);

  useEffect(() => {
    fetchInternalNotes();
  }, [meetingId]);

  const fetchInternalNotes = async () => {
    try {
      const res = await apiClient.get(`/meetings/${meetingId}/notes`);
      const data = res.data;
      if (data.success && Array.isArray(data.data)) {
        const intNote = data.data.find((n: any) => n.note_type === 'INTERNAL');
        const shNote = data.data.find((n: any) => n.note_type === 'SHARED');
        if (intNote) setInternalNotes(intNote.content);
        if (shNote) setSharedNotes(shNote.content);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (activeNoteTab === 'SHARED') {
      setSharedNotes(val);
      emitSocketEvent("notes-edit", { content: val });
    } else {
      setInternalNotes(val);
    }
  };

  const handleDownload = () => {
    const contentToDownload = activeNoteTab === 'SHARED' ? sharedNotes : internalNotes;
    const blob = new Blob([contentToDownload], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `meeting-${activeNoteTab.toLowerCase()}-notes-${meetingId}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveDB = async () => {
    setIsSaving(true);
    try {
      const contentToSave = activeNoteTab === 'SHARED' ? sharedNotes : internalNotes;
      await apiClient.put(`/meetings/${meetingId}/notes`, {
        content: contentToSave,
        note_type: activeNoteTab
      });

      notify.success(`${activeNoteTab === 'SHARED' ? 'Shared' : 'Internal Private'} notes saved successfully.`);
    } catch (err) {
      console.error(err);
      notify.error("Failed to save notes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg p-4 text-white">
      <div className="flex items-center justify-between border-b border-gray-700 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <FileText className="text-red-500" size={18} />
          <h3 className="font-semibold text-sm">Meeting Notes</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSaveDB}
            disabled={isSaving}
            className="flex items-center gap-1 text-xs bg-red-700 hover:bg-red-800 text-white rounded px-2.5 py-1.5 transition disabled:opacity-50"
            title="Save to database"
          >
            <CheckCircle size={14} />
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center justify-center p-1.5 rounded bg-gray-700 hover:bg-gray-600 transition"
            title="Download Markdown"
          >
            <Download size={15} />
          </button>
        </div>
      </div>

      {/* Note Tabs */}
      <div className="flex gap-2 mb-3 bg-gray-900 p-1 rounded-lg border border-gray-700">
        <button
          onClick={() => setActiveNoteTab('SHARED')}
          className={`flex-1 py-1 px-2 text-xs font-semibold rounded transition flex items-center justify-center gap-1 ${
            activeNoteTab === 'SHARED' ? 'bg-red-700 text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Users size={12} />
          Shared Notes
        </button>
        <button
          onClick={() => setActiveNoteTab('INTERNAL')}
          className={`flex-1 py-1 px-2 text-xs font-semibold rounded transition flex items-center justify-center gap-1 ${
            activeNoteTab === 'INTERNAL' ? 'bg-indigo-700 text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Lock size={12} />
          Internal Notes (Private)
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        <textarea
          value={activeNoteTab === 'SHARED' ? sharedNotes : internalNotes}
          onChange={handleChange}
          className="flex-1 w-full bg-gray-950 text-gray-200 border border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:border-red-500 font-mono resize-none"
          placeholder={
            activeNoteTab === 'SHARED' 
              ? "Collaborate on shared notes... Visible to all meeting participants."
              : "Write internal notes... Visible ONLY to your organization!"
          }
        />
        <div className="mt-2 text-[11px] text-gray-400">
          {activeNoteTab === 'SHARED' ? (
            <span>Shared notes synchronize live with all meeting participants.</span>
          ) : (
            <span className="text-indigo-400">🔒 Strictly Private: Counter-party organizations cannot view internal notes.</span>
          )}
        </div>
      </div>
    </div>
  );
}
