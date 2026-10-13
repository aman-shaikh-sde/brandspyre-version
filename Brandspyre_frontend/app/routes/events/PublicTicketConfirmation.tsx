import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, Ticket, Calendar, MapPin, Download, Printer, ArrowRight, Sparkles, Mail, RefreshCw } from "lucide-react";
import eventService from "~/services/eventService";

export default function PublicTicketConfirmation() {
  const { orderId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await eventService.getOrderDetails(orderId!);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Failed to load order confirmation:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResendEmail = async () => {
    if (!orderId || resending) return;
    try {
      setResending(true);
      setResendStatus(null);
      const res = await eventService.resendOrderConfirmation(orderId);
      if (res.success) {
        setResendStatus({ success: true, message: res.message || "Confirmation email with QR codes resent!" });
      } else {
        setResendStatus({ success: false, message: res.message || "Failed to resend email." });
      }
    } catch (err: any) {
      setResendStatus({
        success: false,
        message: err.response?.data?.message || "Failed to resend confirmation email."
      });
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!data?.order) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-24 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Booking Not Found</h2>
        <Link to="/explore-events" className="mt-4 inline-block px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors">
          Browse Events
        </Link>
      </div>
    );
  }

  const { order, tickets = [] } = data;
  const event = order.event || {};

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Success Header Card */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full mx-auto flex items-center justify-center shadow-inner">
            <CheckCircle2 size={36} />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Registration Confirmed
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              You're Going to {event.title || "the Event"}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Confirmation receipt and tickets have been sent to <strong>{order.customer_email}</strong>.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>Order #{order.order_number}</span>
            <span>•</span>
            <span>Paid: {order.total_payable === 0 ? "Free" : `₹${order.total_payable?.toLocaleString("en-IN")}`}</span>
          </div>

          {resendStatus && (
            <div className={`p-3 rounded-xl text-xs font-semibold max-w-md mx-auto transition-all ${
              resendStatus.success
                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
            }`}>
              {resendStatus.message}
            </div>
          )}

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <Printer size={14} /> Print Tickets
            </button>
            <button
              onClick={handleResendEmail}
              disabled={resending}
              className="px-4 py-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60"
            >
              {resending ? <RefreshCw size={14} className="animate-spin" /> : <Mail size={14} />}
              {resending ? "Sending..." : "Resend Email with QR"}
            </button>
            <Link
              to="/explore-events"
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-colors"
            >
              Explore More Events <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Tickets Showcase */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Ticket size={20} className="text-red-600" /> Your Admission Tickets ({tickets.length})
          </h3>

          <div className="space-y-4">
            {tickets.map((t: any, idx: number) => {
              // Simulated QR code matrix generator for guaranteed visual rendering
              const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                `${window.location.origin}/tickets/verify/${t.qr_token}`
              )}`;

              return (
                <div
                  key={t.ticket_number || idx}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col md:flex-row justify-between"
                >
                  <div className="p-6 space-y-4 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60">
                        {t.ticket_type_id?.name || "Standard Pass"}
                      </span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={13} /> {t.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                        {event.title}
                      </h4>
                      <p className="text-xs font-semibold text-slate-500 mt-1">
                        Attendee: <strong className="text-slate-900 dark:text-white">{t.attendee_name}</strong>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="text-[10px] uppercase text-slate-400">Date</p>
                        <p className="font-semibold text-slate-700 dark:text-slate-300">
                          {event.start_date ? new Date(event.start_date).toLocaleDateString("en-IN") : "TBA"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-slate-400">Ticket Code</p>
                        <p className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {t.ticket_number}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Segment */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 text-center min-w-[200px]">
                    <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                      <img
                        src={qrImageUrl}
                        alt="Admission QR Code"
                        className="w-32 h-32 object-contain"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium mt-2">Scan at Venue Gate</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <a
                        href={qrImageUrl}
                        download={`ticket-${t.ticket_number}.png`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 font-semibold transition-colors"
                      >
                        <Download size={11} /> Download
                      </a>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <Link
                        to={`/tickets/verify/${t.qr_token}`}
                        target="_blank"
                        className="text-[10px] text-red-600 hover:text-red-700 hover:underline font-semibold"
                      >
                        Verify Pass
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
