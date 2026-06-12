# Executive Daily Distribution Performance (EDDP) PWA

Aplikasi Web Progresif (PWA) tingkat enterprise untuk mengelola, memformat, dan membagikan laporan kinerja distribusi harian unit layanan pelanggan (ULP) PLN ke WhatsApp secara instan. Menggunakan Google Sheets & Google Apps Script sebagai serverless backend database.

---

## 1. Fitur Utama Aplikasi

### A. Pengisian Bertahap & Penanganan Data Kosong
* **Form Pengisian Parsial**: Karena formulir diisi oleh beberapa bidang kerja secara bertahap, aplikasi mendukung pengiriman data meskipun belum lengkap. Tidak ada pop-up konfirmasi atau banner peringatan yang memblokir proses submit ketika ada data kosong.
* **Penyimpanan Sel Kosong (Presisi)**: Parameter yang dikosongkan akan disimpan ke Google Sheets sebagai sel kosong (bukan angka `0`). Saat dimuat kembali ke form, data kosong ini akan ditampilkan sebagai tanda `-`.
* **Nilai Nol Asli (`0`)**: Jika realisasi diisi angka `0` secara sengaja, maka nilai tersebut disimpan dan ditampilkan sebagai `0` (bukan sebagai data kosong).

### B. Otentikasi PIN Keamanan
* **Login Khusus Angka**: Form login PIN dirancang agar memicu papan ketik numerik (`inputMode="numeric"`) di HP dan secara real-time menyaring input sehingga **hanya karakter angka saja** yang dapat diketik.
* **PIN Akses**: Aplikasi dapat diakses dengan nama petugas bebas dan PIN keamanan: **`52351`**.

### C. Navigasi & Tampilan Atas Minimalis (Borderless Icons)
Kontrol di sudut kanan atas dirancang tanpa bingkai/latar belakang kotak (*borderless*), menyatu secara elegan dengan spasi rapat (`gap-1`):
1. **Indikator Internet (Ikon Awan)**:
   - **ONLINE**: Menampilkan ikon **Cloud** berwarna **Biru** (`text-sky-500`) disertai animasi denyut halus (`animate-cloud-pulse`).
   - **OFFLINE**: Menampilkan ikon **CloudOff** berwarna **Abu-abu** (`text-slate-400`).
2. **Toggle Tema (Sun/Moon)**:
   - Secara default aplikasi memuat **Light Mode** saat pertama kali dibuka. Pilihan tema disimpan secara persisten di `localStorage`.
   - **Animasi Light Mode**: Ikon matahari berwarna kuning berputar lambat secara kontinu (`animate-spin-slow`).
   - **Animasi Dark Mode**: Ikon bulan berwarna biru langit melayang dan bergoyang lembut secara kontinu (`animate-float-slow`).
3. **Logout**: Ikon keluar (`LogOut`) minimalis untuk kembali ke halaman PIN.

### D. Preview WhatsApp & Format Tanggal H-1
* **Tanggal H-1**: Karena realisasi laporan adalah kinerja hari kemarin yang dilaporkan hari ini, teks laporan WhatsApp secara otomatis ter-generate dengan tanggal **H-1** dari tanggal pelaporan yang dipilih di form.
* **Kustomisasi Teks**: Teks pratinjau dalam chat bubble WhatsApp dapat diedit secara manual sebelum disalin ke clipboard atau dibagikan langsung ke WhatsApp grup koordinasi.

### E. Mode Offline & Sinkronisasi Otomatis
* Laporan yang dikirim saat offline otomatis disimpan ke antrean lokal browser. Saat internet kembali aktif, aplikasi secara otomatis mengirimkan seluruh antrean tersebut ke Google Sheets tanpa kehilangan data.

---

## 2. Struktur Proyek

```
eddp/
├── backend/
│   └── code.gs          # Kode Google Apps Script untuk disalin ke Spreadsheet
├── backend.js           # Salinan kode Google Apps Script di repositori
├── src/
│   ├── components/
│   │   ├── ui/          # Komponen UI dasar (Button, Card, Input, Select)
│   │   ├── Layout.jsx   # Kerangka dasar (header, login, navigasi tab)
│   │   ├── PerformanceForm.jsx  # Form isian realisasi harian
│   │   ├── FormatPreview.jsx    # Preview format pesan WhatsApp bubble
│   │   └── HistoryList.jsx      # Riwayat pengiriman laporan dari server
│   ├── context/
│   │   └── AppContext.jsx       # State manager (API, offline queue, auth)
│   ├── utils/
│   │   ├── formatter.js         # Pemformat angka ID, tanggal, dan teks WA
│   │   └── constants.js         # Konstanta daftar ULP & parameter KPI
│   ├── index.css        # Konfigurasi Tailwind CSS v4 & custom keyframes
│   ├── App.jsx          # Entry point routing tab
│   └── main.jsx         # Render root React DOM
├── package.json
└── vite.config.js       # Konfigurasi bundling Vite
```

---

## 3. Cara Instalasi & Setup Backend

### A. Pengaturan Google Sheets & Apps Script
1. Buat **Google Spreadsheet** baru di Drive Anda.
2. Tambahkan 3 lembar sheet dengan nama persis:
   - `Submissions` (untuk data laporan harian)
   - `Targets` (untuk konfigurasi target ULP)
   - `Users` (untuk akun PIN akses)
3. Buka menu **Extensions** -> **Apps Script**.
4. Hapus seluruh kode bawaan di editor `Code.gs`.
5. Buka file [backend/code.gs](file:///d:/Antigravity/eddp/backend/code.gs) di direktori proyek, salin kodenya, lalu tempel di editor Apps Script.
6. Klik **Save Project** (ikon disket).
7. Di bagian atas editor, pilih fungsi `setupDatabase` lalu klik **Run** (Jalankan). Berikan otoritas izin akses akun Google jika diminta. Langkah ini akan otomatis menginisialisasi kolom header dan target default ULP.
8. Klik tombol **Deploy** di kanan atas -> pilih **New deployment**.
9. Klik ikon roda gigi -> pilih **Web app**.
10. Konfigurasi deployment:
    - **Execute as**: `Me`
    - **Who has access**: `Anyone`
11. Klik **Deploy** dan salin **Web App URL** yang dihasilkan (contoh: `https://script.google.com/macros/s/.../exec`).

### B. Menjalankan PWA Secara Lokal
1. Pastikan Anda berada di folder proyek `d:\Antigravity\eddp`.
2. Install dependensi (jika baru di-clone):
   ```bash
   npm install
   ```
3. Jalankan server pengembangan lokal:
   ```bash
   npm run dev
   ```
4. Buka URL localhost di browser Anda (misalnya `http://localhost:3000/`).
5. Pergi ke tab **Pengaturan** di kanan bawah aplikasi, tempelkan **Web App URL** yang Anda salin dari Google Apps Script, lalu klik **Simpan Pengaturan**.

---

## 4. Kredensial Pengujian Default
* **Nama**: *Bebas* (misalnya: `Petugas`)
* **PIN**: `52351`
