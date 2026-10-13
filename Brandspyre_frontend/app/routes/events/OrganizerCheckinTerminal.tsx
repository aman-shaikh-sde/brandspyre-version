import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Scan,
  Keyboard,
  ArrowLeft,
  Volume2,
  VolumeX,
  History,
  Users,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import PageHeader from "src/component/ui/PageHeader";
import eventService from "~/services/eventService";

interface ScanRecord {
  id: string;
  status: "SUCCESS" | "DUPLICATE" | "INVALID";
  attendeeName?: string;
  ticketTier?: string;
  ticketNumber?: string;
  timestamp: string;
  message: string;
}

export default function OrganizerCheckinTerminal() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [ticketInput, setTicketInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Scan feedback
  const [lastScanResult, setLastScanResult] = useState<ScanRecord | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEvents();
    // Auto-focus input for barcode scanners
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await eventService.getOrganizerEvents({ limit: 50, status: "PUBLISHED" });
      if (res.success) {
        setEvents(res.data.events || []);
        if (res.data.events?.length > 0) {
          setSelectedEventId(res.data.events[0]._id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  };

  const playBeep = (type: "success" | "error") => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "success") {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch A5
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15); // E6
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else {
        osc.frequency.setValueAtTime(300, ctx.currentTime); // Low pitch error buzz
        osc.frequency.setValueAtTime(200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      // AudioContext may be restricted by browser policy
    }
  };

  const handleProcessCheckin = async (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    setLoading(true);
    try {
      // Determine if code is a 48-char hex QR token or a ticket number (TKT-XXXX)
      const isQr = cleanCode.length >= 32;
      const payload: any = {
        device_info: "Web Browser Terminal"
      };

      if (isQr) {
        payload.qr_token = cleanCode;
      } else {
        payload.ticket_number = cleanCode;
      }

      if (selectedEventId) {
        payload.event_id = selectedEventId;
      }

      const res = await eventService.checkinAttendee(payload);

      if (res.success) {
        const ticket = res.data?.ticket;
        const record: ScanRecord = {
          id: Math.random().toString(),
          status: "SUCCESS",
          attendeeName: ticket?.attendee_name || "Guest Attendee",
          ticketTier: ticket?.ticket_type_id?.name || "General Pass",
          ticketNumber: ticket?.ticket_number || cleanCode,
          timestamp: new Date().toLocaleTimeString(),
          message: "Check-in Confirmed. Welcome!"
        };
        setLastScanResult(record);
        setScanHistory((prev) => [record, ...prev.slice(0, 19)]);
        playBeep("success");
      }
    } catch (err: any) {
      playBeep("error");
      const errMsg = err?.response?.data?.message || "Invalid ticket code.";
      const isDuplicate = errMsg.toLowerCase().includes("already checked in");

      const record: ScanRecord = {
        id: Math.random().toString(),
        status: isDuplicate ? "DUPLICATE" : "INVALID",
        ticketNumber: cleanCode,
        timestamp: new Date().toLocaleTimeString(),
        message: errMsg
      };
      setLastScanResult(record);
      setScanHistory((prev) => [record, ...prev.slice(0, 19)]);
    } finally {
      setLoading(false);
      setTicketInput("");
      // Keep input focused for consecutive scans
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleProcessCheckin(ticketInput);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/event-management/events"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-600"
            title={soundEnabled ? "Mute audio beep" : "Unmute audio beep"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-green-600" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
          </button>
          <Link
            to="/event-management/attendees"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
          >
            <Users className="w-3.5 h-3.5" /> Full Roster
          </Link>
        </div>
      </div>

      {/* Terminal Main Unit */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-800 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-600/20 rounded-2xl border border-primary-500/30 text-primary-400">
              <Scan className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-2xs font-bold uppercase tracking-widest text-primary-400">Terminal v2.4</span>
              <h2 className="text-xl font-black tracking-tight">On-Ground QR & Pass Verification</h2>
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 w-full focus:outline-none focus:border-primary-500"
            >
              <option value="">Any Active Event</option>
              {events.map((ev) => (
                <option key={ev._id} value={ev._id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Big Input Box for Scanners & Manual Entry */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-2xs font-bold uppercase tracking-widest text-slate-400">
            Scan QR Code with Hardware Gun or Enter Ticket #
          </label>
          <div className="relative">
            <Keyboard className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              type="text"
              autoFocus
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              placeholder="e.g. TKT-B9F2A10 or scan QR token..."
              disabled={loading}
              className="w-full bg-slate-950 border-2 border-slate-700 focus:border-primary-500 rounded-2xl pl-12 pr-32 py-4 text-base md:text-lg font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-primary-500/20 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !ticketInput.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold shadow-lg disabled:opacity-40 transition-colors"
            >
              {loading ? "Checking..." : "VERIFY"}
            </button>
          </div>
        </form>

        {/* Big Dynamic Feedback Banner */}
        {lastScanResult ? (
          <div
            className={`p-6 rounded-2xl border transition-all animate-fadeIn ${
              lastScanResult.status === "SUCCESS"
                ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-200"
                : lastScanResult.status === "DUPLICATE"
                ? "bg-amber-950/70 border-amber-500/50 text-amber-200"
                : "bg-rose-950/70 border-rose-500/50 text-rose-200"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-black/20">
                {lastScanResult.status === "SUCCESS" ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                ) : lastScanResult.status === "DUPLICATE" ? (
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                ) : (
                  <XCircle className="w-8 h-8 text-rose-400" />
                )}
              </div>
              <div className="flex-1">
                <span className="text-2xs font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/30">
                  {lastScanResult.status === "SUCCESS"
                    ? "ENTRY APPROVED"
                    : lastScanResult.status === "DUPLICATE"
                    ? "DUPLICATE SCAN ATTEMPT"
                    : "ACCESS DENIED"}
                </span>

                {lastScanResult.status === "SUCCESS" ? (
                  <div className="mt-2">
                    <h3 className="text-2xl font-black text-white">{lastScanResult.attendeeName}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-emerald-300">
                      <span className="font-semibold">{lastScanResult.ticketTier}</span>
                      <span>•</span>
                      <span className="font-mono text-xs">{lastScanResult.ticketNumber}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2">
                    <h3 className="text-lg font-bold text-white">{lastScanResult.message}</h3>
                    <p className="text-xs mt-1 opacity-80 font-mono">Code: {lastScanResult.ticketNumber}</p>
                  </div>
                )}
                <div className="text-2xs opacity-60 mt-3">Verified at {lastScanResult.timestamp}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs">
            <QrCode className="w-10 h-10 mx-auto mb-2 opacity-30" />
            Ready for input. Scan attendee QR badge or type ticket code above.
          </div>
        )}
      </div>

      {/* Recent Scans Stream */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
            <History className="w-4 h-4 text-gray-500" />
            <h3>Terminal Scan Log (Last 20)</h3>
          </div>
          <span className="text-xs text-gray-400">{scanHistory.length} recorded</span>
        </div>

        {scanHistory.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">No scans recorded in this session yet.</p>
        ) : (
          <div className="divide-y divide-gray-100 overflow-hidden">
            {scanHistory.map((scan) => (
              <div key={scan.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  {scan.status === "SUCCESS" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : scan.status === "DUPLICATE" ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500" />
                  )}
                  <div>
                    <span className="font-semibold text-gray-800">
                      {scan.attendeeName || scan.ticketNumber || "Ticket Scan"}
                    </span>
                    {scan.ticketTier && <span className="ml-2 text-2xs text-gray-500 font-medium">({scan.ticketTier})</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-2xs font-semibold px-2 py-0.5 rounded-full ${
                      scan.status === "SUCCESS"
                        ? "bg-emerald-50 text-emerald-700"
                        : scan.status === "DUPLICATE"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {scan.status}
                  </span>
                  <span className="text-2xs text-gray-400">{scan.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
