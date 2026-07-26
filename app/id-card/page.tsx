"use client";

import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import Navbar from "@/components/Navbar";
import StarfieldBackground from "@/components/StarfieldBackground";
import Card from "@/components/Card";
import { toPng } from "html-to-image";
import html2canvas from "html2canvas";
import Cropper from "cropperjs";
import { GRIFFY_FONT_BASE64 } from "@/lib/griffyFont";
import {
  Download,
  User,
  Sparkles,
  CreditCard,
  Upload,
  Crop,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Check,
  X,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";

// Default SVG Placeholder Avatar DataURL
const DEFAULT_AVATAR_DATA_URL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="250" viewBox="0 0 200 250" fill="%230f172a"><rect width="200" height="250" fill="%230f172a"/><circle cx="100" cy="90" r="45" fill="%23334155"/><path d="M 30 220 C 30 150, 170 150, 170 220 Z" fill="%23334155"/><text x="100" y="240" font-family="sans-serif" font-size="12" fill="%237df9ff" text-anchor="middle">IMO PASFOTO</text></svg>`;

const DEFAULT_CUSTOM_HTML = `<div style="width:100%; height:100%; padding:24px; background:linear-gradient(135deg, #07142e 0%, #020510 60%, #1a0b36 100%); color:#fff; border-radius:16px; border:2px solid #7df9ff; box-shadow:0 0 30px rgba(125,249,255,0.3); display:flex; flex-direction:column; justify-content:space-between; position:relative; overflow:hidden; font-family:sans-serif;">
  
  <!-- Header Card -->
  <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(125,249,255,0.3); padding-bottom:12px; position:relative; z-index:4;">
    <div style="font-family:monospace; font-weight:bold; font-size:18px; color:#7df9ff; letter-spacing:2px;">
      IMO 2026 OFFICIAL ID
    </div>
    <span style="font-size:11px; padding:3px 10px; background:rgba(125,249,255,0.15); border:1px solid rgba(125,249,255,0.4); color:#7df9ff; border-radius:999px; font-family:monospace; text-transform:uppercase;">
      {peran}
    </span>
  </div>

  <!-- Main Body Section with Photo Layering -->
  <div style="margin-top:16px; margin-bottom:16px; display:flex; align-items:center; gap:16px; position:relative; z-index:3;">
    <!-- Pasfoto Photo Frame (Layer 1 & Layer 2) -->
    <div style="position:relative; width:95px; height:120px; flex-shrink:0; border-radius:12px; overflow:hidden; border:2px solid #7df9ff; box-shadow:0 0 15px rgba(125,249,255,0.4); background:#0f172a;">
      <!-- Layer 1: Cropped Pasfoto Image -->
      <img src="{foto}" style="width:100%; height:100%; object-fit:cover; display:block;" alt="Pasfoto" />
      <!-- Layer 2: Avatar Frame Overlay -->
      <div style="position:absolute; inset:0; border:1px solid rgba(255,255,255,0.2); pointer-events:none; background:linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%);"></div>
    </div>

    <!-- Participant Details (Layer 4: Top Text Overlay) -->
    <div style="flex-grow:1; display:flex; flex-direction:column; justify-content:center;">
      <div style="font-size:22px; font-weight:900; color:#ffffff; letter-spacing:0.5px; line-height:1.2; margin-bottom:4px;">
        {nama}
      </div>
      <div style="font-size:13px; font-family:monospace; color:#7df9ff; margin-bottom:3px;">
        NIM: {nim}
      </div>
      <div style="font-size:13px; color:#e2e8f0; font-family:monospace; margin-bottom:3px;">
        Kelompok: {kelompok}
      </div>
      <div style="font-size:11px; color:#94a3b8;">
        Jurusan: {jurusan}
      </div>
    </div>
  </div>

  <!-- Motto Quote & Footer Section -->
  <div style="position:relative; z-index:4;">
    <div style="font-size:11px; font-style:italic; color:#b48cff; border-left:2px solid #b48cff; padding-left:8px; margin-bottom:12px;">
      "{quote}"
    </div>
    <div style="font-size:11px; font-family:monospace; color:#64748b; border-top:1px solid rgba(255,255,255,0.1); padding-top:10px; display:flex; justify-content:space-between; align-items:center;">
      <span>VERIFIED MEMBER</span>
      <span>STATUS: ONLINE</span>
    </div>
  </div>
</div>`;

export default function IdCardGeneratorPage() {
  const [customHtml, setCustomHtml] = useState<string>(DEFAULT_CUSTOM_HTML);
  const [croppedPhoto, setCroppedPhoto] = useState<string>(DEFAULT_AVATAR_DATA_URL);

  const [formValues, setFormValues] = useState<Record<string, string>>({
    nama: "Budi Santoso",
    nim: "2026010042",
    kelompok: "Kelompok 1",
    jurusan: "Informatika / STEI",
    peran: "Peserta Resmi",
    quote: "Different Minds, One Generation Chasing Glories",
    foto: DEFAULT_AVATAR_DATA_URL,
    photo: DEFAULT_AVATAR_DATA_URL,
  });

  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Cropper Modal States
  const [showCropModal, setShowCropModal] = useState<boolean>(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [currentAspectRatio, setCurrentAspectRatio] = useState<number>(3 / 4);

  const cardRef = useRef<HTMLDivElement>(null);
  const cropperImageRef = useRef<HTMLImageElement | null>(null);
  const cropperInstanceRef = useRef<Cropper | null>(null);

  // Load Admin-configured HTML Template on Mount
  useEffect(() => {
    try {
      const savedAdminTemplate = localStorage.getItem("imo2026_id_card_html_template");
      if (savedAdminTemplate) {
        setCustomHtml(savedAdminTemplate);
      }
    } catch (e) {
      console.warn("Could not load saved admin template:", e);
    }
  }, []);

  // Initialize Cropper.js instance reliably
  const initCropper = useCallback(() => {
    if (!cropperImageRef.current) return;

    if (cropperInstanceRef.current) {
      cropperInstanceRef.current.destroy();
      cropperInstanceRef.current = null;
    }

    setTimeout(() => {
      if (!cropperImageRef.current) return;
      cropperInstanceRef.current = new Cropper(cropperImageRef.current, {
        aspectRatio: currentAspectRatio,
        viewMode: 1,
        dragMode: "move",
        autoCropArea: 0.9,
        restore: false,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
      });
    }, 150);
  }, [currentAspectRatio]);

  useEffect(() => {
    if (showCropModal && rawImageSrc) {
      initCropper();
    }
    return () => {
      if (cropperInstanceRef.current) {
        cropperInstanceRef.current.destroy();
        cropperInstanceRef.current = null;
      }
    };
  }, [showCropModal, rawImageSrc, initCropper]);

  // Extract text placeholders inside {key} automatically
  const detectedPlaceholders = useMemo(() => {
    const matches = customHtml.match(/{([a-zA-Z0-9_]+)}/g);
    if (!matches) return [];
    const keys = matches.map((m) => m.slice(1, -1));
    return Array.from(new Set(keys));
  }, [customHtml]);

  // Handle Photo File Select
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran foto maksimal 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // Reset input
  };

  // Apply Cropped Photo
  const handleApplyCrop = () => {
    if (!cropperInstanceRef.current) return;

    const canvas = cropperInstanceRef.current.getCroppedCanvas({
      width: 600,
      height: 800,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high",
    });

    if (canvas) {
      const croppedDataUrl = canvas.toDataURL("image/png");
      setCroppedPhoto(croppedDataUrl);
      setFormValues((prev) => ({
        ...prev,
        foto: croppedDataUrl,
        photo: croppedDataUrl,
      }));
    }

    setShowCropModal(false);
  };

  // Change Cropper Aspect Ratio
  const handleChangeAspectRatio = (ratio: number) => {
    setCurrentAspectRatio(ratio);
    if (cropperInstanceRef.current) {
      cropperInstanceRef.current.setAspectRatio(ratio);
    }
  };

  // Cropper Controls
  const handleZoom = (delta: number) => {
    cropperInstanceRef.current?.zoom(delta);
  };

  const handleRotate = (degree: number) => {
    cropperInstanceRef.current?.rotate(degree);
  };

  const handleResetCrop = () => {
    cropperInstanceRef.current?.reset();
  };

  // Update dynamic form value
  const handleInputChange = (key: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Reset template to default
  const handleResetTemplate = () => {
    try {
      localStorage.removeItem("imo2026_id_card_html_template");
      setCustomHtml(DEFAULT_CUSTOM_HTML);
    } catch (e) {
      console.warn("Could not reset template:", e);
    }
  };

  // Live replace placeholders inside HTML template
  const renderedHtml = useMemo(() => {
    let result = customHtml;

    // Handle foto/photo placeholder replacement intelligently
    ["foto", "photo"].forEach((photoKey) => {
      const srcAttrMatch = result.includes(`src="{${photoKey}}"`) || result.includes(`src='{${photoKey}}'`);
      const hrefAttrMatch =
        result.includes(`href="{${photoKey}}"`) ||
        result.includes(`href='{${photoKey}}'`) ||
        result.includes(`xlink:href="{${photoKey}}"`) ||
        result.includes(`xlink:href='{${photoKey}}'`);
      const urlCSSMatch = result.includes(`url('{${photoKey}}')`) || result.includes(`url("{${photoKey}}")`) || result.includes(`url({${photoKey}})`);
      const rawTagRegex = new RegExp(`{${photoKey}}`, "g");

      if (srcAttrMatch || hrefAttrMatch || urlCSSMatch) {
        result = result.replace(rawTagRegex, croppedPhoto);
      } else if (result.includes(`{${photoKey}}`)) {
        // Replace standalone {foto} with responsive contained image element
        const imgElement = `<span style="display:inline-block; max-width:100%; max-height:100%; vertical-align:middle; overflow:hidden; border-radius:inherit;"><img src="${croppedPhoto}" style="max-width:100%; max-height:100%; width:auto; height:auto; object-fit:contain; display:block;" alt="Pasfoto" /></span>`;
        result = result.replace(rawTagRegex, imgElement);
      }
    });

    // Transform SVG motto text into pure SVG vector tspan elements FIRST before replacing general placeholders
    const mottoVal = formValues["motto"] || formValues["quote"] || formValues["deskripsi"] || "";
    const mottoTextToWrap = mottoVal || "{motto}";
    const mottoWords = mottoTextToWrap.trim().split(/\s+/);
    const mottoLines: string[] = [];
    let mottoCurrentLine = "";
    for (const word of mottoWords) {
      if ((mottoCurrentLine + " " + word).trim().length <= 26) {
        mottoCurrentLine = (mottoCurrentLine + " " + word).trim();
      } else {
        if (mottoCurrentLine) mottoLines.push(mottoCurrentLine);
        mottoCurrentLine = word;
      }
    }
    if (mottoCurrentLine) mottoLines.push(mottoCurrentLine);

    const displayMottoLines = mottoLines.slice(0, 3);
    const mottoLineHeight = 6.2;
    const mottoTotalHeight = (displayMottoLines.length - 1) * mottoLineHeight;
    const mottoInitialY = 241 - mottoTotalHeight / 2;

    const mottoTspans = displayMottoLines
      .map((line, idx) => {
        const lineY = mottoInitialY + idx * mottoLineHeight;
        return `<tspan x="136" y="${lineY.toFixed(2)}">${line}</tspan>`;
      })
      .join("");

    const svgWrappedMotto = `<text fill="#0b1e36" font-size="5.2" font-family="'Griffy', cursive, sans-serif" font-weight="bold" dominant-baseline="central" text-anchor="start">${mottoTspans}</text>`;

    result = result.replace(
      /<foreignObject\b[^>]*>(?:(?!<\/foreignObject>)[\s\S])*?(\{motto\}|\{quote\}|\{deskripsi\})(?:(?!<\/foreignObject>)[\s\S])*?<\/foreignObject>/gi,
      svgWrappedMotto
    );
    result = result.replace(
      /<text\b[^>]*>(?:(?!<\/text>)[\s\S])*?(\{motto\}|\{quote\}|\{deskripsi\})(?:(?!<\/text>)[\s\S])*?<\/text>/gi,
      svgWrappedMotto
    );
    result = result.replace(/\{motto\}|\{quote\}/g, svgWrappedMotto);

    // Replace font-family in SVG text tags to Griffy
    result = result.replace(/font-family="[^"]*"/gi, `font-family="'Griffy', cursive, sans-serif"`);

    detectedPlaceholders.forEach((key) => {
      if (key === "foto" || key === "photo" || key === "motto" || key === "quote" || key === "deskripsi") return;
      let val = formValues[key];
      if (val === undefined || val === "") {
        val = `{${key}}`;
      }
      const regex = new RegExp(`{${key}}`, "g");
      result = result.replace(regex, val);
    });

    // Scope <style> blocks so CSS rules don't leak into outer document
    return result.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (match, cssContent) => {
      const scopedCss = cssContent.replace(
        /([^{}+>,\s][^{}]+)\s*\{/g,
        (m: string, selector: string) => {
          const trimmed = selector.trim();
          if (trimmed.startsWith("@")) return m;
          const scopedSelectors = trimmed
            .split(",")
            .map((s: string) => `.id-card-preview-scope ${s.trim()}`)
            .join(", ");
          return `${scopedSelectors} {`;
        }
      );
      return `<style>${scopedCss}</style>`;
    });
  }, [customHtml, detectedPlaceholders, formValues, croppedPhoto]);

  // Export PNG Function - inject Griffy font into live SVG defs BEFORE html-to-image clones DOM
  const handleExportPng = useCallback(async () => {
    if (!cardRef.current) return;
    setIsExporting(true);

    // Track injected nodes for cleanup
    const injectedNodes: { parent: Element; child: Element }[] = [];

    try {
      // Step 1: Wait for fonts
      if (typeof document !== "undefined" && document.fonts) {
        await document.fonts.load("1em 'Griffy'");
        await document.fonts.ready;
      }

      const container = cardRef.current;

      // Step 2: Inject font into EVERY SVG element's defs on live DOM
      // html-to-image will clone the live DOM including our injected styles
      const allSvgs = Array.from(container.querySelectorAll("svg"));
      // Also inject into the container's root if it IS an svg
      if (container instanceof SVGElement) allSvgs.unshift(container as unknown as SVGSVGElement);

      for (const svgEl of allSvgs) {
        let defs = svgEl.querySelector(":scope > defs");
        if (!defs) {
          defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
          svgEl.prepend(defs);
          injectedNodes.push({ parent: svgEl, child: defs });
        }
        const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
        style.textContent = GRIFFY_FONT_BASE64;
        defs.prepend(style);
        injectedNodes.push({ parent: defs, child: style });
      }

      // Step 3: Also inject a <style> into document head as extra coverage
      const headStyle = document.createElement("style");
      headStyle.id = "__griffy_export_style__";
      headStyle.textContent = GRIFFY_FONT_BASE64;
      document.head.appendChild(headStyle);

      // Step 4: Wait one frame for the browser to parse the injected styles
      await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
      await new Promise((res) => setTimeout(res, 150));

      // Step 5: Export via html-to-image
      const dataUrl = await toPng(container, {
        cacheBust: false,
        pixelRatio: 4,
        quality: 1.0,
        fontEmbedCSS: GRIFFY_FONT_BASE64,
        skipFonts: true,
        imagePlaceholder: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        filter: (node) => {
          if (node instanceof HTMLElement && (node.id === "eruda" || node.tagName === "SCRIPT")) return false;
          return true;
        },
      });

      const link = document.createElement("a");
      const activeName = formValues["nama"] || "Participant";
      const safeName = activeName.trim().replace(/[^a-zA-Z0-9]/g, "_") || "IMO_Participant";
      link.download = `ID_CARD_IMO2026_${safeName}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err: any) {
      console.error("Export failed:", err);
      alert("Gagal memproses gambar. Silakan coba lagi.");
    } finally {
      // Cleanup all injected nodes
      for (const { parent, child } of injectedNodes) {
        if (parent.contains(child)) parent.removeChild(child);
      }
      const headStyle = document.getElementById("__griffy_export_style__");
      if (headStyle) document.head.removeChild(headStyle);
      setIsExporting(false);
    }
  }, [formValues]);

  // Format label from placeholder key (e.g. nomor_hp -> Nomor Hp)
  const formatLabel = (key: string) => {
    const keyMap: Record<string, string> = {
      nama: "Nama Lengkap",
      nim: "NIM / Nomor Peserta",
      kelompok: "Kelompok",
      jurusan: "Jurusan / Fakultas",
      peran: "Peran / Status Peserta",
      quote: "Motto / Jargon",
      foto: "Unggah & Potong Pasfoto",
      photo: "Unggah & Potong Pasfoto",
    };
    if (keyMap[key.toLowerCase()]) return keyMap[key.toLowerCase()];
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="relative min-h-screen flex flex-col z-0 overflow-hidden bg-[#020510] text-slate-100 font-sans">
      <StarfieldBackground />
      <Navbar />

      <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-12 relative z-10">
        {/* Header Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full border border-accent-cyan/30 bg-accent-cyan/5 text-accent-cyan text-xs font-bold uppercase tracking-wider mb-4">
            <CreditCard className="h-4 w-4" />
            <span>Kartu Identitas Resmi IMO 2026</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-black tracking-wider text-slate-100 mb-3">
            ID CARD GENERATOR
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Isi formulir dan unggah pasfoto Anda. Gunakan fitur **Pemotong Foto Interaktif** untuk mendapatkan ukuran pasfoto yang presisi.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT SIDE: CLEAN USER FORM */}
          <div className="lg:col-span-6 space-y-6">
            <Card glowColor="purple">
              <h3 className="font-display font-bold text-lg text-slate-100 mb-4 flex items-center space-x-2 border-b border-card-border/30 pb-3">
                <User className="h-5 w-5 text-accent-cyan" />
                <span>Formulir Data Peserta</span>
              </h3>

              {/* Photo Upload Section */}
              <div className="mb-5 pb-5 border-b border-card-border/30">
                <label className="block text-slate-300 uppercase font-mono tracking-wider mb-2 font-bold text-xs flex items-center space-x-2">
                  <ImageIcon className="h-4 w-4 text-accent-cyan" />
                  <span>Foto Profil / Pasfoto Peserta</span>
                </label>

                <div className="flex items-center space-x-4">
                  <div className="w-16 h-20 rounded-xl overflow-hidden bg-slate-950 border border-card-border/60 flex-shrink-0 relative shadow-inner">
                    <img src={croppedPhoto} alt="Preview Pasfoto" className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-grow space-y-2">
                    <label className="w-full px-4 py-2.5 rounded-xl bg-accent-cyan/15 hover:bg-accent-cyan/25 border border-accent-cyan/40 text-accent-cyan text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer transition touch-manipulation">
                      <Upload className="h-4 w-4" />
                      <span>{croppedPhoto !== DEFAULT_AVATAR_DATA_URL ? "Ganti & Potong Foto" : "Unggah & Potong Foto"}</span>
                      <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                    </label>

                    <p className="text-[11px] text-slate-400 font-mono">
                      Mendukung format JPG, PNG, WEBP (Maks 10MB).
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic Text Input Fields */}
              {detectedPlaceholders.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 italic">
                  Belum ada templat kartu yang dikonfigurasi.
                </p>
              ) : (
                <div className="space-y-4 text-xs font-sans">
                  {detectedPlaceholders
                    .filter((key) => key !== "foto" && key !== "photo")
                    .map((key) => {
                      const isLongText = key === "quote" || key === "deskripsi" || key === "motto";

                      return (
                        <div key={key}>
                          <label className="block text-slate-300 uppercase font-mono tracking-wider mb-1.5 font-bold">
                            {formatLabel(key)}
                          </label>

                          {isLongText ? (
                            <textarea
                              rows={2}
                              value={formValues[key] || ""}
                              onChange={(e) => handleInputChange(key, e.target.value)}
                              placeholder={`Masukkan ${formatLabel(key).toLowerCase()}...`}
                              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-card-border/50 text-slate-100 text-sm focus:outline-none focus:border-accent-cyan/60 font-sans"
                            />
                          ) : (
                            <input
                              type="text"
                              value={formValues[key] || ""}
                              onChange={(e) => handleInputChange(key, e.target.value)}
                              placeholder={`Masukkan ${formatLabel(key).toLowerCase()}...`}
                              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-card-border/50 text-slate-100 text-sm focus:outline-none focus:border-accent-cyan/60 font-sans"
                            />
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT SIDE: LIVE CARD PREVIEW & DOWNLOAD */}
          <div className="lg:col-span-6 sticky top-24 space-y-6">
            <Card glowColor="cyan" className="flex flex-col items-center">
              <div className="w-full flex justify-between items-center mb-6 border-b border-card-border/30 pb-3 flex-wrap gap-2">
                <span className="font-mono text-xs text-accent-cyan font-bold uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="h-4 w-4" />
                  <span>Preview Tampilan Kartu</span>
                </span>

                <button
                  onClick={handleExportPng}
                  disabled={isExporting}
                  className="px-4 py-2 rounded-xl bg-accent-cyan hover:bg-cyan-300 text-black text-xs font-mono font-bold uppercase tracking-wider transition shadow-[0_0_15px_rgba(125,249,255,0.4)] flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 touch-manipulation"
                >
                  <Download className="h-4 w-4" />
                  <span>{isExporting ? "Memproses..." : "Unduh Gambar PNG"}</span>
                </button>
              </div>

              {/* CARD PREVIEW CANVAS FOR PNG DOWNLOAD */}
              <div className="w-full flex justify-center items-center overflow-hidden py-2">
                <div
                  ref={cardRef}
                  className="w-full max-w-[450px] min-h-[250px] rounded-2xl relative select-none overflow-hidden transition-all duration-500 shadow-2xl flex flex-col justify-center items-center"
                  style={{ textRendering: "geometricPrecision", shapeRendering: "geometricPrecision" }}
                >
                  <div
                    className="id-card-preview-scope w-full h-full flex flex-col justify-center items-center"
                    dangerouslySetInnerHTML={{ __html: renderedHtml }}
                  />
                </div>
              </div>

              <div className="mt-6 text-center text-xs text-slate-500 font-mono">
                Isi form di sebelah kiri untuk melihat perubahan secara live, lalu klik tombol **Unduh Gambar PNG**.
              </div>
            </Card>
          </div>

        </div>
      </main>

      {/* CROPPER.JS INTERACTIVE MODAL */}
      {showCropModal && rawImageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="glass rounded-2xl p-6 border border-accent-cyan/40 max-w-xl w-full flex flex-col max-h-[90vh] shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-card-border/40 mb-4">
              <div className="flex items-center space-x-2">
                <Crop className="h-5 w-5 text-accent-cyan" />
                <h3 className="font-display font-bold text-lg text-slate-100">
                  Potong & Atur Pasfoto Peserta
                </h3>
              </div>

              <button
                onClick={() => setShowCropModal(false)}
                className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cropper Work Area */}
            <div className="relative w-full h-[320px] sm:h-[380px] bg-slate-950 rounded-xl overflow-hidden mb-4 border border-card-border/60 flex items-center justify-center">
              <img
                ref={cropperImageRef}
                src={rawImageSrc}
                alt="Target Crop"
                onLoad={initCropper}
                className="max-h-full max-w-full block"
              />
            </div>

            {/* Toolbar Controls */}
            <div className="space-y-4">
              {/* Aspect Ratio Presets */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
                  Rasio Bingkai:
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleChangeAspectRatio(3 / 4)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition border cursor-pointer ${currentAspectRatio === 3 / 4
                        ? "bg-accent-cyan text-black border-accent-cyan shadow-[0_0_10px_rgba(125,249,255,0.4)]"
                        : "bg-slate-950 border-card-border/60 text-slate-300 hover:border-accent-cyan"
                      }`}
                  >
                    3:4 (Pasfoto Formal)
                  </button>

                  <button
                    onClick={() => handleChangeAspectRatio(1)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition border cursor-pointer ${currentAspectRatio === 1
                        ? "bg-accent-cyan text-black border-accent-cyan shadow-[0_0_10px_rgba(125,249,255,0.4)]"
                        : "bg-slate-950 border-card-border/60 text-slate-300 hover:border-accent-cyan"
                      }`}
                  >
                    1:1 (Square)
                  </button>
                </div>
              </div>

              {/* Manipulation Buttons (Rotate, Zoom, Reset) */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-card-border/30">
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleRotate(-90)}
                    className="p-2 rounded-xl bg-slate-900 border border-card-border/60 text-slate-300 hover:text-accent-cyan hover:border-accent-cyan transition cursor-pointer"
                    title="Putar Kiri 90°"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleRotate(90)}
                    className="p-2 rounded-xl bg-slate-900 border border-card-border/60 text-slate-300 hover:text-accent-cyan hover:border-accent-cyan transition cursor-pointer"
                    title="Putar Kanan 90°"
                  >
                    <RotateCw className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleZoom(0.1)}
                    className="p-2 rounded-xl bg-slate-900 border border-card-border/60 text-slate-300 hover:text-accent-cyan hover:border-accent-cyan transition cursor-pointer"
                    title="Perbesar (Zoom In)"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleZoom(-0.1)}
                    className="p-2 rounded-xl bg-slate-900 border border-card-border/60 text-slate-300 hover:text-accent-cyan hover:border-accent-cyan transition cursor-pointer"
                    title="Perkecil (Zoom Out)"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>

                  <button
                    onClick={handleResetCrop}
                    className="p-2 rounded-xl bg-slate-900 border border-card-border/60 text-slate-300 hover:text-accent-cyan hover:border-accent-cyan transition cursor-pointer"
                    title="Reset Pemotongan"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>

                {/* Submit / Apply Button */}
                <button
                  onClick={handleApplyCrop}
                  className="px-5 py-2.5 rounded-xl bg-accent-cyan hover:bg-cyan-300 text-black text-xs font-mono font-bold uppercase tracking-wider transition shadow-[0_0_15px_rgba(125,249,255,0.4)] flex items-center space-x-1.5 cursor-pointer touch-manipulation"
                >
                  <Check className="h-4 w-4" />
                  <span>Potong & Terapkan Foto</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="w-full py-8 text-center text-xs text-slate-500 font-mono border-t border-card-border/20 mt-16 bg-background/50">
        &copy; {new Date().getFullYear()} IMO 2026 Official ID Card Engine.
      </footer>
    </div>
  );
}
