/**
 * renderIdCard.ts (idcard-generator copy)
 */

import type { Layer, Color } from 'ag-psd';
import type { ParsedTemplate, TemplateField } from './psdTemplate';

export interface RenderOptions {
  values: Record<string, string>;
  photo?: HTMLImageElement | null;
  photoAspectRatio?: number;
  photoBorder?: { width: number; color: string } | null;
  showPlaceholder?: boolean;
  globalFont?: string;
  fontOverrides?: Record<string, string>;
  boldOverrides?: Record<string, boolean>;
  italicOverrides?: Record<string, boolean>;
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

  // Bleed margin to ensure photo covers irregular cutout mask edges cleanly
  const bleedX = Math.max(60, Math.round(frameWidth * 0.25));
  const bleedY = Math.max(70, Math.round(frameHeight * 0.25));
  const drawLeft = frameLeft - bleedX;
  const drawTop = frameTop - bleedY;
  const drawWidth = frameWidth + bleedX * 2;
  const drawHeight = frameHeight + bleedY * 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(drawLeft, drawTop, drawWidth, drawHeight);
  ctx.clip();
  drawImageCover(ctx, photo, drawLeft, drawTop, drawWidth, drawHeight);
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
  const centerY = (top + bottom) / 2;
  const frameTop = centerY - frameHeight / 2;
  const frameLeft = left;

  const bleedX = Math.max(60, Math.round(frameWidth * 0.25));
  const bleedY = Math.max(70, Math.round(frameHeight * 0.25));
  const drawLeft = frameLeft - bleedX;
  const drawTop = frameTop - bleedY;
  const drawWidth = frameWidth + bleedX * 2;
  const drawHeight = frameHeight + bleedY * 2;

  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(drawLeft, drawTop, drawWidth, drawHeight);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(frameLeft, frameTop, frameWidth, frameHeight);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('{foto}', frameLeft + frameWidth / 2, centerY);
  ctx.restore();
}

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
// Motto text wrapping helper (max 8 kata atau 44 huruf per baris, maks 3 baris)
// ---------------------------------------------------------------------------
export function wrapMottoText(text: string, maxWords = 8, maxChars = 44, maxLines = 3): string {
  if (!text) return '';
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const paragraphs = normalized.split('\n');
  const wrappedLines: string[] = [];

  for (let pIndex = 0; pIndex < paragraphs.length; pIndex++) {
    if (wrappedLines.length >= maxLines) break;

    const paragraph = paragraphs[pIndex];
    const trimmed = paragraph.trim();
    if (!trimmed) {
      wrappedLines.push('');
      continue;
    }

    const words = trimmed.split(/\s+/).filter(Boolean);
    let currentWords: string[] = [];
    let currentLen = 0;

    for (const word of words) {
      if (wrappedLines.length >= maxLines) break;

      const isLastAllowedLine = wrappedLines.length === maxLines - 1;

      let w = word;
      while (w.length > maxChars) {
        if (currentWords.length > 0) {
          wrappedLines.push(currentWords.join(' '));
          currentWords = [];
          currentLen = 0;
          if (wrappedLines.length >= maxLines) break;
        }
        wrappedLines.push(w.slice(0, maxChars));
        w = w.slice(maxChars);
        if (wrappedLines.length >= maxLines) break;
      }
      if (!w || wrappedLines.length >= maxLines) continue;

      const wouldExceedWordCount = currentWords.length >= maxWords;
      const wouldExceedCharCount = currentLen > 0 && (currentLen + 1 + w.length > maxChars);

      if (wouldExceedWordCount || wouldExceedCharCount) {
        if (isLastAllowedLine) {
          break;
        }
        wrappedLines.push(currentWords.join(' '));
        currentWords = [w];
        currentLen = w.length;
      } else {
        currentWords.push(w);
        currentLen += (currentLen === 0 ? 0 : 1) + w.length;
      }
    }

    if (currentWords.length > 0 && wrappedLines.length < maxLines) {
      wrappedLines.push(currentWords.join(' '));
    }
  }

  return wrappedLines.slice(0, maxLines).join('\n');
}

function drawTextField(
  ctx: CanvasRenderingContext2D,
  field: TemplateField,
  options: RenderOptions,
) {
  const { left, top, right, bottom } = field.bounds;
  const bWidth = right - left;
  const showPlaceholder = options.showPlaceholder !== false;

  let text = field.rawTemplate.replace(/\{(\w+)\}/g, (_match, tag) => {
    let val = options.values[tag.toLowerCase()];
    if (val !== undefined && val !== '') {
      const lower = tag.toLowerCase().trim();
      if (lower === 'nama' || lower === 'name' || lower.includes('nama')) {
        if (val.length > 16) val = val.slice(0, 16);
      }
      return val;
    }
    return showPlaceholder ? `{${tag}}` : '';
  });

  if (!text.trim()) return;

  const lowerTag = field.tag.toLowerCase().trim();
  const isMotto = lowerTag === 'motto' || lowerTag === 'quote' || lowerTag.includes('motto') || lowerTag.includes('quote');
  if (isMotto) {
    text = wrapMottoText(text, 8, 44);
  }


  const lines = text.split('\n');

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
  if (textAlign === 'right') drawX = right;
  else if (textAlign === 'center') drawX = left + bWidth / 2;
  else drawX = left;

  const lineHeight = field.style.fontSize * 1.25;

  // Tag position: start at original tag center, do NOT offset upwards when multiple lines are added; continue downwards
  const startY = isMotto
    ? (top + bottom) / 2
    : ((top + bottom) / 2 - (lines.length * lineHeight) / 2 + lineHeight / 2);

  ctx.textAlign = textAlign;
  ctx.textBaseline = 'middle';
  lines.forEach((line, i) => ctx.fillText(line, drawX, startY + i * lineHeight));
  ctx.restore();
}

export function renderIdCard(
  canvas: HTMLCanvasElement,
  parsed: ParsedTemplate,
  options: RenderOptions,
) {
  canvas.width = parsed.width;
  canvas.height = parsed.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const photoField = parsed.fields.find((f) => f.type === 'photo') ?? null;
  const taggedTextLayers = new Set<Layer>(
    parsed.fields.filter((f) => f.type === 'text').map((f) => f.layer),
  );
  const photoLayers = new Set<Layer>(
    parsed.fields.filter((f) => f.type === 'photo').map((f) => f.layer),
  );

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

  const children = parsed.psd.children ?? [];
  for (let i = children.length - 1; i >= 0; i--) {
    drawRasterLayer(ctx, children[i], taggedTextLayers, photoLayers);
  }

  for (const field of parsed.fields) {
    if (field.type === 'text') {
      drawTextField(ctx, field, options);
    }
  }
}
