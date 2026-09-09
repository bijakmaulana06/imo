import {normalizeNim} from './identity.mjs';
import * as XLSX from 'xlsx';

function onlyKeys(object, allowed, label) {
  if (!object || typeof object !== "object" || Array.isArray(object)) throw new Error(`${label} harus berupa objek JSON.`);
  if (Object.keys(object).some((key) => !allowed.includes(key))) throw new Error(`${label} mengandung kolom yang tidak didukung: gunakan kolom yang didokumentasikan.`);
}

function textField(value, min, max, label) {
  if (typeof value !== "string" || value.trim().length < min || value.length > max) throw new Error(`${label} harus berupa teks ${min}–${max} karakter.`);
  return value.trim();
}

export function parseVoterExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array', raw: false });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
  
  if (!rows || rows.length < 2) throw new Error("File Excel harus berisi baris header 'NIM' dan minimal satu baris data NIM.");
  
  const headerRow = rows[0];
  const headerVal = String(headerRow?.[0] || "").trim().toLowerCase();
  if (!headerVal.includes("nim")) {
    throw new Error("Kolom pertama pada baris pertama harus berisi judul 'NIM'.");
  }
  
  const dataRows = rows.slice(1);
  if (!dataRows.length) throw new Error("File Excel tidak memiliki baris data setelah header 'NIM'.");
  if (dataRows.length > 10000) throw new Error("Maksimal 10.000 data pemilih per file.");
  
  const seen = new Set();
  const nims = [];
  
  dataRows.forEach((row, index) => {
    const rawValue = row[0];
    if (rawValue === undefined || rawValue === null || rawValue === "") return;
    const value = String(rawValue).trim();
    if (!value) return;
    
    let nim;
    try { nim = normalizeNim(value); }
    catch (err) { throw new Error(`NIM tidak valid pada baris Excel ${index + 2}: ${err instanceof Error ? err.message : String(err)}`); }
    if (seen.has(nim)) throw new Error(`NIM duplikat '${nim}' pada baris Excel ${index + 2}.`);
    seen.add(nim);
    nims.push(nim);
  });
  
  if (nims.length === 0) throw new Error("Tidak ada data NIM yang valid di dalam file Excel.");
  return nims;
}

export function validateNamedVoter(input) {
  if (!input || typeof input !== "object") throw new Error("Isi NIM dan nama pemilih.");
  const nim = normalizeNim(input.nim);
  const name = textField(input.name, 1, 160, "Nama pemilih").replace(/\s+/g, " ");
  if (/[\u0000-\u001f\u007f]/.test(input.name)) throw new Error("Nama pemilih mengandung karakter tidak valid.");
  return { nim, name };
}

export function parseNamedVoterExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error("File Excel tidak memiliki lembar data.");
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });
  if (String(rows[0]?.[0]).trim().toUpperCase() !== "NIM" || String(rows[0]?.[1]).trim().toUpperCase() !== "NAMA") throw new Error("Gunakan template dengan kolom NIM dan NAMA pada baris pertama.");
  const result = [], seen = new Set();
  rows.slice(1).forEach((row,index) => {
    if (row.every(value => !String(value).trim())) return;
    let voter;
    try { voter = validateNamedVoter({ nim: String(row[0] ?? ""), name: String(row[1] ?? "") }); }
    catch (error) { throw new Error(`Baris Excel ${index + 2}: ${error.message}`); }
    if (seen.has(voter.nim)) throw new Error(`NIM duplikat pada baris Excel ${index + 2}.`);
    seen.add(voter.nim); result.push(voter);
  });
  if (!result.length || result.length > 10000) throw new Error("File harus berisi 1–10.000 pemilih.");
  return result;
}

export function parseCsv(source) {
  const rows = [];
  let row = [], field = "", quoted = false, afterQuote = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') { quoted = false; afterQuote = true; }
      else field += char;
      continue;
    }
    if (afterQuote && char !== "," && char !== "\r" && char !== "\n") throw new Error("CSV memiliki karakter setelah penutup tanda kutip.");
    if (char === '"') {
      if (field.length || afterQuote) throw new Error("Tanda kutip CSV tidak valid.");
      quoted = true;
    } else if (char === ",") {
      row.push(field); field = ""; afterQuote = false;
    } else if (char === "\r" || char === "\n") {
      if (char === "\r" && source[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = ""; afterQuote = false;
    } else field += char;
  }
  if (quoted) throw new Error("Tanda kutip CSV belum ditutup.");
  if (field.length || row.length || afterQuote) { row.push(field); rows.push(row); }
  return rows;
}

