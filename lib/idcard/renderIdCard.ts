/**
 * renderIdCard.ts
 * ---------------------------------------------------------------------------
 * 3-PASS RENDER ARCHITECTURE:
 * Pass 1 – Gambar slot {foto} (foto user / placeholder) PERTAMA KALI pada canvas.
 * Pass 2 – Gambar semua layer raster PSD (bingkai, portal kristal, overlay dengan lubang transparan)
 *           DI ATAS foto. Ini memastikan elemen bingkai PSD menutupi pinggiran foto
 *           dan foto tampil di BELAKANG desain melalui lubang transparan.
 * Pass 3 – Gambar semua teks replacement ({nama}, {kelompok}, dll.) DI ATAS segalanya.
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
  if (!rgb || luminance(rgb) > 0.85) return '#1a1a2e';
  return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
}

function justificationToAlign(j: string | undefined): CanvasTextAlign {
  if (!j) return 'center';
  if (j.includes('right')) return 'right';
  if (j.includes('center')) return 'center';
  return 'left';
}

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
  const rawHeight   = bottom - top;
  const frameHeight = rawHeight > frameWidth * 0.5 ? rawHeight : frameWidth * aspectRatio;
  const frameTop    = (top + bottom) / 2 - frameHeight / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(left, frameTop, frameWidth, frameHeight);
  ctx.clip();
  drawImageCover(ctx, photo, left, frameTop, frameWidth, frameHeight);
  ctx.restore();

  if (border && border.width > 0) {
    ctx.save();
    ctx.strokeStyle = border.color;
    ctx.lineWidth   = border.width;
    ctx.strokeRect(left + border.width / 2, frameTop + border.width / 2,
      frameWidth - border.width, frameHeight - border.width);
    ctx.restore();
  }
}

function drawPhotoPlaceholder(
  ctx: CanvasRenderingContext2D,
  field: TemplateField,
  aspectRatio: number,
) {
  const { left, top, right, bottom } = field.bounds;
  const frameWidth  = right - left;
  const rawHeight   = bottom - top;
  const frameHeight = rawHeight > frameWidth * 0.5 ? rawHeight : frameWidth * aspectRatio;
  const frameTop    = (top + bottom) / 2 - frameHeight / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1.5;
  ctx.fillRect(left, frameTop, frameWidth, frameHeight);
  ctx.strokeRect(left, frameTop, frameWidth, frameHeight);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('{foto}', left + frameWidth / 2, (top + bottom) / 2);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// PASS 2 helper: draw raster design layers, skip tagged text & photo layers
// ---------------------------------------------------------------------------
function drawRasterLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  taggedTextLayers: Set<Layer>,
  photoLayers: Set<Layer>,
) {
  if (layer.hidden) return;

  if (layer.children) {
    for (let i = layer.children.length - 1; i >= 0; i--) {
      drawRasterLayer(ctx, layer.children[i], taggedTextLayers, photoLayers);
    }
    return;
  }

  // Skip tagged text layers & photo layers in Pass 2 (drawn in Pass 1 & Pass 3)
  if (taggedTextLayers.has(layer) || photoLayers.has(layer)) return;

  if (!layer.canvas) return;

  ctx.save();
  const rawOpacity = layer.opacity ?? 1;
  ctx.globalAlpha = rawOpacity > 1 ? rawOpacity / 255 : rawOpacity;
  ctx.globalCompositeOperation = BLEND_MODE_MAP[layer.blendMode ?? 'normal'] ?? 'source-over';
  ctx.drawImage(layer.canvas, layer.left ?? 0, layer.top ?? 0);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// PASS 3 helper: draw text replacements on top
// ---------------------------------------------------------------------------
function drawTextField(
  ctx: CanvasRenderingContext2D,
  field: TemplateField,
  options: RenderOptions,
) {
  const { left, top, right, bottom } = field.bounds;
  const bWidth  = right - left;

  const showPlaceholder = options.showPlaceholder !== false;

  let text = field.rawTemplate.replace(/\{(\w+)\}/g, (_match, tag) => {
    const val = options.values[tag.toLowerCase()];
    if (val !== undefined && val !== '') return val;
    return showPlaceholder ? `{${tag}}` : '';
  });

  if (!text.trim()) return;

  // Font resolution order:
  // 1. fontOverrides[tag] (per-tag override)
  // 2. globalFont (global override)
  // 3. field.style.fontName (font asli PSD)
  // 4. 'sans-serif' fallback
  const resolvedFont =
    options.fontOverrides?.[field.tag] ||
    options.globalFont ||
    field.style.fontName ||
    'sans-serif';

  const isBold =
    options.boldOverrides?.[field.tag] ??
    options.boldOverrides?.['global'] ??
    false;

  const isItalic =
    options.italicOverrides?.[field.tag] ??
    options.italicOverrides?.['global'] ??
    false;

  const fontStyle = [
    isItalic ? 'italic' : '',
    isBold ? 'bold' : '',
    `${field.style.fontSize}px`,
    `"${resolvedFont}", sans-serif`,
  ].filter(Boolean).join(' ');

  ctx.save();
  ctx.font = fontStyle;
  ctx.fillStyle = colorToCss(field.style.color);

  const textAlign = justificationToAlign(field.style.justification);
  let drawX: number;
  if (textAlign === 'right')       drawX = right;
  else if (textAlign === 'center') drawX = left + bWidth / 2;
  else                             drawX = left;

  const lines = text.split('\n');
  const lineHeight = field.style.fontSize * 1.25;
  const totalTextHeight = lines.length * lineHeight;
  const startY = (top + bottom) / 2 - totalTextHeight / 2 + lineHeight / 2;

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

  const photoField = parsed.fields.find(f => f.type === 'photo') ?? null;
  const taggedTextLayers = new Set<Layer>(
    parsed.fields.filter(f => f.type === 'text').map(f => f.layer)
  );
  const photoLayers = new Set<Layer>(
    parsed.fields.filter(f => f.type === 'photo').map(f => f.layer)
  );

  // ── PASS 1: Draw photo field BEHIND design raster layers ───────────────────
  if (photoField) {
    if (options.photo) {
      ctx.save();
      ctx.globalAlpha = photoField.layer.opacity ?? 1;
      drawPhotoField(
        ctx,
        photoField,
        options.photo,
        options.photoAspectRatio ?? 4 / 3,
        options.photoBorder ?? null,
      );
      ctx.restore();
    } else if (options.showPlaceholder !== false) {
      ctx.save();
      ctx.globalAlpha = photoField.layer.opacity ?? 1;
      drawPhotoPlaceholder(
        ctx,
        photoField,
        options.photoAspectRatio ?? 4 / 3,
      );
      ctx.restore();
    }
  }

  // ── PASS 2: Draw all raster design layers (frames, crystal portal, overlays) ─
  const children = parsed.psd.children ?? [];
  for (let i = children.length - 1; i >= 0; i--) {
    drawRasterLayer(ctx, children[i], taggedTextLayers, photoLayers);
  }

  // ── PASS 3: Draw text replacements ON TOP of everything ────────────────────
  for (const field of parsed.fields) {
    if (field.type === 'text') {
      drawTextField(ctx, field, options);
    }
  }
}
