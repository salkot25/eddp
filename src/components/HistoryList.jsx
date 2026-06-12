import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Card, CardBody } from "./ui/Card";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { formatIndonesianDate, formatIndonesianNumber, generateWhatsAppText } from "../utils/formatter";
import { LIST_ULP } from "../utils/constants";
import { 
  Search, 
  User, 
  Calendar, 
  Copy, 
  Check, 
  CloudOff, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  Clock
} from "lucide-react";

export default function HistoryList() {
  const { history, isLoading, fetchData, isOnline, apiUrl, activeUlp } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Toggle dropdown detail
  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Salin langsung teks laporan history
  const handleCopyHistory = async (e, item) => {
    e.stopPropagation(); // Mencegah toggle expand card
    
    // Siapkan struktur KPI data untuk formatter
    const kpisData = {
      kwh_p2tl: { target: item.kwh_p2tl.target, realisasi: item.kwh_p2tl.realisasi },
      kwh_tua: { target: item.kwh_tua.target, realisasi: item.kwh_tua.realisasi },
      gangguan_permanen: { target: item.gangguan_permanen.target, realisasi: item.gangguan_permanen.realisasi },
      gangguan_temporer: { target: item.gangguan_temporer.target, realisasi: item.gangguan_temporer.realisasi },
      pelanggan: { target: item.pelanggan.target, realisasi: item.pelanggan.realisasi },
      daya: { target: item.daya.target, realisasi: item.daya.realisasi },
      abt_lisdes: { target: item.abt_lisdes.target, realisasi: item.abt_lisdes.realisasi }
    };

    const text = generateWhatsAppText(item.ulp, item.tanggal, kpisData);
    
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Gagal menyalin riwayat:", err);
    }
  };

  // Filter riwayat secara otomatis berdasarkan ULP yang aktif & pencarian (Tanggal atau Petugas)
  const filteredHistory = history
    .filter(item => item.ulp.toLowerCase() === activeUlp.toLowerCase())
    .filter(item => {
      const term = searchTerm.toLowerCase();
      const indonesianDate = formatIndonesianDate(item.tanggal).toLowerCase();
      return (
        item.tanggal.includes(term) ||
        indonesianDate.includes(term) ||
        (item.petugas && item.petugas.toLowerCase().includes(term))
      );
    });

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Baris Pencarian & Refresh */}
      <div className="flex gap-3 items-center">
        <div className="flex-1">
          <Input
            name="search"
            placeholder="Cari berdasarkan tanggal atau petugas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
          />
        </div>
        
        {apiUrl && (
          <Button
            variant="secondary"
            onClick={() => fetchData(true)}
            isLoading={isLoading}
            disabled={!isOnline}
            icon={RefreshCw}
            className="p-3 bg-slate-100 border border-slate-200 rounded-xl dark:bg-slate-900 dark:border-slate-800"
            title="Refresh Riwayat dari Server"
          >
            <span className="hidden sm:inline">Sinkron</span>
          </Button>
        )}
      </div>

      {/* 2. Daftar Riwayat */}
      <div className="flex flex-col gap-3">
        {filteredHistory.length === 0 ? (
          <Card variant="glass" className="py-10 text-center">
            <CardBody className="flex flex-col gap-2">
              <Clock className="h-10 w-10 text-slate-400 dark:text-slate-600 mx-auto" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">Belum ada riwayat laporan</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Silakan buat laporan baru di tab "Buat Laporan".
              </p>
            </CardBody>
          </Card>
        ) : (
          filteredHistory.map((item) => {
            const isExpanded = expandedId === item.id;
            const isCopied = copiedId === item.id;
            const isOfflineDraft = item.isOfflineDraft;

            return (
              <Card 
                key={item.id} 
                variant="solid" 
                className={`border-slate-200 dark:border-slate-800/60 transition-all duration-200 dark:bg-[#121829]/65 hover:border-slate-350 dark:hover:border-slate-700/65 ${
                  isExpanded ? "ring-1 ring-sky-500/30 border-sky-500/20" : ""
                }`}
              >
                {/* Header Card (Klik untuk Expand) */}
                <div 
                  onClick={() => toggleExpand(item.id)}
                  className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-start gap-3">
                    {/* Status Sync Icon */}
                    <div className="mt-1">
                      {isOfflineDraft ? (
                        <CloudOff className="h-4 w-4 text-amber-500 dark:text-amber-400" title="Offline Draft" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1" title="Sinkron Terkirim" />
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        {item.ulp}
                        {isOfflineDraft && (
                          <span className="text-[9px] bg-amber-550/15 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 px-1.5 py-0.5 rounded-full border border-amber-500/20">
                            Offline
                          </span>
                        )}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400 dark:text-slate-500" />
                          {formatIndonesianDate(item.tanggal)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User size={12} className="text-slate-400 dark:text-slate-500" />
                          {item.petugas || "Sistem"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tombol Aksi Kanan Card */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      variant={isCopied ? "accent" : "secondary"}
                      size="sm"
                      onClick={(e) => handleCopyHistory(e, item)}
                      icon={isCopied ? Check : Copy}
                      className="h-8 px-3.5 text-xs font-semibold rounded-lg shrink-0"
                    >
                      {isCopied ? "Disalin" : "Salin"}
                    </Button>
                    <button 
                      onClick={() => toggleExpand(item.id)}
                      className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 shrink-0 cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Body Details (Tampil saat Expanded) */}
                {isExpanded && (
                  <div className="px-4 pb-5 pt-1 border-t border-slate-200 dark:border-slate-800/40 bg-slate-50/45 dark:bg-slate-950/20 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5 mt-2 text-xs">
                      
                      {/* 1. kWh P2TL */}
                      <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-800/25">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">1. kWh P2TL di AP2T (kWh)</span>
                        <div className="text-right">
                          <p className="text-slate-800 dark:text-slate-200 font-bold">R: {formatIndonesianNumber(item.kwh_p2tl.realisasi, 2)}</p>
                          <p className="text-[10px] text-slate-450 dark:text-slate-500">T: {formatIndonesianNumber(item.kwh_p2tl.target, 2)}</p>
                        </div>
                      </div>

                      {/* 2. kWh Meter Tua */}
                      <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-800/25">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">2. kWh Meter Tua/Rusak (plggn)</span>
                        <div className="text-right">
                          <p className="text-slate-800 dark:text-slate-200 font-bold">R: {formatIndonesianNumber(item.kwh_tua.realisasi)}</p>
                          <p className="text-[10px] text-slate-450 dark:text-slate-500">T: {formatIndonesianNumber(item.kwh_tua.target)}</p>
                        </div>
                      </div>

                      {/* 3. Gangguan Permanen */}
                      <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-800/25">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">3. Gangguan Permanen (kali)</span>
                        <div className="text-right">
                          <p className="text-slate-800 dark:text-slate-200 font-bold">R: {formatIndonesianNumber(item.gangguan_permanen.realisasi)}</p>
                          <p className="text-[10px] text-slate-450 dark:text-slate-500">T: {formatIndonesianNumber(item.gangguan_permanen.target)}</p>
                        </div>
                      </div>

                      {/* 4. Gangguan Temporer */}
                      <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-800/25">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">4. Gangguan Temporer (kali)</span>
                        <div className="text-right">
                          <p className="text-slate-800 dark:text-slate-200 font-bold">R: {formatIndonesianNumber(item.gangguan_temporer.realisasi)}</p>
                          <p className="text-[10px] text-slate-450 dark:text-slate-500">T: {formatIndonesianNumber(item.gangguan_temporer.target)}</p>
                        </div>
                      </div>

                      {/* 5. Jumlah Pelanggan */}
                      <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-800/25">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">5. Penambahan Pelanggan (plggn)</span>
                        <div className="text-right">
                          <p className="text-slate-800 dark:text-slate-200 font-bold">R: {formatIndonesianNumber(item.pelanggan.realisasi)}</p>
                          <p className="text-[10px] text-slate-450 dark:text-slate-500">T: {formatIndonesianNumber(item.pelanggan.target)}</p>
                        </div>
                      </div>

                      {/* 6. Daya Tersambung */}
                      <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-800/25">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">6. Penambahan Daya (kVA)</span>
                        <div className="text-right">
                          <p className="text-slate-800 dark:text-slate-200 font-bold">R: {formatIndonesianNumber(item.daya.realisasi, 2)}</p>
                          <p className="text-[10px] text-slate-450 dark:text-slate-500">T: {formatIndonesianNumber(item.daya.target, 2)}</p>
                        </div>
                      </div>

                      {/* 7. ABT Lisdes */}
                      <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-800/25 md:col-span-2">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">7. ABT Lisdes Selesai Konstruksi (Lokasi)</span>
                        <div className="text-right">
                          <p className="text-slate-800 dark:text-slate-200 font-bold">R: {formatIndonesianNumber(item.abt_lisdes.realisasi)}</p>
                          <p className="text-[10px] text-slate-450 dark:text-slate-500">T: {formatIndonesianNumber(item.abt_lisdes.target)}</p>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