export function parseVoterCsv(source) {
  const rows = parseCsv(source.replace(/^\uFEFF/, ""))
    .map((values, index) => ({ values, record: index + 1 }))
    .filter(({ values }) => values.some((value) => value.trim()));
  const headerIndex = rows.findIndex(({ values }) => values.some((value) => value.trim().toLowerCase() === "nim"));
  if (headerIndex < 0) throw new Error("CSV harus mempunyai tepat satu kolom nim.");
  const header = rows[headerIndex].values.map((value) => value.trim().toLowerCase());
  if (header.filter((value) => value === "nim").length !== 1) throw new Error("CSV harus mempunyai tepat satu kolom nim.");
  const dataRows = rows.slice(headerIndex + 2);
  if (!dataRows.length || dataRows.length > 10000) throw new Error("Impor harus berisi 1–10.000 pemilih setelah baris pertama dikecualikan.");
  const seen = new Set();
  return dataRows.map(({ values: row, record }) => {
    if (row.length !== header.length) throw new Error(`Jumlah kolom tidak sesuai pada record CSV ${record}: harus ${header.length} kolom, ditemukan ${row.length}.`);
    let nim;
    try { nim = normalizeNim(row[header.indexOf("nim")]); }
    catch { throw new Error(`NIM tidak valid pada record CSV ${record}, kolom ${header.indexOf("nim") + 1}.`); }
    if (seen.has(nim)) throw new Error(`NIM duplikat setelah normalisasi pada record CSV ${record}.`);
    seen.add(nim);
    return nim;
  });
}

export function validateElection(input, partial = false) {
  onlyKeys(input, ["title", "year", "status", "opens_at", "closes_at", "is_current"], "Pemilihan");
  const result = { ...input };
  if (!partial || "title" in input) result.title = textField(input.title, 1, 160, "Judul");
  if (!partial || "year" in input) result.year = textField(input.year, 1, 20, "Tahun");
  if ("status" in input && !["draft", "open", "closed"].includes(input.status)) throw new Error("Status harus draft, open, atau closed.");
  if ("is_current" in input && typeof input.is_current !== "boolean") throw new Error("is_current harus boolean.");
  for (const key of ["opens_at", "closes_at"]) {
    if (input[key] != null && (typeof input[key] !== "string" || !/(Z|[+-]\d{2}:\d{2})$/.test(input[key]) || !Number.isFinite(Date.parse(input[key])))) {
      throw new Error(`${key} harus waktu ISO 8601 dengan zona waktu, atau null.`);
    }
  }
  if (input.opens_at && input.closes_at && Date.parse(input.closes_at) <= Date.parse(input.opens_at)) throw new Error("closes_at harus sesudah opens_at.");
  return result;
}

export function validateCandidates(input, electionId) {
  if (!Array.isArray(input) || !input.length || input.length > 50) throw new Error("Kandidat harus berupa array berisi 1–50 objek.");
  const numbers = new Set();
  return input.map((candidate) => {
    onlyKeys(candidate, ["number", "name", "tagline", "vision", "mission", "photo_key", "accent", "is_active"], "Kandidat");
    if (!Number.isInteger(candidate.number) || candidate.number < 1 || candidate.number > 99 || numbers.has(candidate.number)) throw new Error("Nomor kandidat harus unik, angka 1–99.");
    numbers.add(candidate.number);
    const mission = candidate.mission ?? [];
    if (!Array.isArray(mission) || mission.length > 12) throw new Error("Misi maksimal 12 butir.");
    const photoKey = candidate.photo_key ?? null;
    if (photoKey !== null && (typeof photoKey !== "string" || !/^[A-Za-z0-9][A-Za-z0-9/_.-]{0,400}$/.test(photoKey) || photoKey.split("/").some((part) => !part || part === "." || part === ".."))) throw new Error("photo_key harus object key R2, bukan URL atau path relatif.");
    if (candidate.accent != null && !/^#[0-9a-f]{6}$/i.test(candidate.accent)) throw new Error("accent harus warna heksadesimal #RRGGBB.");
    if (candidate.is_active != null && typeof candidate.is_active !== "boolean") throw new Error("is_active harus boolean.");
    return {
      election_id: electionId, number: candidate.number,
      name: textField(candidate.name, 1, 120, "Nama kandidat"),
      tagline: textField(candidate.tagline ?? "", 0, 240, "Tagline"),
      vision: textField(candidate.vision ?? "", 0, 3000, "Visi"),
      mission: mission.map((item) => textField(item, 1, 600, "Misi")),
      photo_key: photoKey, accent: candidate.accent ?? "#bfa276", is_active: candidate.is_active ?? true,
    };
  });
}
