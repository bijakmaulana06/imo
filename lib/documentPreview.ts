import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import mammoth from "mammoth";
import { DocumentFieldConfig } from "@/types/document";

export interface PreviewResult {
  html: string;
  totalFields: number;
  filledCount: number;
  missingRequired: string[];
}

/**
 * Clean internal Word XML strings (remove proofing errors, spellchecks, split tags)
 */
export function cleanDocxZip(zip: PizZip): PizZip {
  Object.keys(zip.files).forEach((fileName) => {
    if (fileName.startsWith("word/") && fileName.endsWith(".xml")) {
      const rawXml = zip.files[fileName].asText();
      let cleanedXml = rawXml
        .replace(/<w:proofErr[^>]*\/>/g, "")
        .replace(/<w:proofWarning[^>]*\/>/g, "")
        .replace(/<w:noProof[^>]*\/>/g, "")
        .replace(/<w:lang[^>]*\/>/g, "");

      // Auto-repair mistyped tags like {prodi), {tag) -> {prodi} {tag}
      cleanedXml = cleanedXml.replace(/\{([a-zA-Z0-9_\-\s]+)\)[,\s]*/g, "{$1} ");
      zip.file(fileName, cleanedXml);
    }
  });
  return zip;
}

/**
 * Generate Realtime HTML Preview from a DOCX ArrayBuffer and current formData
 */
export async function generateDocumentPreviewHtml(
  docxArrayBuffer: ArrayBuffer,
  formData: Record<string, any>,
  fieldsConfig: DocumentFieldConfig[] = [],
  highlightMode: boolean = true
): Promise<PreviewResult> {
  const zip = new PizZip(docxArrayBuffer.slice(0));
  cleanDocxZip(zip);

  const missingRequired: string[] = [];
  let filledCount = 0;
  const totalFields = fieldsConfig.length;

  // Build field map for quick lookup
  const fieldMap = new Map<string, DocumentFieldConfig>();
  fieldsConfig.forEach((f) => fieldMap.set(f.tag, f));

  // Determine filled / empty status
  fieldsConfig.forEach((field) => {
    const val = formData[field.tag];
    const hasValue = val !== undefined && val !== null && String(val).trim() !== "";
    if (hasValue) {
      filledCount++;
    } else if (field.required !== false) {
      missingRequired.push(field.label || field.tag);
    }
  });

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: (part) => {
      const tag = part.value;
      if (highlightMode) {
        const field = fieldMap.get(tag);
        const label = field?.label || tag;
        return `[[EMPTY:${label}]]`;
      }
      return "........................";
    },
  });

  // Prepare sanitized data for docxtemplater
  const sanitizedData: Record<string, string> = {};
  
  // Fill all configured fields
  fieldsConfig.forEach((field) => {
    const tag = field.tag;
    const val = formData[tag];
    const hasValue = val !== undefined && val !== null && String(val).trim() !== "";

    if (hasValue) {
      const stringVal = String(val);
      if (highlightMode) {
        sanitizedData[tag] = `[[FILLED:${stringVal}]]`;
      } else {
        sanitizedData[tag] = stringVal;
      }
    } else {
      if (highlightMode) {
        sanitizedData[tag] = `[[EMPTY:${field.label || tag}]]`;
      } else {
        sanitizedData[tag] = "........................";
      }
    }
  });

  // Also include any extra form data keys not explicitly in fieldsConfig
  Object.keys(formData).forEach((key) => {
    if (!(key in sanitizedData)) {
      const val = formData[key];
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        sanitizedData[key] = highlightMode ? `[[FILLED:${String(val)}]]` : String(val);
      }
    }
  });

  doc.render(sanitizedData);

  const generatedBuffer = doc.getZip().generate({
    type: "arraybuffer",
    compression: "DEFLATE",
  });

  const conversionResult = await mammoth.convertToHtml({
    arrayBuffer: generatedBuffer,
  });

  let rawHtml = conversionResult.value || "<p class='text-slate-500 italic'>Dokumen kosong</p>";

  if (highlightMode) {
    // Replace filled markers with visual highlight pills
    rawHtml = rawHtml.replace(
      /\[\[FILLED:(.*?)\]\]/g,
      `<span class="imo-doc-filled" title="Data Terisi">$1</span>`
    );
    // Replace empty markers with dashed placeholder pills
    rawHtml = rawHtml.replace(
      /\[\[EMPTY:(.*?)\]\]/g,
      `<span class="imo-doc-empty" title="Belum diisi">[ $1 ]</span>`
    );
  }

  return {
    html: rawHtml,
    totalFields,
    filledCount,
    missingRequired,
  };
}
