import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, AlertCircle, Ticket, Calendar, MapPin } from "lucide-react";
import eventService from "~/services/eventService";

export default function PublicTicketVerify() {
  const { qrToken } = useParams();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (qrToken) {
      verify();
    }
  }, [qrToken]);

  const verify = async () => {
    try {
      setLoading(true);
      const res = await eventService.verifyTicketQr(qrToken!);
      if (res.success && res.data) {
        setTicket(res.data);
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 max-w-md w-full p-8 rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-lg text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded-full mx-auto flex items-center justify-center">
            <XCircle size={36} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Invalid Ticket QR</h2>
          <p className="text-xs text-slate-500">This QR code does not correspond to any valid issued ticket.</p>
        </div>
      </div>
    );
  }

  const isValid = ticket.status === "VALID";
  const isCheckedIn = ticket.is_checked_in;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 max-w-md w-full p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 text-center">
        <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${
          isValid && !isCheckedIn
            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600"
            : isCheckedIn
            ? "bg-amber-100 dark:bg-amber-950/60 text-amber-600"
            : "bg-rose-100 dark:bg-rose-950/60 text-rose-600"
        }`}>
          {isValid && !isCheckedIn ? (
            <CheckCircle2 size={44} />
          ) : isCheckedIn ? (
            <AlertCircle size={44} />
          ) : (
            <XCircle size={44} />
          )}
        </div>

        <div className="space-y-1">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            isValid && !isCheckedIn
              ? "bg-emerald-500/10 text-emerald-600"
              : isCheckedIn
              ? "bg-amber-500/10 text-amber-600"
              : "bg-rose-500/10 text-rose-600"
          }`}>
            {isCheckedIn ? "ALREADY CHECKED IN" : ticket.status}
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white pt-2">
            {ticket.attendee_name}
          </h2>
          <p className="text-xs text-slate-500 font-mono">
            {ticket.ticket_number}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-left space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Event:</span>
            <strong className="text-slate-900 dark:text-white truncate max-w-[200px]">{ticket.event_id?.title}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Category:</span>
            <strong className="text-slate-900 dark:text-white">{ticket.ticket_type_id?.name || "General"}</strong>
          </div>
          {isCheckedIn && (
            <div className="flex justify-between">
              <span className="text-slate-400">Checked in at:</span>
              <strong className="text-amber-600">{new Date(ticket.checked_in_at).toLocaleTimeString()}</strong>
            </div>
          )}
        </div>

        <Link
          to="/explore-events"
          className="inline-block text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
        >
          Brandspyre Events Network
        </Link>
      </div>
    </div>
  );
}
