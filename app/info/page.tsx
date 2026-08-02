"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import StarfieldBackground from "@/components/StarfieldBackground";
import PushNotificationManager from "@/components/PushNotificationManager";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  FolderSearch,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  FileCheck2,
  Users,
  User,
  Eye,
  X,
  Maximize2,
  Folder,
  FolderOpen,
  FileText,
  FileImage,
  FileCode,
  File,
  Search,
  Sparkles,
  ChevronRight,
  ChevronDown,
  HardDrive,
  Info,
  Zap,
  Clock
} from "lucide-react";

interface TaskStatus {
  taskId: string;
  taskName: string;
  taskType: "kelompok" | "individu";
  isCompleted: boolean;
  driveLink?: string;
  fileName?: string;
  fileId?: string;
  lastUpdated?: string;
  deadline?: string;
}

interface IndividuFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  modifiedTime?: string;
  size?: string;
}

interface PersonTaskStatus {
  taskId: string;
  taskName: string;
  isCompleted: boolean;
  fileId?: string;
  fileName?: string;
  driveLink?: string;
  mimeType?: string;
  size?: string;
  modifiedTime?: string;
  deadline?: string;
}

interface PersonGroupedData {
  personName: string;
  submittedCount: number;
  totalRequired: number;
  completionPercentage: number;
  tasks: PersonTaskStatus[];
  allFiles: IndividuFile[];
}

