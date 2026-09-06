"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import StarfieldBackground from "@/components/StarfieldBackground";
import Card from "@/components/Card";
import IdCardGenerator from "@/components/idcard/IdCardGenerator";
import {
  CheckCircle2,
  Sparkles,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface TemplateItem {
  id: string;
  name: string;
  description?: string;
  background_url?: string;
  layout_json?: {
    psd_url?: string;
  };
  is_active?: boolean;
  is_default?: boolean;
}

const FALLBACK_TEMPLATE: TemplateItem = {
  id: "official-default-template",
  name: "Templat Resmi IMO 2026",
  description: "Desain templat ID Card standar resmi IMO 2026",
  background_url: "/templates/id-card.psd",
  is_active: true,
  is_default: true,
};

function sortTemplatesNatural<T extends { name: string }>(items: T[]): T[] {
  const extractNum = (str: string) => {
    // 1. Prioritaskan angka setelah kata 'kelompok' (misal 'Kelompok 1', 'Kelompok 2')
    const kMatch = str.match(/kelompok\s*(\d+)/i);
    if (kMatch) return parseInt(kMatch[1], 10);

    // 2. Atau cek angka apa saja di dalam nama
    const allMatches = str.match(/\d+/g);
    if (allMatches && allMatches.length > 0) {
      if (allMatches.length > 1 && allMatches[0] === '2026') {
        return parseInt(allMatches[1], 10);
      }
      return parseInt(allMatches[allMatches.length - 1], 10);
    }
    return Number.MAX_SAFE_INTEGER;
  };

  return [...items].sort((a, b) => {
    const numA = extractNum(a.name);
    const numB = extractNum(b.name);

    if (numA !== numB) {
      return numA - numB;
    }

    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });
}

export default function IdCardPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedTemplateUrl, setSelectedTemplateUrl] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("official-default-template");
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [isSwitchingTemplate, setIsSwitchingTemplate] = useState(false);
  const [switchingTemplateName, setSwitchingTemplateName] = useState<string>("");
  const [templateKey, setTemplateKey] = useState<number>(0);
  const [refreshingList, setRefreshingList] = useState(false);

  const fetchTemplatesList = async () => {
    try {
      const res = await fetch(`/api/id-card-templates?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) throw new Error("Gagal mengambil templat");
      const data = await res.json();
      
      const list: TemplateItem[] = data.templates || [];
      const activeList = list.filter((t) => t.is_active !== false);
      const sortedList = sortTemplatesNatural(activeList);
      setTemplates(sortedList);
      return sortedList;
    } catch (err) {
      console.warn("Could not load templates list from API, using fallback:", err);
      return [];
    }
  };

  useEffect(() => {
    async function loadTemplates() {
      try {
        setLoadingTemplates(true);
        const sortedList = await fetchTemplatesList();

        if (sortedList.length > 0) {
          const defaultItem = sortedList.find((t) => t.is_default) || sortedList[0];
          const psdUrl = defaultItem.background_url || defaultItem.layout_json?.psd_url || "/templates/id-card.psd";
          setSelectedTemplateUrl(psdUrl);
          setSelectedTemplateId(defaultItem.id);
        } else {
          setSelectedTemplateUrl("/templates/id-card.psd");
          setSelectedTemplateId("official-default-template");
        }
      } finally {
        setLoadingTemplates(false);
      }
    }

    loadTemplates();
  }, []);

  const handleRefreshTemplatesList = async () => {
    setRefreshingList(true);
    try {
      const sortedList = await fetchTemplatesList();
      // Verifikasi template aktif yang sedang dipilih
      const current = sortedList.find((t) => t.id === selectedTemplateId);
      if (current) {
        handleSelectTemplate(current, true);
      }
    } finally {
      setTimeout(() => setRefreshingList(false), 500);
    }
  };

  const handleSelectTemplate = (t: TemplateItem, force: boolean = false) => {
    if (t.id === selectedTemplateId && !force && !isSwitchingTemplate) return;

    setIsSwitchingTemplate(true);
    setSwitchingTemplateName(t.name);
    // Kosongkan template URL terlebih dahulu agar instance canvas lama benar-benar di-clear
    setSelectedTemplateUrl("");

    // Berikan delay terukur (600ms) untuk memastikan cache & state templat sebelumnya bersih
    setTimeout(() => {
      const psdUrl = t.background_url || t.layout_json?.psd_url || "/templates/id-card.psd";
      setSelectedTemplateUrl(psdUrl);
      setSelectedTemplateId(t.id);
      setTemplateKey((k) => k + 1);
      setIsSwitchingTemplate(false);
    }, 600);
  };

  const displayTemplates = templates.length > 0 ? templates : [FALLBACK_TEMPLATE];
  const activeTemplateName = displayTemplates.find((t) => t.id === selectedTemplateId)?.name;

  return (
    <div className="relative min-h-screen flex flex-col z-0 overflow-hidden bg-[#020510] text-slate-100 font-sans">
      {/* Three.js Photorealistic 3D Galaxy Background */}
      <StarfieldBackground />

      {/* Navigation */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-grow relative pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex flex-col gap-6 z-10">
        {/* Simplified Header Section */}
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-2">
          <h1 className="text-3xl md:text-5xl font-display font-black tracking-wider text-slate-100 leading-tight">
            GENERATOR ID CARD <span className="text-accent-cyan glow-text-cyan">IMO 2026</span>
          </h1>
          <p className="text-slate-400 text-xs md:text-sm font-sans">
            Pilih templat ID Card, lalu isi data dan foto Anda di bawah ini.
          </p>
        </div>

        {/* Template Selector Dropdown Menu */}
        {loadingTemplates ? (
          <div className="w-full max-w-4xl mx-auto rounded-2xl glass border border-card-border/40 p-4 flex items-center justify-center gap-3 text-slate-400 text-xs font-mono">
            <Loader2 className="w-4 h-4 animate-spin text-accent-cyan" />
            <span>Memuat menu templat...</span>
          </div>
        ) : (
          <div className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-slate-950/90 border border-card-border/60 rounded-2xl p-4 shadow-xl backdrop-blur-xl gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-accent-cyan/15 border border-accent-cyan/30 text-accent-cyan shadow-[0_0_12px_rgba(125,249,255,0.2)]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <label htmlFor="template-select" className="text-xs font-mono font-bold text-accent-cyan uppercase tracking-wider block">
                  PILIH TEMPLAT ID CARD
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Pilih templat dari menu di samping</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-md">
              <select
                id="template-select"
                value={selectedTemplateId}
                disabled={isSwitchingTemplate}
                onChange={(e) => {
                  const found = displayTemplates.find((t) => t.id === e.target.value);
                  if (found) handleSelectTemplate(found);
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-card-border/80 text-slate-100 text-xs font-mono font-bold focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan cursor-pointer transition-colors shadow-inner disabled:opacity-50"
              >
                {displayTemplates.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-950 text-slate-200">
                    {t.name} {t.is_default ? "(Default)" : ""}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleRefreshTemplatesList}
                disabled={refreshingList || isSwitchingTemplate}
                title="Segarkan & verifikasi ulang templat"
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-card-border/80 text-slate-300 hover:text-accent-cyan transition-all flex items-center justify-center disabled:opacity-50 shadow-inner"
              >
                <RefreshCw className={`w-4 h-4 ${refreshingList || isSwitchingTemplate ? "animate-spin text-accent-cyan" : ""}`} />
              </button>
            </div>
          </div>
        )}

        {/* Core Generator Section */}
        <section className="w-full">
          {loadingTemplates || isSwitchingTemplate || !selectedTemplateUrl ? (
            <div className="w-full max-w-4xl mx-auto rounded-3xl glass border border-accent-cyan/30 p-16 flex flex-col items-center justify-center gap-4 text-center shadow-[0_0_50px_rgba(125,249,255,0.1)]">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-accent-cyan/20 border-t-accent-cyan animate-spin" />
                <RefreshCw className="w-5 h-5 text-accent-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-mono text-sm font-bold text-accent-cyan uppercase tracking-wider">
                  {switchingTemplateName ? `Memverifikasi & Memuat ${switchingTemplateName}...` : "Menyiapkan mesin templat ID Card..."}
                </p>
                <p className="font-mono text-xs text-slate-400">
                  Membersihkan templat sebelumnya & memastikan templat terpilih benar...
                </p>
              </div>
            </div>
          ) : (
            <IdCardGenerator
              key={`${selectedTemplateId}_${templateKey}`}
              templateUrl={selectedTemplateUrl}
              templateName={activeTemplateName}
              allowUserUpload={false}
            />
          )}
        </section>
      </main>

      <footer className="w-full py-8 text-center text-xs text-slate-500 font-mono border-t border-card-border/20 mt-16 bg-background/50 relative z-10">
        &copy; {new Date().getFullYear()} IMO 2026. Official ID Card Generator Engine.
      </footer>
    </div>
  );
}
