# Rencana Implementasi: Executive Daily Distribution Performance PWA

Aplikasi Web Progresif (PWA) tingkat enterprise untuk mengelola dan memformat pelaporan kinerja distribusi harian unit layanan pelanggan (ULP) PLN ke WhatsApp, dengan backend Google Sheets dan Google Apps Script.

## User Review Required

> [!IMPORTANT]
> **Versi Tailwind CSS**: Kami akan menggunakan **Tailwind CSS v4** (atau v3 stabil jika Anda lebih memilih, silakan konfirmasi jika ingin v3). Secara default, kami akan menggunakan versi Tailwind CSS v4 terbaru yang terintegrasi dengan Vite untuk optimasi performa maksimal.
> **Struktur Spreadsheet**: Spreadsheet akan memerlukan dua lembar (Sheet): `Submissions` untuk menyimpan data pelaporan dan `Targets` untuk menyimpan konfigurasi target default ULP agar target tidak terprogram keras (hardcoded).
> **URL Google Apps Script**: Anda perlu membuat Google Sheets, menempelkan kode Apps Script yang kami sediakan, lalu men-deploy-nya sebagai Web App untuk mendapatkan URL endpoint API.

## Open Questions

> [!WARNING]
> 1. **Daftar ULP**: Apakah selain ULP Salatiga Kota, ada ULP lain yang perlu dimasukkan dalam pilihan (misalnya ULP Ambarawa, ULP Ungaran, dsb)?
> 2. **Metode Otentikasi**: Apakah aplikasi ini memerlukan sistem login berbasis PIN sederhana/Google Sign-In, atau cukup pengisian nama pelapor tanpa otentikasi ketat? (Rekomendasi kami: PIN Sederhana yang divalidasi via Spreadsheet).

## Proposed Changes

Kami akan membuat struktur file yang modular dan SOLID di dalam folder `d:\Antigravity\eddp`.

```
d:\Antigravity\eddp\
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js (atau CSS-based config jika Tailwind v4)
├── public/
│   ├── manifest.json
│   ├── icon-192.png
│   └── icon-512.png
└── src/
    ├── main.jsx
    ├── index.css
    ├── App.jsx
    ├── components/
    │   ├── ui/
    │   │   ├── Button.jsx
    │   │   ├── Card.jsx
    │   │   ├── Input.jsx
    │   │   └── Select.jsx
    │   ├── Layout.jsx
    │   ├── PerformanceForm.jsx
    │   ├── FormatPreview.jsx
    │   └── HistoryList.jsx
    ├── context/
    │   └── AppContext.jsx
    ├── hooks/
    │   └── useLocalStorage.js
    ├── services/
    │   ├── appscript.js
    │   └── sw.js (Service Worker)
    └── utils/
        ├── formatter.js
        └── constants.js
```

---

### 1. Backend: Google Apps Script

#### [NEW] [backend.js](file:///d:/Antigravity/eddp/backend.js)
Kode Google Apps Script (`Code.gs`) yang akan ditempelkan di editor Apps Script spreadsheet Anda. Kode ini mendukung:
- `doGet(e)`: Mengambil riwayat pengiriman terbaru dan target default ULP.
- `doPost(e)`: Menyimpan laporan harian baru, memvalidasi input, dan memperbarui baris jika tanggal & ULP sama (menghindari duplikasi).

---

### 2. Konfigurasi Proyek

#### [NEW] [package.json](file:///d:/Antigravity/eddp/package.json)
Mendefinisikan dependensi: `react`, `react-dom`, `lucide-react` (ikon premium), dan dependensi pengembangan `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite` (Tailwind CSS v4).

#### [NEW] [vite.config.js](file:///d:/Antigravity/eddp/vite.config.js)
Konfigurasi Vite dengan React plugin dan Tailwind CSS v4, serta konfigurasi PWA manifest injector.

#### [NEW] [manifest.json](file:///d:/Antigravity/eddp/public/manifest.json)
Manifest PWA untuk mendukung instalasi di Android/iOS dengan dukungan mode standalone dan offline-ready.

---

### 3. Styling & Desain (60-30-10 & 4px Grid)

#### [NEW] [index.css](file:///d:/Antigravity/eddp/src/index.css)
Menginisialisasi Tailwind v4 dan menentukan tema warna custom PLN (Enterprise Theme):
- **60% Dominan (Background)**: Dark Mode premium dengan slate-dark (`#0B0F19`) atau Light Mode bersih (`#F8FAFC`).
- **30% Struktur (Secondary)**: Card/kontainer berwarna slate-card (`#131B2E` / `#FFFFFF`) dengan border halus (`#1E293B` / `#E2E8F0`).
- **10% Accent (Energetik/Highlight)**: Kuning PLN hangat (`#F59E0B`) atau Biru PLN (`#06B6D4`) untuk tombol utama, persentase pencapaian, dan penekanan penting.
- **4px Rules**: Menerapkan kelipatan 4px untuk `gap`, `padding`, `margin`, dan `rounded` (misal: rounded-xl = 12px, p-4 = 16px, gap-2 = 8px).

---

### 4. Komponen Frontend

#### [NEW] [AppContext.jsx](file:///d:/Antigravity/eddp/src/context/AppContext.jsx)
State manager utama menggunakan Context API untuk mengelola status loading, daftar riwayat laporan, target default, konektivitas internet (online/offline), dan integrasi API Apps Script.

#### [NEW] [formatter.js](file:///d:/Antigravity/eddp/src/utils/formatter.js)
Fungsi pembantu untuk memformat teks WhatsApp persis seperti template yang diinginkan, menghitung otomatis persentase realisasi terhadap target, serta menandai emoji status (misal: ✅ jika >= 100%, ⚠️ jika < 100%).

#### [NEW] [PerformanceForm.jsx](file:///d:/Antigravity/eddp/src/components/PerformanceForm.jsx)
Form input harian dengan UI yang sangat interaktif dan responsif (Mobile First). Menampilkan indikator visual (gauge/bar) pencapaian langsung di setiap item KPI saat pengguna mengetik angka realisasi.

#### [NEW] [FormatPreview.jsx](file:///d:/Antigravity/eddp/src/components/FormatPreview.jsx)
Menampilkan preview visual teks WhatsApp secara langsung (live preview) dengan tombol "Salin Laporan" dan "Kirim via WhatsApp" menggunakan micro-animation.

#### [NEW] [HistoryList.jsx](file:///d:/Antigravity/eddp/src/components/HistoryList.jsx)
Daftar riwayat laporan sebelumnya yang tersimpan di Google Sheets, lengkap dengan fitur pencarian dan download ulang format teks WhatsApp-nya.

---

## Verification Plan

### Automated Tests
- Menjalankan linting dan build produksi (`npm run build`) untuk memastikan tidak ada kesalahan kompilasi.
- Menjalankan server pengembangan (`npm run dev`) untuk verifikasi lokal.

### Manual Verification
1. **Validasi Input & Formatter**: Memasukkan data sampel seperti di instruksi, memverifikasi hasil kalkulasi persentase kinerja, dan memverifikasi format salinan WhatsApp.
2. **Koneksi Google Sheets**: Menguji submit data saat online dan memastikan data tersimpan dengan benar di Spreadsheet.
3. **Uji Offline PWA**: Mematikan koneksi internet di browser devtools, mengisi form, memverifikasi penyimpanan lokal (draft), dan memastikan data tersinkronisasi saat koneksi kembali online.
4. **Desain Mobile First**: Memverifikasi responsivitas pada resolusi mobile (375px - 425px) menggunakan Chrome DevTools device mode.
