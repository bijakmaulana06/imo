/**
 * psdTemplate.ts
 * ---------------------------------------------------------------------------
 * Parsing template .psd menjadi struktur data yang dipakai form + renderer.
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

function extractFontName(layer: Layer): string {
  const text = layer.text;
  if (!text) return 'sans-serif';
  if (text.style?.font?.name) return text.style.font.name;
  for (const run of text.styleRuns ?? []) {
    if (run.style?.font?.name) return run.style.font.name;
  }
  return 'sans-serif';
}

function extractColor(layer: Layer): Color | undefined {
  const text = layer.text;
  if (!text) return undefined;
  if (text.style?.fillColor) return text.style.fillColor;
  for (const run of text.styleRuns ?? []) {
    if (run.style?.fillColor) return run.style.fillColor;
  }
  return undefined;
}

function extractJustification(layer: Layer): string | undefined {
  const text = layer.text;
  if (!text) return undefined;
  if (text.paragraphStyle?.justification) return text.paragraphStyle.justification;
  for (const run of text.paragraphStyleRuns ?? []) {
    if (run.style?.justification) return run.style.justification;
  }
  return undefined;
}

function calculateFontSize(layer: Layer, boundsHeight: number): number {
  const text = layer.text;
  const baseSize = text?.style?.fontSize ?? text?.styleRuns?.[0]?.style?.fontSize ?? 24;

  let transformScale = 1;
  if (text?.transform && text.transform.length >= 4) {
    const [a, b, c, d] = text.transform;
    const scaleY = Math.sqrt(c * c + d * d);
    const scaleX = Math.sqrt(a * a + b * b);
    transformScale = scaleY || scaleX || 1;
  }

  let size = baseSize * transformScale;

  // Jika boundsHeight valid (dihitung dari raster Photoshop layer),
  // pastikan ukuran font proporsional dengan tinggi box teks asli di Photoshop.
  if (boundsHeight > 0 && (size < boundsHeight * 0.5 || size > boundsHeight * 1.5)) {
    size = Math.max(size, boundsHeight * 0.75);
  }

  return Math.round(size) || 24;
}

function walkLayers(layers: Layer[] | undefined, out: TemplateField[], fonts: Set<string>) {
  if (!layers) return;

  for (const layer of layers) {
    if (layer.children) {
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

    const boundsHeight = bounds.bottom - bounds.top;

    const style = {
      fontName: extractFontName(layer),
      fontSize: calculateFontSize(layer, boundsHeight),
      color: extractColor(layer),
      justification: extractJustification(layer),
    };

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
      if (tag === 'foto') continue;
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
