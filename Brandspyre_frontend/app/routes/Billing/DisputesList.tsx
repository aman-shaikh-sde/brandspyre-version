import React, { useState, useEffect } from "react";
import { apiClient } from "src/services/apiClient";
import { AlertTriangle, CheckCircle, XCircle, FileText, Search } from "lucide-react";

export default function DisputesList() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("billing/disputes");
      if (res.data.success) {
        setDisputes(res.data.data);
      }
    } catch (err) {
      console.error("Fetch disputes error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (status: 'accepted' | 'rejected') => {
    if (!selectedDispute) return;
    try {
      const res = await apiClient.post(`billing/disputes/${selectedDispute._id}/resolve`, {
        resolution_status: status,
        resolution_notes: resolutionNotes
      });
      if (res.data.success) {
        setSelectedDispute(null);
        setResolutionNotes("");
        fetchDisputes();
      }
    } catch (err) {
      console.error("Resolve dispute error:", err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-500" /> Client Billing Disputes & Credit Notes
        </h1>
        <p className="text-xs text-slate-500 mt-1">Review client lead quality disputes, investigate issues, and issue Credit Notes.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
              <th className="p-4">Dispute #</th>
              <th className="p-4">Client</th>
              <th className="p-4">Lead Name</th>
              <th className="p-4">Dispute Reason</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Credit Note</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={7} className="py-8 text-center text-slate-400">Loading disputes...</td></tr>
            ) : disputes.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-slate-400">No active lead disputes found.</td></tr>
            ) : (
              disputes.map((d) => (
                <tr key={d._id} className="hover:bg-slate-50/60">
                  <td className="p-4 font-semibold text-rose-600">{d.dispute_code}</td>
                  <td className="p-4 font-medium text-slate-900">{d.client_code}</td>
                  <td className="p-4 text-slate-800">{d.lead_id?.lead_name || "Lead #" + d.lead_id?._id}</td>
                  <td className="p-4 text-slate-600 text-xs">{d.dispute_reason}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                      d.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      d.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="p-4 text-center text-xs font-medium">
                    {d.credit_note_generated ? (
                      <span className="text-emerald-600 font-semibold">Issued (CN)</span>
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {d.status === 'pending' && (
                      <button
                        onClick={() => setSelectedDispute(d)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg text-xs font-medium"
                      >
                        Investigate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedDispute && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">Resolve Dispute #{selectedDispute.dispute_code}</h3>
            <p className="text-xs text-slate-500">Reason: {selectedDispute.dispute_reason}</p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Resolution Notes</label>
              <textarea
                rows={3}
                placeholder="Enter investigation details & outcome rationale..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setSelectedDispute(null)} className="px-3 py-1.5 text-xs text-slate-600">Cancel</button>
              <button
                onClick={() => handleResolve('rejected')}
                className="bg-rose-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold"
              >
                Reject Dispute
              </button>
              <button
                onClick={() => handleResolve('accepted')}
                className="bg-emerald-600 text-white px-4 py-1.5 rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20"
              >
                Accept & Issue Credit Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
