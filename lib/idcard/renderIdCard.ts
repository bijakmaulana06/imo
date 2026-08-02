/**
 * renderIdCard.ts
 * ---------------------------------------------------------------------------
 * TWO-PASS RENDER:
 * Pass 1 – Gambar semua layer PSD (raster background, boxes, labels) dalam urutan z-order.
 *           Layer tagged ({nama}, {kelompok}, dll.) DI-SKIP di pass ini (jangan gambar raster placeholder-nya).
 * Pass 2 – Gambar semua teks replacement DI ATAS segalanya (globalAlpha=1, source-over).
 *
 * Ini memastikan teks pengganti selalu muncul di atas white box / elemen PSD lainnya,
 * tanpa peduli z-order asli di dalam file PSD.
 */

import type { Layer, Color } from 'ag-psd';
import type { ParsedTemplate, TemplateField } from './psdTemplate';

export interface RenderOptions {
  values: Record<string, string>;
  photo?: HTMLImageElement | null;
  photoAspectRatio?: number;
  photoBorder?: { width: number; color: string } | null;
  /** Tampilkan placeholder {tag} saat value kosong. Default: true */
  showPlaceholder?: boolean;
  /** Override font untuk SEMUA field teks (jika fontOverrides tidak ada per-tag) */
  globalFont?: string;
  /** Override font per tag: { nama: 'Poppins', kelompok: 'Roboto' } */
  fontOverrides?: Record<string, string>;
  /** Bold: true untuk semua tag jika key='global', atau per-tag key */
  boldOverrides?: Record<string, boolean>;
  /** Italic: true untuk semua tag jika key='global', atau per-tag key */
  italicOverrides?: Record<string, boolean>;
}

// ---------------------------------------------------------------------------
// Blend mode map
// ---------------------------------------------------------------------------
const BLEND_MODE_MAP: Record<string, GlobalCompositeOperation> = {
  multiply: 'multiply',
  screen: 'screen',
  darken: 'darken',
  lighten: 'lighten',
  overlay: 'overlay',
  difference: 'difference',
  exclusion: 'exclusion',
  hue: 'hue',
  saturation: 'saturation',
  color: 'color',
  luminosity: 'luminosity',
  'color burn': 'color-burn',
  'color dodge': 'color-dodge',
  'hard light': 'hard-light',
  'soft light': 'soft-light',
};

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------
function colorToRgb(color: Color | undefined): { r: number; g: number; b: number } | null {
  if (!color) return null;
  if ('fr' in color) return { r: Math.round(color.fr * 255), g: Math.round(color.fg * 255), b: Math.round(color.fb * 255) };
  if ('r' in color && 'g' in color && 'b' in color) return { r: color.r, g: color.g, b: color.b };
  if ('c' in color) return {
    r: Math.round(255 * (1 - color.c) * (1 - color.k)),
    g: Math.round(255 * (1 - color.m) * (1 - color.k)),
    b: Math.round(255 * (1 - color.y) * (1 - color.k)),
  };
  if ('k' in color) { const v = Math.round(255 * (1 - color.k / 255)); return { r: v, g: v, b: v }; }
  return null;
}

function luminance({ r, g, b }: { r: number; g: number; b: number }): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function colorToCss(color: Color | undefined): string {
  const rgb = colorToRgb(color);
  if (!rgb || luminance(rgb) > 0.85) return '#1a1a2e'; // default dark if undefined or near-white
  return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
}

function justificationToAlign(j: string | undefined): CanvasTextAlign {
  if (!j) return 'center';
  if (j.includes('right')) return 'right';
  if (j.includes('center')) return 'center';
  return 'left';
}

