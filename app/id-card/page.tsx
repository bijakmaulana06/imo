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

export default function IdCardPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedTemplateUrl, setSelectedTemplateUrl] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("official-default-template");
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  useEffect(() => {
    async function loadTemplates() {
      try {
        setLoadingTemplates(true);
        const res = await fetch("/api/id-card-templates");
        if (!res.ok) throw new Error("Gagal mengambil templat");
        const data = await res.json();
        
        const list: TemplateItem[] = data.templates || [];
        const activeList = list.filter((t) => t.is_active !== false);
        setTemplates(activeList);

        if (activeList.length > 0) {
          const defaultItem = activeList.find((t) => t.is_default) || activeList[0];
          const psdUrl = defaultItem.background_url || defaultItem.layout_json?.psd_url || "/templates/id-card.psd";
          setSelectedTemplateUrl(psdUrl);
          setSelectedTemplateId(defaultItem.id);
        } else {
          setSelectedTemplateUrl("/templates/id-card.psd");
          setSelectedTemplateId("official-default-template");
        }
      } catch (err) {
        console.warn("Could not load templates list from API, using fallback:", err);
        setSelectedTemplateUrl("/templates/id-card.psd");
        setSelectedTemplateId("official-default-template");
      } finally {
        setLoadingTemplates(false);
      }
    }

    loadTemplates();
  }, []);

  const handleSelectTemplate = (t: TemplateItem) => {
    const psdUrl = t.background_url || t.layout_json?.psd_url || "/templates/id-card.psd";
    setSelectedTemplateUrl(psdUrl);
    setSelectedTemplateId(t.id);
  };

  const displayTemplates = templates.length > 0 ? templates : [FALLBACK_TEMPLATE];

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

            <div className="flex-1 max-w-md">
              <select
                id="template-select"
                value={selectedTemplateId}
                onChange={(e) => {
                  const found = displayTemplates.find((t) => t.id === e.target.value);
                  if (found) handleSelectTemplate(found);
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-card-border/80 text-slate-100 text-xs font-mono font-bold focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan cursor-pointer transition-colors shadow-inner"
              >
                {displayTemplates.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-950 text-slate-200">
                    {t.name} {t.is_default ? "(Default)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Core Generator Section */}
        <section className="w-full">
          {loadingTemplates || !selectedTemplateUrl ? (
            <div className="w-full max-w-4xl mx-auto rounded-3xl glass border border-card-border/40 p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-accent-cyan" />
              <p className="font-mono text-xs text-slate-300">Menyiapkan mesin templat ID Card...</p>
            </div>
          ) : (
            <IdCardGenerator templateUrl={selectedTemplateUrl} allowUserUpload={false} />
          )}
        </section>
      </main>

      <footer className="w-full py-8 text-center text-xs text-slate-500 font-mono border-t border-card-border/20 mt-16 bg-background/50 relative z-10">
        &copy; {new Date().getFullYear()} IMO 2026. Official ID Card Generator Engine.
      </footer>
    </div>
  );
}
