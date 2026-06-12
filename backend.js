/**
 * Google Apps Script Backend for Executive Daily Distribution Performance PWA
 *
 * Skenario Penggunaan:
 * 1. Buat Google Sheet baru.
 * 2. Tambahkan Sheet bernama "Submissions" dan "Targets".
 * 3. Pada Sheet "Targets", buat kolom:
 *    - ULP (e.g. ULP Salatiga Kota, ULP Ambarawa, ULP Ungaran)
 *    - target_kwh_p2tl
 *    - target_kwh_tua
 *    - target_gangguan_permanen
 *    - target_gangguan_temporer
 *    - target_pelanggan
 *    - target_daya
 *    - target_abt_lisdes
 * 4. Buka menu Extensions > Apps Script, hapus kode bawaan dan tempelkan kode di bawah ini.
 * 5. Klik "Deploy" > "New deployment" > Pilih type "Web app".
 * 6. Set "Execute as" ke "Me" dan "Who has access" ke "Anyone".
 * 7. Deploy dan salin URL Web App untuk dikonfigurasi di PWA.
 */

// Konfigurasi Nama Sheet
const SHEET_SUBMISSIONS = "Submissions";
const SHEET_TARGETS = "Targets";
const SHEET_USERS = "Users";

// Header untuk sheet Submissions
const SUBMISSION_HEADERS = [
  "ID",
  "Timestamp",
  "Tanggal",
  "ULP",
  "kWh P2TL Target",
  "kWh P2TL Realisasi",
  "kWh Meter Tua Target",
  "kWh Meter Tua Realisasi",
  "Gangguan Permanen Target",
  "Gangguan Permanen Realisasi",
  "Gangguan Temporer Target",
  "Gangguan Temporer Realisasi",
  "Pelanggan Target",
  "Pelanggan Realisasi",
  "Daya Target",
  "Daya Realisasi",
  "ABT Lisdes Target",
  "ABT Lisdes Realisasi",
  "Petugas"
];

/**
 * Setup lembar Spreadsheet awal jika belum ada
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Setup Submissions
  let subSheet = ss.getSheetByName(SHEET_SUBMISSIONS);
  if (!subSheet) {
    subSheet = ss.insertSheet(SHEET_SUBMISSIONS);
    subSheet.appendRow(SUBMISSION_HEADERS);
    subSheet.getRange(1, 1, 1, SUBMISSION_HEADERS.length).setFontWeight("bold").setBackground("#F1F5F9");
  }
  
  // Setup Targets
  let targetSheet = ss.getSheetByName(SHEET_TARGETS);
  if (!targetSheet) {
    targetSheet = ss.insertSheet(SHEET_TARGETS);
    const targetHeaders = [
      "ULP", 
      "kWh P2TL", 
      "kWh Meter Tua", 
      "Gangguan Permanen", 
      "Gangguan Temporer", 
      "Pelanggan Baru", 
      "Daya Tersambung", 
      "ABT Lisdes"
    ];
    targetSheet.appendRow(targetHeaders);
    targetSheet.getRange(1, 1, 1, targetHeaders.length).setFontWeight("bold").setBackground("#F1F5F9");
    
    // Data default Salatiga Kota dan ULP lainnya
    const defaultTargets = [
      ["ULP Salatiga Kota", 15218.55, 8, 1, 1, 20, 48.47, 0],
      ["ULP Ambarawa", 12000.00, 6, 1, 2, 15, 35.00, 0],
      ["ULP Ungaran", 18500.00, 10, 2, 2, 25, 60.00, 1]
    ];
    
    defaultTargets.forEach(row => targetSheet.appendRow(row));
  }

  // Setup Users
  let userSheet = ss.getSheetByName(SHEET_USERS);
  if (!userSheet) {
    userSheet = ss.insertSheet(SHEET_USERS);
    const userHeaders = ["Username", "Password", "Role"];
    userSheet.appendRow(userHeaders);
    userSheet.getRange(1, 1, 1, userHeaders.length).setFontWeight("bold").setBackground("#F1F5F9");
    
    // Akun default (PIN 52351 tetap didukung sebagai password/PIN)
    const defaultUsers = [
      ["admin", "52351", "Administrator"],
      ["petugas", "52351", "Petugas"],
      ["salatiga", "52351", "Petugas"]
    ];
    defaultUsers.forEach(row => userSheet.appendRow(row));
  }
}

/**
 * Helper CORS: Mengembalikan output JSON dengan header CORS yang tepat
 */