// ---------------------------------------------------------------------------
// PASS 1 helper: draw raster layers only, skip tagged fields
// ---------------------------------------------------------------------------
function drawRasterLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  taggedLayers: Set<Layer>,
  photoField: TemplateField | null,
) {
  if (layer.hidden) return;

  if (layer.children) {
    for (let i = layer.children.length - 1; i >= 0; i--) {
      drawRasterLayer(ctx, layer.children[i], taggedLayers, photoField);
    }
    return;
  }

  // Skip tagged layers entirely in pass 1 (will be drawn in pass 2)
  if (taggedLayers.has(layer)) return;

  if (!layer.canvas) return;

  ctx.save();
  const rawOpacity = layer.opacity ?? 1;
  ctx.globalAlpha = rawOpacity > 1 ? rawOpacity / 255 : rawOpacity;
  ctx.globalCompositeOperation = BLEND_MODE_MAP[layer.blendMode ?? 'normal'] ?? 'source-over';
  ctx.drawImage(layer.canvas, layer.left ?? 0, layer.top ?? 0);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// PASS 2 helpers: draw text & photo replacements on top
// ---------------------------------------------------------------------------
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number,
) {
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (imgRatio > boxRatio) { sw = img.height * boxRatio; sx = (img.width - sw) / 2; }
  else { sh = img.width / boxRatio; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawPhotoField(
  ctx: CanvasRenderingContext2D,
  field: TemplateField,
  photo: HTMLImageElement,
  aspectRatio: number,
  border: { width: number; color: string } | null,
) {
  const { left, top, right, bottom } = field.bounds;
  const frameWidth  = right - left;
  const frameHeight = frameWidth * aspectRatio;
  const frameTop    = (top + bottom) / 2 - frameHeight / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(left, frameTop, frameWidth, frameHeight);
  ctx.clip();
  drawImageCover(ctx, photo, left, frameTop, frameWidth, frameHeight);
  ctx.restore();

  if (border) {
    ctx.save();
    ctx.strokeStyle = border.color;
    ctx.lineWidth   = border.width;
    ctx.strokeRect(left + border.width / 2, frameTop + border.width / 2,
      frameWidth - border.width, frameHeight - border.width);
    ctx.restore();
  }
}

function drawTextField(
  ctx: CanvasRenderingContext2D,
  field: TemplateField,
  options: RenderOptions,
) {
  const { left, top, right, bottom } = field.bounds;
  const bWidth  = right - left;
  const bHeight = bottom - top;

  const showPlaceholder = options.showPlaceholder !== false; // default true

  const rendered = field.rawTemplate.replace(/\{(\w+)\}/g, (_m, tag) => {
    const val = options.values[tag.toLowerCase()];
    if (val !== undefined && val !== '') return val;
    return showPlaceholder ? `{${tag}}` : '';
  });

  if (!rendered.trim()) return;

  let fontSize = field.style.fontSize ?? 24;
  if (bHeight > 0) fontSize = Math.min(fontSize, bHeight * 0.75);
  fontSize = Math.max(fontSize, 10);

  const textAlign = justificationToAlign(field.style.justification);
  const textColor = colorToCss(field.style.color);

  const resolvedFont = options.fontOverrides?.[field.tag]
    || options.globalFont
    || field.style.fontName
    || 'sans-serif';

  const isBold   = options.boldOverrides?.[field.tag]   ?? options.boldOverrides?.['global']   ?? false;
  const isItalic = options.italicOverrides?.[field.tag] ?? options.italicOverrides?.['global'] ?? false;

  const fontStyle = `${isItalic ? 'italic ' : ''}${isBold ? 'bold ' : ''}${fontSize}px "${resolvedFont}", sans-serif`;

  const cx = left + bWidth / 2;
  const drawX = textAlign === 'right' ? right : textAlign === 'center' ? cx : left;
  const drawY = top + bHeight / 2;

  const lines      = rendered.split('\n');
  const lineHeight = fontSize * 1.25;
  const totalH     = (lines.length - 1) * lineHeight;
  const startY     = drawY - totalH / 2;

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.font = fontStyle;
  ctx.fillStyle = textColor;
  ctx.textAlign = textAlign;
  ctx.textBaseline = 'middle';
  lines.forEach((line, i) => ctx.fillText(line, drawX, startY + i * lineHeight));
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export function renderIdCard(
  canvas: HTMLCanvasElement,
  parsed: ParsedTemplate,
  options: RenderOptions,
) {
  canvas.width  = parsed.width;
  canvas.height = parsed.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Build a Set of all tagged layers so pass 1 can skip them
  const taggedLayers = new Set<Layer>(parsed.fields.map(f => f.layer));

  // Find photo field (if any) for pass 2
  const photoField = parsed.fields.find(f => f.type === 'photo') ?? null;

  // ── PASS 1: Draw all raster layers (skip tagged text/photo layers) ─────────
  const children = parsed.psd.children ?? [];
  for (let i = children.length - 1; i >= 0; i--) {
    drawRasterLayer(ctx, children[i], taggedLayers, photoField);
  }

  // ── PASS 2: Draw text & photo replacements ON TOP of everything ────────────
  for (const field of parsed.fields) {
    if (field.type === 'text') {
      drawTextField(ctx, field, options);
    } else if (field.type === 'photo' && options.photo) {
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      drawPhotoField(
        ctx,
        field,
        options.photo,
        options.photoAspectRatio ?? 4 / 3,
        options.photoBorder ?? { width: 2, color: '#ffffff' },
      );
      ctx.restore();
    }
  }
}
