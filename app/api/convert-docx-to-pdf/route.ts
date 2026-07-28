import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "File .docx wajib dikirimkan dalam formData ('file')" },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Create temp directory for conversion
    const tmpDir = os.tmpdir();
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const inputPath = path.join(tmpDir, `input_${uniqueId}.docx`);
    const outputPath = path.join(tmpDir, `input_${uniqueId}.pdf`);

    // Write input DOCX file to disk
    fs.writeFileSync(inputPath, fileBuffer);

    try {
      // Find python executable path
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

      // Execute Python docx2pdf conversion
      await execFileAsync(pyExec, [scriptPath, inputPath, outputPath], {
        timeout: 30000,
      });

      if (!fs.existsSync(outputPath)) {
        throw new Error("File PDF hasil konversi tidak ditemukan di server");
      }

      const pdfBuffer = fs.readFileSync(outputPath);

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${file.name.replace(/\.docx$/i, "")}.pdf"`,
        },
      });
    } finally {
      // Cleanup temporary files asynchronously
      setTimeout(() => {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      }, 1000);
    }
  } catch (err: any) {
    console.error("DOCX to PDF Server Error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal mengonversi file Word ke PDF di server" },
      { status: 500 }
    );
  }
}
