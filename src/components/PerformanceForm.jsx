import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Card } from "./ui/Card";
import { SyncMenuButton } from "./ui/SyncMenuButton";
import { LIST_ULP, KPI_METADATA } from "../utils/constants";
import { calculateAchievement } from "../utils/formatter";
import { Calendar, Save, RotateCcw, RefreshCw, BarChart2 } from "lucide-react";

const BULLET_COLORS = [
  "#ef4444", // P2TL - Red
  "#f59e0b", // kWh Meter Tua - Amber
  "#3b82f6", // Gangguan Permanen - Blue
  "#06b6d4", // Gangguan Temporer - Cyan
  "#8b5cf6", // Pelanggan Baru - Purple
  "#10b981", // Daya tersambung - Emerald
  "#64748b", // ABT Lisdes - Slate
];

export default function PerformanceForm({ onReportSubmitted }) {
  const {
    activeUlp,
    setActiveUlp,
    activeDate,
    setActiveDate,
    targets,
    history,
    submitReport,
    getActiveDraft,
    saveDraft,
    clearDraft,
    isLoading,
    syncAuditLog,
    username,
    confirm,
    refreshSpreadsheetData,
  } = useApp();

  const [formValues, setFormValues] = useState({});

  // Helper pencarian target ULP yang robust (toleran terhadap casing & prefix "ULP ")
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

  // Sinkronisasikan state lokal form dengan ULP atau tanggal yang aktif
  // Prioritas: Draft lokal > Data dari server (history) > Target default ULP dari sheet target
  useEffect(() => {
    const currentTargets = findTargetsForUlp(activeUlp, targets);
    const draft = getActiveDraft();

    // Cari data yang sudah pernah disubmit (dari server/history) untuk ULP+tanggal ini
    const existingSubmission = history.find(
      (h) => h.tanggal === activeDate && h.ulp === activeUlp,
    );

    // Cek apakah draft memiliki data realisasi (bukan hanya object kosong)
    const draftHasRealisasi = KPI_METADATA.some((kpi) => {
      const val = draft[`${kpi.key}_realisasi`];
      return val !== undefined && val !== "";
    });

    // Gabungkan target ULP bawaan dengan realisasi/target kustom dari draft atau history
    const mergedValues = {};
    KPI_METADATA.forEach((kpi) => {
      const targetKey = `${kpi.key}_target`;
      const realisasiKey = `${kpi.key}_realisasi`;

      // Sumber data history (jika ada submission sebelumnya)
      const historyKpi = existingSubmission
        ? existingSubmission[kpi.key]
        : null;

      if (draftHasRealisasi) {
        // Prioritas 1: Draft lokal (user sedang mengedit)
        mergedValues[targetKey] =
          draft[targetKey] !== undefined && draft[targetKey] !== ""
            ? draft[targetKey]
            : (currentTargets[kpi.key] ?? 0);
        mergedValues[realisasiKey] =
          draft[realisasiKey] !== undefined ? draft[realisasiKey] : "";
      } else if (historyKpi) {
        // Prioritas 2: Data dari server/history (sudah pernah disubmit)
        mergedValues[targetKey] =
          historyKpi.target ?? currentTargets[kpi.key] ?? 0;
        mergedValues[realisasiKey] = historyKpi.realisasi ?? "";
      } else {
        // Prioritas 3: Target default ULP dari sheet targets, realisasi kosong
        mergedValues[targetKey] = currentTargets[kpi.key] ?? 0;
        mergedValues[realisasiKey] = "";
      }
    });

    setFormValues(mergedValues);

    // Jika data berasal dari history (bukan draft), simpan ke draf agar sinkron
    if (!draftHasRealisasi && existingSubmission) {
      saveDraft(mergedValues);
    }
  }, [activeUlp, activeDate, targets, history]);

  // Handler input perubahan nilai
  const handleValChange = (key, val) => {
    const updated = {
      ...formValues,
      [key]: val,
    };
    setFormValues(updated);
    saveDraft({ [key]: val });
  };

  // Bersihkan semua input form
  const handleResetForm = async () => {
    const isConfirmed = await confirm({
      title: "Kosongkan Form Laporan",
      message:
        "Apakah Anda yakin ingin mengosongkan semua isian form target & realisasi hari ini?",
      confirmText: "Ya, Kosongkan",
      cancelText: "Batal",
      severity: "danger",
    });

    if (isConfirmed) {
      const reseted = {};
      const currentTargets = findTargetsForUlp(activeUlp, targets);

      KPI_METADATA.forEach((kpi) => {
        reseted[`${kpi.key}_target`] = currentTargets[kpi.key] ?? 0;
        reseted[`${kpi.key}_realisasi`] = "";
      });

      setFormValues(reseted);
      saveDraft(reseted);
    }
  };

  // Helper styling input realisasi untuk mendeteksi data kosong
  const getRealisasiClass = (val) => {
    const base =
      "w-13 text-center font-mono font-bold text-xs rounded-lg py-1 outline-none transition-all";
    if (val === undefined || val === "") {
      return `${base} text-slate-400 bg-slate-100 border border-slate-200 focus:border-sky-500/80 dark:bg-slate-950/20 dark:border-slate-800`;
    }
    return `${base} text-emerald-600 bg-slate-100 border border-slate-200 focus:border-emerald-500/80 dark:text-emerald-400 dark:bg-slate-950/20 dark:border-slate-800`;
  };

  // Submit Laporan
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kirimkan formValues lengkap (berisi target dan realisasi)
    const result = await submitReport(formValues);
    if (result && result.success) {
      clearDraft(activeUlp, activeDate);
      if (onReportSubmitted) {
        onReportSubmitted(formValues);
      }
    }
  };

  const isRealisasi = true;

  // Helper styling persentase capaian
  const getAchStyle = (kpiKey, target, real) => {
    const ach = calculateAchievement(kpiKey, target, real);
    if (ach === null)
      return { color: "#94a3b8", bg: "transparent", pct: null, status: "" };

    const meta = KPI_METADATA.find((k) => k.key === kpiKey);
    const lowerIsBetter = meta ? meta.lowerIsBetter : false;

    if (lowerIsBetter) {
      if (ach >= 100)
        return {
          color: "#10b981",
          bg: "rgba(16,185,129,0.09)",
          pct: ach,
          status: "Baik",
        };
      if (ach >= 75)
        return {
          color: "#f59e0b",
          bg: "rgba(245,158,11,0.09)",
          pct: ach,
          status: "Waspada",
        };
      return {
        color: "#ef4444",
        bg: "rgba(239,68,68,0.09)",
        pct: ach,
        status: "Buruk",
      };
    } else {
      if (ach >= 100)
        return {
          color: "#10b981",
          bg: "rgba(16,185,129,0.09)",
          pct: ach,
          status: "Tercapai",
        };
      if (ach >= 50)
        return {
          color: "#f59e0b",
          bg: "rgba(245,158,11,0.09)",
          pct: ach,
          status: "Mendekati",
        };
      return {
        color: "#ef4444",
        bg: "rgba(239,68,68,0.09)",
        pct: ach,
        status: "Kurang",
      };
    }
  };

  // Helper warna progress bar
  const getBarColor = (kpiKey, target, real) => {
    const ach = calculateAchievement(kpiKey, target, real);
    if (ach === null) return "#94a3b8";
    return ach >= 100 ? "#10b981" : ach >= 50 ? "#f59e0b" : "#ef4444";
  };

  // CSS Grid template matching LaporanPanel.jsx
  const colTemplate = "24px 1fr 72px 72px";

  return (
    <div className="flex flex-col gap-5">
      {/* ══════════════════════════════════════════════
           01. DATE CONTROLS
      ══════════════════════════════════════════════ */}
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

      {/* ══════════════════════════════════════════════
           02. MAIN KPI TABLE (Matches LaporanPanel table style)
      ══════════════════════════════════════════════ */}
      <Card
        variant="solid"
        className="border-slate-200 dark:border-slate-800/60 shadow-lg"
      >
        {/* Card Header */}
        <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-sky-500/10 border border-sky-500/15 rounded-xl flex items-center justify-center shrink-0">
              <BarChart2 className="w-4 h-4 text-sky-550 dark:text-sky-400" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                Parameter Kinerja Distribusi
              </h3>
              <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                Petugas:{" "}
                <span className="text-sky-600 dark:text-sky-400 font-semibold">
                  {username || "Sistem"}
                </span>
              </p>
            </div>
          </div>

          <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-600 dark:bg-slate-800/50 dark:border-slate-700/60 dark:text-slate-400 px-2 py-0.5 rounded-lg font-bold">
            7 METRICS
          </span>
        </div>

        {/* Table Column Headers */}
        <div
          className="grid px-4 py-2 bg-slate-100/50 border-b border-slate-200 text-[9px] font-black text-slate-500 dark:bg-slate-900/40 dark:border-slate-800/40 dark:text-slate-550 uppercase tracking-wider"
          style={{ gridTemplateColumns: colTemplate }}
        >
          <div>#</div>
          <div>Parameter Kinerja ULP</div>
          <div className="text-center">Target</div>
          <div className="text-center">Realisasi</div>
        </div>

        {/* Table Body Rows */}
        <div className="divide-y divide-slate-200/80 dark:divide-slate-800/30">
          {KPI_METADATA.map((kpi, idx) => {
            const targetKey = `${kpi.key}_target`;
            const realisasiKey = `${kpi.key}_realisasi`;

            const targetVal = formValues[targetKey] ?? 0;
            const realisasiVal = formValues[realisasiKey] ?? "";

            // Hitung status pencapaian
            const s = getAchStyle(kpi.key, targetVal, realisasiVal);
            const fillWidth =
              targetVal > 0 && realisasiVal !== ""
                ? Math.min(100, Math.max(0, s.pct))
                : 0;

            return (
              <div
                key={kpi.key}
                className="grid items-center px-4 py-3 hover:bg-slate-100/50 dark:hover:bg-slate-950/20 transition-all duration-150"
                style={{ gridTemplateColumns: colTemplate }}
              >
                {/* 1. Kolom Nomor */}
                <div className="text-xs font-bold text-slate-400 dark:text-slate-600">
                  {idx + 1}
                </div>

                {/* 2. Kolom Nama Parameter + Progress bar */}
                <div className="pr-2.5">
                  <div className="flex items-center">
                    <span className="text-xs font-semibold text-slate-750 dark:text-slate-200 leading-snug">
                      {kpi.label}{" "}
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        ({kpi.unit})
                      </span>
                    </span>
                  </div>

                  {/* Progress Bar (Hanya jika Realisasi & Target > 0) */}
                  {isRealisasi && realisasiVal !== "" && targetVal > 0 && (
                    <div className="mt-2 h-1 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden w-full">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${fillWidth}%`,
                          backgroundColor: getBarColor(
                            kpi.key,
                            targetVal,
                            realisasiVal,
                          ),
                        }}
                        role="progressbar"
                        aria-valuenow={fillWidth}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        title={`${fillWidth}%`}
                      />
                    </div>
                  )}
                </div>

                {/* 3. Kolom Target Input (Manual Editable Override) */}
                <div className="text-center flex justify-center">
                  <input
                    type="number"
                    step={kpi.decimalPlaces > 0 ? "0.01" : "1"}
                    value={targetVal}
                    onChange={(e) => handleValChange(targetKey, e.target.value)}
                    className="w-13 text-center font-mono font-bold text-xs text-slate-800 bg-slate-100 border border-slate-200 rounded-lg py-1 focus:border-sky-500/80 outline-none transition-all dark:text-slate-100 dark:bg-slate-950/20 dark:border-slate-800"
                  />
                </div>

                {/* 4. Kolom Realisasi Input (Disabled jika Rencana) */}
                <div className="text-center flex justify-center">
                  {isRealisasi ? (
                    <input
                      type="number"
                      step={kpi.decimalPlaces > 0 ? "0.01" : "1"}
                      placeholder="-"
                      value={realisasiVal}
                      onChange={(e) =>
                        handleValChange(realisasiKey, e.target.value)
                      }
                      className={getRealisasiClass(realisasiVal)}
                    />
                  ) : (
                    <span className="text-slate-650 dark:text-slate-600 font-mono font-bold text-xs select-none">
                      -
                    </span>
                  )}
                </div>

                {/* removed percentage column */}
              </div>
            );
          })}
        </div>
      </Card>

      {/* ══════════════════════════════════════════════
           03. ACTION BUTTONS
      ══════════════════════════════════════════════ */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={handleResetForm}
          className="flex-1 py-2.5 rounded-xl font-bold text-xs border border-slate-200 bg-white text-slate-500 hover:text-slate-750 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400 dark:hover:text-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none"
        >
          <RotateCcw size={14} />
          Reset Form
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-2 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 hover:brightness-110 shadow-lg shadow-sky-500/10 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 select-none"
        >
          {isLoading ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save size={14} />
              Simpan Laporan Harian
            </>
          )}
        </button>
      </div>
    </div>
  );
}
