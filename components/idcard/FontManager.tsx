'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Type,
  Upload,
  Link,
  Search,
  Check,
  X,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import {
  loadFontFromUrl,
  loadFontFromFile,
  loadGoogleFont,
  isFontAvailable,
} from '@/lib/idcard/fontManager';

interface LoadedFont {
  alias: string;
  source: 'google' | 'url' | 'file';
  sourceName: string;
}

interface FontManagerProps {
  /** Fonts yang DIPERLUKAN template PSD (belum tersedia di browser). */
  missingFonts?: string[];
  /** Callback setelah font berhasil dimuat — berikan alias font yang dimuat. */
  onFontLoaded?: (alias: string) => void;
}

// Rekomendasi font Google populer untuk ID card / dokumen
const POPULAR_GOOGLE_FONTS = [
  'Poppins',
  'Inter',
  'Roboto',
  'Montserrat',
  'Nunito',
  'Lato',
  'Open Sans',
  'Raleway',
  'Playfair Display',
  'Cinzel',
];

export default function FontManager({ missingFonts = [], onFontLoaded }: FontManagerProps) {
  const [tab, setTab] = useState<'google' | 'url' | 'file'>('google');
  const [loadedFonts, setLoadedFonts] = useState<LoadedFont[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Google Fonts tab
  const [googleSearch, setGoogleSearch] = useState('');
  const [googleAlias, setGoogleAlias] = useState('');

  // URL tab
  const [urlInput, setUrlInput] = useState('');
  const [urlAlias, setUrlAlias] = useState('');

  // File tab
  const [fileAlias, setFileAlias] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const notify = useCallback((msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  }, []);

  const addLoaded = useCallback((font: LoadedFont) => {
    setLoadedFonts(prev => {
      if (prev.some(f => f.alias === font.alias)) return prev;
      return [...prev, font];
    });
    onFontLoaded?.(font.alias);
  }, [onFontLoaded]);

  // ── Load from Google Fonts ──────────────────────────────────────────────────
  const handleLoadGoogle = useCallback(async (family: string) => {
    const alias = googleAlias.trim() || family;
    setLoading(true);
    setError(null);
    try {
      await loadGoogleFont(family);
      addLoaded({ alias, source: 'google', sourceName: family });
      notify(`Font "${alias}" berhasil dimuat dari Google Fonts`);
      setGoogleAlias('');
      setGoogleSearch('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat font Google');
    } finally {
      setLoading(false);
    }
  }, [googleAlias, addLoaded, notify]);

  // ── Load from URL ───────────────────────────────────────────────────────────
  const handleLoadUrl = useCallback(async () => {
    const url = urlInput.trim();
    const alias = urlAlias.trim() || url.split('/').pop() || 'custom';
    if (!url) { setError('URL tidak boleh kosong'); return; }
    setLoading(true);
    setError(null);
    try {
      await loadFontFromUrl(alias, url);
      addLoaded({ alias, source: 'url', sourceName: url });
      notify(`Font "${alias}" berhasil dimuat dari URL`);
      setUrlInput('');
      setUrlAlias('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat font dari URL');
    } finally {
      setLoading(false);
    }
  }, [urlInput, urlAlias, addLoaded, notify]);

  // ── Load from File ──────────────────────────────────────────────────────────
  const handleLoadFile = useCallback(async () => {
    if (!selectedFile) { setError('Pilih file font terlebih dahulu'); return; }
    const alias = fileAlias.trim() || selectedFile.name.replace(/\.[^.]+$/, '');
    setLoading(true);
    setError(null);
    try {
      await loadFontFromFile(alias, selectedFile);
      addLoaded({ alias, source: 'file', sourceName: selectedFile.name });
      notify(`Font "${alias}" berhasil dimuat dari file`);
      setFileAlias('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat file font');
    } finally {
      setLoading(false);
    }
  }, [selectedFile, fileAlias, addLoaded, notify]);

  // Quick-load missing PSD font by auto-trying Google Fonts
  const handleQuickLoad = useCallback(async (fontName: string) => {
    setLoading(true);
    setError(null);
    try {
      await loadGoogleFont(fontName);
      addLoaded({ alias: fontName, source: 'google', sourceName: fontName });
      notify(`Font "${fontName}" berhasil dimuat`);
    } catch {
      // If Google Fonts fails, tell user to load manually
      setError(`Font "${fontName}" tidak ada di Google Fonts. Muat manual lewat URL atau file.`);
    } finally {
      setLoading(false);
    }
  }, [addLoaded, notify]);

  const filtered = POPULAR_GOOGLE_FONTS.filter(f =>
    f.toLowerCase().includes(googleSearch.toLowerCase())
  );

  const tabCls = (t: typeof tab) =>
    `px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
      tab === t
        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
        : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-5 shadow-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Type className="w-5 h-5 text-violet-400" />
          <h3 className="text-base font-bold text-white">Font Manager</h3>
        </div>
        {loadedFonts.length > 0 && (
          <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-full px-2 py-0.5">
            {loadedFonts.length} dimuat
          </span>
        )}
      </div>

      {/* Missing fonts quick-load */}
      {missingFonts.length > 0 && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
          <p className="text-xs text-amber-400 font-medium mb-2 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Font yang dibutuhkan template PSD belum tersedia:
          </p>
          <div className="flex flex-wrap gap-2">
            {missingFonts.filter(f => !isFontAvailable(f)).map(f => (
              <button
                key={f}
                type="button"
                disabled={loading}
                onClick={() => handleQuickLoad(f)}
                className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-300 hover:bg-amber-500/25 transition-colors disabled:opacity-50"
              >
                <Plus className="w-3 h-3" /> Muat &quot;{f}&quot;
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
        <button type="button" className={tabCls('google')} onClick={() => setTab('google')}>
          <Search className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />Google Fonts
        </button>
        <button type="button" className={tabCls('url')} onClick={() => setTab('url')}>
          <Link className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />URL / CDN
        </button>
        <button type="button" className={tabCls('file')} onClick={() => setTab('file')}>
          <Upload className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />File Font
        </button>
      </div>

      {/* ── Tab: Google Fonts ──────────────────────────────────────────────── */}
      {tab === 'google' && (
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Cari font (e.g. Poppins, Roboto...)"
            value={googleSearch}
            onChange={e => setGoogleSearch(e.target.value)}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 outline-none focus:border-cyan-500 placeholder:text-slate-500"
          />
          {/* Alias override */}
          <input
            type="text"
            placeholder="Alias nama font (opsional — default = nama Google Fonts)"
            value={googleAlias}
            onChange={e => setGoogleAlias(e.target.value)}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 outline-none focus:border-violet-500 placeholder:text-slate-500"
          />
          <p className="text-[10px] text-slate-500">
            Isi alias jika nama font di PSD berbeda dari nama Google Fonts
            (e.g. nama PSD: <code className="text-cyan-400">MyFont</code>, pilih Poppins, alias: <code className="text-cyan-400">MyFont</code>)
          </p>
          <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {filtered.map(f => {
              const already = loadedFonts.some(l => (googleAlias || f) === l.alias);
              return (
                <button
                  key={f}
                  type="button"
                  disabled={loading || already}
                  onClick={() => handleLoadGoogle(f)}
                  className={`flex items-center justify-between gap-2 text-xs px-3 py-2 rounded-lg border transition-all text-left ${
                    already
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-violet-500/50 hover:bg-slate-700 hover:text-white'
                  } disabled:cursor-not-allowed`}
                >
                  <span>{f}</span>
                  {already ? <Check className="w-3 h-3 shrink-0" /> : <Plus className="w-3 h-3 shrink-0 opacity-50" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tab: URL / CDN ─────────────────────────────────────────────────── */}
      {tab === 'url' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400">URL font (Google Fonts CSS / .woff2 / .ttf)</label>
            <input
              type="url"
              placeholder="https://fonts.googleapis.com/css2?family=... atau https://.../font.woff2"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 outline-none focus:border-cyan-500 placeholder:text-slate-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400">Alias nama font <span className="text-slate-500">(harus cocok dengan nama font di PSD)</span></label>
            <input
              type="text"
              placeholder="Nama font yang dipakai di PSD"
              value={urlAlias}
              onChange={e => setUrlAlias(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 outline-none focus:border-cyan-500 placeholder:text-slate-500"
            />
          </div>
          <button
            type="button"
            onClick={handleLoadUrl}
            disabled={loading || !urlInput.trim()}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Muat Font dari URL
          </button>
        </div>
      )}

      {/* ── Tab: File Upload ───────────────────────────────────────────────── */}
      {tab === 'file' && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-700 hover:border-violet-500/60 py-6 text-slate-400 hover:text-white transition-all bg-slate-800/40 hover:bg-slate-800"
          >
            <Upload className="w-6 h-6" />
            <span className="text-xs font-medium">
              {selectedFile ? selectedFile.name : 'Klik atau drag .ttf/.otf/.woff/.woff2'}
            </span>
            {selectedFile && (
              <span className="text-[10px] text-slate-500">
                {(selectedFile.size / 1024).toFixed(0)} KB
              </span>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".ttf,.otf,.woff,.woff2"
            className="hidden"
            onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400">Alias nama font <span className="text-slate-500">(harus cocok dengan nama font di PSD)</span></label>
            <input
              type="text"
              placeholder="Nama font yang dipakai di PSD (opsional)"
              value={fileAlias}
              onChange={e => setFileAlias(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 outline-none focus:border-violet-500 placeholder:text-slate-500"
            />
          </div>
          <button
            type="button"
            onClick={handleLoadFile}
            disabled={loading || !selectedFile}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Type className="w-4 h-4" />}
            Muat Font dari File
          </button>
        </div>
      )}

      {/* Status messages */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
          <X className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400">
          <Check className="w-3.5 h-3.5 shrink-0" />
          {success}
        </div>
      )}

      {/* Loaded fonts list */}
      {loadedFonts.length > 0 && (
        <div className="border-t border-slate-800 pt-3 flex flex-col gap-2">
          <p className="text-xs text-slate-500 font-medium">Font yang sudah dimuat:</p>
          <div className="flex flex-col gap-1">
            {loadedFonts.map(f => (
              <div key={f.alias} className="flex items-center gap-2 text-[11px] text-slate-300">
                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="font-mono text-emerald-300">{f.alias}</span>
                <span className="text-slate-600">←</span>
                <span className="text-slate-500 truncate">
                  {f.source === 'google' ? '🔍 Google Fonts' : f.source === 'url' ? '🔗' : '📁'} {f.sourceName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
