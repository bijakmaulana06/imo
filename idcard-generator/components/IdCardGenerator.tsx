'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { parseTemplate, type ParsedTemplate } from '@/lib/psdTemplate';
import { checkFonts, loadCustomFont, type FontStatus } from '@/lib/fontManager';
import { renderIdCard } from '@/lib/renderIdCard';

interface IdCardGeneratorProps {
  /** URL template .psd yang sudah disiapkan admin (public/ folder atau Supabase Storage).
   *  Kalau tidak diisi, akan muncul tombol upload manual (mis. untuk mode admin/preview). */
  templateUrl?: string;
}

export default function IdCardGenerator({ templateUrl }: IdCardGeneratorProps) {
  const [parsed, setParsed] = useState<ParsedTemplate | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null);
  const [fontStatuses, setFontStatuses] = useState<FontStatus[]>([]);
  const [fontUrls, setFontUrls] = useState<Record<string, string>>({});
  const [fontLoadError, setFontLoadError] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadTemplate = useCallback(async (source: ArrayBuffer) => {
    setLoading(true);
    setError(null);
    try {
      const result = parseTemplate(source);
      setParsed(result);
      setValues(Object.fromEntries(result.textTags.map((t) => [t, ''])));
      setFontStatuses(checkFonts(result.fontsUsed));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membaca file .psd. Pastikan file tidak rusak.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load template dari URL (mode normal / mahasiswa)
  useEffect(() => {
    if (!templateUrl) return;
    fetch(templateUrl)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.arrayBuffer();
      })
      .then(loadTemplate)
      .catch(() => setError('Gagal mengambil template dari server.'));
  }, [templateUrl, loadTemplate]);

  const handleTemplateUpload = (file: File) => {
    file.arrayBuffer().then(loadTemplate);
  };

  const handlePhotoUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setPhotoImg(img);
    img.src = url;
  };

  const handleFontUrlLoad = async (fontName: string) => {
    const url = fontUrls[fontName];
    if (!url) return;
    try {
      await loadCustomFont(fontName, url);
      setFontStatuses((prev) => prev.map((f) => (f.name === fontName ? { ...f, available: true } : f)));
      setFontLoadError((prev) => ({ ...prev, [fontName]: '' }));
    } catch (e) {
      setFontLoadError((prev) => ({
        ...prev,
        [fontName]: e instanceof Error ? e.message : 'Gagal memuat font dari link tersebut.',
      }));
    }
  };

  // Gambar ulang canvas tiap kali template/isian/foto/font berubah
  useEffect(() => {
    if (!parsed || !canvasRef.current) return;
    renderIdCard(canvasRef.current, parsed, { values, photo: photoImg });
  }, [parsed, values, photoImg, fontStatuses]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const name = values['nama']?.trim().replace(/\s+/g, '_') || 'id-card';
      link.download = `${name}.png`;
      link.click();
    }, 'image/png');
  };

  const missingFonts = fontStatuses.filter((f) => !f.available);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4 md:flex-row">
      {/* Preview */}
      <div className="flex min-h-[20rem] flex-1 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        {!parsed && !templateUrl && !loading && (
          <label className="cursor-pointer rounded-md border border-dashed border-neutral-300 px-6 py-10 text-center text-sm text-neutral-500 hover:border-neutral-400">
            Unggah template (.psd)
            <input
              type="file"
              accept=".psd"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleTemplateUpload(e.target.files[0])}
            />
          </label>
        )}
        {loading && <p className="text-sm text-neutral-500">Membaca template…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <canvas
          ref={canvasRef}
          className="max-w-full rounded shadow-sm"
          style={{ display: parsed ? 'block' : 'none' }}
        />
      </div>

      {/* Form, dibuat otomatis dari tag yang terdeteksi di template */}
      {parsed && (
        <div className="flex w-full flex-col gap-4 md:w-72">
          {parsed.textTags.map((tag) => (
            <label key={tag} className="flex flex-col gap-1 text-sm">
              <span className="font-medium capitalize text-neutral-700">{tag}</span>
              <input
                type="text"
                value={values[tag] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [tag]: e.target.value }))}
                placeholder={
                  tag.toLowerCase().includes('nama')
                    ? 'Xaviera Putri'
                    : tag.toLowerCase().includes('nim')
                    ? '260xxxxxxxx'
                    : `Isi ${tag}`
                }
            </label>
          ))}

          {parsed.hasPhotoSlot && (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-neutral-700">Foto</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                className="text-sm"
              />
            </label>
          )}

          {missingFonts.length > 0 && (
            <div className="flex flex-col gap-3 rounded-md border border-amber-300 bg-amber-50 p-3">
              <p className="text-sm text-amber-800">
                Font berikut dipakai di template tapi tidak terdeteksi di browser ini. Masukkan link
                file font (.woff2/.woff/.ttf) atau link CSS Google Fonts untuk masing-masing:
              </p>
              {missingFonts.map((f) => (
                <div key={f.name} className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-amber-900">{f.name}</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://..."
                      value={fontUrls[f.name] ?? ''}
                      onChange={(e) => setFontUrls((u) => ({ ...u, [f.name]: e.target.value }))}
                      className="flex-1 rounded-md border border-amber-300 px-2 py-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleFontUrlLoad(f.name)}
                      className="rounded-md bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-700"
                    >
                      Muat
                    </button>
                  </div>
                  {fontLoadError[f.name] && (
                    <span className="text-xs text-red-600">{fontLoadError[f.name]}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleDownload}
            className="mt-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Unduh ID Card
          </button>
        </div>
      )}
    </div>
  );
}
