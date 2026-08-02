/**
 * fontManager.ts
 * ---------------------------------------------------------------------------
 * Cek apakah font yang dipakai di PSD tersedia di browser, dan muat font
 * custom dari URL (Google Fonts CSS link, atau file .woff/.woff2 langsung)
 * kalau belum tersedia.
 */

/** Cek apakah sebuah font family sudah bisa dipakai untuk render di canvas. */
export function isFontAvailable(fontName: string): boolean {
  if (typeof document === 'undefined' || !('fonts' in document)) return true;
  try {
    return document.fonts.check(`16px "${fontName}"`);
  } catch {
    return false;
  }
}

/**
 * Muat font dari URL lalu daftarkan ke document.fonts dengan nama `fontName`
 * (harus sama persis dengan nama font di layer PSD supaya dipakai saat render).
 *
 * Mendukung dua bentuk URL:
 * 1. Link file font langsung (.woff2/.woff/.ttf/.otf) -> dipakai langsung lewat FontFace.
 * 2. Link CSS Google Fonts (fonts.googleapis.com/css2?family=...) -> kita fetch
 *    CSS-nya, ambil url() file font di dalamnya, baru dipakai lewat FontFace.
 *    (Nama font yang didaftarkan tetap `fontName` supaya cocok dengan tag PSD,
 *    bukan nama asli dari Google Fonts.)
 */
export async function loadCustomFont(fontName: string, url: string): Promise<void> {
  let fontFileUrl = url;

  const isCssLink = /\.css($|\?)/i.test(url) || url.includes('fonts.googleapis.com');
  if (isCssLink) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Gagal mengambil CSS font (${res.status})`);
    const css = await res.text();
    const match = css.match(/url\(([^)]+)\)/);
    if (!match) throw new Error('Tidak menemukan file font di dalam CSS tersebut');
    fontFileUrl = match[1].replace(/["']/g, '');
  }

  const face = new FontFace(fontName, `url(${fontFileUrl})`);
  const loaded = await face.load();
  document.fonts.add(loaded);
}

export interface FontStatus {
  name: string;
  available: boolean;
}

export function checkFonts(fontNames: string[]): FontStatus[] {
  return fontNames.map((name) => ({ name, available: isFontAvailable(name) }));
}
