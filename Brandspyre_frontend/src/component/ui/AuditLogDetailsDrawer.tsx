import React, { useState } from 'react';
import { X, ShieldCheck, Copy, Check, Terminal, Clock, User, Building2, Server } from 'lucide-react';
import {
  getAuditTitle,
  getAuditDescription,
  getAuditCategory,
  getAuditActor,
  getAuditEntity,
  getAuditTimestamp,
  getAuditMethodAndRoute
} from 'src/utils/auditPresentation';

interface AuditLogDetailsDrawerProps {
  log: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function AuditLogDetailsDrawer({ log, isOpen, onClose }: AuditLogDetailsDrawerProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !log) return null;

  const title = getAuditTitle(log);
  const description = getAuditDescription(log);
  const category = getAuditCategory(log);
  const actor = getAuditActor(log);
  const entity = getAuditEntity(log);
  const timestamp = getAuditTimestamp(log);
  const apiRoute = getAuditMethodAndRoute(log);

  const handleCopyId = () => {
    if (entity.entityId) {
      navigator.clipboard.writeText(entity.entityId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs transition-opacity flex justify-end">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Audit Event Details</h3>
              <span className={`inline-block px-2 py-0.5 mt-0.5 rounded-md text-[10px] font-bold border ${category.badgeClass}`}>
                {category.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {/* Main Card Summary */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="font-bold text-sm text-slate-900 dark:text-white">{title}</div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{description}</p>
          </div>

          {/* Structured Detail Grid */}
          <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800/60">
            {/* Activity */}
            <div className="pt-3 flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Activity
              </span>
              <span className="font-bold text-slate-900 dark:text-white">{title}</span>
            </div>

            {/* Target Organization */}
            <div className="pt-3 flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> Organization
              </span>
              <span className="font-bold text-slate-900 dark:text-white">{entity.displayName}</span>
            </div>

            {/* Performed By */}
            <div className="pt-3 flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Performed By
              </span>
              <div className="text-right">
                <div className="font-bold text-slate-900 dark:text-white">{actor.name}</div>
                <div className="text-[11px] text-slate-500">{actor.email}</div>
              </div>
            </div>

            {/* Role */}
            <div className="pt-3 flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">Role</span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                {actor.role}
              </span>
            </div>

            {/* Timestamp */}
            <div className="pt-3 flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Timestamp
              </span>
              <span className="font-bold text-slate-900 dark:text-white">{timestamp.fullString}</span>
            </div>

            {/* Entity Type & ID */}
            <div className="pt-3 flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">Entity ID</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                  {entity.truncatedId}
                </span>
                <button
                  onClick={handleCopyId}
                  title="Copy full Entity ID"
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* IP Address */}
            <div className="pt-3 flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-400" /> IP Address
              </span>
              <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">{log.ip || '127.0.0.1'}</span>
            </div>

            {/* Result */}
            <div className="pt-3 flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">Result</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                Successful
              </span>
            </div>
          </div>

          {/* Technical Section (API Details) */}
          <div className="pt-3 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" /> Technical API Endpoint
            </span>
            <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-bold text-[10px]">
                  {apiRoute.method}
                </span>
                <span className="text-slate-300 truncate">{apiRoute.path}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