function jsonResponse(data) {
  const jsonString = JSON.stringify(data);
  return ContentService.createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Helper untuk memformat objek Date atau String Tanggal secara aman ke "yyyy-MM-dd"
 */
function formatDateString(dateVal) {
  if (!dateVal) return "";
  try {
    // Jika berupa objek Date
    if (dateVal instanceof Date) {
      return Utilities.formatDate(dateVal, Session.getScriptTimeZone(), "yyyy-MM-dd");
    }
    // Jika berupa string, parsing dulu
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
    }
  } catch (e) {
    // abaikan error
  }
  return String(dateVal).split("T")[0]; // Fallback string split
}

/**
 * Helper untuk membaca nilai target/realisasi secara aman dari cell (menjaga cell kosong sebagai "")
 */
function readSubmissionValue(val) {
  if (val === "" || val === null || val === undefined) return "";
  const num = Number(val);
  return isNaN(num) ? "" : num;
}

/**
 * Helper untuk memvalidasi nilai target/realisasi dari payload sebelum disimpan (menjaga data kosong sebagai "")
 */
function parseSubmissionValue(val) {
  if (val === "" || val === null || val === undefined) return "";
  const num = Number(val);
  return isNaN(num) ? "" : num;
}

/**
 * Mengambil data (Riwayat Laporan & Target)
 */
