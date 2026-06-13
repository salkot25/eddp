import React, { createContext, useState, useEffect, useContext } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { FALLBACK_TARGETS, KPI_METADATA, LIST_ULP } from "../utils/constants";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";

const AppContext = createContext();

export function AppProvider({ children }) {
  // 1. Konektivitas & API Endpoint
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [apiUrl, setApiUrl] = useLocalStorage(
    "eddp_api_url",
    import.meta.env.VITE_API_URL || "",
  ); // URL Web App Google Apps Script

  // Sinkronisasi otomatis jika di localStorage bernilai kosong namun di .env ada nilainya
  useEffect(() => {
    if (!apiUrl && import.meta.env.VITE_API_URL) {
      setApiUrl(import.meta.env.VITE_API_URL);
    }
  }, [apiUrl, setApiUrl]);

  // 2. Status Autentikasi
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage(
    "eddp_auth",
    false,
  );
  const [username, setUsername] = useLocalStorage("eddp_username", "");

  // 3. Pilihan Aktif (ULP & Tanggal)
  const [activeUlp, setActiveUlp] = useLocalStorage(
    "eddp_active_ulp",
    LIST_ULP[0],
  );
  const [activeDate, setActiveDate] = useState(() => {
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000;
    const localISOTime = new Date(today.getTime() - tzOffset)
      .toISOString()
      .slice(0, 10);
    return localISOTime; // "YYYY-MM-DD" waktu lokal
  });

  // 4. Data (Target & Riwayat)
  const [targets, setTargets] = useState(FALLBACK_TARGETS);
  const [history, setHistory] = useLocalStorage("eddp_history_cache", []);

  // 5. Draft Form Aktif
  const [drafts, setDrafts] = useLocalStorage("eddp_drafts", {});

  // 6. Antrean Submit Offline
  const [offlineQueue, setOfflineQueue] = useLocalStorage(
    "eddp_offline_queue",
    [],
  );

  // 7. UI States
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    show: false,
    message: "",
    type: "info",
  });
  const [syncAuditLog, setSyncAuditLog] = useLocalStorage(
    "eddp_sync_audit_log",
    {
      targets: null,
      form: null,
    },
  );
  const [confirmConfig, setConfirmConfig] = useState(null);

  const confirm = (config) => {
    return new Promise((resolve) => {
      setConfirmConfig({
        ...config,
        resolve,
      });
    });
  };

  const getDraftKey = (ulp = activeUlp, date = activeDate) => `${ulp}_${date}`;

  const getTargetSnapshot = (ulp, targetsMap = targets) => {
    if (!ulp) return {};
    return targetsMap[ulp] || FALLBACK_TARGETS[ulp] || {};
  };

  const buildDraftSnapshot = (submission, targetValues = {}) => {
    return KPI_METADATA.reduce((acc, kpi) => {
      const targetKey = `${kpi.key}_target`;
      const realisasiKey = `${kpi.key}_realisasi`;

      acc[targetKey] =
        submission?.[kpi.key]?.target ?? targetValues[kpi.key] ?? 0;
      acc[realisasiKey] = submission?.[kpi.key]?.realisasi ?? "";

      return acc;
    }, {});
  };

  // Pantau status koneksi internet
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast("Koneksi internet kembali online", "success");
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast("Koneksi terputus. Mode offline aktif.", "warning");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Toast/Notification Auto-dismiss
  const showToast = (message, type = "info") => {
    setSyncStatus({ show: true, message, type });
    setTimeout(() => {
      setSyncStatus((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  // Autentikasi User Spreadsheet (Hanya Validasi Remote via Server)
  const login = async (pin, name) => {
    const usernameInput = String(name || "").trim();
    const passwordInput = String(pin || "").trim();

    if (!usernameInput) {
      showToast("Nama / Username tidak boleh kosong!", "error");
      return false;
    }

    // Jika URL API kosong, beri tahu pengguna dengan jelas
    if (!apiUrl) {
      showToast(
        "Gagal masuk. URL Web App Google Apps Script belum dikonfigurasi di Pengaturan!",
        "error",
      );
      return false;
    }

    // Kita tidak memblokir menggunakan !isOnline karena navigator.onLine bisa tidak akurat.
    // Kita langsung mencoba melakukan request ke server login.
    setIsLoading(true);
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "login",
          username: usernameInput,
          password: passwordInput,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setIsAuthenticated(true);
        setUsername(result.username);

        // Pilih ULP otomatis berdasarkan username
        const loggedUsername = String(result.username).toLowerCase();
        let targetUlp = LIST_ULP[0]; // default fallback
        if (loggedUsername.includes("salatiga")) {
          targetUlp = "ULP Salatiga Kota";
        } else if (loggedUsername.includes("ambarawa")) {
          targetUlp = "ULP Ambarawa";
        } else if (loggedUsername.includes("ungaran")) {
          targetUlp = "ULP Ungaran";
        }
        setActiveUlp(targetUlp);

        showToast(`Selamat datang, ${result.username}!`, "success");
        return true;
      } else {
        showToast(result.error || "Gagal masuk!", "error");
        return false;
      }
    } catch (err) {
      console.error("Gagal melakukan login online:", err);
      showToast(
        "Gagal menyambungkan ke server login. Silakan periksa jaringan internet Anda.",
        "error",
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUsername("");
    showToast("Anda telah keluar.", "info");
  };

  // Sinkronisasi Antrean Offline ke Spreadsheet jika kembali online
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0 && apiUrl) {
      syncOfflineQueue();
    }
  }, [isOnline, offlineQueue, apiUrl]);

  const syncOfflineQueue = async () => {
    setIsLoading(true);
    showToast("Mensinkronisasikan laporan offline...", "info");

    let successCount = 0;
    const remainingQueue = [...offlineQueue];

    for (let i = 0; i < offlineQueue.length; i++) {
      const item = offlineQueue[i];
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "text/plain;charset=utf-8", // Menghindari preflight OPTIONS request
          },
          body: JSON.stringify(item),
        });
        const result = await response.json();
        if (result.success) {
          successCount++;
          remainingQueue.shift(); // Hapus yang berhasil dari antrean
        }
      } catch (err) {
        console.error("Gagal sinkronisasi data offline:", err);
        break; // Berhenti jika masih gagal koneksi ke Apps Script
      }
    }

    setOfflineQueue(remainingQueue);
    setIsLoading(false);

    if (successCount > 0) {
      showToast(
        `${successCount} laporan offline berhasil disinkronkan!`,
        "success",
      );
      fetchData(true); // Muat ulang riwayat dari server
    }
  };

  // Mengambil data Target & Riwayat dari Apps Script
  const fetchData = async (forced = false, options = {}) => {
    if (!apiUrl) {
      // Jika URL API belum disetel, gunakan target fallback
      setTargets(FALLBACK_TARGETS);
      return { success: false, reason: "missing_api" };
    }

    // Coba fetch jika online ATAU jika terpaksa (forced)
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}?action=getData`);
      const result = await response.json();

      if (result.success) {
        const nextTargets = result.targets
          ? {
              ...FALLBACK_TARGETS,
              ...result.targets,
            }
          : FALLBACK_TARGETS;

        // Gabungkan target dari server dengan target fallback (jika ada ULP baru di server)
        setTargets(nextTargets);
        if (result.submissions) {
          setHistory(result.submissions);

          if (options.syncActiveDraft) {
            const currentSubmission = result.submissions.find(
              (item) => item.tanggal === activeDate && item.ulp === activeUlp,
            );
            const syncedDraft = buildDraftSnapshot(
              currentSubmission,
              getTargetSnapshot(activeUlp, nextTargets),
            );

            setDrafts((prev) => ({
              ...prev,
              [getDraftKey()]: syncedDraft,
            }));
          }
        }

        if (options.showSuccessToast) {
          showToast(
            options.successMessage || "Data spreadsheet berhasil disinkronkan",
            "success",
          );
        }

        return {
          success: true,
          targets: nextTargets,
          submissions: result.submissions || [],
        };
      }

      return {
        success: false,
        error: result.error || "Gagal memuat data spreadsheet",
      };
    } catch (err) {
      console.error("Error fetching data from Apps Script:", err);
      if (isOnline || forced) {
        showToast(
          "Gagal memuat data dari Spreadsheet. Menggunakan cache lokal.",
          "warning",
        );
      }
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  };

  // Panggil fetchData saat inisialisasi jika API url disetel
  useEffect(() => {
    if (apiUrl) {
      fetchData(true);
    }
  }, [apiUrl]);

  // Mengirim/Menyimpan Laporan Baru
  const submitReport = async (kpiInputs) => {
    const id = `EDDP_${new Date().getTime()}`;

    const parsePayloadVal = (val) => {
      if (val === undefined || val === null || val === "") return "";
      const num = Number(val);
      return isNaN(num) ? "" : num;
    };

    const reportPayload = {
      id,
      tanggal: activeDate,
      ulp: activeUlp,
      petugas: username || "Petugas",
      kwh_p2tl_target: parsePayloadVal(kpiInputs.kwh_p2tl_target),
      kwh_p2tl_realisasi: parsePayloadVal(kpiInputs.kwh_p2tl_realisasi),
      kwh_tua_target: parsePayloadVal(kpiInputs.kwh_tua_target),
      kwh_tua_realisasi: parsePayloadVal(kpiInputs.kwh_tua_realisasi),
      gangguan_permanen_target: parsePayloadVal(
        kpiInputs.gangguan_permanen_target,
      ),
      gangguan_permanen_realisasi: parsePayloadVal(
        kpiInputs.gangguan_permanen_realisasi,
      ),
      gangguan_temporer_target: parsePayloadVal(
        kpiInputs.gangguan_temporer_target,
      ),
      gangguan_temporer_realisasi: parsePayloadVal(
        kpiInputs.gangguan_temporer_realisasi,
      ),
      pelanggan_target: parsePayloadVal(kpiInputs.pelanggan_target),
      pelanggan_realisasi: parsePayloadVal(kpiInputs.pelanggan_realisasi),
      daya_target: parsePayloadVal(kpiInputs.daya_target),
      daya_realisasi: parsePayloadVal(kpiInputs.daya_realisasi),
      abt_lisdes_target: parsePayloadVal(kpiInputs.abt_lisdes_target),
      abt_lisdes_realisasi: parsePayloadVal(kpiInputs.abt_lisdes_realisasi),
    };

    // Draft TIDAK dihapus agar preview WhatsApp tetap menampilkan data terbaru
    // Draft hanya di-reset saat user menekan "Reset Form" secara manual

    // Jika URL API tidak disetel, langsung simpan lokal
    if (!apiUrl) {
      const newHistoryItem = {
        id: reportPayload.id,
        timestamp: new Date().toISOString(),
        tanggal: reportPayload.tanggal,
        ulp: reportPayload.ulp,
        kwh_p2tl: {
          target: reportPayload.kwh_p2tl_target,
          realisasi: reportPayload.kwh_p2tl_realisasi,
        },
        kwh_tua: {
          target: reportPayload.kwh_tua_target,
          realisasi: reportPayload.kwh_tua_realisasi,
        },
        gangguan_permanen: {
          target: reportPayload.gangguan_permanen_target,
          realisasi: reportPayload.gangguan_permanen_realisasi,
        },
        gangguan_temporer: {
          target: reportPayload.gangguan_temporer_target,
          realisasi: reportPayload.gangguan_temporer_realisasi,
        },
        pelanggan: {
          target: reportPayload.pelanggan_target,
          realisasi: reportPayload.pelanggan_realisasi,
        },
        daya: {
          target: reportPayload.daya_target,
          realisasi: reportPayload.daya_realisasi,
        },
        abt_lisdes: {
          target: reportPayload.abt_lisdes_target,
          realisasi: reportPayload.abt_lisdes_realisasi,
        },
        petugas: reportPayload.petugas,
        isOfflineDraft: true,
      };

      setOfflineQueue((prev) => [...prev, reportPayload]);

      const existingIndex = history.findIndex(
        (h) =>
          h.tanggal === reportPayload.tanggal && h.ulp === reportPayload.ulp,
      );
      const updatedHistory = [...history];
      if (existingIndex > -1) {
        updatedHistory[existingIndex] = newHistoryItem;
      } else {
        updatedHistory.unshift(newHistoryItem);
      }
      setHistory(updatedHistory);

      showToast(
        "Laporan disimpan lokal. (URL API belum dikonfigurasi)",
        "warning",
      );
      return { success: true, localOnly: true };
    }

    // Mode Online: Kirim langsung ke Google Sheets via Apps Script
    setIsLoading(true);
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(reportPayload),
      });
      const result = await response.json();

      if (result.success) {
        showToast(result.message || "Laporan berhasil terkirim!", "success");
        await fetchData(true); // Refresh riwayat laporan dari server
        return { success: true, serverUpdated: true };
      } else {
        throw new Error(result.error || "Gagal menyimpan");
      }
    } catch (err) {
      console.error("Gagal mengirim laporan:", err);
      showToast(
        "Gagal kirim ke server. Disimpan di antrean offline lokal.",
        "error",
      );

      // Simpan ke antrean lokal sebagai fallback kegagalan jaringan
      const newHistoryItem = {
        id: reportPayload.id,
        timestamp: new Date().toISOString(),
        tanggal: reportPayload.tanggal,
        ulp: reportPayload.ulp,
        kwh_p2tl: {
          target: reportPayload.kwh_p2tl_target,
          realisasi: reportPayload.kwh_p2tl_realisasi,
        },
        kwh_tua: {
          target: reportPayload.kwh_tua_target,
          realisasi: reportPayload.kwh_tua_realisasi,
        },
        gangguan_permanen: {
          target: reportPayload.gangguan_permanen_target,
          realisasi: reportPayload.gangguan_permanen_realisasi,
        },
        gangguan_temporer: {
          target: reportPayload.gangguan_temporer_target,
          realisasi: reportPayload.gangguan_temporer_realisasi,
        },
        pelanggan: {
          target: reportPayload.pelanggan_target,
          realisasi: reportPayload.pelanggan_realisasi,
        },
        daya: {
          target: reportPayload.daya_target,
          realisasi: reportPayload.daya_realisasi,
        },
        abt_lisdes: {
          target: reportPayload.abt_lisdes_target,
          realisasi: reportPayload.abt_lisdes_realisasi,
        },
        petugas: reportPayload.petugas,
        isOfflineDraft: true,
      };

      setOfflineQueue((prev) => [...prev, reportPayload]);

      const existingIndex = history.findIndex(
        (h) =>
          h.tanggal === reportPayload.tanggal && h.ulp === reportPayload.ulp,
      );
      const updatedHistory = [...history];
      if (existingIndex > -1) {
        updatedHistory[existingIndex] = newHistoryItem;
      } else {
        updatedHistory.unshift(newHistoryItem);
      }
      setHistory(updatedHistory);

      return { success: true, localFallback: true };
    } finally {
      setIsLoading(false);
    }
  };

  // Mengambil draft form aktif untuk ULP & Tanggal terpilih
  const getActiveDraft = () => {
    const draftKey = getDraftKey();
    return (
      drafts[draftKey] || {
        kwh_p2tl: "",
        kwh_tua: "",
        gangguan_permanen: "",
        gangguan_temporer: "",
        pelanggan: "",
        daya: "",
        abt_lisdes: "",
      }
    );
  };

  // Menyimpan draft form aktif
  const saveDraft = (fields) => {
    const draftKey = getDraftKey();
    setDrafts((prev) => ({
      ...prev,
      [draftKey]: {
        ...prev[draftKey],
        ...fields,
      },
    }));
  };

  // Menghapus draft form aktif (setelah berhasil disubmit)
  const clearDraft = (ulp, date) => {
    const draftKey = getDraftKey(ulp, date);
    setDrafts((prev) => {
      const updated = { ...prev };
      delete updated[draftKey];
      return updated;
    });
  };

  const hasUnsavedActiveDraftChanges = () => {
    const activeDraft = getActiveDraft();
    const currentSubmission = history.find(
      (item) => item.tanggal === activeDate && item.ulp === activeUlp,
    );
    const referenceDraft = buildDraftSnapshot(
      currentSubmission,
      getTargetSnapshot(activeUlp),
    );

    const normalizeValue = (value) => {
      if (value === "" || value === null || value === undefined) return "";
      const num = Number(value);
      return Number.isNaN(num) ? String(value) : String(num);
    };

    return KPI_METADATA.some((kpi) => {
      const targetKey = `${kpi.key}_target`;
      const realisasiKey = `${kpi.key}_realisasi`;

      return (
        normalizeValue(activeDraft[targetKey]) !==
          normalizeValue(referenceDraft[targetKey]) ||
        normalizeValue(activeDraft[realisasiKey]) !==
          normalizeValue(referenceDraft[realisasiKey])
      );
    });
  };

  const refreshSpreadsheetData = async (mode = "targets") => {
    if (!apiUrl) {
      showToast(
        "URL Web App Google Apps Script belum dikonfigurasi.",
        "warning",
      );
      setSyncAuditLog((prev) => ({
        ...prev,
        [mode]: {
          at: new Date().toISOString(),
          status: "error",
          note: "URL API belum dikonfigurasi",
        },
      }));
      return { success: false, reason: "missing_api" };
    }

    if (mode === "form") {
      if (hasUnsavedActiveDraftChanges()) {
        const isConfirmed = await confirm({
          title: "Timpa Draft Lokal?",
          message:
            "Terdapat perubahan lokal yang belum disimpan. Sinkronisasi seluruh form akan menimpa draft lokal dengan data terbaru dari spreadsheet.",
          confirmText: "Ya, Timpa Draft",
          cancelText: "Batal",
          severity: "warning",
        });

        if (!isConfirmed) {
          return { success: false, cancelled: true };
        }
      }

      const syncResult = await fetchData(true, {
        syncActiveDraft: true,
        showSuccessToast: true,
        successMessage: "Data spreadsheet berhasil disinkronkan",
      });

      setSyncAuditLog((prev) => ({
        ...prev,
        form: {
          at: new Date().toISOString(),
          status: syncResult.success ? "success" : "error",
          note: syncResult.success
            ? "Sinkron seluruh form berhasil"
            : "Sinkron seluruh form gagal",
        },
      }));

      return syncResult;
    }

    const syncResult = await fetchData(true, {
      syncActiveDraft: false,
      showSuccessToast: true,
      successMessage: "Target spreadsheet berhasil disinkronkan",
    });

    setSyncAuditLog((prev) => ({
      ...prev,
      targets: {
        at: new Date().toISOString(),
        status: syncResult.success ? "success" : "error",
        note: syncResult.success
          ? "Sinkron target berhasil"
          : "Sinkron target gagal",
      },
    }));

    return syncResult;
  };

  return (
    <AppContext.Provider
      value={{
        isOnline,
        apiUrl,
        setApiUrl,
        isAuthenticated,
        username,
        login,
        logout,
        activeUlp,
        setActiveUlp,
        activeDate,
        setActiveDate,
        targets,
        history,
        isLoading,
        syncAuditLog,
        syncStatus,
        showToast,
        fetchData,
        refreshSpreadsheetData,
        submitReport,
        getActiveDraft,
        saveDraft,
        clearDraft,
        offlineQueueLength: offlineQueue.length,
        confirm,
      }}
    >
      {children}
      {confirmConfig && (
        <ConfirmDialog
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          cancelText={confirmConfig.cancelText}
          severity={confirmConfig.severity}
          onConfirm={() => {
            confirmConfig.resolve(true);
            setConfirmConfig(null);
          }}
          onCancel={() => {
            confirmConfig.resolve(false);
            setConfirmConfig(null);
          }}
        />
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
