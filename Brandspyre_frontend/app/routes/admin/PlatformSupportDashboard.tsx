import React, { useEffect, useState } from 'react';
import apiClient from "src/services/apiClient";
import PageHeader from 'src/component/ui/PageHeader';
import CrmBadge from 'src/component/ui/CrmBadge';
import { EmptyState } from 'src/component/ui/EmptyState';
import { Search, Send, CheckCircle2, RefreshCw, Headphones, Paperclip } from 'lucide-react';

export default function PlatformSupportDashboard() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMsg, setReplyMsg] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState('IN_PROGRESS');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    fetchSupportData();
  }, [statusFilter, priorityFilter]);

  const fetchSupportData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/v1/support/admin/tickets', {
        params: { search, status: statusFilter, priority: priorityFilter }
      });
      if (res.data?.success) {
        const ticketList = res.data.data.tickets || [];
        setTickets(ticketList);
        setMetrics(res.data.data.metrics);
        if (ticketList.length > 0 && (!selectedTicket || !ticketList.find((t: any) => t._id === selectedTicket._id))) {
          setSelectedTicket(ticketList[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching support queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSupportData();
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMsg.trim()) return;

    try {
      const res = await apiClient.post(`/v1/support/tickets/${selectedTicket._id}/reply`, {
        message: replyMsg,
        is_internal_note: isInternal,
        status: statusUpdate
      });

      if (res.data?.success) {
        setSelectedTicket(res.data.data);
        setReplyMsg('');
        fetchSupportData();
      }
    } catch (err) {
      alert('Failed to submit reply');
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket) return;
    try {
      const res = await apiClient.post(`/v1/support/tickets/${selectedTicket._id}/reply`, {
        message: 'Ticket marked as resolved by Administrator.',
        is_internal_note: false,
        status: 'RESOLVED'
      });

      if (res.data?.success) {
        setSelectedTicket(res.data.data);
        fetchSupportData();
      }
    } catch (err) {
      alert('Failed to resolve ticket');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 text-slate-900 dark:text-slate-100">
      {/* Standard Page Header */}
      <PageHeader
        title="Customer Support"
        description="Manage organization support requests and customer communication."
        actions={
          <button
            onClick={fetchSupportData}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
          </button>
        }
      />

      {/* Primary Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-red-600"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </form>

        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="px-3 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl">
            Open: {metrics?.open || 0}
          </span>
          <span className="px-3 py-1.5 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-xl">
            In Progress: {metrics?.in_progress || 0}
          </span>
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl">
            Resolved: {metrics?.resolved || 0}
          </span>
        </div>
      </div>

      {/* Two-Column Support Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Ticket List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col space-y-3">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
            Ticket Queue ({tickets.length})
          </h3>
          <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-6 text-center text-slate-400 text-xs">Loading queue...</div>
            ) : tickets.length === 0 ? (
              <EmptyState title="No Support Tickets" message="No support tickets match the current search filters." />
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicket?._id === t._id;
                return (
                  <div
                    key={t._id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-red-50/70 border-red-300 dark:bg-red-950/30 dark:border-red-800 text-slate-900 dark:text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[11px] font-bold text-red-600 dark:text-red-400">{t.ticket_number}</span>
                      <CrmBadge label={t.status || 'OPEN'} />
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white truncate">{t.subject}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
                      <span>{t.user_name || t.user_email || 'Customer'}</span>
                      <span>{new Date(t.updated_at || t.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: Selected Ticket Details & Conversation */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[560px]">
          {selectedTicket ? (
            <div className="flex flex-col h-full space-y-5 text-xs">
              {/* Header Details */}
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">{selectedTicket.ticket_number}</span>
                    <CrmBadge label={selectedTicket.priority || 'NORMAL'} />
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">{selectedTicket.subject}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Organization / User: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedTicket.user_name || selectedTicket.user_email}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CrmBadge label={selectedTicket.status || 'OPEN'} />
                  <button
                    onClick={handleResolveTicket}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Resolve Ticket
                  </button>
                </div>
              </div>

              {/* Conversation History */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 max-h-[340px]">
                {/* Customer Message */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Customer Message</span>
                    <span>{new Date(selectedTicket.created_at).toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
                </div>

                {/* Replies Thread */}
                {selectedTicket.replies?.map((r: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border space-y-2 ${
                      r.is_internal_note
                        ? 'bg-amber-50/80 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200'
                        : r.sender_role === 'admin'
                        ? 'bg-blue-50/80 border-blue-200 text-blue-900 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-200'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold opacity-80">
                      <span>
                        {r.is_internal_note ? '🔒 Internal Admin Note' : r.sender_name || r.sender_role}
                      </span>
                      <span>{new Date(r.created_at).toLocaleString('en-IN')}</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{r.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply Composer Form */}
              <form onSubmit={handleSendReply} className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                    />
                    <span>Internal Admin Note Only</span>
                  </label>

                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>Update Status:</span>
                    <select
                      value={statusUpdate}
                      onChange={(e) => setStatusUpdate(e.target.value)}
                      className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs outline-none"
                    >
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    required
                    placeholder={isInternal ? "Write internal team note..." : "Write a reply..."}
                    value={replyMsg}
                    onChange={(e) => setReplyMsg(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-red-600"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <Send className="w-3.5 h-3.5" /> Send Reply
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <EmptyState title="No Ticket Selected" message="Select a ticket from the queue to view thread details." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
