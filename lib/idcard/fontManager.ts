/**
 * fontManager.ts
 * ---------------------------------------------------------------------------
 * Cek ketersediaan font, muat font custom dari URL (Google Fonts / file lokal),
 * dan load font dari file .ttf/.otf/.woff/.woff2 yang diupload langsung.
 */

/** Cek apakah sebuah font family sudah bisa dipakai di canvas. */
export function isFontAvailable(fontName: string): boolean {
  if (typeof document === 'undefined' || !('fonts' in document)) return true;
  try {
    return document.fonts.check(`16px "${fontName}"`);
  } catch {
    return false;
  }
}

/**
 * Muat font dari URL eksternal (Google Fonts CSS / file font langsung).
 * fontName harus sama persis dengan nama font di layer PSD.
 */
export async function loadFontFromUrl(fontName: string, url: string): Promise<void> {
  let fontFileUrl = url;

  const isCssLink =
    /\.css($|\?)/i.test(url) || url.includes('fonts.googleapis.com');

  if (isCssLink) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Gagal fetch CSS font (${res.status})`);
    const css = await res.text();
    // Ambil URL font dari CSS (biasanya ada di dalam src: url(...))
    const match = css.match(/url\(([^)]+)\)/);
    if (!match) throw new Error('Tidak menemukan file font di CSS tersebut');
    fontFileUrl = match[1].replace(/['"]/g, '');
  }

  const face = new FontFace(fontName, `url(${fontFileUrl})`);
  const loaded = await face.load();
  document.fonts.add(loaded);
}

/**
 * Muat font dari File object (hasil upload .ttf/.otf/.woff/.woff2).
 * fontName adalah alias yang dipakai untuk memanggil font ini (harus cocok
 * dengan nama font di layer PSD untuk dirender otomatis).
 */
export async function loadFontFromFile(fontName: string, file: File): Promise<void> {
  const buffer = await file.arrayBuffer();
  const face = new FontFace(fontName, buffer);
  const loaded = await face.load();
  document.fonts.add(loaded);
}

/**
 * Muat font Google Fonts dari nama family (e.g. "Open Sans").
 * Secara otomatis membangun URL Google Fonts CSS2 dan mengunduh semua weights.
 */
export async function loadGoogleFont(familyName: string): Promise<void> {
  if (familyName.toLowerCase() === 'griffy') {
    try {
      const face = new FontFace('Griffy', 'url(/fonts/Griffy-Regular.woff)');
      const loaded = await face.load();
      document.fonts.add(loaded);
      return;
    } catch (e) {
      console.warn('Local Griffy font load failed, falling back to Google Fonts:', e);
    }
  }
  const encoded = encodeURIComponent(familyName);
  const url = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;700&display=swap`;
  await loadFontFromUrl(familyName, url);
}

export interface FontStatus {
  name: string;
  available: boolean;
}

export function checkFonts(fontNames: string[]): FontStatus[] {
  return fontNames.map((name) => ({ name, available: isFontAvailable(name) }));
}

// ── Backward-compat alias ─────────────────────────────────────────────────────
export const loadCustomFont = loadFontFromUrl;
