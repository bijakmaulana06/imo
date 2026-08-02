'use client';

/**
 * FontPicker.tsx
 * Compact inline font selector: type a Google Fonts family name and press Enter
 * (or click a quick-pick button) to load + apply the font instantly.
 */

import React, { useState, useCallback } from 'react';
import { loadGoogleFont, loadFontFromFile } from '@/lib/idcard/fontManager';
import { Loader2, Upload, X } from 'lucide-react';

const QUICK_FONTS = [
  'Griffy',
  'Poppins',
  'Roboto',
  'Montserrat',
  'Lato',
  'Nunito',
  'Raleway',
  'Inter',
  'Playfair Display',
  'Cinzel',
  'Open Sans',
];

interface FontPickerProps {
  value: string;
  onChange: (font: string) => void;
  loading?: boolean;
  setLoading?: (v: boolean) => void;
  placeholder?: string;
  /** Compact mode: hide quick-font grid, show only input row */
  compact?: boolean;
}

export default function FontPicker({
  value,
  onChange,
  loading = false,
  setLoading,
  placeholder = 'Default',
  compact = false,
}: FontPickerProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [showQuick, setShowQuick] = useState(false);

  const applyFont = useCallback(async (fontFamily: string) => {
    if (!fontFamily.trim()) { onChange(''); return; }
    setError('');
    setLoading?.(true);
    try {
      await loadGoogleFont(fontFamily.trim());
      onChange(fontFamily.trim());
      setInput('');
    } catch {
      setError(`"${fontFamily}" tidak ditemukan di Google Fonts`);
    } finally {
      setLoading?.(false);
    }
  }, [onChange, setLoading]);

  const handleFileUpload = useCallback(async (file: File) => {
    const alias = input.trim() || file.name.replace(/\.[^.]+$/, '');
    setError('');
    setLoading?.(true);
    try {
      const { loadFontFromFile: load } = await import('@/lib/idcard/fontManager');
      await load(alias, file);
      onChange(alias);
      setInput('');
    } catch {
      setError('Gagal membaca file font');
    } finally {
      setLoading?.(false);
    }
  }, [input, onChange, setLoading]);

  if (compact) {
    return (
      <div className="flex-1 flex items-center gap-1.5">
        {value ? (
          <div className="flex-1 flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-500/15 border border-violet-500/25 text-[11px] text-violet-300">
            <span className="truncate flex-1">{value}</span>
            <button type="button" onClick={() => onChange('')} className="text-violet-400 hover:text-red-400 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFont(input)}
            placeholder={placeholder}
            className="flex-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-[11px] placeholder-slate-600 outline-none focus:border-violet-500 transition-colors"
          />
        )}
        {!value && (
          <button
            type="button"
            disabled={loading || !input.trim()}
            onClick={() => applyFont(input)}
            className="px-2 py-1 rounded-lg bg-violet-600/80 hover:bg-violet-500 text-white text-[10px] font-bold transition-all disabled:opacity-40"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Muat'}
          </button>
        )}
      </div>
    );
  }

  // Full mode
  return (
    <div className="flex flex-col gap-2">
      {/* Current value display */}
      {value ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <span className="text-xs text-violet-300 font-medium flex-1">✓ {value}</span>
          <button type="button" onClick={() => onChange('')} className="text-slate-500 hover:text-red-400 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}

      {/* Input row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && applyFont(input)}
          placeholder="Nama Google Fonts (e.g. Poppins)"
          className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 outline-none focus:border-violet-500 transition-colors"
        />
        <button
          type="button"
          disabled={loading || !input.trim()}
          onClick={() => applyFont(input)}
          className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Muat'}
        </button>
        {/* Upload local font file */}
        <label className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer text-slate-400 hover:text-white transition-colors" title="Upload font file (.ttf/.otf/.woff2)">
          <Upload className="w-4 h-4" />
          <input
            type="file"
            accept=".ttf,.otf,.woff,.woff2"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          />
        </label>
      </div>

      {/* Quick font grid toggle */}
      <button
        type="button"
        onClick={() => setShowQuick(v => !v)}
        className="text-[10px] text-slate-500 hover:text-slate-300 text-left transition-colors"
      >
        {showQuick ? '▲ Sembunyikan' : '▼ Font populer'}
      </button>

      {showQuick && (
        <div className="grid grid-cols-2 gap-1">
          {QUICK_FONTS.map(f => (
            <button
              key={f}
              type="button"
              disabled={loading}
              onClick={() => applyFont(f)}
              className={`text-[11px] px-2.5 py-1.5 rounded-lg border text-left transition-all ${
                value === f
                  ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-violet-500/40 hover:bg-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-[10px] text-rose-400">{error}</p>}
    </div>
  );
}
