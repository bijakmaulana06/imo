import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fs from "fs";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import {
  buildDocumentFileName,
  prepareFormDataForDocx,
} from "@/lib/documentHelper";

const execFileAsync = promisify(execFile);

interface CachedTemplate {
  template: any;
  fileBuffer: Buffer;
  cachedAt: number;
}
const templateCache = new Map<string, CachedTemplate>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, formData, outputFormat = "pdf" } = body;

    if (!templateId || !formData) {
      return NextResponse.json(
        { error: "templateId dan formData wajib disertakan" },
        { status: 400 }
      );
    }

    let template: any = null;
    let fileBuffer: Buffer | null = null;

    // Check in-memory cache first (valid for 1 hour)
    const cached = templateCache.get(templateId);
    if (cached && Date.now() - cached.cachedAt < 3600000) {
      template = cached.template;
      fileBuffer = cached.fileBuffer;
    } else {
      let supabase = await createClient();
      if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const { createClient: createSupabaseJsClient } = await import("@supabase/supabase-js");
        supabase = createSupabaseJsClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        ) as any;
      }

      // 1. Ambil metadata template dari database
      const { data: dbTemplate, error: dbError } = await supabase
        .from("document_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (dbError || !dbTemplate) {
        return NextResponse.json(
          { error: "Template dokumen tidak ditemukan di database" },
          { status: 404 }
        );
      }
      template = dbTemplate;

      // 2. Ambil file template .docx dari Supabase Storage atau fetch URL dengan fallback
      const targetUrl = template.file_url || template.file_path || "";

      if (targetUrl.startsWith("http")) {
        try {
          const res = await fetch(targetUrl);
          if (res.ok) {
            fileBuffer = Buffer.from(await res.arrayBuffer());
          }
        } catch (e) {
          console.warn("Direct HTTP fetch template URL failed, trying Supabase storage client download fallback...", e);
        }
      }

      if (!fileBuffer) {
        let relativePath = template.file_path || targetUrl;
        if (targetUrl.includes("/templates/")) {
          relativePath = targetUrl.split("/templates/").pop() || relativePath;
        } else if (targetUrl.includes("/document_templates/")) {
          relativePath = targetUrl.split("/document_templates/").pop() || relativePath;
        }

        let { data: fileData, error: downloadError } = await supabase.storage
          .from("templates")
          .download(relativePath);

        if ((downloadError || !fileData) && targetUrl.includes("document_templates")) {
          const altRes = await supabase.storage
            .from("document_templates")
            .download(relativePath);
          if (altRes.data) {
            fileData = altRes.data;
            downloadError = null;
          }
        }

        if (downloadError || !fileData) {
          console.error("Supabase storage download error:", downloadError);
          throw new Error(
            `Gagal mengunduh file template .docx dari storage. Pastikan file template tersedia di Supabase Storage.`
          );
        }
        fileBuffer = Buffer.from(await fileData.arrayBuffer());
      }

      // Save to memory cache
      if (template && fileBuffer) {
        templateCache.set(templateId, {
          template,
          fileBuffer,
          cachedAt: Date.now(),
        });
      }
    }

    // 3. Clean & Populate tag menggunakan pizzip & docxtemplater
    const zip = new PizZip(fileBuffer);

    // Membersihkan tag pengganggu spellcheck / grammar Word (<w:proofErr>, <w:noProof>, dll) & auto-repair tag mistyped
    Object.keys(zip.files).forEach((fileName) => {
      if (fileName.startsWith("word/") && fileName.endsWith(".xml")) {
        const rawXml = zip.files[fileName].asText();
        let cleanedXml = rawXml
          .replace(/<w:proofErr[^>]*\/>/g, "")
          .replace(/<w:proofWarning[^>]*\/>/g, "")
          .replace(/<w:noProof[^>]*\/>/g, "")
          .replace(/<w:lang[^>]*\/>/g, "");
        
        // Auto-repair tag mistyped seperti {prodi), {tag) menjadi {prodi} {tag}
        cleanedXml = cleanedXml.replace(/\{([a-zA-Z0-9_\-\s]+)\)[,\s]*/g, "{$1} ");
        zip.file(fileName, cleanedXml);
      }
    });

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: (part) => {
        // Fallback ke string kosong jika data form untuk tag tersebut tidak terisi
        return "";
      },
    });

    // Sanitasi data form & format tanggal resmi Indonesia beserta lokasi
    const sanitizedData = prepareFormDataForDocx(
      formData,
      template.fields_config || []
    );

    // Render tag dengan data ter-sanitasi
    try {
      doc.render(sanitizedData);
    } catch (renderError: any) {
      console.error("Docxtemplater Render Error Object:", renderError);
      let detailErrs = "";
      if (renderError.properties && Array.isArray(renderError.properties.errors)) {
        detailErrs = renderError.properties.errors
          .map((e: any) => {
            return e.properties?.explanation || e.properties?.id || e.message || "Unknown sub-error";
          })
          .join(" | ");
      }
      const finalMsg = detailErrs || renderError.message || "Gagal mengganti tag pada dokumen Word.";
      throw new Error(`Error Tag Dokumen: ${finalMsg}`);
    }

    const generatedDocxBuffer = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    const docxFileName = buildDocumentFileName(template.title, formData, "docx");
    const encodedDocxFileName = encodeURIComponent(docxFileName);

    // Jika format yang diminta adalah docx
    if (outputFormat === "docx") {
      return new NextResponse(new Uint8Array(generatedDocxBuffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${docxFileName.replace(/"/g, '')}"; filename*=UTF-8''${encodedDocxFileName}`,
        },
      });
    }

    // 4. Konversi DOCX terisi ke PDF Native (100% Layout & Format DOCX Terjaga Tanpa HTML)
    let pdfBuffer: Buffer | null = null;

    // 4a. Coba konversi via Python docx2pdf / LibreOffice lokal jika ada
    try {
      const tmpDir = os.tmpdir();
      const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const tempInputDocx = path.join(tmpDir, `input_${uniqueId}.docx`);
      const tempOutputPdf = path.join(tmpDir, `output_${uniqueId}.pdf`);

      fs.writeFileSync(tempInputDocx, generatedDocxBuffer);

      try {
        const pythonPaths = [
          "C:\\Users\\bijak\\AppData\\Local\\Programs\\Python\\Python311\\python.exe",
          "python",
          "python3",
        ];
        let pyExec = "python";
        for (const p of pythonPaths) {
          if (p.includes("\\") ? fs.existsSync(p) : true) {
            pyExec = p;
            break;
          }
        }

        const scriptPath = path.join(process.cwd(), "lib", "convert_docx.py");
        await execFileAsync(pyExec, [scriptPath, tempInputDocx, tempOutputPdf], {
          timeout: 15000,
        });

        if (fs.existsSync(tempOutputPdf)) {
          pdfBuffer = fs.readFileSync(tempOutputPdf);
        }
      } catch (localErr) {
        console.warn("Local Word/Python conversion note, switching to Native Cloud Engine:", localErr);
      } finally {
        setTimeout(() => {
          if (fs.existsSync(tempInputDocx)) fs.unlinkSync(tempInputDocx);
          if (fs.existsSync(tempOutputPdf)) fs.unlinkSync(tempOutputPdf);
        }, 1000);
      }
    } catch (e) {
      console.warn("Local temp file error:", e);
    }

    // 4b. Jika konversi lokal tidak menghasilkan PDF, gunakan Native LibreOffice Conversion Engine
    if (!pdfBuffer) {
      try {
        const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
        const postDataHead = Buffer.from(
          `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="files"; filename="document.docx"\r\n` +
          `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document\r\n\r\n`
        );
        const postDataTail = Buffer.from(`\r\n--${boundary}--\r\n`);
        const fullPayload = Buffer.concat([postDataHead, generatedDocxBuffer, postDataTail]);

        const response = await fetch("https://demo.gotenberg.dev/forms/libreoffice/convert", {
          method: "POST",
          headers: {
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
          },
          body: fullPayload,
        });

        if (response.ok) {
          const pdfArrayBuf = await response.arrayBuffer();
          pdfBuffer = Buffer.from(pdfArrayBuf);
        } else {
          console.error("Gotenberg native PDF engine status error:", response.status);
        }
      } catch (cloudErr) {
        console.error("Gotenberg native PDF engine network error:", cloudErr);
      }
    }

    if (!pdfBuffer) {
      throw new Error("Gagal mengkonversi dokumen Word ke PDF Native. Pastikan koneksi internet stabil.");
    }

    const pdfFileName = buildDocumentFileName(template.title, formData, "pdf");
    const encodedPdfFileName = encodeURIComponent(pdfFileName);

    // Kembalikan PDF Native
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdfFileName.replace(/"/g, '')}"; filename*=UTF-8''${encodedPdfFileName}`,
      },
    });
  } catch (err: any) {
    console.error("Auto Form Generate Document Error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal meng-generate dokumen" },
      { status: 500 }
    );
  }
}
