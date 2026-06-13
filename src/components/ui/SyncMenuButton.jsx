import React from "react";
import { RefreshCw } from "lucide-react";

export function SyncMenuButton({
  onSyncAll,
  isLoading = false,
  lastSyncAt = null,
}) {
  const formatSyncClock = (val) => {
    if (!val) return "--:--";
    try {
      return new Date(val).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "--:--";
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 min-w-[36px] text-right">
        {formatSyncClock(lastSyncAt)}
      </span>
      <button
        type="button"
        onClick={onSyncAll}
        disabled={isLoading}
        title="Sinkronkan seluruh data"
        aria-label="Sinkronkan seluruh data"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-sm shadow-slate-200/40 transition-all hover:-translate-y-0.5 hover:border-sky-500/40 hover:bg-sky-50 hover:text-sky-600 hover:shadow-sky-500/10 dark:bg-slate-800/60 dark:border-slate-700/50 dark:text-slate-300 dark:shadow-black/10 dark:hover:bg-slate-800 dark:hover:text-sky-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
      >
        <RefreshCw
          className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-sky-500 dark:text-sky-400" : ""}`}
        />
      </button>
    </div>
  );
}
