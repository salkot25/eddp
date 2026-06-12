/**
 * Konstanta Konfigurasi Aplikasi EDDP (Executive Daily Distribution Performance)
 */


export const LIST_ULP = [
  "ULP Salatiga Kota",
  "ULP Ambarawa",
  "ULP Ungaran"
];

// Fallback Targets jika koneksi API gagal / offline
export const FALLBACK_TARGETS = {
  "ULP Salatiga Kota": {
    kwh_p2tl: 15218.55,
    kwh_tua: 8,
    gangguan_permanen: 1,
    gangguan_temporer: 1,
    pelanggan: 20,
    daya: 48.47,
    abt_lisdes: 0
  },
  "ULP Ambarawa": {
    kwh_p2tl: 12000.00,
    kwh_tua: 6,
    gangguan_permanen: 1,
    gangguan_temporer: 2,
    pelanggan: 15,
    daya: 35.00,
    abt_lisdes: 0
  },
  "ULP Ungaran": {
    kwh_p2tl: 18500.00,
    kwh_tua: 10,
    gangguan_permanen: 2,
    gangguan_temporer: 2,
    pelanggan: 25,
    daya: 60.00,
    abt_lisdes: 1
  }
};

export const KPI_METADATA = [
  {
    key: "kwh_p2tl",
    label: "Perolehan kWh P2TL di AP2T",
    unit: "kWh",
    icon: "zap",
    format: "number",
    decimalPlaces: 2,
    lowerIsBetter: false
  },
  {
    key: "kwh_tua",
    label: "Penggantian kWh meter Tua/Rusak Gangguan",
    unit: "plggn",
    icon: "gauge",
    format: "integer",
    decimalPlaces: 0,
    lowerIsBetter: false
  },
  {
    key: "gangguan_permanen",
    label: "Gangguan Penyulang Permanen",
    unit: "kali",
    icon: "alert-octagon",
    format: "integer",
    decimalPlaces: 0,
    lowerIsBetter: true // Gangguan: lebih sedikit lebih baik
  },
  {
    key: "gangguan_temporer",
    label: "Gangguan Penyulang Temporer",
    unit: "kali",
    icon: "alert-triangle",
    format: "integer",
    decimalPlaces: 0,
    lowerIsBetter: true // Gangguan: lebih sedikit lebih baik
  },
  {
    key: "pelanggan",
    label: "Penambahan Jumlah Pelanggan",
    unit: "plggn",
    icon: "users",
    format: "integer",
    decimalPlaces: 0,
    lowerIsBetter: false
  },
  {
    key: "daya",
    label: "Penambahan daya tersambung",
    unit: "kVA",
    icon: "trending-up",
    format: "number",
    decimalPlaces: 2,
    lowerIsBetter: false
  },
  {
    key: "abt_lisdes",
    label: "ABT Lisdes selesai Konstruksi",
    unit: "Lokasi",
    icon: "home",
    format: "integer",
    decimalPlaces: 0,
    lowerIsBetter: false
  }
];
