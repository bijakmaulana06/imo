import { DocumentFieldConfig } from "@/types/document";

export const INDONESIAN_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/**
 * Memformat string tanggal (misal '2026-02-17' atau '2026-09-04')
 * menjadi format resmi surat Indonesia:
 * {lokasi}, [tanggal] [bulan dalam bahasa Indonesia] [tahun]
 * Contoh: 'Jakarta, 17 Februari 2026' atau 'Semarang, 4 September 2026'
 */
export function formatIndonesianDate(
  dateValue: string,
  locationValue?: string
): string {
  if (!dateValue || typeof dateValue !== "string") return "";
  const trimmed = dateValue.trim();
  if (!trimmed) return "";

  let day: number | null = null;
  let month: number | null = null; // 1-12
  let year: number | null = null;

  // Cek format standar HTML date picker: YYYY-MM-DD
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    year = parseInt(ymdMatch[1], 10);
    month = parseInt(ymdMatch[2], 10);
    day = parseInt(ymdMatch[3], 10);
  } else {
    // Cek format DD-MM-YYYY atau DD/MM/YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmyMatch) {
      day = parseInt(dmyMatch[1], 10);
      month = parseInt(dmyMatch[2], 10);
      year = parseInt(dmyMatch[3], 10);
    } else {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        day = parsed.getDate();
        month = parsed.getMonth() + 1;
        year = parsed.getFullYear();
      }
    }
  }

  let formattedDate = trimmed;
  if (day && month && year && month >= 1 && month <= 12) {
    const monthName = INDONESIAN_MONTHS[month - 1];
    formattedDate = `${day} ${monthName} ${year}`;
  }

  // Bersihkan lokasi (buang spasi dan tanda koma di ujung kata)
  const cleanLoc = (locationValue || "")
    .trim()
    .replace(/,+$/, "")
    .trim();

  if (cleanLoc) {
    // Jika tanggal sudah mengandung nama lokasi tersebut, jangan diduplikasi
    if (formattedDate.toLowerCase().startsWith(cleanLoc.toLowerCase())) {
      return formattedDate;
    }
    return `${cleanLoc}, ${formattedDate}`;
  }

  return formattedDate;
}

/**
 * Menyusun nama file unduhan sesuai format:
 * *nama dokumen*_{nama}_{kelas}_TERISI.[ext]
 */
