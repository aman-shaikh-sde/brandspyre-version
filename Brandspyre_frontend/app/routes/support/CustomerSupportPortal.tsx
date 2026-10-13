import React, { useEffect, useState } from 'react';
import apiClient from "src/services/apiClient";
import PageHeader from 'src/component/ui/PageHeader';
import CrmBadge from 'src/component/ui/CrmBadge';
import FormModal from 'src/component/ui/FormModal';
import { Headphones, Plus, Send, RefreshCw, MessageSquare } from 'lucide-react';

export default function CustomerSupportPortal() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('TECHNICAL');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [replyMsg, setReplyMsg] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/v1/support/tickets');
      if (res.data?.success) {
        const ticketList = res.data.data.tickets || [];
        setTickets(ticketList);
        if (ticketList.length > 0 && (!selectedTicket || !ticketList.find((t: any) => t._id === selectedTicket._id))) {
          setSelectedTicket(ticketList[0]);
        }
      }
    } catch (err) {
      console.error('Error loading tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await apiClient.post('/v1/support/tickets', {
        subject,
        category,
        priority,
        description
      });
      setModalOpen(false);
      setSubject('');
      setDescription('');
      fetchTickets();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to submit support ticket.';
      alert(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomerReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMsg.trim()) return;

    try {
      const res = await apiClient.post(`/v1/support/tickets/${selectedTicket._id}/reply`, {
        message: replyMsg
      });
      if (res.data?.success) {
        setSelectedTicket(res.data.data);
        setReplyMsg('');
        fetchTickets();
      }
    } catch (err) {
      alert('Failed to send reply');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 text-slate-900 dark:text-slate-100">
      {/* Standard Page Header */}
      <PageHeader
        title="Customer Support & Help Desk"
        description="Submit tickets, track response status, and communicate directly with platform administrators."
        actions={
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Submit Support Ticket
          </button>
        }
      />

      {/* Main Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Ticket List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
            Your Support Queries ({tickets.length})
          </h3>
          <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-6 text-center text-slate-400 text-xs">Loading support tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">No support queries submitted yet.</div>
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
                      <span>Category: {t.category || 'General'}</span>
                      <span>{new Date(t.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Ticket Conversation Thread */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[560px]">
          {selectedTicket ? (
            <div className="flex flex-col h-full space-y-5 text-xs">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">{selectedTicket.ticket_number}</span>
                    <CrmBadge label={selectedTicket.priority || 'NORMAL'} />
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">{selectedTicket.subject}</h2>
                </div>
                <CrmBadge label={selectedTicket.status || 'OPEN'} />
              </div>

              <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 max-h-[360px]">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Submitted on {new Date(selectedTicket.created_at).toLocaleString('en-IN')}
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
                </div>

                {selectedTicket.replies?.filter((r: any) => !r.is_internal_note).map((r: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border space-y-2 ${
                      r.sender_role === 'admin'
                        ? 'bg-blue-50/80 border-blue-200 text-blue-900 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-200 mr-6'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 ml-6'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold opacity-80">
                      <span>{r.sender_role === 'admin' ? 'Support Administrator' : r.sender_name || 'You'}</span>
                      <span>{new Date(r.created_at).toLocaleString('en-IN')}</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{r.message}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleCustomerReply} className="border-t border-slate-200 dark:border-slate-800 pt-4 flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Type a message to support team..."
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
              </form>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-xs">
              Select a support ticket from the left list to view thread details
            </div>
          )}
        </div>
      </div>

      {/* Standardized FormModal for New Support Ticket */}
      <FormModal
        isVisible={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Submit New Support Ticket"
        subtitle="Provide details of your query or custom requirement."
        onSubmit={handleCreateTicket}
        submitLabel="Submit Ticket"
        isSubmitting={submitting}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
            <input
              type="text"
              required
              placeholder="Brief summary of your inquiry"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-red-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none"
              >
                <option value="TECHNICAL">Technical Assistance</option>
                <option value="BILLING">Billing & Subscription</option>
                <option value="MODULE_REQUEST">Module Add-on Request</option>
                <option value="ONBOARDING">Onboarding Assistance</option>
                <option value="BUG">Report a Bug</option>
                <option value="OTHER">Other Query</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Detailed Description</label>
            <textarea
              required
              rows={4}
              placeholder="Describe your question or issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-red-600"
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
