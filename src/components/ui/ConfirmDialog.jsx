import React from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { Button } from "./Button";
import { Card, CardBody } from "./Card";

export function ConfirmDialog({
  title,
  message,
  confirmText = "Ya",
  cancelText = "Batal",
  onConfirm,
  onCancel,
  severity = "warning" // warning, danger, info
}) {
  const iconMap = {
    warning: <HelpCircle className="h-6 w-6 text-amber-400" />,
    danger: <AlertTriangle className="h-6 w-6 text-rose-500" />,
    info: <HelpCircle className="h-6 w-6 text-sky-400" />
  };

  const buttonVariants = {
    warning: "accent",
    danger: "danger",
    info: "primary"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop blur overlay */}
      <div 
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity" 
        onClick={onCancel}
      />
      
      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-sm transform overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950/90 shadow-2xl transition-all p-0.5 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-950 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white dark:bg-slate-950 p-5 rounded-[14px]">
          <div className="flex items-start gap-4">
            {/* Severity Icon */}
            <div className="flex-shrink-0 p-2.5 rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
              {iconMap[severity]}
            </div>
            
            {/* Content Text */}
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                {title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed whitespace-pre-wrap">
                {message}
              </p>
            </div>
          </div>
          
          {/* Action Buttons Grid */}
          <div className="flex gap-3 mt-6 justify-end">
            <Button 
              variant="secondary" 
              onClick={onCancel}
              size="sm"
              className="px-4 py-2 text-xs"
            >
              {cancelText}
            </Button>
            
            <Button 
              variant={buttonVariants[severity]} 
              onClick={onConfirm}
              size="sm"
              className="px-5 py-2 text-xs font-semibold"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