export function buildDocumentFileName(
  templateTitle: string,
  formData: Record<string, any> = {},
  extension: "pdf" | "docx" = "pdf"
): string {
  const cleanTitle = (templateTitle || "dokumen")
    .replace(/[\\/:*?"<>|\r\n\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Cari nilai tag nama
  const namaKey =
    Object.keys(formData).find((k) => {
      const lk = k.toLowerCase().trim();
      return lk === "nama" || lk === "nama_lengkap" || lk === "namasiswa" || lk === "nama_peserta";
    }) || "nama";

  const rawNama = formData[namaKey] || formData["nama"] || formData["Nama"] || "";
  const cleanNama = String(rawNama)
    .replace(/[\\/:*?"<>|\r\n\t]/g, "")
    .trim();

  // Cari nilai tag kelas
  const kelasKey =
    Object.keys(formData).find((k) => {
      const lk = k.toLowerCase().trim();
      return lk === "kelas" || lk === "rombel" || lk === "tingkat";
    }) || "kelas";

  const rawKelas = formData[kelasKey] || formData["kelas"] || formData["Kelas"] || "";
  const cleanKelas = String(rawKelas)
    .replace(/[\\/:*?"<>|\r\n\t]/g, "")
    .trim();

  // Format baku: *nama dokumen*_{nama}_{kelas}_TERISI
  const parts: string[] = [cleanTitle];

  if (cleanNama) {
    parts.push(cleanNama);
  }
  if (cleanKelas) {
    parts.push(cleanKelas);
  }
  parts.push("TERISI");

  return `${parts.join("_")}.${extension}`;
}

/**
 * Mengecek apakah fields_config sudah memiliki field lokasi/kota
 */
export function hasLocationFieldConfig(
  fieldsConfig: DocumentFieldConfig[] = []
): boolean {
  return fieldsConfig.some((f) => {
    const t = (f.tag || "").toLowerCase().trim();
    const l = (f.label || "").toLowerCase().trim();
    return (
      t === "lokasi" ||
      t === "kota" ||
      t.includes("lokasi") ||
      l.includes("lokasi") ||
      l.includes("kota penandatanganan")
    );
  });
}

/**
 * Menghasilkan daftar field efektif untuk form.
 * Jika tag lokasi tidak ada dalam template, secara otomatis menambahkan
 * input lokasi (wajib diisi, format teks biasa) tepat di belakang setiap field tanggal/date picker.
 */
export function getEffectiveDocumentFields(
  fieldsConfig: DocumentFieldConfig[] = []
): DocumentFieldConfig[] {
  const hasLoc = hasLocationFieldConfig(fieldsConfig);
  if (hasLoc) {
    return fieldsConfig;
  }

  const result: DocumentFieldConfig[] = [];

  fieldsConfig.forEach((field) => {
    result.push(field);

    const isDateField =
      field.type === "date" ||
      (field.tag || "").toLowerCase().includes("date") ||
      (field.tag || "").toLowerCase().includes("tanggal");

    if (isDateField) {
      // Tambahkan input lokasi wajib diisi tepat setelah field tanggal
      result.push({
        id: `auto_lokasi_${field.id || field.tag}`,
        tag: `lokasi_${field.tag}`,
        label: "Lokasi / Kota Penandatanganan",
        type: "text",
        placeholder: "Contoh: Semarang, Jakarta, Surabaya...",
        required: true,
        defaultValue: "",
      });
    }
  });

  return result;
}

/**
 * Mempersiapkan dan mensanitasi formData sebelum dikirim ke Docxtemplater.
 * Menggabungkan lokasi dan tanggal menjadi format:
 * {lokasi}, [tanggal] [bulan seperti 'februari'] [tahun]
 */
export function prepareFormDataForDocx(
  formData: Record<string, any>,
  fieldsConfig: DocumentFieldConfig[] = []
): Record<string, string> {
  const sanitized: Record<string, string> = {};

  if (formData && typeof formData === "object") {
    Object.keys(formData).forEach((key) => {
      const val = formData[key];
      sanitized[key] = val !== undefined && val !== null ? String(val) : "";
    });
  }

  const hasTemplateLokasi = hasLocationFieldConfig(fieldsConfig);

  // Ambil nilai lokasi umum jika ada
  const globalLocation =
    sanitized["lokasi"] ||
    sanitized["kota"] ||
    Object.keys(sanitized)
      .filter((k) => k.startsWith("lokasi_"))
      .map((k) => sanitized[k])
      .find((v) => v.trim() !== "") ||
    "";

  // Sinkronkan key lokasi
  if (globalLocation && !sanitized["lokasi"]) {
    sanitized["lokasi"] = globalLocation;
  }

  // Format setiap field tanggal
  fieldsConfig.forEach((field) => {
    const isDateField =
      field.type === "date" ||
      (field.tag || "").toLowerCase().includes("date") ||
      (field.tag || "").toLowerCase().includes("tanggal");

    if (isDateField) {
      const rawDate = sanitized[field.tag] || "";
      const locVal =
        sanitized[`lokasi_${field.tag}`] ||
        sanitized["lokasi"] ||
        sanitized["kota"] ||
        globalLocation;

      if (rawDate) {
        if (!hasTemplateLokasi) {
          // Template tidak punya tag {lokasi} mandiri:
          // Gabungkan lokasi ke dalam tag tanggal dengan format:
          // {lokasi}, [tanggal] [bulan] [tahun]
          sanitized[field.tag] = formatIndonesianDate(rawDate, locVal);
        } else {
          // Template punya tag {lokasi} mandiri:
          sanitized[field.tag] = formatIndonesianDate(rawDate);
          if (locVal && !sanitized["lokasi"]) {
            sanitized["lokasi"] = locVal;
          }
        }
      }
    }
  });

  return sanitized;
}
