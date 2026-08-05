/**
 * renderIdCard.ts
 * ---------------------------------------------------------------------------
 * 3-PASS RENDER ARCHITECTURE:
 * Pass 1 – Gambar slot {foto} (foto user / placeholder) PERTAMA KALI pada canvas.
 * Pass 2 – Gambar semua layer raster PSD (bingkai, portal kristal, overlay dengan lubang transparan)
 *           DI ATAS foto. Ini memastikan elemen bingkai PSD menutupi pinggiran foto
 *           dan foto tampil di BELAKANG desain melalui lubang transparan.
 * Pass 3 – Gambar semua teks replacement ({nama}, {nim}, dll.) DI ATAS segalanya.
 */

import type { Layer, Color } from 'ag-psd';
import type { ParsedTemplate, TemplateField } from './psdTemplate';

export interface RenderOptions {
  values: Record<string, string>;
  photo?: HTMLImageElement | null;
  /** rasio tinggi:lebar bingkai foto. Default 4/3 = mengikuti proporsi umum foto 3x4. */
  photoAspectRatio?: number;
  /** tebal & warna garis bingkai foto, set null untuk tanpa bingkai */
  photoBorder?: { width: number; color: string } | null;
  showPlaceholder?: boolean;
}

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

/** Best-effort konversi tipe Color milik ag-psd (RGBA/RGB/FRGB/CMYK/grayscale) ke string CSS. */
function colorToCss(color: Color | undefined): string {
  if (!color) return '#000000';
  if ('fr' in color) {
    return `rgb(${Math.round(color.fr * 255)}, ${Math.round(color.fg * 255)}, ${Math.round(color.fb * 255)})`;
  }
  if ('r' in color && 'g' in color && 'b' in color) {
    const a = 'a' in color && color.a !== undefined ? color.a : 1;
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${a})`;
  }
  if ('c' in color) {
    const r = 255 * (1 - color.c) * (1 - color.k);
    const g = 255 * (1 - color.m) * (1 - color.k);
    const b = 255 * (1 - color.y) * (1 - color.k);
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }
  if ('k' in color) {
    const v = Math.round(255 * (1 - color.k / 255));
    return `rgb(${v}, ${v}, ${v})`;
  }
  return '#000000';
}

function justificationToAlign(j: string | undefined): CanvasTextAlign {
  if (!j) return 'left';
  if (j.includes('right')) return 'right';
  if (j.includes('center')) return 'center';
  return 'left';
}

function drawTemplateText(ctx: CanvasRenderingContext2D, field: TemplateField, value: string) {
  const { left, top, right, bottom } = field.bounds;
  const width = right - left;

  ctx.save();
  ctx.font = `${field.style.fontSize}px "${field.style.fontName}", sans-serif`;
  ctx.fillStyle = colorToCss(field.style.color);
  ctx.textAlign = justificationToAlign(field.style.justification);
  ctx.textBaseline = 'middle';

  const x = ctx.textAlign === 'right' ? right : ctx.textAlign === 'center' ? left + width / 2 : left;
  const y = (top + bottom) / 2;

  const rendered = field.rawTemplate.replace(/\{(\w+)\}/g, (_m, t) =>
    t.toLowerCase() === field.tag ? value : `{${t}}`,
  );
  const lines = rendered.split('\n');
  const lineHeight = field.style.fontSize * 1.2;
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => ctx.fillText(line, x, startY + i * lineHeight));

  ctx.restore();
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;

  if (imgRatio > boxRatio) {
    sw = img.height * boxRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / boxRatio;
    sy = (img.height - sh) / 2;
  }

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
  const frameWidth = right - left;
  const rawHeight = bottom - top;
  const frameHeight = rawHeight > frameWidth * 0.5 ? rawHeight : frameWidth * aspectRatio;
  const centerY = (top + bottom) / 2;
  const frameTop = centerY - frameHeight / 2;
  const frameLeft = left;

  ctx.save();
  ctx.beginPath();
  ctx.rect(frameLeft, frameTop, frameWidth, frameHeight);
  ctx.clip();
  drawImageCover(ctx, photo, frameLeft, frameTop, frameWidth, frameHeight);
  ctx.restore();

  if (border && border.width > 0) {
    ctx.save();
    ctx.strokeStyle = border.color;
    ctx.lineWidth = border.width;
    ctx.strokeRect(
      frameLeft + border.width / 2,
      frameTop + border.width / 2,
      frameWidth - border.width,
      frameHeight - border.width,
    );
    ctx.restore();
  }
}

function drawPhotoPlaceholder(
  ctx: CanvasRenderingContext2D,
  field: TemplateField,
  aspectRatio: number,
) {
  const { left, top, right, bottom } = field.bounds;
  const frameWidth = right - left;
  const rawHeight = bottom - top;
  const frameHeight = rawHeight > frameWidth * 0.5 ? rawHeight : frameWidth * aspectRatio;
  const frameTop = (top + bottom) / 2 - frameHeight / 2;

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

function drawLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  taggedTextLayers: Set<Layer>,
  photoLayers: Set<Layer>,
) {
  if (layer.hidden) return;

  if (layer.children) {
    for (let i = layer.children.length - 1; i >= 0; i--) {
      drawLayer(ctx, layer.children[i], taggedTextLayers, photoLayers);
    }
    return;
  }

  if (taggedTextLayers.has(layer) || photoLayers.has(layer)) return;

  if (layer.canvas) {
    ctx.save();
    const rawOpacity = layer.opacity ?? 1;
    ctx.globalAlpha = rawOpacity > 1 ? rawOpacity / 255 : rawOpacity;
    ctx.globalCompositeOperation = BLEND_MODE_MAP[layer.blendMode ?? 'normal'] ?? 'source-over';
    ctx.drawImage(layer.canvas, layer.left ?? 0, layer.top ?? 0);
    ctx.restore();
  }
}

export function renderIdCard(canvas: HTMLCanvasElement, parsed: ParsedTemplate, options: RenderOptions) {
  canvas.width = parsed.width;
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

  // ── PASS 2: Draw all raster design layers ──────────────────────────────────
  const children = parsed.psd.children ?? [];
  for (let i = children.length - 1; i >= 0; i--) {
    drawLayer(ctx, children[i], taggedTextLayers, photoLayers);
  }

  // ── PASS 3: Draw text replacements ─────────────────────────────────────────
  for (const field of parsed.fields) {
    if (field.type === 'text') {
      drawTemplateText(ctx, field, options.values[field.tag] ?? '');
    }
  }
}


