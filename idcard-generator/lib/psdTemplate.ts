/**
 * psdTemplate.ts
 * ---------------------------------------------------------------------------
 * Parsing template .psd menjadi struktur data yang dipakai form + renderer.
 *
 * Library: ag-psd (https://github.com/Agamnentzar/ag-psd)
 * - `readPsd()` di sini SELALU dipanggil di browser (client component), bukan
 *   di server. Ini penting karena data pribadi (nama, NIM) tidak pernah perlu
 *   dikirim ke server -- hanya file .psd template (tanpa data pribadi) yang
 *   diambil dari server/storage, lalu semua parsing + rendering foto/teks
 *   terjadi di canvas browser milik masing-masing user.
 *
 * Catatan penting soal ag-psd (sudah dicek langsung ke type definitions-nya):
 * - `psd.children` berurutan dari layer PALING ATAS ke PALING BAWAH (sama
 *   seperti panel Layers di Photoshop). Untuk menggambar ulang dokumen secara
 *   visual benar, kita harus menggambar dari elemen TERAKHIR ke PERTAMA.
 * - ag-psd TIDAK menggambar ulang bitmap text layer walau `layer.text.text`
 *   diubah -- `layer.canvas` tetap berisi raster lama. Karena itu untuk field
 *   yang mengandung tag {tag}, kita sengaja TIDAK memakai `layer.canvas`,
 *   melainkan menggambar teks/foto sendiri di atas posisi (bounds) layer asli.
 */

import { readPsd, type Psd, type Layer, type Color } from 'ag-psd';

export type FieldType = 'text' | 'photo';

export interface TemplateField {
  /** nama tag, tanpa kurung kurawal, huruf kecil semua. contoh: "nama", "nim", "foto" */
  tag: string;
  type: FieldType;
  /** nama layer di PSD, untuk label form kalau tag muncul di beberapa layer */
  layerName: string;
  bounds: { left: number; top: number; right: number; bottom: number };
  /** referensi langsung ke layer PSD-nya, dipakai lagi saat render */
  layer: Layer;
  /** template string asli, contoh "NIM: {nim}" -- kosong untuk field foto */
  rawTemplate: string;
  style: {
    fontName: string;
    fontSize: number;
    color: Color | undefined;
    justification: string | undefined;
  };
}

export interface ParsedTemplate {
  psd: Psd;
  width: number;
  height: number;
  /** semua layer teks yang mengandung {tag}, termasuk {foto} */
  fields: TemplateField[];
  /** daftar unik nama tag non-foto, untuk generate input form */
  textTags: string[];
  /** true jika template punya slot {foto} */
  hasPhotoSlot: boolean;
  /** semua nama font yang dipakai di layer-layer bertag, untuk cek ketersediaan font */
  fontsUsed: string[];
}

const TAG_REGEX = /\{(\w+)\}/g;

function collectFonts(layer: Layer): string[] {
  const names = new Set<string>();
  const style = layer.text?.style;
  if (style?.font?.name) names.add(style.font.name);
  for (const run of layer.text?.styleRuns ?? []) {
    if (run.style?.font?.name) names.add(run.style.font.name);
  }
  return [...names];
}

function walkLayers(layers: Layer[] | undefined, out: TemplateField[], fonts: Set<string>) {
  if (!layers) return;

  for (const layer of layers) {
    if (layer.children) {
      // layer group -> masuk rekursif
      walkLayers(layer.children, out, fonts);
      continue;
    }

    const text = layer.text?.text;
    if (!text) continue;

    const tags = [...text.matchAll(TAG_REGEX)].map((m) => m[1].toLowerCase());
    if (tags.length === 0) continue;

    const bounds = {
      left: layer.left ?? 0,
      top: layer.top ?? 0,
      right: layer.right ?? 0,
      bottom: layer.bottom ?? 0,
    };

    const style = {
      fontName: layer.text?.style?.font?.name ?? 'sans-serif',
      fontSize: layer.text?.style?.fontSize ?? 24,
      color: layer.text?.style?.fillColor,
      justification: layer.text?.paragraphStyle?.justification,
    };

    // Layer {foto}: seluruh isi teks (setelah di-trim) harus persis "{foto}".
    // Sengaja dibuat berdiri sendiri (tidak boleh dicampur teks lain) karena
    // foto butuh bounding box sendiri, bukan disisipkan di tengah kalimat.
    const trimmed = text.trim().toLowerCase();
    if (trimmed === '{foto}') {
      out.push({
        tag: 'foto',
        type: 'photo',
        layerName: layer.name ?? 'foto',
        bounds,
        layer,
        rawTemplate: text,
        style,
      });
      continue;
    }

    for (const font of collectFonts(layer)) fonts.add(font);

    for (const tag of new Set(tags)) {
      if (tag === 'foto') continue; // sudah ditangani di atas
      out.push({
        tag,
        type: 'text',
        layerName: layer.name ?? tag,
        bounds,
        layer,
        rawTemplate: text,
        style,
      });
    }
  }
}

export function parseTemplate(buffer: ArrayBuffer): ParsedTemplate {
  const psd = readPsd(buffer, {
    // Kita menggambar ulang komposit sendiri layer per layer (lihat renderIdCard.ts),
    // jadi composite image bawaan PSD tidak diperlukan -- mempercepat parsing.
    skipCompositeImageData: true,
    skipThumbnail: true,
  });

  const fields: TemplateField[] = [];
  const fonts = new Set<string>();
  walkLayers(psd.children, fields, fonts);

  const textTags = [...new Set(fields.filter((f) => f.type === 'text').map((f) => f.tag))];

  return {
    psd,
    width: psd.width,
    height: psd.height,
    fields,
    textTags,
    hasPhotoSlot: fields.some((f) => f.type === 'photo'),
    fontsUsed: [...fonts],
  };
}