function doGet(e) {
  setupDatabase(); // Pastikan database siap
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const action = e.parameter.action;
  
  try {
    // 1. Ambil Data Target ULP
    const targetSheet = ss.getSheetByName(SHEET_TARGETS);
    const targetRows = targetSheet.getDataRange().getValues();
    const targets = {};
    
    for (let i = 1; i < targetRows.length; i++) {
      const row = targetRows[i];
      if (!row[0]) continue;
      targets[row[0]] = {
        ulp: row[0],
        kwh_p2tl: readSubmissionValue(row[1]),
        kwh_tua: readSubmissionValue(row[2]),
        gangguan_permanen: readSubmissionValue(row[3]),
        gangguan_temporer: readSubmissionValue(row[4]),
        pelanggan: readSubmissionValue(row[5]),
        daya: readSubmissionValue(row[6]),
        abt_lisdes: readSubmissionValue(row[7])
      };
    }
    
    if (action === "getTargets") {
      return jsonResponse({ success: true, data: targets });
    }
    
    // 2. Ambil Riwayat Laporan (Limit 50 terbaru)
    const subSheet = ss.getSheetByName(SHEET_SUBMISSIONS);
    const subRows = subSheet.getDataRange().getValues();
    const submissions = [];
    
    // Mulai dari baris terbawah (terbaru)
    for (let i = subRows.length - 1; i >= 1; i--) {
      const row = subRows[i];
      if (!row[0]) continue;
      submissions.push({
        id: row[0],
        timestamp: row[1] ? row[1].toString() : "",
        tanggal: formatDateString(row[2]),
        ulp: row[3],
        kwh_p2tl: { target: readSubmissionValue(row[4]), realisasi: readSubmissionValue(row[5]) },
        kwh_tua: { target: readSubmissionValue(row[6]), realisasi: readSubmissionValue(row[7]) },
        gangguan_permanen: { target: readSubmissionValue(row[8]), realisasi: readSubmissionValue(row[9]) },
        gangguan_temporer: { target: readSubmissionValue(row[10]), realisasi: readSubmissionValue(row[11]) },
        pelanggan: { target: readSubmissionValue(row[12]), realisasi: readSubmissionValue(row[13]) },
        daya: { target: readSubmissionValue(row[14]), realisasi: readSubmissionValue(row[15]) },
        abt_lisdes: { target: readSubmissionValue(row[16]), realisasi: readSubmissionValue(row[17]) },
        petugas: row[18]
      });
      if (submissions.length >= 50) break; // Batasi 50 laporan terakhir
    }
    
    return jsonResponse({
      success: true,
      targets: targets,
      submissions: submissions
    });
    
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Menyimpan atau memperbarui data Laporan Harian
 */
function doPost(e) {
  setupDatabase();
  
  try {
    let payload;
    if (e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = e.parameter;
      }
    } else {
      payload = e.parameter;
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 0. Cek Aksi Login
    if (payload.action === "login") {
      const usernameInput = String(payload.username || "").trim();
      const passwordInput = String(payload.password || "").trim();
      
      const userSheet = ss.getSheetByName(SHEET_USERS);
      const userRows = userSheet.getDataRange().getValues();
      
      for (let i = 1; i < userRows.length; i++) {
        const dbUsername = String(userRows[i][0] || "").trim();
        const dbPassword = String(userRows[i][1] || "").trim();
        
        if (dbUsername.toLowerCase() === usernameInput.toLowerCase() && dbPassword === passwordInput) {
          return jsonResponse({ success: true, username: dbUsername });
        }
      }
      return jsonResponse({ success: false, error: "Username atau Password/PIN salah!" });
    }
    
    const subSheet = ss.getSheetByName(SHEET_SUBMISSIONS);
    const subRows = subSheet.getDataRange().getValues();
    
    const id = payload.id || "EDDP_" + new Date().getTime();
    const timestamp = new Date();
    const tanggal = payload.tanggal; // format: "YYYY-MM-DD" atau string tanggal
    const ulp = payload.ulp;
    const petugas = payload.petugas || "Sistem";
    
    const formattedTanggal = formatDateString(tanggal);
    
    const values = [
      id,
      timestamp,
      formattedTanggal,
      ulp,
      parseSubmissionValue(payload.kwh_p2tl_target),
      parseSubmissionValue(payload.kwh_p2tl_realisasi),
      parseSubmissionValue(payload.kwh_tua_target),
      parseSubmissionValue(payload.kwh_tua_realisasi),
      parseSubmissionValue(payload.gangguan_permanen_target),
      parseSubmissionValue(payload.gangguan_permanen_realisasi),
      parseSubmissionValue(payload.gangguan_temporer_target),
      parseSubmissionValue(payload.gangguan_temporer_realisasi),
      parseSubmissionValue(payload.pelanggan_target),
      parseSubmissionValue(payload.pelanggan_realisasi),
      parseSubmissionValue(payload.daya_target),
      parseSubmissionValue(payload.daya_realisasi),
      parseSubmissionValue(payload.abt_lisdes_target),
      parseSubmissionValue(payload.abt_lisdes_realisasi),
      petugas
    ];
    
    // Cari apakah sudah ada laporan untuk ULP dan Tanggal yang sama
    let existingRowIndex = -1;
    if (formattedTanggal) {
      for (let i = 1; i < subRows.length; i++) {
        const sheetTanggal = formatDateString(subRows[i][2]);
        if (sheetTanggal === formattedTanggal && subRows[i][3] === ulp) {
          existingRowIndex = i + 1; // 1-indexed sheet row
          break;
        }
      }
    }
    
    if (existingRowIndex > -1) {
      // Update baris yang ada (menjaga ID asli)
      values[0] = subRows[existingRowIndex - 1][0]; // Gunakan ID lama
      subSheet.getRange(existingRowIndex, 1, 1, values.length).setValues([values]);
      return jsonResponse({ success: true, message: "Laporan berhasil diperbarui!", id: values[0] });
    } else {
      // Tambahkan baris baru
      subSheet.appendRow(values);
      return jsonResponse({ success: true, message: "Laporan baru berhasil disimpan!", id: id });
    }
    
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}
