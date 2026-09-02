import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { DocumentFieldConfig } from "@/types/document";

export interface PreviewStats {
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
 * Calculate Form Field Progress and Missing Fields
 */
export function calculateFormProgress(
  formData: Record<string, any>,
  fieldsConfig: DocumentFieldConfig[] = []
): PreviewStats {
  const missingRequired: string[] = [];
  let filledCount = 0;
  const totalFields = fieldsConfig.length;

  fieldsConfig.forEach((field) => {
    const val = formData[field.tag];
    const hasValue = val !== undefined && val !== null && String(val).trim() !== "";
    if (hasValue) {
      filledCount++;
    } else if (field.required !== false) {
      missingRequired.push(field.label || field.tag);
    }
  });

  return {
    totalFields,
    filledCount,
    missingRequired,
  };
}

/**
 * Generates an in-memory filled DOCX ArrayBuffer with genuine formatting
 */
export function generateFilledDocxBuffer(
  docxArrayBuffer: ArrayBuffer,
  formData: Record<string, any>,
  fieldsConfig: DocumentFieldConfig[] = []
): ArrayBuffer {
  const zip = new PizZip(docxArrayBuffer.slice(0));
  cleanDocxZip(zip);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
  });

  const sanitizedData: Record<string, string> = {};

  // Populate defined fields
  fieldsConfig.forEach((field) => {
    const tag = field.tag;
    const val = formData[tag];
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      sanitizedData[tag] = String(val);
    } else {
      sanitizedData[tag] = "";
    }
  });

  // Populate any other keys in formData
  Object.keys(formData).forEach((key) => {
    if (!(key in sanitizedData)) {
      const val = formData[key];
      sanitizedData[key] = val !== undefined && val !== null ? String(val) : "";
    }
  });

  doc.render(sanitizedData);

  return doc.getZip().generate({
    type: "arraybuffer",
    compression: "DEFLATE",
  });
}
