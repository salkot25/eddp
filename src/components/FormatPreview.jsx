import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { Card, CardBody } from "./ui/Card";
import { SyncMenuButton } from "./ui/SyncMenuButton";
import {
  generateWhatsAppText,
  formatIndonesianDate,
  getHMinus1DateStr,
} from "../utils/formatter";
import { KPI_METADATA } from "../utils/constants";
import {
  Copy,
  Check,
  Send,
  MessageSquare,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Edit3,
  RotateCcw,
  ExternalLink,
  Circle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function FormatPreview() {
  const {
    activeUlp,
    activeDate,
    setActiveDate,
    targets,
    getActiveDraft,
    confirm,
    refreshSpreadsheetData,
    isLoading,
    syncAuditLog,
  } = useApp();
  const draft = getActiveDraft();

  const [formattedText, setFormattedText] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [isVerifMinimized, setIsVerifMinimized] = useState(false);

  // Ambil waktu lokal saat ini
  useEffect(() => {
    const now = new Date();
    setCurrentTime(
      now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    );
  }, []);

  const draftSerialized = JSON.stringify(draft);

  // Hitung kelengkapan pengisian data (verifikasi laporan)
  const completeness = useMemo(() => {
    const items = KPI_METADATA.map((kpi, idx) => {
      const realisasiVal = draft[`${kpi.key}_realisasi`];
      const isFilled = realisasiVal !== undefined && realisasiVal !== "";
      return {
        index: idx + 1,
        key: kpi.key,
        label: kpi.label,
        unit: kpi.unit,
        isFilled,
      };
    });

    const total = items.length;
    const filledCount = items.filter((i) => i.isFilled).length;
    const missingItems = items.filter((i) => !i.isFilled);
    const percentage = Math.round((filledCount / total) * 100);

    return {
      isComplete: missingItems.length === 0,
      filledCount,
      total,
      percentage,
      missingCount: missingItems.length,
      missingItems,
      items,
    };
  }, [draftSerialized]);

  // Auto-minimize ketika kelengkapan terisi penuh (100% / isComplete)
  useEffect(() => {
    setIsVerifMinimized(completeness.isComplete);
  }, [completeness.isComplete]);

  // Re-generate teks WhatsApp
  useEffect(() => {
    const kpisData = {};

    const findTargetsForUlp = (ulpName, targetsMap) => {
      if (!ulpName || !targetsMap) return {};
      if (targetsMap[ulpName]) return targetsMap[ulpName];
      const normalizedUlp = ulpName.toLowerCase().trim();
      const matchKey = Object.keys(targetsMap).find(
        (key) => key.toLowerCase().trim() === normalizedUlp,
      );
      if (matchKey) return targetsMap[matchKey];
      const cleanUlp = normalizedUlp.replace("ulp ", "").trim();
      const matchKeyClean = Object.keys(targetsMap).find(
        (key) => key.toLowerCase().replace("ulp ", "").trim() === cleanUlp,
      );
      if (matchKeyClean) return targetsMap[matchKeyClean];
      return {};
    };

    const currentTargets = findTargetsForUlp(activeUlp, targets);

    KPI_METADATA.forEach((kpi) => {
      const targetVal =
        draft[`${kpi.key}_target`] !== undefined &&
        draft[`${kpi.key}_target`] !== ""
          ? draft[`${kpi.key}_target`]
          : (currentTargets[kpi.key] ?? 0);

      const realisasiVal =
        draft[`${kpi.key}_realisasi`] !== undefined
          ? draft[`${kpi.key}_realisasi`]
          : "";

      kpisData[kpi.key] = {
        target: targetVal,
        realisasi: realisasiVal,
      };
    });

    const text = generateWhatsAppText(activeUlp, activeDate, kpisData);
    setFormattedText(text);
    if (!isEditing) {
      setEditedText(text);
    }
  }, [draftSerialized, activeUlp, activeDate, targets, isEditing]);

  // Salin ke clipboard
  const handleCopy = async () => {
    const textToCopy = isEditing ? editedText : formattedText;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error("Gagal menyalin teks:", err);
    }
  };

  // Kirim via WhatsApp
  const handleWhatsAppShare = () => {
    const textToShare = isEditing ? editedText : formattedText;
    const encodedText = encodeURIComponent(textToShare);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, "_blank");
  };

  // Reset perubahan edit manual
  const handleResetEdit = async () => {
    const isConfirmed = await confirm({
      title: "Batalkan Edit Manual",
      message:
        "Apakah Anda yakin ingin membatalkan semua perubahan teks manual dan mengembalikan teks laporan otomatis?",
      confirmText: "Ya, Kembalikan",
      cancelText: "Batal",
      severity: "warning",
    });

    if (isConfirmed) {
      setEditedText(formattedText);
      setIsEditing(false);
    }
  };

  // Progress bar width
  const progressWidth = `${completeness.percentage}%`;
  const progressColor = completeness.isComplete
    ? "bg-emerald-500"
    : completeness.percentage >= 50
      ? "bg-amber-500"
      : "bg-rose-500";

  return (
    <div className="flex flex-col gap-6">
      {/* ═══════════════════════════════════════════════════
           SECTION 01 · DATE CONTROLS
      ═══════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 shadow-sm shadow-slate-200/40 dark:bg-slate-800/60 dark:border-slate-700/50 dark:shadow-black/10 shrink-0">
          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <input
            type="date"
            value={activeDate}
            onChange={(e) => setActiveDate(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer tracking-tight"
          />
        </div>
        <SyncMenuButton
          isLoading={isLoading}
          onSyncAll={() => refreshSpreadsheetData("form")}
          lastSyncAt={syncAuditLog?.form?.at}
        />
      </div>

      {/* ═══════════════════════════════════════════════════
           SECTION 02 · VERIFICATION STATUS
      ═══════════════════════════════════════════════════ */}
      <div
        className="rounded-2xl border overflow-hidden shadow-sm bg-white dark:bg-slate-900/50 transition-all duration-300"
        style={{
          borderColor: completeness.isComplete
            ? "rgba(16,185,129,0.2)"
            : completeness.percentage >= 50
              ? "rgba(245,158,11,0.2)"
              : "rgba(239,68,68,0.2)",
        }}
      >
        {/* Header */}
        <div
          onClick={() => setIsVerifMinimized((prev) => !prev)}
          className={`px-4 py-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/20 select-none transition-colors ${
            isVerifMinimized
              ? ""
              : "border-b border-slate-100 dark:border-slate-800/60"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {completeness.isComplete ? (
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-lg bg-amber-550/10 flex items-center justify-center">
                <AlertCircle size={16} className="text-amber-500" />
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                {completeness.isComplete
                  ? "Laporan Lengkap"
                  : "Laporan Belum Lengkap"}
              </p>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                {completeness.filledCount}/{completeness.total} indikator terisi
              </p>
            </div>
          </div>

          {/* Percentage Badge & Chevron */}
          <div className="flex items-center gap-2">
            <div
              className={`text-xs font-black px-2.5 py-1 rounded-lg tracking-tight ${
                completeness.isComplete
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : completeness.percentage >= 50
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              }`}
            >
              {completeness.percentage}%
            </div>
            {isVerifMinimized ? (
              <ChevronDown
                size={16}
                className="text-slate-400 dark:text-slate-500"
              />
            ) : (
              <ChevronUp
                size={16}
                className="text-slate-400 dark:text-slate-500"
              />
            )}
          </div>
        </div>

        {/* Expandable content */}
        {!isVerifMinimized && (
          <>
            {/* Progress Bar */}
            <div className="w-full h-1 bg-slate-50 dark:bg-slate-800/40">
              <div
                className={`h-full transition-all duration-500 ease-out ${progressColor}`}
                style={{ width: progressWidth }}
              />
            </div>

            {/* KPI Checklist — itemized rows */}
            <div className="px-4 py-2.5 flex flex-col gap-0.5">
              {completeness.items.map((item) => (
                <div
                  key={item.key}
                  className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors ${
                    item.isFilled
                      ? "opacity-60"
                      : "bg-amber-50/60 dark:bg-amber-500/5"
                  }`}
                >
                  {/* Status Icon */}
                  {item.isFilled ? (
                    <CheckCircle2
                      size={14}
                      className="text-emerald-500 shrink-0"
                    />
                  ) : (
                    <Circle
                      size={14}
                      className="text-amber-400 dark:text-amber-500 shrink-0"
                    />
                  )}

                  {/* Index */}
                  <span
                    className={`text-[10px] font-bold w-4 text-center shrink-0 ${
                      item.isFilled
                        ? "text-slate-400 dark:text-slate-500"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {item.index}
                  </span>

                  {/* Label */}
                  <span
                    className={`text-[11px] font-medium flex-1 min-w-0 truncate ${
                      item.isFilled
                        ? "text-slate-500 dark:text-slate-400 line-through decoration-slate-300 dark:decoration-slate-600"
                        : "text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {item.label}
                  </span>

                  {/* Unit Badge */}
                  <span
                    className={`text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                      item.isFilled
                        ? "bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500"
                        : "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {item.unit}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer summary for incomplete */}
            {!completeness.isComplete && (
              <div className="px-4 pb-3 pt-1">
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 leading-relaxed">
                  Isi data realisasi indikator di atas melalui tab{" "}
                  <span className="font-bold text-slate-500 dark:text-slate-400">
                    Isi Laporan
                  </span>{" "}
                  untuk melengkapi.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════
           SECTION 03 · WHATSAPP PREVIEW BUBBLE
      ═══════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-3">
        {/* Section Label + Edit Toggle */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">
              Pratinjau Pesan
            </span>
          </div>

          {/* Edit/Done Toggle */}
          {isEditing ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleResetEdit}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-2 py-1 rounded-md cursor-pointer transition-colors"
              >
                <RotateCcw size={10} />
                Reset
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 px-2 py-1 rounded-md cursor-pointer transition-colors"
              >
                <Check size={10} />
                Selesai
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-600 hover:text-sky-500 dark:text-sky-400 px-2 py-1 rounded-md cursor-pointer transition-colors"
            >
              <Edit3 size={10} />
              Edit Manual
            </button>
          )}
        </div>

        {/* WhatsApp Chat Container */}
        <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800/60 shadow-lg">
          {/* WA Header Bar */}
          <div className="bg-[#075E54] dark:bg-[#1F2C34] px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0 border border-white/10">
              <span className="text-[11px] font-black text-white uppercase tracking-tight">
                {activeUlp.substring(4, 7)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[13px] font-bold truncate leading-tight">
                Laporan WhatsApp
              </p>
              <p className="text-emerald-300/70 text-[10px] font-semibold leading-tight mt-0.5">
                EDDP · {activeUlp.replace("ULP ", "")} ·{" "}
                {formatIndonesianDate(getHMinus1DateStr(activeDate))}
              </p>
            </div>
          </div>

          {/* Message Area */}
          <div
            className="px-3 py-4 min-h-[320px] flex flex-col items-start bg-[#ECE5DD] dark:bg-[#0B141A]"
            style={{
              backgroundImage:
                "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
              backgroundSize: "200px",
              backgroundRepeat: "repeat",
            }}
          >
            {/* Chat Bubble */}
            <div className="bg-[#DCF8C6] dark:bg-[#005C4B] rounded-xl rounded-tl-sm max-w-[96%] shadow-sm relative">
              {/* Bubble Content */}
              <div className="px-3 pt-3 pb-1">
                {isEditing ? (
                  <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    rows={Math.max(18, editedText.split("\n").length + 2)}
                    className="w-full min-w-[260px] sm:min-w-[320px] min-h-[320px] bg-transparent text-[11px] font-mono text-[#111B21] dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-none leading-relaxed tracking-tight"
                  />
                ) : (
                  <pre className="font-mono text-[11px] whitespace-pre-wrap leading-relaxed break-all select-text tracking-tight text-[#111B21] dark:text-slate-100">
                    {formattedText}
                  </pre>
                )}
              </div>

              {/* Bubble Footer (Time + Ticks) */}
              <div className="flex items-center justify-end gap-1 px-3 pb-1.5 select-none">
                <span className="text-[9px] font-medium text-[#667781] dark:text-slate-400">
                  {currentTime}
                </span>
                <svg
                  viewBox="0 0 16 11"
                  width="16"
                  height="11"
                  className="text-[#53BDEB] dark:text-[#53BDEB]"
                >
                  <path
                    d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.011-2.095a.463.463 0 0 0-.336-.153.457.457 0 0 0-.339.135.457.457 0 0 0-.14.338c0 .125.049.245.139.337l2.422 2.523a.545.545 0 0 0 .357.158c.14 0 .277-.065.38-.178L11.12 1.33a.483.483 0 0 0 .123-.34.457.457 0 0 0-.172-.337z"
                    fill="currentColor"
                  />
                  <path
                    d="M15.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-1.013-1.055-.445.55 1.07 1.114a.545.545 0 0 0 .357.158c.14 0 .277-.065.38-.178L15.12 1.33a.483.483 0 0 0 .123-.34.457.457 0 0 0-.172-.337z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
           SECTION 04 · ACTION BUTTONS
           4px rounded corners, 4px gap multiples
      ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3">
        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className={`group relative flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer select-none overflow-hidden ${
            isCopied
              ? "border-emerald-500/40 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
              : "border-slate-200 bg-white text-slate-600 hover:border-sky-500/40 hover:text-sky-600 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-sky-500/40 dark:hover:text-sky-400"
          }`}
        >
          {isCopied ? (
            <>
              <Check className="w-4 h-4" />
              <span className="tracking-tight">Tersalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span className="tracking-tight">Salin Teks</span>
            </>
          )}
        </button>

        {/* WhatsApp Share Button */}
        <button
          onClick={handleWhatsAppShare}
          className="group relative flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#1EBE5A] text-white border border-[#25D366]/30 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 cursor-pointer transition-all duration-200 select-none overflow-hidden"
        >
          <Send className="w-4 h-4 transform -rotate-12" />
          <span className="tracking-tight">Kirim via WhatsApp</span>
          <ExternalLink className="w-3 h-3 opacity-50" />
        </button>
      </div>
    </div>
  );
}
