import { KPI_METADATA } from "./constants";

/**
 * Memformat angka menggunakan standar Indonesia (titik untuk ribuan, koma untuk desimal)
 */
export function formatIndonesianNumber(num, decimals = 0) {
  if (num === null || num === undefined || num === "") return "";
  const parsed = Number(num);
  if (isNaN(parsed)) return num;

  // Format desimal dengan koma
  const fixed = parsed.toFixed(decimals);
  const parts = fixed.split(".");
  
  // Format ribuan dengan titik
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  
  return parts.length > 1 ? parts.join(",") : parts[0];
}

/**
 * Memformat tanggal YYYY-MM-DD menjadi format Indonesia (DD Bulan YYYY)
 */
export function formatIndonesianDate(dateStr) {
  if (!dateStr) return "";
  
  // Atasi timezone offset agar tanggal tidak berkurang saat di-parse
  const parts = dateStr.split("-");
  let date;
  if (parts.length === 3) {
    date = new Date(parts[0], parts[1] - 1, parts[2]);
  } else {
    date = new Date(dateStr);
  }
  
  if (isNaN(date.getTime())) return dateStr;
  
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
}

/**
 * Mengurangi tanggal YYYY-MM-DD sebanyak 1 hari (H-1)
 */
export function getHMinus1DateStr(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  let date;
  if (parts.length === 3) {
    date = new Date(parts[0], parts[1] - 1, parts[2]);
  } else {
    date = new Date(dateStr);
  }
  
  if (isNaN(date.getTime())) return dateStr;
  
  date.setDate(date.getDate() - 1);
  
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  
  return `${y}-${m}-${d}`;
}

/**
 * Menghasilkan teks laporan WhatsApp sesuai format resmi
 */
export function generateWhatsAppText(ulp, dateStr, kpis) {
  const hMinus1DateStr = getHMinus1DateStr(dateStr);
  const formattedDate = formatIndonesianDate(hMinus1DateStr);
  let text = `*Executive Daily Distribution Performance*\n`;
  text += `*${ulp}*\n`;
  text += `${formattedDate}\n\n`;

  KPI_METADATA.forEach((kpi, index) => {
    const kpiData = kpis[kpi.key] || { target: 0, realisasi: "" };
    const targetStr = formatIndonesianNumber(kpiData.target, kpi.decimalPlaces);
    
    const hasRealisasi = kpiData.realisasi !== null && kpiData.realisasi !== undefined && kpiData.realisasi !== "";
    const realisasiStr = hasRealisasi ? formatIndonesianNumber(kpiData.realisasi, kpi.decimalPlaces) : "-";

    text += `${index + 1}. ${kpi.label} (${kpi.unit})\n`;
    text += `- Target: ${targetStr}\n`;
    text += `- Realisasi: ${realisasiStr}\n\n`;
  });

  return text.trim();
}

/**
 * Menghitung persentase pencapaian KPI
 */
export function calculateAchievement(kpiKey, target, realisasi) {
  if (realisasi === null || realisasi === undefined || realisasi === "" || isNaN(realisasi)) return null;

  const targetNum = Number(target);
  const realisasiNum = Number(realisasi);

  // Jika target 0 dan realisasi 0 → dianggap 100% (tidak ada target, tidak ada realisasi = tercapai)
  if (targetNum === 0 && realisasiNum === 0) return 100;

  // Jika target 0 tapi realisasi > 0 → tidak bisa dihitung
  if (target === null || target === undefined || isNaN(target) || targetNum === 0) return 0;

  // Cari metadata untuk tahu apakah "lower is better"
  const meta = KPI_METADATA.find(k => k.key === kpiKey);
  const lowerIsBetter = meta ? meta.lowerIsBetter : false;

  if (lowerIsBetter) {
    if (realisasiNum === 0) return 100; // Tidak ada gangguan = 100%
    if (realisasiNum <= targetNum) return 100;
    // Gangguan melebihi target: performa berkurang
    const ratio = targetNum / realisasiNum;
    return Math.max(0, Math.round(ratio * 100));
  } else {
    const ratio = realisasiNum / targetNum;
    return Math.round(ratio * 100);
  }
}
