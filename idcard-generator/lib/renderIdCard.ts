/**
 * renderIdCard.ts
 * ---------------------------------------------------------------------------
 * Menggambar ulang PSD ke <canvas>, layer demi layer, dari bawah ke atas.
 * Layer biasa digambar apa adanya (pakai raster asli dari ag-psd). Layer yang
 * terdeteksi sebagai field ({nama}, {nim}, dst) TIDAK memakai raster asli --
 * kita gambar teks baru dengan value dari form, di posisi & style yang sama.
 * Layer {foto} diganti dengan foto upload di dalam bingkai portrait.
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

  // Render teks final (template string dengan {tag} sudah diganti value asli)
  // baris per baris kalau ada line break.
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
    // gambar lebih lebar dari bingkai -> crop kiri-kanan
    sw = img.height * boxRatio;
    sx = (img.width - sw) / 2;
  } else {
    // gambar lebih tinggi dari bingkai -> crop atas-bawah
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
  // Lebar bingkai mengikuti lebar layer {foto} apa adanya (sesuai lebar teks/kalimat
  // saat tag itu dibuat di PSD). Tinggi portrait diturunkan dari rasio, bukan dari
  // tinggi layer teks aslinya (yang biasanya cuma setinggi satu baris).
  const frameWidth = right - left;
  const frameHeight = frameWidth * aspectRatio;
  const centerY = (top + bottom) / 2;
  const frameTop = centerY - frameHeight / 2;
  const frameLeft = left;

  ctx.save();
  ctx.beginPath();
  ctx.rect(frameLeft, frameTop, frameWidth, frameHeight);
  ctx.clip();
  drawImageCover(ctx, photo, frameLeft, frameTop, frameWidth, frameHeight);
  ctx.restore();

  if (border) {
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

function drawLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  fieldsByLayer: Map<Layer, TemplateField>,
  options: RenderOptions,
) {
  if (layer.hidden) return;

  if (layer.children) {
    // grup: gambar isinya dari bawah ke atas juga
    for (let i = layer.children.length - 1; i >= 0; i--) {
      drawLayer(ctx, layer.children[i], fieldsByLayer, options);
    }
    return;
  }

  const field = fieldsByLayer.get(layer);

  ctx.save();
  ctx.globalAlpha = layer.opacity ?? 1;
  ctx.globalCompositeOperation = BLEND_MODE_MAP[layer.blendMode ?? 'normal'] ?? 'source-over';

  if (field?.type === 'text') {
    drawTemplateText(ctx, field, options.values[field.tag] ?? '');
  } else if (field?.type === 'photo') {
    if (options.photo) {
      drawPhotoField(
        ctx,
        field,
        options.photo,
        options.photoAspectRatio ?? 4 / 3,
        options.photoBorder ?? { width: 4, color: '#ffffff' },
      );
    }
    // kalau belum ada foto di-upload, slot dibiarkan kosong (background di
    // bawahnya tetap kelihatan) supaya user tahu di mana foto akan muncul.
  } else if (layer.canvas) {
    ctx.drawImage(layer.canvas, layer.left ?? 0, layer.top ?? 0);
  }

  ctx.restore();
}

export function renderIdCard(canvas: HTMLCanvasElement, parsed: ParsedTemplate, options: RenderOptions) {
  canvas.width = parsed.width;
  canvas.height = parsed.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const fieldsByLayer = new Map<Layer, TemplateField>();
  for (const field of parsed.fields) fieldsByLayer.set(field.layer, field);

  const children = parsed.psd.children ?? [];
  // ag-psd: children terurut dari layer PALING ATAS ke PALING BAWAH, jadi
  // untuk menggambar dengan urutan tumpukan yang benar kita mulai dari
  // elemen terakhir (paling bawah) menuju elemen pertama (paling atas).
  for (let i = children.length - 1; i >= 0; i--) {
    drawLayer(ctx, children[i], fieldsByLayer, options);
  }
}
