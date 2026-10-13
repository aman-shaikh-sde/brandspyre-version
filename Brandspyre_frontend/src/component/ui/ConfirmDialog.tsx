import React from "react";
import { Modal } from "../Modal";
import { Button } from "./Button";
import { AlertTriangle, Info, Trash2, CheckCircle2 } from "lucide-react";

export interface ConfirmDialogProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "success";
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isVisible,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}) => {
  const iconMap = {
    danger: <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />,
    warning: <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
    info: <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
    success: <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
  };

  const iconBgMap = {
    danger: "bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40",
    warning: "bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40",
    info: "bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40",
    success: "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40",
  };

  const footer = (
    <div className="flex items-center justify-end gap-2.5 w-full">
      <Button variant="secondary" onClick={onClose} disabled={isLoading}>
        {cancelText}
      </Button>
      <Button
        variant={variant === "danger" ? "danger" : "primary"}
        onClick={onConfirm}
        isLoading={isLoading}
      >
        {confirmText}
      </Button>
    </div>
  );

  return (
    <Modal isVisible={isVisible} onClose={onClose} maxWidth="sm" footer={footer}>
      <div className="flex flex-col items-center text-center p-2">
        <div className={`p-3.5 rounded-full mb-3.5 ${iconBgMap[variant]}`}>{iconMap[variant]}</div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs">{description}</p>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