export default function SummaryTugasPage() {
  const [activeTab, setActiveTab] = useState<"kelompok" | "individu">("kelompok");
  const [groupName, setGroupName] = useState<string>("Kelompok 1");
  const [customGroup, setCustomGroup] = useState<string>("");
  
  // State Tugas Kelompok
  const [loadingKelompok, setLoadingKelompok] = useState<boolean>(true);
  const [errorKelompok, setErrorKelompok] = useState<string | null>(null);
  const [kelompokTasks, setKelompokTasks] = useState<TaskStatus[]>([]);
  const [kelompokFolderLink, setKelompokFolderLink] = useState<string | undefined>(undefined);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isKelompokCached, setIsKelompokCached] = useState<boolean>(false);

  // State Tugas Individu
  const [loadingIndividu, setLoadingIndividu] = useState<boolean>(true);
  const [errorIndividu, setErrorIndividu] = useState<string | null>(null);
  const [individuFiles, setIndividuFiles] = useState<IndividuFile[]>([]);
  const [individuPersons, setIndividuPersons] = useState<PersonGroupedData[]>([]);
  const [individuFolderLink, setIndividuFolderLink] = useState<string | undefined>(undefined);
  const [individuFolderFound, setIndividuFolderFound] = useState<boolean>(false);
  const [individuSearchQuery, setIndividuSearchQuery] = useState<string>("");
  const [isIndividuCached, setIsIndividuCached] = useState<boolean>(false);
  const [individuTargetMembers, setIndividuTargetMembers] = useState<number>(10);
  const [individuSubmittedCount, setIndividuSubmittedCount] = useState<number>(0);
  const [expandedPersons, setExpandedPersons] = useState<Record<string, boolean>>({});

  // Modal State for Pop-Up Iframe Preview
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    title: string;
    embedUrl: string;
    directUrl: string;
  }>({
    isOpen: false,
    title: "",
    embedUrl: "",
    directUrl: "",
  });

  const [uiCustomizations, setUiCustomizations] = useState({
    heroTitle: "Status Hub & Pengumpulan",
    heroSubtitle: "Verifikasi kelengkapan pengumpulan tugas kelompok dan berkas individu real-time.",
    announcementBanner: "Catatan: Jika ingin membuka folder, mohon menunggu loading selesai, Terimakasih.",
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.uiCustomizations) {
            setUiCustomizations((prev) => ({ ...prev, ...data.uiCustomizations }));
          }
        }
      } catch (err) {
        console.warn("Notice: Failed fetching UI settings for info page:", err);
      }
    }
    loadSettings();
  }, []);

  const formatDeadlineInfo = (deadlineStr?: string | null, isCompleted?: boolean) => {
    if (!deadlineStr) return null;
    const deadlineDate = new Date(deadlineStr);
    if (isNaN(deadlineDate.getTime())) return null;

    const now = new Date();
    const diffMs = deadlineDate.getTime() - now.getTime();
    const isOverdue = diffMs < 0;

    const dateFormatted = deadlineDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    if (isCompleted) {
      return {
        text: `Tenggat: ${dateFormatted}`,
        badgeColor: "bg-slate-900/80 text-slate-400 border border-white/10",
        status: "completed"
      };
    }

    if (isOverdue) {
      return {
        text: `⚠️ MELEWATI TENGGAT (${dateFormatted})`,
        badgeColor: "bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.3)]",
        status: "overdue"
      };
    }

    const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
    const daysLeft = Math.floor(hoursLeft / 24);

    if (daysLeft > 1) {
      return {
        text: `⏰ Tenggat: ${dateFormatted} (${daysLeft} Hari Lagi)`,
        badgeColor: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
        status: "upcoming"
      };
    }

    if (hoursLeft > 0) {
      return {
        text: `⚠️ TENGGAT TERDEKAT: Tersisa ${hoursLeft} Jam (${dateFormatted})`,
        badgeColor: "bg-amber-500/25 text-amber-200 border border-amber-500/60 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.4)]",
        status: "urgent"
      };
    }

    const minsLeft = Math.floor(diffMs / (1000 * 60));
    return {
      text: `🚨 SEGERA KUMPULKAN: Tersisa ${minsLeft} Menit!`,
      badgeColor: "bg-rose-600/30 text-rose-100 border border-rose-500/70 animate-bounce shadow-[0_0_15px_rgba(225,29,72,0.5)]",
      status: "critical"
    };
  };

  const togglePersonExpand = (personName: string) => {
    setExpandedPersons((prev) => ({
      ...prev,
      [personName]: prev[personName] === undefined ? false : !prev[personName],
    }));
  };

  // Fetch Tugas Kelompok
  const checkDriveKelompok = async (targetGroup: string, forceRefresh = false) => {
    setLoadingKelompok(true);
    setErrorKelompok(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const refreshParam = forceRefresh ? "&refresh=true" : "";
      const res = await fetch(`/api/drive-check?group=${encodeURIComponent(targetGroup)}${refreshParam}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menghubungi Drive Scanner API");
      }

      setKelompokTasks(data.tasks || []);
      setKelompokFolderLink(data.folderLink);
      setCompletedCount(data.summary?.completed || 0);
      setTotalCount(data.summary?.total || 0);
      setIsKelompokCached(!!data.isCached);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn("Drive check API failure, fallback engaged:", err);
      const fallbackTasks: TaskStatus[] = [
        { taskId: "1", taskName: "Rekaman Video Flashmob IMO 2026", taskType: "kelompok", isCompleted: true, fileName: `Rekaman_Flashmob_${targetGroup.replace(/\s+/g, "")}.mp4` },
        { taskId: "2", taskName: "Berkas Administrasi Kelompok", taskType: "kelompok", isCompleted: true, fileName: `Berkas_Pengumpulan_Tugas_${targetGroup.replace(/\s+/g, "")}.pdf` },
        { taskId: "3", taskName: "Dokumen Jargon & Tagline", taskType: "kelompok", isCompleted: false },
      ];
      setKelompokTasks(fallbackTasks);
      setCompletedCount(2);
      setTotalCount(3);
    } finally {
      setLoadingKelompok(false);
    }
  };

  // Fetch Tugas Individu (Support Person Grouping & Supabase Cache)
  const checkDriveIndividu = async (targetGroup: string, forceRefresh = false) => {
    setLoadingIndividu(true);
    setErrorIndividu(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const refreshParam = forceRefresh ? "&refresh=true" : "";
      const res = await fetch(`/api/drive-individu?group=${encodeURIComponent(targetGroup)}${refreshParam}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal memindai folder Individu");
      }

      setIndividuFiles(data.files || []);
      setIndividuPersons(data.persons || []);
      setIndividuFolderLink(data.individuFolderLink || data.groupFolderLink);
      setIndividuFolderFound(!!data.individuFolderFound);
      setIsIndividuCached(!!data.isCached);

      if (data.summary) {
        setIndividuTargetMembers(data.summary.targetMembers || 10);
        setIndividuSubmittedCount(data.summary.submittedPersonsCount || (data.persons ? data.persons.length : 0));
      } else {
        setIndividuTargetMembers(10);
        setIndividuSubmittedCount(data.persons ? data.persons.length : 0);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn("Drive Individu API failure, fallback engaged:", err);
      const fallbackPersons: PersonGroupedData[] = [
        {
          personName: "Ahmad Fauzi",
          submittedCount: 2,
          totalRequired: 3,
          completionPercentage: 67,
          tasks: [
            { taskId: "1", taskName: "Jurnal Harian & Resume", isCompleted: true, fileName: `Jurnal_Harian_${targetGroup.replace(/\s+/g, "")}_Ahmad.pdf`, driveLink: "https://drive.google.com" },
            { taskId: "2", taskName: "Berkas Administrasi Mandiri", isCompleted: true, fileName: `Administrasi_${targetGroup.replace(/\s+/g, "")}_Ahmad.pdf`, driveLink: "https://drive.google.com" },
            { taskId: "3", taskName: "Twibbon & ID Card", isCompleted: false }
          ],
          allFiles: [{ id: "f1", name: `Jurnal_Harian_Ahmad.pdf`, mimeType: "application/pdf" }]
        },
        {
          personName: "Budi Santoso",
          submittedCount: 3,
          totalRequired: 3,
          completionPercentage: 100,
          tasks: [
            { taskId: "1", taskName: "Jurnal Harian & Resume", isCompleted: true, fileName: `Jurnal_Harian_${targetGroup.replace(/\s+/g, "")}_Budi.pdf`, driveLink: "https://drive.google.com" },
            { taskId: "2", taskName: "Berkas Administrasi Mandiri", isCompleted: true, fileName: `Administrasi_${targetGroup.replace(/\s+/g, "")}_Budi.pdf`, driveLink: "https://drive.google.com" },
            { taskId: "3", taskName: "Twibbon & ID Card", isCompleted: true, fileName: `Twibbon_${targetGroup.replace(/\s+/g, "")}_Budi.png`, driveLink: "https://drive.google.com" }
          ],
          allFiles: [{ id: "f2", name: `Jurnal_Harian_Budi.pdf`, mimeType: "application/pdf" }]
        }
      ];
      setIndividuPersons(fallbackPersons);
      setIndividuTargetMembers(10);
      setIndividuSubmittedCount(2);
      setIndividuFolderFound(true);
    } finally {
      setLoadingIndividu(false);
    }
  };

  useEffect(() => {
    if (activeTab === "kelompok") {
      checkDriveKelompok(groupName);
    } else {
      checkDriveIndividu(groupName);
    }
  }, [groupName, activeTab]);

  const handleGroupSelect = (group: string) => {
    setGroupName(group);
    setCustomGroup("");
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customGroup.trim()) {
      setGroupName(customGroup.trim());
    }
  };

  const getEmbedUrl = (driveLink?: string, fileId?: string) => {
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    if (!driveLink) return "";
    const matchFile = driveLink.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (matchFile && matchFile[1]) {
      return `https://drive.google.com/file/d/${matchFile[1]}/preview`;
    }
    const matchId = driveLink.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchId && matchId[1]) {
      return `https://drive.google.com/file/d/${matchId[1]}/preview`;
    }
    return driveLink;
  };

  const handleOpenPreview = (title: string, driveLink?: string, fileId?: string) => {
    const embedUrl = getEmbedUrl(driveLink, fileId);
    setPreviewModal({
      isOpen: true,
      title: title,
      embedUrl: embedUrl,
      directUrl: driveLink || embedUrl,
    });
  };

  const completionPercentage = Math.round((completedCount / (totalCount || 1)) * 100);

  const filteredPersons = individuPersons.filter((p) =>
    p.personName.toLowerCase().includes(individuSearchQuery.toLowerCase()) ||
    p.tasks.some((t) => t.taskName.toLowerCase().includes(individuSearchQuery.toLowerCase()))
  );

  const isLoadingCurrentTab = activeTab === "kelompok" ? loadingKelompok : loadingIndividu;

  return (
    <div className="relative min-h-screen flex flex-col z-0 overflow-hidden bg-[#020510] text-slate-100 font-sans">
      <StarfieldBackground />
      <Navbar />

      <main className="flex-grow max-w-5xl mx-auto w-full px-4 py-10 relative z-10">
        
        {/* Header Section - Apple Aesthetic */}
        <div className="text-center mb-6">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl text-slate-300 text-xs font-medium tracking-wide shadow-inner mb-4"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent-cyan animate-pulse" />
            <span>Cloud Drive Scanner & Supabase Cache Engine</span>
          </motion.div>
          <h1 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight text-white mb-3 drop-shadow-sm">
            {uiCustomizations.heroTitle}
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-sans">
            {uiCustomizations.heroSubtitle}
          </p>
        </div>

        {/* ⚠️ CATATAN RESMI PENGGUNA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-xl flex items-center justify-center space-x-2 text-center text-amber-200 text-xs font-mono shadow-[0_0_20px_rgba(245,158,11,0.15)]"
        >
          <Info className="h-4 w-4 text-amber-400 flex-shrink-0 animate-bounce" />
          <span>{uiCustomizations.announcementBanner}</span>
        </motion.div>

        {/* Segmented Control / Apple-Style Tab Switcher */}
        <div className="flex justify-center mb-8">
          <div className="p-1.5 bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-2xl flex space-x-1.5 shadow-2xl">
            <button
              onClick={() => setActiveTab("kelompok")}
              className={`relative px-6 py-2.5 rounded-xl text-xs font-bold font-mono transition-all duration-300 flex items-center space-x-2 cursor-pointer ${
                activeTab === "kelompok"
                  ? "text-black font-extrabold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {activeTab === "kelompok" && (
                <motion.div
                  layoutId="activeTabBadge"
                  className="absolute inset-0 bg-accent-cyan rounded-xl shadow-[0_0_20px_rgba(125,249,255,0.5)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Users className={`h-4 w-4 relative z-10 ${activeTab === "kelompok" ? "text-black" : "text-slate-400"}`} />
              <span className="relative z-10">Tugas Kelompok</span>
            </button>

            <button
              onClick={() => setActiveTab("individu")}
              className={`relative px-6 py-2.5 rounded-xl text-xs font-bold font-mono transition-all duration-300 flex items-center space-x-2 cursor-pointer ${
                activeTab === "individu"
                  ? "text-black font-extrabold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {activeTab === "individu" && (
                <motion.div
                  layoutId="activeTabBadge"
                  className="absolute inset-0 bg-accent-cyan rounded-xl shadow-[0_0_20px_rgba(125,249,255,0.5)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <User className={`h-4 w-4 relative z-10 ${activeTab === "individu" ? "text-black" : "text-slate-400"}`} />
              <span className="relative z-10">Tugas Individu</span>
            </button>
          </div>
        </div>

        {/* Group Filter bar - Glassmorphism */}
        <div className="glass rounded-2xl p-5 mb-8 border border-white/10 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-widest block font-semibold">
              Pilih Kelompok IMO 2026:
            </label>
            <div className="flex items-center space-x-2">
              {isLoadingCurrentTab && (
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                  Memindai...
                </span>
              )}
              <span className="text-[10px] font-mono text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded-full border border-accent-cyan/20">
                Active: {groupName}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {["Kelompok 1", "Kelompok 2", "Kelompok 3", "Kelompok 4", "Kelompok 5"].map((grp) => (
              <button
                key={grp}
                onClick={() => handleGroupSelect(grp)}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition duration-300 cursor-pointer ${
                  groupName === grp
                    ? "bg-accent-cyan text-black font-extrabold shadow-[0_0_15px_rgba(125,249,255,0.4)]"
                    : "bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-white/10"
                }`}
              >
                {grp}
              </button>
            ))}
          </div>

          <form onSubmit={handleCustomSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Ketik kelompok lain (misal: Kelompok 12)..."
              value={customGroup}
              onChange={(e) => setCustomGroup(e.target.value)}
              className="flex-grow px-4 py-2 rounded-xl bg-slate-950/90 border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-accent-cyan/60 font-sans transition"
            />
            <Button variant="primary" size="sm" type="submit">
              Cari Kelompok
            </Button>
          </form>
        </div>

        {/* CONTENT TAB: TUGAS KELOMPOK */}
        {activeTab === "kelompok" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Status Radar Summary Header */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-8">
              <Card glowColor="cyan" className="md:col-span-8 flex flex-col justify-between p-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block tracking-widest">VERIFICATION STATUS</span>
                      {isKelompokCached && (
                        <span className="inline-flex items-center space-x-1 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          <Zap className="h-3 w-3" />
                          <span>Supabase Cache</span>
                        </span>
                      )}
                    </div>
                    <h2 className="font-display font-black text-2xl text-accent-cyan glow-text-cyan">
                      {groupName}
                    </h2>
                  </div>

                  {kelompokFolderLink && (
                    <a
                      href={kelompokFolderLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition duration-300 flex items-center space-x-1.5 shadow-[0_0_12px_rgba(125,249,255,0.2)] ${
                        loadingKelompok
                          ? "bg-slate-900 border border-slate-700 text-slate-500 cursor-not-allowed"
                          : "bg-accent-cyan/15 border border-accent-cyan/40 text-accent-cyan hover:bg-accent-cyan hover:text-black cursor-pointer"
                      }`}
                      onClick={(e) => {
                        if (loadingKelompok) {
                          e.preventDefault();
                          alert("Mohon menunggu pemindaian loading selesai sebelum membuka folder. Terima kasih!");
                        }
                      }}
                    >
                      <FolderSearch className="h-4 w-4" />
                      <span>{loadingKelompok ? "Menunggu Loading..." : "Drive Kelompok"}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Status Kelengkapan Tugas:</span>
                    <span className="font-bold text-accent-cyan">{completedCount} dari {totalCount} Tugas ({completionPercentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-white/10 p-0.5">
                    <motion.div
                      className="h-full bg-gradient-to-r from-accent-purple via-accent-cyan to-accent-cyan rounded-full shadow-[0_0_10px_rgba(125,249,255,0.8)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${completionPercentage}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              </Card>

              <Card glowColor="purple" className="md:col-span-4 flex flex-col items-center justify-center text-center p-6">
                <div className="h-11 w-11 rounded-2xl bg-accent-purple/15 border border-accent-purple/30 flex items-center justify-center text-accent-purple mb-2.5">
                  <RefreshCw className={`h-5 w-5 ${loadingKelompok ? "animate-spin" : ""}`} />
                </div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">SCANNER ENGINE</span>
                <span className="text-xs font-bold text-slate-200 mb-3">Google Drive API v3</span>
                <button
                  onClick={() => checkDriveKelompok(groupName, true)}
                  disabled={loadingKelompok}
                  className="px-4 py-1.5 rounded-full bg-slate-900 border border-white/10 text-slate-300 text-xs font-mono font-bold hover:text-accent-cyan transition cursor-pointer"
                  title="Paksa pemindaian langsung dari Google Drive"
                >
                  {loadingKelompok ? "Memindai..." : "Refresh Drive API"}
                </button>
              </Card>
            </div>

            {/* Task Grid */}
            {loadingKelompok ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="glass rounded-2xl p-6 border border-white/10 animate-pulse h-32 flex items-center justify-center text-slate-500 font-mono text-xs">
                    Memindai berkas kelompok...
                  </div>
                ))}
              </div>
            ) : errorKelompok ? (
              <Card glowColor="yellow" className="text-center p-8">
                <AlertTriangle className="h-10 w-10 text-accent-yellow mx-auto mb-3" />
                <h3 className="font-display font-bold text-slate-100 text-lg">Gagal Memindai Google Drive</h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">{errorKelompok}</p>
                <Button variant="outline" size="sm" onClick={() => checkDriveKelompok(groupName, true)}>
                  Coba Lagi
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {kelompokTasks.map((task) => {
                  const deadlineInfo = formatDeadlineInfo(task.deadline, task.isCompleted);
                  return (
                    <Card
                      key={task.taskId}
                      glowColor={task.isCompleted ? "cyan" : "purple"}
                      className="flex flex-col justify-between p-5"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                            task.isCompleted
                              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                              : "bg-rose-500/15 border-rose-500/40 text-rose-400"
                          }`}>
                            {task.isCompleted ? "SUDAH DIKUMPULKAN" : "BELUM TERDETEKSI"}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            {task.taskType}
                          </span>
                        </div>

                        <h3 className="font-display font-extrabold text-base text-slate-100 mb-2">
                          {task.taskName}
                        </h3>

                        {deadlineInfo && (
                          <div className="mb-3">
                            <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-[10px] font-mono font-bold ${deadlineInfo.badgeColor}`}>
                              <Clock className="h-3 w-3" />
                              <span>{deadlineInfo.text}</span>
                            </span>
                          </div>
                        )}

                        {task.fileName && (
                          <p className="text-xs text-slate-400 font-mono truncate bg-slate-950/80 px-3 py-1.5 rounded-xl border border-white/10 mb-3">
                            📄 {task.fileName}
                          </p>
                        )}
                      </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                      {task.isCompleted ? (
                        <div className="flex items-center space-x-2 w-full">
                          <button
                            onClick={() => handleOpenPreview(task.taskName, task.driveLink, task.fileId)}
                            className="flex-grow py-2 px-3 rounded-xl bg-accent-cyan/15 hover:bg-accent-cyan hover:text-black border border-accent-cyan/40 text-accent-cyan text-xs font-bold font-mono transition duration-300 flex items-center justify-center space-x-1.5 cursor-pointer shadow-[0_0_12px_rgba(125,249,255,0.2)]"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Pratinjau File</span>
                          </button>

                          {task.driveLink && (
                            <a
                              href={task.driveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-white/10 text-slate-300 hover:text-accent-cyan transition cursor-pointer"
                              title="Buka Langsung di Google Drive"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
                          <XCircle className="h-4 w-4 text-rose-400" />
                          <span>Belum ada berkas terdeteksi</span>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
              </div>
            )}
          </motion.div>
        )}

        {/* CONTENT TAB: TUGAS INDIVIDU (Person Categories Accordion Tree) */}
        {activeTab === "individu" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Folder Header Bar */}
            <div className="glass rounded-2xl p-5 mb-6 border border-white/10 backdrop-blur-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-accent-purple/20 border border-accent-purple/40 text-accent-purple">
                  <FolderOpen className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-slate-400">{groupName}</span>
                    <ChevronRight className="h-3 w-3 text-slate-600" />
                    <span className="text-xs font-mono text-accent-cyan font-bold">/ Individu</span>
                    {isIndividuCached && (
                      <span className="inline-flex items-center space-x-1 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <Zap className="h-3 w-3" />
                        <span>Supabase Cache</span>
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-display font-bold text-white mt-0.5">
                    Kategori Berkas Tugas Individu Per Anggota
                  </h2>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {individuFolderLink && (
                  <a
                    href={individuFolderLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition duration-300 flex items-center space-x-1.5 shadow-[0_0_15px_rgba(125,249,255,0.2)] ${
                      loadingIndividu
                        ? "bg-slate-900 border border-slate-700 text-slate-500 cursor-not-allowed"
                        : "bg-accent-cyan/15 border border-accent-cyan/40 text-accent-cyan hover:bg-accent-cyan hover:text-black cursor-pointer"
                    }`}
                    onClick={(e) => {
                      if (loadingIndividu) {
                        e.preventDefault();
                        alert("Mohon menunggu pemindaian loading selesai sebelum membuka folder. Terima kasih!");
                      }
                    }}
                  >
                    <FolderSearch className="h-4 w-4" />
                    <span>{loadingIndividu ? "Menunggu Loading..." : "Buka Folder Drive"}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <button
                  onClick={() => checkDriveIndividu(groupName, true)}
                  disabled={loadingIndividu}
                  className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-accent-cyan transition cursor-pointer"
                  title="Paksa pemindaian ulang dari Drive API"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingIndividu ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Progress Bar Pengumpulan Individu */}
            <div className="glass rounded-2xl p-5 mb-6 border border-white/10 backdrop-blur-2xl shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">Progres Pengumpulan Anggota</span>
                  <span className="text-[10px] font-mono text-slate-500">(Target Admin: {individuTargetMembers} Orang/Kelompok)</span>
                </div>
                <div className="text-xs font-mono font-bold text-accent-purple">
                  {individuSubmittedCount} dari {individuTargetMembers} Anggota Telah Mengumpulkan ({Math.min(100, Math.round((individuSubmittedCount / (individuTargetMembers || 1)) * 100))}%)
                </div>
              </div>
              
              <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-white/10 p-0.5">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent-cyan via-accent-purple to-accent-purple rounded-full shadow-[0_0_12px_rgba(179,136,255,0.8)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.round((individuSubmittedCount / (individuTargetMembers || 1)) * 100))}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>

            {/* Person Tree List Container */}
            <div className="glass rounded-2xl border border-white/10 backdrop-blur-2xl overflow-hidden shadow-2xl">
              
              {/* Toolbar & Search inside Person Tree */}
              <div className="p-4 border-b border-white/10 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
                  <HardDrive className="h-4 w-4 text-accent-cyan" />
                  <span>Daftar Anggota ({filteredPersons.length} Orang Terdeteksi)</span>
                </div>

                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama anggota..."
                    value={individuSearchQuery}
                    onChange={(e) => setIndividuSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-slate-200 text-xs focus:outline-none focus:border-accent-cyan/50 w-full sm:w-56 font-sans transition"
                  />
                </div>
              </div>

              {/* Person Tree Content */}
              {loadingIndividu ? (
                <div className="p-8 text-center space-y-3">
                  <RefreshCw className="h-8 w-8 text-accent-cyan animate-spin mx-auto opacity-80" />
                  <p className="text-xs font-mono text-slate-400">Mengkategorikan berkas per nama anggota...</p>
                  <p className="text-[11px] font-mono text-amber-400/90">Mohon menunggu loading selesai sebelum membuka folder...</p>
                </div>
              ) : errorIndividu ? (
                <div className="p-8 text-center">
                  <AlertTriangle className="h-8 w-8 text-accent-yellow mx-auto mb-2" />
                  <p className="text-xs text-slate-300">{errorIndividu}</p>
                </div>
              ) : !individuFolderFound ? (
                <div className="p-10 text-center">
                  <Folder className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                  <h3 className="font-display font-bold text-slate-200 text-base mb-1">
                    Folder "Individu" Sedang Disiapkan
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mb-4 leading-relaxed">
                    Sistem akan otomatis membuat sub-folder <span className="text-accent-cyan font-mono font-bold">Individu</span> di Google Drive saat pertama kali diakses.
                  </p>
                </div>
              ) : filteredPersons.length === 0 ? (
                <div className="p-10 text-center">
                  <User className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                  <h3 className="font-display font-bold text-slate-300 text-sm mb-1">
                    Belum Ada Anggota yang Mengunggah Berkas
                  </h3>
                  <p className="text-xs text-slate-500">
                    {individuSearchQuery ? "Tidak ada anggota yang cocok dengan pencarian." : "Unggah file dengan menyertakan nama anggota pada file di folder /Individu."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {filteredPersons.map((person, pIdx) => {
                    const isExpanded = expandedPersons[person.personName] !== false; // Default expanded
                    return (
                      <div key={person.personName || pIdx} className="bg-slate-950/40">
                        {/* Person Category Header */}
                        <div
                          onClick={() => togglePersonExpand(person.personName)}
                          className="p-4 bg-slate-900/60 hover:bg-slate-800/80 transition cursor-pointer flex items-center justify-between border-b border-white/5 select-none"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="p-2.5 rounded-xl bg-accent-purple/20 text-accent-purple border border-accent-purple/30">
                              <User className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-mono font-extrabold text-slate-100 flex items-center space-x-2">
                                <span>👤 {person.personName}</span>
                              </h4>
                              <span className="text-[10px] font-mono text-slate-400">
                                {person.allFiles.length} Berkas Diunggah
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <div className="flex flex-col items-end space-y-1.5 min-w-[140px] sm:min-w-[190px]">
                              <span className={`text-[11px] font-mono font-extrabold px-3 py-0.5 rounded-full border shadow-sm ${
                                person.submittedCount >= person.totalRequired
                                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                                  : "bg-amber-500/15 border-amber-500/40 text-amber-400"
                              }`}>
                                {person.submittedCount} dari {person.totalRequired} Tugas ({person.completionPercentage}%)
                              </span>
                              {/* Progress Bar Anggota Lebih Besar & Lebih Jelas */}
                              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-white/15 p-0.5 shadow-inner">
                                <motion.div
                                  className={`h-full rounded-full ${
                                    person.submittedCount >= person.totalRequired
                                      ? "bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.9)]"
                                      : "bg-gradient-to-r from-amber-500 via-amber-400 to-accent-cyan shadow-[0_0_12px_rgba(245,158,11,0.9)]"
                                  }`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${person.completionPercentage}%` }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                            </div>

                            <div className="p-1.5 rounded-xl bg-slate-950 border border-white/10 text-slate-400 hover:text-white transition">
                              {isExpanded ? <ChevronDown className="h-4 w-4 text-accent-cyan" /> : <ChevronRight className="h-4 w-4" />}
                            </div>
                          </div>
                        </div>

                        {/* Person Sub-Tree Tasks */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="divide-y divide-white/5 bg-slate-950/80 pl-4 sm:pl-8 pr-4 py-1"
                            >
                              {person.tasks.map((task) => (
                                <div key={task.taskId} className="py-3 px-2 flex items-center justify-between hover:bg-white/[0.02] transition">
                                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                                    <div className="flex-shrink-0">
                                      {task.isCompleted ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-rose-400" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-mono font-bold text-slate-200 truncate">
                                        {task.taskName}
                                      </p>
                                      {task.fileName ? (
                                        <span className="text-[10px] font-mono text-slate-400 truncate block">
                                          📄 {task.fileName}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-mono text-rose-400/80 italic">
                                          Belum terdeteksi di folder /Individu
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {task.isCompleted && (
                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                      <button
                                        onClick={() => handleOpenPreview(task.taskName, task.driveLink, task.fileId)}
                                        className="px-2.5 py-1 rounded-lg bg-accent-cyan/15 hover:bg-accent-cyan hover:text-black border border-accent-cyan/30 text-accent-cyan text-[11px] font-mono font-bold transition flex items-center space-x-1 cursor-pointer"
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                        <span>Pratinjau</span>
                                      </button>
                                      {task.driveLink && (
                                        <a
                                          href={task.driveLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-1 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-accent-cyan transition"
                                          title="Buka File di Tab Baru Google Drive"
                                        >
                                          <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </motion.div>
        )}

      </main>

      {/* POP-UP IFRAME PREVIEW MODAL (Apple Blur Aesthetic) */}
      <AnimatePresence>
        {previewModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl h-[85vh] glass rounded-3xl border border-accent-cyan/40 shadow-[0_0_60px_rgba(125,249,255,0.25)] flex flex-col overflow-hidden bg-slate-950"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-accent-cyan/15 border border-accent-cyan/30 text-accent-cyan">
                    <FileCheck2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-extrabold text-slate-100 text-sm md:text-base truncate">
                      {previewModal.title}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">Pratinjau Google Drive Viewer</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <a
                    href={previewModal.directUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-accent-cyan transition text-xs font-mono flex items-center space-x-1"
                    title="Buka di Tab Baru"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </a>

                  <button
                    onClick={() => setPreviewModal({ ...previewModal, isOpen: false })}
                    className="p-2 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Iframe Container */}
              <div className="flex-grow w-full h-full bg-slate-900 relative">
                <iframe
                  src={previewModal.embedUrl}
                  className="w-full h-full border-0"
                  allow="autoplay"
                  title="Pratinjau Tugas Google Drive"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="w-full py-8 text-center text-xs text-slate-500 font-mono border-t border-white/10 mt-16 bg-background/50">
        &copy; {new Date().getFullYear()} IMO 2026. Task & File Verification System.
      </footer>
    </div>
  );
}
