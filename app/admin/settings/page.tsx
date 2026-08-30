"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSiteConfig, DEFAULT_SITE_CONFIG } from "@/components/SiteConfigProvider";
import {
  Globe,
  Palette,
  ShieldAlert,
  Type,
  HardDrive,
  Bell,
  Send,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Activity,
  TerminalSquare,
  Lock,
  Cpu,
  RefreshCcw,
  WifiOff,
  X,
  Code,
  Sparkles,
  LayoutGrid,
  ChevronUp,
  ChevronDown,
  Music,
  ExternalLink,
  Plus,
  Trash2,
  Camera,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Copy,
  RotateCcw,
  Milestone,
  Compass,
  Minus,
  Search,
  UsersRound
} from "lucide-react";
import { Link } from "next-view-transitions";
import ImoLogo from "@/components/ImoLogo";
import StarfieldBackground from "@/components/StarfieldBackground";

type TabId = "root_system" | "push" | "security" | "theme" | "branding" | "copywriting" | "drive" | "status" | "home_nodes" | "audio_player";

// Organic offsets & distinct custom routing styles for PCB Circuit Constellation
const NODES = [
  { id: "root_system" as TabId, label: "Next.js Engine", icon: Cpu, angleOffset: 0, radiusOffset: 0, routeType: "v_first", cornerRatio: 0.7, color: "from-blue-500/20 to-cyan-500/20 border-cyan-500/50 text-cyan-300" },
  { id: "push" as TabId, label: "Push & VAPID", icon: Bell, angleOffset: 0, radiusOffset: 0, routeType: "h_first", cornerRatio: 0.45, color: "from-amber-500/20 to-orange-500/20 border-amber-500/50 text-amber-300" },
  { id: "security" as TabId, label: "API Security", icon: Lock, angleOffset: 0, radiusOffset: 0, routeType: "double_hv", cornerRatio: 0.5, color: "from-rose-500/20 to-pink-500/20 border-rose-500/50 text-rose-300" },
  { id: "theme" as TabId, label: "Theme Engine", icon: Palette, angleOffset: 0, radiusOffset: 0, routeType: "v_first", cornerRatio: 0.85, color: "from-purple-500/20 to-indigo-500/20 border-purple-500/50 text-purple-300" },
  { id: "branding" as TabId, label: "Branding & SEO", icon: Globe, angleOffset: 0, radiusOffset: 0, routeType: "h_first", cornerRatio: 0.65, color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/50 text-emerald-300" },
  { id: "copywriting" as TabId, label: "Localizations", icon: Type, angleOffset: 0, radiusOffset: 0, routeType: "double_vh", cornerRatio: 0.55, color: "from-cyan-500/20 to-blue-500/20 border-cyan-500/50 text-cyan-300" },
  { id: "drive" as TabId, label: "Google Drive", icon: HardDrive, angleOffset: 0, radiusOffset: 0, routeType: "h_first", cornerRatio: 0.35, color: "from-indigo-500/20 to-blue-500/20 border-indigo-500/50 text-indigo-300" },
  { id: "status" as TabId, label: "System Modes", icon: ShieldAlert, angleOffset: 0, radiusOffset: 0, routeType: "double_hv", cornerRatio: 0.6, color: "from-rose-600/20 to-red-500/20 border-rose-400/50 text-rose-300" },
  { id: "home_nodes" as TabId, label: "Menu Beranda", icon: LayoutGrid, angleOffset: 0, radiusOffset: 0, routeType: "v_first", cornerRatio: 0.75, color: "from-teal-500/20 to-emerald-500/20 border-teal-500/50 text-teal-300" },
  { id: "audio_player" as TabId, label: "Audio Player", icon: Music, angleOffset: 45, radiusOffset: 15, routeType: "v_first", cornerRatio: 0.8, color: "from-fuchsia-500/20 to-purple-500/20 border-fuchsia-500/50 text-fuchsia-300" },
];

export default function AdminSettingsCommandCenter() {
  const { refreshConfig } = useSiteConfig();
  const [activeTab, setActiveTab] = useState<TabId | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Responsive Layout calculations
  const [baseRadius, setBaseRadius] = useState(210);
  const [isMobile, setIsMobile] = useState(false);

  // System Core Settings State
  const [coreConfig, setCoreConfig] = useState(DEFAULT_SITE_CONFIG);
  const [gdriveParentFolder, setGdriveParentFolder] = useState("");
  const [totalGroupsCount, setTotalGroupsCount] = useState(20);
  const [targetMembersPerGroup, setTargetMembersPerGroup] = useState(10);
  const [groupMemberCounts, setGroupMemberCounts] = useState<Record<string, number>>({});
  const [groupNames, setGroupNames] = useState<Record<string, string>>({});
  const [showCustomGroupCounts, setShowCustomGroupCounts] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    enableNewTaskNotif: true,
    enableAnnouncementNotif: true,
    enableDeadlineNotif: true,
    vapidPublicKey: "",
    vapidPrivateKey: "",
  });
  const [pushSubscribersCount, setPushSubscribersCount] = useState(0);
  
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTargetUrl, setBroadcastTargetUrl] = useState("/info");
  const [sendingPush, setSendingPush] = useState(false);
  const [pushResultMsg, setPushResultMsg] = useState<string | null>(null);
  const [testEndpoint, setTestEndpoint] = useState("");
  const [testingPush, setTestingPush] = useState(false);
  const [purgingCache, setPurgingCache] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const availH = window.innerHeight - 140;
      const availW = window.innerWidth - 80;
      const maxSafeRadius = Math.min(availW * 0.38, availH * 0.38);

      if (window.innerWidth < 768) {
        setIsMobile(true);
        setBaseRadius(Math.min(130, maxSafeRadius));
      } else if (window.innerWidth < 1024) {
        setIsMobile(false);
        setBaseRadius(Math.min(185, maxSafeRadius));
      } else {
        setIsMobile(false);
        setBaseRadius(Math.min(235, maxSafeRadius));
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(async (registration) => {
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          setTestEndpoint(sub.endpoint);
        }
      });
    }
    fetchSettings();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setCoreConfig({ ...DEFAULT_SITE_CONFIG, ...data });
        setGdriveParentFolder(data.gdriveParentFolder || "");
        setTotalGroupsCount(data.totalGroupsCount || 20);
        setTargetMembersPerGroup(data.targetMembersPerGroup || 10);
        if (data.groupMemberCounts && typeof data.groupMemberCounts === "object") {
          setGroupMemberCounts(data.groupMemberCounts);
        }
        if (data.groupNames && typeof data.groupNames === "object") {
          setGroupNames(data.groupNames);
        }
        if (data.notificationSettings) {
          setNotificationSettings(data.notificationSettings);
        }
        setPushSubscribersCount(data.pushSubscribersCount || 0);
      }
    } catch (err) {
      console.error("Gagal memuat pengaturan teknis:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteCoreConfig: coreConfig,
          gdriveParentFolder,
          totalGroupsCount,
          targetMembersPerGroup,
          groupMemberCounts,
          groupNames,
          notificationSettings,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSaveSuccess("System root configurations updated successfully!");
        await refreshConfig();
        setTimeout(() => setSaveSuccess(null), 5000);
      } else {
        setSaveError(data.error || "Gagal menyimpan pengaturan.");
      }
    } catch (err: any) {
      setSaveError("Terjadi kesalahan sistem: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePurgeCache = async () => {
    setPurgingCache(true);
    setSaveSuccess(null);
    setSaveError(null);
    try {
      const res = await fetch("/api/admin/purge-cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "/", type: "layout" }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveSuccess("Next.js Cache successfully purged! Clients will receive fresh data.");
        setTimeout(() => setSaveSuccess(null), 5000);
      } else {
        setSaveError(data.error || "Failed to purge cache.");
      }
    } catch (err: any) {
      setSaveError("System Error: " + err.message);
    } finally {
      setPurgingCache(false);
    }
  };



  const handleSendPushBroadcast = async (e: React.FormEvent, isTest: boolean = false) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) {
      alert("Judul dan pesan notifikasi wajib diisi!");
      return;
    }

    if (isTest) setTestingPush(true);
    else setSendingPush(true);
    
    setPushResultMsg(null);

    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMessage,
          url: broadcastTargetUrl,
          isTest,
          testEndpoint: isTest ? testEndpoint : undefined
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPushResultMsg(data.message || (isTest ? "Test ping sent successfully!" : `Berhasil mengirim ke ${data.sentCount} perangkat!`));
        if (!isTest) {
          setBroadcastTitle("");
          setBroadcastMessage("");
        }
      } else {
        setPushResultMsg("Gagal: " + (data.error || "Gagal mengirim notifikasi"));
      }
    } catch (err: any) {
      setPushResultMsg("Error: " + err.message);
    } finally {
      if (isTest) setTestingPush(false);
      else setSendingPush(false);
    }
  };

  const getCoordinates = (index: number) => {
    const node = NODES[index];
    const stepAngle = 360 / NODES.length;
    const baseAngle = (index * stepAngle) - 90;
    const finalAngleDeg = baseAngle + (node.angleOffset || 0);
    const angleRad = (finalAngleDeg * Math.PI) / 180;
    const nodeRadius = baseRadius + (node.radiusOffset || 0);
    
    // Elliptical scaling for widescreen displays (wider X radius, compact Y radius to prevent card collisions)
    const radiusX = isMobile ? nodeRadius : nodeRadius * 1.35;
    const radiusY = isMobile ? nodeRadius : nodeRadius * 0.95;

    const x = Math.cos(angleRad) * radiusX;
    const y = Math.sin(angleRad) * radiusY;
    return { x, y };
  };

  return (
    <div className="min-h-screen bg-[#020510] text-slate-300 flex overflow-hidden font-mono relative">
      {/* Dimmed Starfield Background for Settings Page */}
      <div className="opacity-35 filter brightness-75 pointer-events-none">
        <StarfieldBackground />
      </div>
      
      {/* ALERTS */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-6 right-6 z-50 px-4 py-3 rounded-lg bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center space-x-2 backdrop-blur-md"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{saveSuccess}</span>
          </motion.div>
        )}
        {saveError && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-6 right-6 z-50 px-4 py-3 rounded-lg bg-rose-950/90 border border-rose-500/40 text-rose-300 text-xs shadow-[0_0_25px_rgba(244,63,94,0.4)] flex items-center space-x-2 backdrop-blur-md"
          >
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <span>{saveError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col h-screen relative z-10 pt-16">
        <header className="fixed top-0 left-0 right-0 h-16 border-b border-slate-800/40 bg-[#020510]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-40">
          <div className="flex items-center space-x-3">
            <Link href="/admin/dashboard" className="text-slate-500 hover:text-cyan-400 transition">
              <TerminalSquare className="w-5 h-5" />
            </Link>
            <div className="h-4 w-[1px] bg-slate-700" />
            <span className="text-xs font-bold text-cyan-400 tracking-[0.2em] uppercase glow-text-cyan flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>IMO_CIRCUIT_CONSTELLATION</span>
            </span>
          </div>
          <button
            onClick={() => handleSaveAll()}
            disabled={saving || loading}
            className="px-4 py-1.5 rounded-lg bg-cyan-600/20 border border-cyan-500/50 hover:bg-cyan-500/40 text-cyan-300 text-xs font-bold transition flex items-center space-x-2 disabled:opacity-50 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "SYNCING..." : "SAVE ALL SETTINGS"}</span>
          </button>
        </header>

        {/* --- RADIAL CONSTELLATION NODE CANVAS --- */}
        <div className="flex-1 w-full h-full relative overflow-y-auto overflow-x-hidden bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.06)_0%,rgba(2,5,16,1)_75%)]">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-cyan-500">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : isMobile ? (
            /* --- MOBILE VERTICAL GRID LAYOUT --- */
            <div className="flex flex-col p-6 space-y-6 w-full max-w-sm mx-auto pb-24 relative z-10">
              {/* Sci-Fi Background Decor */}
              <div className="fixed inset-0 bg-[url('/noise.png')] bg-repeat opacity-[0.03] pointer-events-none mix-blend-overlay" />
              <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[300px] h-[300px] border border-cyan-500/10 rounded-full border-dashed animate-[spin_80s_linear_infinite] pointer-events-none" />

              {/* Center Core Header */}
              <div className="flex flex-col items-center mt-4 mb-6">
                <motion.div 
                  className="relative flex items-center justify-center p-5 bg-[#070b16]/90 rounded-full border-2 border-cyan-500/60 shadow-[0_0_40px_rgba(34,211,238,0.3)] backdrop-blur-xl group"
                  animate={{ boxShadow: ["0 0 20px rgba(34,211,238,0.3)", "0 0 40px rgba(34,211,238,0.6)", "0 0 20px rgba(34,211,238,0.3)"] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                >
                  <ImoLogo className="h-9 w-auto filter drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] opacity-95" />
                  <div className="absolute inset-[-8px] rounded-full border-t-2 border-b-2 border-cyan-400 blur-[1px] animate-[spin_5s_linear_infinite]" />
                </motion.div>
                <div className="mt-4 px-3 py-1 bg-cyan-950/60 border border-cyan-500/30 rounded-full text-[9px] font-bold tracking-[0.25em] text-cyan-400 uppercase">
                  IMO SYSTEM CORE
                </div>
              </div>

              {/* Vertical Node List */}
              <div className="grid grid-cols-1 gap-3 relative z-20">
                {NODES.map((node, i) => {
                  const isActive = activeTab === node.id;
                  return (
                    <motion.div
                      key={node.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setActiveTab(node.id)}
                      className={`
                        relative p-3.5 rounded-2xl border backdrop-blur-xl shadow-lg transition-all flex items-center space-x-3.5 cursor-pointer
                        ${isActive ? "border-cyan-400 bg-cyan-950/80 text-white shadow-[0_0_20px_rgba(34,211,238,0.4)]" : `${node.color} bg-[#0b0f19]/90 border-white/5`}
                      `}
                    >
                      <div className={`p-2 rounded-xl bg-black/40 border border-white/10 ${isActive ? "text-cyan-300" : ""}`}>
                        <node.icon className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[11px] font-bold tracking-wider uppercase text-slate-100">
                          {node.label}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono tracking-tight">
                          {isActive ? "ACTIVE NODE" : "CLICK TO CONFIG"}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* --- DESKTOP RADIAL CONSTELLATION --- */
            <>
              {/* Sci-Fi Background Tech Grid & Rings */}
              <div className="absolute inset-0 bg-[url('/noise.png')] bg-repeat opacity-[0.03] pointer-events-none mix-blend-overlay" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(460px,60vh)] h-[min(460px,60vh)] border border-cyan-500/10 rounded-full border-dashed animate-[spin_80s_linear_infinite] pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(620px,78vh)] h-[min(620px,78vh)] border border-blue-500/10 rounded-full animate-[spin_140s_linear_infinite_reverse] pointer-events-none" />

              {/* SQUARED (PCB CIRCUIT STEPPED) CONNECTING LINES SVG */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <g style={{ transform: "translate(50%, 50%)" }}>
                  {NODES.map((node, i) => {
                    const { x, y } = getCoordinates(i);
                    const isActive = activeTab === node.id;
                    
                    // Exit port on central core border
                    const stepAngle = 360 / NODES.length;
                    const baseAngle = (i * stepAngle) - 90;
                    const finalAngleDeg = baseAngle + (node.angleOffset || 0);
                    const angleRad = (finalAngleDeg * Math.PI) / 180;
                    const CORE_RADIUS = 50;
                    const startX = Math.cos(angleRad) * CORE_RADIUS;
                    const startY = Math.sin(angleRad) * CORE_RADIUS;

                    // Sector-bounded step out to guarantee zero line collisions across quadrants
                    const sectorDist = 55;
                    const sectorX = startX + Math.cos(angleRad) * sectorDist;
                    const sectorY = startY + Math.sin(angleRad) * sectorDist;

                    const isMoreVertical = Math.abs(Math.sin(angleRad)) > Math.abs(Math.cos(angleRad));
                    
                    let pathData = "";
                    const joints: { cx: number; cy: number }[] = [
                      { cx: sectorX, cy: sectorY }
                    ];

                    if (isMoreVertical) {
                      pathData = `M ${startX} ${startY} L ${sectorX} ${sectorY} L ${sectorX} ${y} L ${x} ${y}`;
                      joints.push({ cx: sectorX, cy: y });
                    } else {
                      pathData = `M ${startX} ${startY} L ${sectorX} ${sectorY} L ${x} ${sectorY} L ${x} ${y}`;
                      joints.push({ cx: x, cy: sectorY });
                    }

                    return (
                      <g key={`circuit-group-${node.id}`}>
                        {/* Start Port Dot at Core Border */}
                        <circle cx={startX} cy={startY} r={isActive ? 3 : 2} fill={isActive ? "#22d3ee" : "#475569"} />

                        {/* Sector-Bounded Non-Colliding 90-degree Path */}
                        <motion.path
                          d={pathData}
                          fill="none"
                          stroke={isActive ? "#22d3ee" : "rgba(51, 65, 85, 0.6)"}
                          strokeWidth={isActive ? 2.5 : 1.5}
                          strokeDasharray={isActive ? "none" : "5,5"}
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1, delay: i * 0.08 }}
                        />

                        {/* Joint Dots at Sector Bends */}
                        {joints.map((j, idx) => (
                          <circle key={idx} cx={j.cx} cy={j.cy} r={isActive ? 3.5 : 2} fill={isActive ? "#22d3ee" : "#334155"} />
                        ))}

                        {/* Terminal Node Dot at Target Node */}
                        <circle cx={x} cy={y} r={isActive ? 4 : 2.5} fill={isActive ? "#22d3ee" : "#334155"} />
                      </g>
                    );
                  })}
                </g>
              </svg>

              {/* THE CENTER CORE (IMO LOGO) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                <motion.div 
                  className="relative flex items-center justify-center p-6 bg-[#070b16]/90 rounded-full border-2 border-cyan-500/60 shadow-[0_0_50px_rgba(34,211,238,0.3)] backdrop-blur-xl cursor-pointer group"
                  animate={{ 
                    boxShadow: ["0 0 30px rgba(34,211,238,0.3)", "0 0 60px rgba(34,211,238,0.6)", "0 0 30px rgba(34,211,238,0.3)"] 
                  }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                  onClick={() => setActiveTab(null)}
                >
                  <ImoLogo className="h-11 w-auto filter drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] opacity-95 group-hover:scale-105 transition-transform" />
                  
                  {/* Outer spinning ring for core */}
                  <div className="absolute inset-[-10px] rounded-full border-t-2 border-b-2 border-cyan-400 blur-[1px] animate-[spin_5s_linear_infinite]" />
                </motion.div>
                <div className="mt-3 px-3 py-1 bg-cyan-950/60 border border-cyan-500/30 rounded-full text-[9px] font-bold tracking-[0.25em] text-cyan-400 uppercase backdrop-blur-md">
                  IMO SYSTEM CORE
                </div>
              </div>

              {/* ORGANIC SATELLITE NODE CARDS */}
              {NODES.map((node, i) => {
                const { x, y } = getCoordinates(i);
                const isActive = activeTab === node.id;
                
                return (
                  <motion.div
                    key={node.id}
                    className="absolute top-1/2 left-1/2 z-20 flex flex-col items-center justify-center cursor-pointer"
                    initial={{ x: "-50%", y: "-50%", opacity: 0, scale: 0.5 }}
                    animate={{ 
                      x: `calc(-50% + ${x}px)`, 
                      y: `calc(-50% + ${y}px)`, 
                      opacity: 1, 
                      scale: 1 
                    }}
                    transition={{ type: "spring", stiffness: 180, damping: 18, delay: i * 0.08 }}
                    onClick={() => setActiveTab(node.id)}
                  >
                    <motion.div
                      whileHover={{ scale: 1.05, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                      className={`
                        relative px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl border bg-gradient-to-br backdrop-blur-xl shadow-xl transition-all duration-300 flex items-center space-x-2.5 min-w-[135px] sm:min-w-[160px] md:min-w-[175px]
                        ${isActive ? "border-cyan-400 bg-cyan-950/80 text-white shadow-[0_0_35px_rgba(34,211,238,0.5)] scale-105" : `${node.color} bg-[#0b0f19]/90 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)]`}
                      `}
                    >
                      <div className={`p-1.5 sm:p-2 rounded-xl bg-black/40 border border-white/10 ${isActive ? "text-cyan-300 animate-pulse" : ""}`}>
                        <node.icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5" />
                      </div>
                      
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-100 whitespace-nowrap">
                          {node.label}
                        </span>
                        <span className="text-[8px] sm:text-[9px] text-slate-400 font-mono tracking-tight">
                          {isActive ? "ACTIVE NODE" : "CLICK TO CONFIG"}
                        </span>
                      </div>

                      {/* Active glowing ring indicator */}
                      {isActive && (
                        <div className="absolute inset-[-4px] rounded-2xl border border-cyan-400/60 animate-ping pointer-events-none" />
                      )}
                    </motion.div>
                  </motion.div>
                );
              })}
            </>
          )}
        </div>
      </main>

      {/* --- CENTERED MODAL POP-UP OVERLAY --- */}
      <AnimatePresence>
        {activeTab && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 overflow-hidden">
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveTab(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Centered Modal Window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative z-10 max-w-2xl w-full max-h-[85vh] bg-[#0a0d14]/95 border-2 border-cyan-500/40 rounded-2xl shadow-[0_0_60px_rgba(34,211,238,0.25)] flex flex-col backdrop-blur-xl overflow-hidden font-mono"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-black/50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                    <Code className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-cyan-400 tracking-[0.2em] uppercase glow-text-cyan">
                      NODE_CONFIG :: {activeTab.toUpperCase()}
                    </h2>
                    <p className="text-[10px] text-slate-500 font-sans">Modify parameters for this system node.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab(null)} 
                  className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 rounded-xl transition border border-transparent hover:border-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content Scrollable Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('/noise.png')] bg-repeat opacity-[0.98]">
                {activeTab === "root_system" && (
                  <div className="space-y-6">
                    <div className="bg-black/50 border border-slate-800/80 rounded-xl p-5">
                      <h3 className="text-xs font-bold text-slate-300 mb-4 flex items-center space-x-2 tracking-wider">
                        <Cpu className="h-4 w-4 text-cyan-400" />
                        <span>NEXT.JS CACHE PROTOCOL</span>
                      </h3>
                      <div className="space-y-5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Force Purge Data Caches</label>
                          <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">
                            Clear all Server-Side Rendering (SSR) and Static Generation (SSG) caches globally.
                          </p>
                          <button onClick={handlePurgeCache} disabled={purgingCache} className="w-full justify-center py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-[11px] font-bold tracking-wider transition flex items-center space-x-2 disabled:opacity-50">
                            <RefreshCcw className={`h-3.5 w-3.5 ${purgingCache ? "animate-spin" : ""}`} />
                            <span>{purgingCache ? "EXECUTING PURGE..." : "EXECUTE GLOBAL PURGE"}</span>
                          </button>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">API Cache TTL (Seconds)</label>
                          <input type="number" value={coreConfig.cacheTtl} onChange={(e) => setCoreConfig({ ...coreConfig, cacheTtl: Number(e.target.value) })} className="w-full px-3 py-2 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/50 border border-slate-800/80 rounded-xl p-5">
                      <h3 className="text-xs font-bold text-slate-300 mb-4 flex items-center space-x-2 tracking-wider">
                        <WifiOff className="h-4 w-4 text-amber-400" />
                        <span>SERVICE WORKER PWA ROOT</span>
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">SW Cache Manifest Version</label>
                          <input type="text" value={coreConfig.swCacheVersion} onChange={(e) => setCoreConfig({ ...coreConfig, swCacheVersion: e.target.value })} className="w-full px-3 py-2 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">SW Kill Switch Signal</label>
                          <button onClick={() => setCoreConfig({ ...coreConfig, killServiceWorker: !coreConfig.killServiceWorker })} className={`w-full py-2.5 rounded-xl text-[11px] font-bold tracking-wider transition ${coreConfig.killServiceWorker ? "bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]" : "bg-black/70 text-slate-400 border border-slate-800"}`}>
                            {coreConfig.killServiceWorker ? "KILL SIGNAL ACTIVE" : "SIGNAL OFFLINE (NORMAL)"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "push" && (
                  <div className="space-y-6">
                    <div className="bg-black/50 border border-slate-800/80 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-slate-300 flex items-center space-x-2 tracking-wider">
                          <Lock className="h-4 w-4 text-cyan-400" />
                          <span>FIREBASE CLOUD MESSAGING (FCM)</span>
                        </h3>
                        <span className="text-[9px] font-bold bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-full border border-cyan-500/20 uppercase tracking-widest">
                          {pushSubscribersCount} Devices Active
                        </span>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Firebase Project ID</label>
                            <code className="block w-full p-2.5 bg-black/70 border border-slate-800 rounded-lg text-[10px] text-cyan-300 font-mono">imo-info</code>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sender ID</label>
                            <code className="block w-full p-2.5 bg-black/70 border border-slate-800 rounded-lg text-[10px] text-slate-300 font-mono">1061088435535</code>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Service Account Status</label>
                          <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/30 rounded-lg text-[10px] text-emerald-400 flex items-center justify-between">
                            <span>OAuth2 Google Service Account Active</span>
                            <span className="font-mono text-[9px] bg-emerald-500/20 px-2 py-0.5 rounded">HTTP v1 API</span>
                          </div>
                        </div>

                        <div className="pt-2">
                          <a
                            href="/admin/fcm-debug"
                            className="w-full justify-center py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl text-[10px] tracking-wider font-bold transition flex items-center space-x-2 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>BUKA FCM DIAGNOSTICS & TESTING CONSOLE (/admin/fcm-debug)</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/50 border border-slate-800/80 rounded-xl p-5">
                      <h3 className="text-xs font-bold text-slate-300 mb-4 flex items-center space-x-2 tracking-wider">
                        <Activity className="h-4 w-4 text-cyan-400" />
                        <span>BROADCAST TERMINAL</span>
                      </h3>
                      <div className="space-y-4 mb-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Alert Title</label>
                          <input type="text" value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} className="w-full px-3 py-2 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Payload Body</label>
                          <textarea rows={2} value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} className="w-full px-3 py-2 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Directory (URL)</label>
                          <input type="text" value={broadcastTargetUrl} onChange={(e) => setBroadcastTargetUrl(e.target.value)} className="w-full px-3 py-2 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800/50">
                        <button onClick={(e) => handleSendPushBroadcast(e, false)} disabled={sendingPush || testingPush} className="w-full justify-center py-2.5 bg-cyan-600/20 border border-cyan-500/50 hover:bg-cyan-500/40 text-cyan-300 rounded-xl text-[10px] tracking-wider font-bold transition flex items-center space-x-2 disabled:opacity-50">
                          <Send className="h-3.5 w-3.5" />
                          <span>{sendingPush ? "UPLOADING..." : "BROADCAST TO ALL"}</span>
                        </button>
                        <button onClick={(e) => handleSendPushBroadcast(e, true)} disabled={testingPush || sendingPush || !testEndpoint} className="w-full justify-center py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 rounded-xl text-[10px] tracking-wider transition flex items-center space-x-2 disabled:opacity-50">
                          <Activity className="h-3.5 w-3.5" />
                          <span>{testingPush ? "PINGING..." : "TEST PING (THIS DEVICE)"}</span>
                        </button>
                      </div>
                      {pushResultMsg && (
                        <div className="mt-4 p-3 bg-cyan-950/40 border border-cyan-800 rounded-xl text-xs text-cyan-300 font-bold">
                          &gt; {pushResultMsg}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "security" && (
                  <div className="space-y-6">
                    <div className="bg-black/50 border border-slate-800/80 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-slate-300 tracking-wider">FIREWALL PROTOCOL</h3>
                        <button onClick={() => setCoreConfig({ ...coreConfig, apiLockdown: !coreConfig.apiLockdown })} className={`px-3.5 py-1.5 rounded-xl text-[10px] tracking-widest font-bold transition ${coreConfig.apiLockdown ? "bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]" : "bg-black/70 text-slate-400 border border-slate-800"}`}>
                          {coreConfig.apiLockdown ? "LOCKDOWN ACTIVE" : "SECURITY NORMAL"}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">Engage this protocol to instantly force all public API endpoints to return 403 Forbidden. Use only during active DDoS attacks or severe data breaches.</p>
                    </div>
                  </div>
                )}

                {activeTab === "status" && (
                  <div className="space-y-6">
                    <div className="bg-black/50 border border-slate-800/80 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-slate-300 tracking-wider">CINEMATIC OFFLINE (LOCKDOWN)</h3>
                        <button onClick={() => setCoreConfig({ ...coreConfig, maintenanceMode: !coreConfig.maintenanceMode })} className={`px-3.5 py-1.5 rounded-xl text-[10px] tracking-widest font-bold transition ${coreConfig.maintenanceMode ? "bg-rose-500/20 text-rose-400 border border-rose-500/50 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.2)]" : "bg-black/70 text-slate-400 border border-slate-800"}`}>
                          {coreConfig.maintenanceMode ? "ORBIT LOST (LOCKDOWN ON)" : "ORBIT STABLE (ONLINE)"}
                        </button>
                      </div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Terminal Message</label>
                      <input type="text" value={coreConfig.maintenanceMessage} onChange={(e) => setCoreConfig({ ...coreConfig, maintenanceMessage: e.target.value })} className="w-full px-3 py-2 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition mb-4" />

                      {/* Dev Bypass URL Info Box */}
                      <div className={`p-3.5 rounded-xl border text-xs font-mono transition-all ${coreConfig.maintenanceMode ? "bg-amber-950/25 border-amber-500/40 text-amber-200" : "bg-black/40 border-slate-800 text-slate-500"}`}>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center space-x-2">
                            <span className={`h-2 w-2 rounded-full ${coreConfig.maintenanceMode ? "bg-amber-400 animate-ping" : "bg-slate-600"}`} />
                            <span className="font-bold text-[11px] tracking-wider uppercase">
                              URL KHUSUS PENGUJI (DEVELOPMENT BYPASS)
                            </span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${coreConfig.maintenanceMode ? "bg-amber-500/20 text-amber-300 border border-amber-400/40" : "bg-slate-800 text-slate-500"}`}>
                            {coreConfig.maintenanceMode ? "AKTIF" : "NONAKTIF (404)"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
                          {coreConfig.maintenanceMode
                            ? "Lockdown sedang aktif. Anda dapat menggunakan URL khusus berikut untuk menguji website dalam status Development Mode."
                            : "URL bypass penguji otomatis dinonaktifkan saat website dalam keadaan normal (tidak lockdown)."}
                        </p>
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                          <code className="text-[11px] px-2 py-1 rounded bg-black/60 border border-slate-800 text-cyan-300 font-bold select-all">
                            /preview
                          </code>
                          {coreConfig.maintenanceMode ? (
                            <a
                              href="/preview"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold tracking-wider transition"
                            >
                              <span>Buka Penguji</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-600 italic">Mati hingga lockdown aktif</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/50 border border-slate-800/80 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-slate-300 tracking-wider">DATA FREEZE</h3>
                        <button onClick={() => setCoreConfig({ ...coreConfig, taskSubmissionFrozen: !coreConfig.taskSubmissionFrozen })} className={`px-3.5 py-1.5 rounded-xl text-[10px] tracking-widest font-bold transition ${coreConfig.taskSubmissionFrozen ? "bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]" : "bg-black/70 text-slate-400 border border-slate-800"}`}>
                          {coreConfig.taskSubmissionFrozen ? "SUBMISSIONS HALTED" : "SYSTEM OPEN"}
                        </button>
                      </div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Freeze Notice</label>
                      <input type="text" value={coreConfig.taskFreezeMessage} onChange={(e) => setCoreConfig({ ...coreConfig, taskFreezeMessage: e.target.value })} className="w-full px-3 py-2 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition" />
                    </div>
                  </div>
                )}

                {activeTab === "drive" && (
                  <div className="space-y-6">
                    <div className="bg-black/50 border border-slate-800/80 rounded-xl p-5 space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">GDrive Root Matrix ID / Link</label>
                        <input type="text" value={gdriveParentFolder} onChange={(e) => setGdriveParentFolder(e.target.value)} className="w-full px-3 py-2 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Total Groups (Kelompok)</label>
                          <input type="number" min={1} max={100} value={totalGroupsCount} onChange={(e) => setTotalGroupsCount(Number(e.target.value))} className="w-full px-3 py-2 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Target Default Peserta / Kelompok</label>
                          <input type="number" min={1} max={1000} value={targetMembersPerGroup} onChange={(e) => setTargetMembersPerGroup(Number(e.target.value))} className="w-full px-3 py-2 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition" />
                          <span className="text-[9px] text-slate-500 mt-1 block">Standar acuan kuota jika kelompok belum dikustom</span>
                        </div>
                      </div>

                      {/* Custom Per-Group Counts */}
                      <div className="bg-black/70 border border-slate-800 rounded-xl p-4 space-y-3 pt-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <UsersRound className="h-4 w-4 text-cyan-400" />
                            <span className="text-xs font-bold text-slate-200">Kustomisasi Kuota Khusus Per Kelompok</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowCustomGroupCounts(!showCustomGroupCounts)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono font-bold text-slate-300 transition"
                          >
                            {showCustomGroupCounts ? "Sembunyikan" : "Buka Matrix Kelompok"}
                          </button>
                        </div>

                        {showCustomGroupCounts && (
                          <div className="space-y-3 pt-2 border-t border-slate-800">
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                              <span>Atur jumlah anggota unik untuk masing-masing kelompok (1 - {totalGroupsCount})</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Reset semua kelompok ke nilai default (${targetMembersPerGroup})?`)) {
                                    setGroupMemberCounts({});
                                  }
                                }}
                                className="text-cyan-400 hover:underline"
                              >
                                Reset Semua ke Default
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                              {Array.from({ length: totalGroupsCount }, (_, idx) => {
                                const groupNum = idx + 1;
                                const defaultName = `Kelompok ${groupNum}`;
                                const customName = groupNames[String(groupNum)] || "";
                                const currentVal = groupMemberCounts[String(groupNum)] ?? targetMembersPerGroup;
                                const isCustomQuota = groupMemberCounts[String(groupNum)] !== undefined && groupMemberCounts[String(groupNum)] !== targetMembersPerGroup;
                                const isCustomName = !!customName.trim() && customName.trim() !== defaultName;

                                return (
                                  <div key={groupNum} className={`p-2.5 rounded-lg border flex flex-col justify-between space-y-1.5 ${isCustomName || isCustomQuota ? "bg-purple-950/30 border-purple-500/50" : "bg-slate-900/50 border-slate-800"}`}>
                                    <div className="flex items-center justify-between text-[10px] font-mono">
                                      <span className="font-bold text-slate-300">#{groupNum < 10 ? `0${groupNum}` : groupNum}</span>
                                      {(isCustomName || isCustomQuota) && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const nCounts = { ...groupMemberCounts };
                                            delete nCounts[String(groupNum)];
                                            setGroupMemberCounts(nCounts);
                                            const nNames = { ...groupNames };
                                            delete nNames[String(groupNum)];
                                            setGroupNames(nNames);
                                          }}
                                          className="text-[8px] text-purple-300 hover:text-white"
                                        >
                                          Reset ↺
                                        </button>
                                      )}
                                    </div>
                                    <input
                                      type="text"
                                      value={customName}
                                      placeholder={defaultName}
                                      onChange={(e) => setGroupNames({ ...groupNames, [String(groupNum)]: e.target.value })}
                                      className="w-full px-2 py-1 bg-black/80 border border-slate-700 rounded text-xs text-slate-100 outline-none"
                                    />
                                    {isCustomName && (() => {
                                      const trimmed = customName.trim();
                                      let previewFolder = `${trimmed} (Kelompok ${groupNum})`;
                                      if (new RegExp(`\\(Kelompok\\s*${groupNum}\\)`, "i").test(trimmed)) {
                                        previewFolder = trimmed;
                                      } else if (new RegExp(`\\bKelompok\\s*${groupNum}\\b`, "i").test(trimmed)) {
                                        previewFolder = trimmed.replace(new RegExp(`\\s*\\(?Kelompok\\s*${groupNum}\\)?`, "i"), ` (Kelompok ${groupNum})`);
                                      }
                                      return (
                                        <div className="text-[8px] font-mono text-cyan-400 truncate" title={`Nama folder GDrive: ${previewFolder}`}>
                                          📁 {previewFolder}
                                        </div>
                                      );
                                    })()}
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] text-slate-400 font-mono">Kuota:</span>
                                      <input
                                        type="number"
                                        min={1}
                                        value={currentVal}
                                        onChange={(e) => {
                                          const val = Math.max(1, parseInt(e.target.value) || 1);
                                          setGroupMemberCounts({ ...groupMemberCounts, [String(groupNum)]: val });
                                        }}
                                        className="w-16 px-1 py-0.5 bg-black/80 border border-slate-700 rounded text-center text-xs font-mono text-cyan-300 outline-none"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "theme" && (
                  <div className="space-y-6">
                     <div className="bg-black/50 border border-slate-800/80 rounded-xl p-5 space-y-4">
                       <div>
                         <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Cyan Accent (Primary)</label>
                         <input type="color" value={coreConfig.accentCyan} onChange={(e) => setCoreConfig({ ...coreConfig, accentCyan: e.target.value })} className="h-10 w-full rounded-xl cursor-pointer bg-transparent border-0" />
                       </div>
                       <div>
                         <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Purple Accent (Secondary)</label>
                         <input type="color" value={coreConfig.accentPurple} onChange={(e) => setCoreConfig({ ...coreConfig, accentPurple: e.target.value })} className="h-10 w-full rounded-xl cursor-pointer bg-transparent border-0" />
                       </div>
                       <div>
                         <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Deep Void (Background)</label>
                         <input type="color" value={coreConfig.backgroundColor} onChange={(e) => setCoreConfig({ ...coreConfig, backgroundColor: e.target.value })} className="h-10 w-full rounded-xl cursor-pointer bg-transparent border-0" />
                       </div>
                     </div>
                  </div>
                )}

                {activeTab === "branding" && (
                  <div className="space-y-6">
                     <div className="bg-black/50 border border-slate-800/80 rounded-xl p-5 space-y-4">
                       <div>
                         <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Platform Name</label>
                         <input type="text" value={coreConfig.siteName} onChange={(e) => setCoreConfig({ ...coreConfig, siteName: e.target.value })} className="w-full px-3 py-2 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition" />
                       </div>
                       <div>
                         <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Insignia URL</label>
                         <input type="text" value={coreConfig.siteLogoUrl} onChange={(e) => setCoreConfig({ ...coreConfig, siteLogoUrl: e.target.value })} className="w-full px-3 py-2 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition" />
                       </div>
                     </div>
                  </div>
                )}

                {activeTab === "copywriting" && (
                  <div className="space-y-6">
                     <div className="bg-black/50 border border-slate-800/80 rounded-xl p-5 space-y-4">
                       <h3 className="text-xs font-bold text-cyan-400 tracking-wider mb-2 border-b border-slate-800/60 pb-2">BERANDA (HOME)</h3>
                       
                       <div>
                         <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Mission Badge</label>
                         <input type="text" value={coreConfig.homeMissionBadge} onChange={(e) => setCoreConfig({ ...coreConfig, homeMissionBadge: e.target.value })} className="w-full px-3 py-2 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition" />
                       </div>
                       <div>
                         <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Root Terminal Slogan</label>
                         <textarea rows={2} value={coreConfig.homeTagline} onChange={(e) => setCoreConfig({ ...coreConfig, homeTagline: e.target.value })} className="w-full px-3 py-2 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition" />
                       </div>
                       <div>
                         <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Deskripsi Utama</label>
                         <textarea rows={3} value={coreConfig.homeDescription} onChange={(e) => setCoreConfig({ ...coreConfig, homeDescription: e.target.value })} className="w-full px-3 py-2 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition" />
                       </div>
                       <div>
                         <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">CTA Button Label</label>
                         <input type="text" value={coreConfig.homeCtaLabel} onChange={(e) => setCoreConfig({ ...coreConfig, homeCtaLabel: e.target.value })} className="w-full px-3 py-2 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition" />
                       </div>
                     </div>

                     <div className="bg-black/50 border border-slate-800/80 rounded-xl p-5 space-y-4">
                       <h3 className="text-xs font-bold text-emerald-400 tracking-wider mb-2 border-b border-slate-800/60 pb-2">KARTU LAYANAN (BERANDA)</h3>
                       
                       <div className="space-y-2 p-3 bg-slate-900/40 rounded-lg border border-slate-800/60">
                         <label className="block text-[10px] font-bold text-slate-400 uppercase">Card 1: Judul & Deskripsi</label>
                         <input type="text" value={coreConfig.homeCard1Title} onChange={(e) => setCoreConfig({ ...coreConfig, homeCard1Title: e.target.value })} className="w-full px-3 py-1.5 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition" />
                         <textarea rows={2} value={coreConfig.homeCard1Desc} onChange={(e) => setCoreConfig({ ...coreConfig, homeCard1Desc: e.target.value })} className="w-full px-3 py-1.5 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition" />
                       </div>
                       <div className="space-y-2 p-3 bg-slate-900/40 rounded-lg border border-slate-800/60">
                         <label className="block text-[10px] font-bold text-slate-400 uppercase">Card 2: Judul & Deskripsi</label>
                         <input type="text" value={coreConfig.homeCard2Title} onChange={(e) => setCoreConfig({ ...coreConfig, homeCard2Title: e.target.value })} className="w-full px-3 py-1.5 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition" />
                         <textarea rows={2} value={coreConfig.homeCard2Desc} onChange={(e) => setCoreConfig({ ...coreConfig, homeCard2Desc: e.target.value })} className="w-full px-3 py-1.5 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition" />
                       </div>
                       <div className="space-y-2 p-3 bg-slate-900/40 rounded-lg border border-slate-800/60">
                         <label className="block text-[10px] font-bold text-slate-400 uppercase">Card 3: Judul & Deskripsi</label>
                         <input type="text" value={coreConfig.homeCard3Title} onChange={(e) => setCoreConfig({ ...coreConfig, homeCard3Title: e.target.value })} className="w-full px-3 py-1.5 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition" />
                          <textarea rows={2} value={coreConfig.homeCard3Desc} onChange={(e) => setCoreConfig({ ...coreConfig, homeCard3Desc: e.target.value })} className="w-full px-3 py-1.5 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition" />
                       </div>
                     </div>

                      <div className="bg-black/50 border border-slate-800/80 rounded-xl p-5 space-y-5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
                          <div className="flex items-center space-x-2.5">
                            <Milestone className="h-5 w-5 text-cyan-400 animate-pulse" />
                            <div>
                              <h3 className="text-xs font-bold text-cyan-300 tracking-wider uppercase">
                                ALUR KISAH PENJELAJAHAN (STORYLINE BERANDA)
                              </h3>
                              <p className="text-[10px] text-slate-400">
                                Kelola seluruh parameter narasi, foto Google Drive, urutan babak, dan jumlah slot cerita.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => setCoreConfig({ ...coreConfig, homePhotoSlotsEnabled: !coreConfig.homePhotoSlotsEnabled })}
                              className={`px-3 py-1.5 rounded-lg text-[10px] tracking-widest font-bold transition flex items-center space-x-1.5 ${
                                coreConfig.homePhotoSlotsEnabled !== false
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                                  : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${coreConfig.homePhotoSlotsEnabled !== false ? "bg-emerald-400" : "bg-rose-400"}`} />
                              <span>{coreConfig.homePhotoSlotsEnabled !== false ? "SECTION AKTIF" : "SECTION NONAKTIF"}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const newSlots = [...(coreConfig.homePhotoSlots || [])];
                                const nextNum = newSlots.length + 1;
                                const stepStr = String(nextNum).padStart(2, "0");
                                newSlots.push({
                                  id: `slot-${Date.now()}`,
                                  badge: `Chapter ${stepStr} // Babak Baru`,
                                  title: `Judul Babak Cerita ${nextNum}`,
                                  description: "Tuliskan narasi perjalanan atau momentum penting mahasiswa baru pada babak ini...",
                                  gdriveUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000&auto=format&fit=crop",
                                  coordinateLabel: `KOORDINAT ALUR ${stepStr}`,
                                  dateTag: "Status: Terverifikasi dalam Babad Penjelajahan IMO 2026",
                                });
                                setCoreConfig({ ...coreConfig, homePhotoSlots: newSlots });
                              }}
                              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold tracking-wider transition flex items-center space-x-1"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Tambah Chapter</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm("Kembalikan seluruh slot cerita ke template bawaan IMO 2026?")) {
                                  setCoreConfig({
                                    ...coreConfig,
                                    homePhotoSlotsTitle: "ALUR KISAH PENJELAJAHAN ORBIT",
                                    homePhotoSlotsSubtitle: "Rekam jejak kronologis dan narasi momentum penjelajahan Mahasiswa Baru IMO 2026 dari awal keberangkatan hingga puncak inovasi.",
                                    homePhotoSlots: [
                                      {
                                        id: "slot-1",
                                        badge: "Chapter 01 // Inisiasi Orbit",
                                        title: "Pemberangkatan & Orientasi Perdana",
                                        description: "Langkah mula ribuan pemuda dari berbagai penjuru berkumpul dalam satu atmosfer orbit baru. Di sini, semangat kebersamaan dinyalakan dan komitmen IMO 2026 ditanamkan bersama para LO pendamping.",
                                        gdriveUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000&auto=format&fit=crop",
                                        coordinateLabel: "KOORDINAT ALUR 01 - GEDUNG UTAMA",
                                        dateTag: "Status: H-7 Fase Pengkondisian",
                                      },
                                      {
                                        id: "slot-2",
                                        badge: "Chapter 02 // Sinergi & Dinamika Kelompok",
                                        title: "Simulasi Misi & Penyusunan Berkas",
                                        description: "Setiap kelompok menguji ketangguhan kolaborasi mereka dalam merampungkan tugas terstruktur, menyelesaikan Auto-Form, serta menyelaraskan frekuensi pemikiran menuju satu visi misi bersama.",
                                        gdriveUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000&auto=format&fit=crop",
                                        coordinateLabel: "KOORDINAT ALUR 02 - LAB SIMULASI",
                                        dateTag: "Status: H-Day Penjelajahan Berkas",
                                      },
                                      {
                                        id: "slot-3",
                                        badge: "Chapter 03 // Puncak Konstelasi",
                                        title: "Sidang Pleno & Deklarasi Generasi Inovator",
                                        description: "Panggung pembuktian di mana karya, gagasan, dan inovasi terbaik dipresentasikan di hadapan dewan penguji. Menandai lahirnya generasi penjelajah baru yang siap mengukir sejarah gemilang.",
                                        gdriveUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1000&auto=format&fit=crop",
                                        coordinateLabel: "KOORDINAT ALUR 03 - AUDITORIUM UTAMA",
                                        dateTag: "Status: Pasca Sidang Pleno",
                                      },
                                    ],
                                  });
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 text-[10px] font-bold transition flex items-center space-x-1"
                              title="Reset ke Default Alur Cerita"
                            >
                              <RotateCcw className="h-3 w-3" />
                              <span className="hidden sm:inline">Reset</span>
                            </button>
                          </div>
                        </div>

                        {/* Global Section Titles */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 bg-black/40 rounded-xl border border-slate-800/60">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Judul Utama Storyline</label>
                            <input
                              type="text"
                              value={coreConfig.homePhotoSlotsTitle || ""}
                              onChange={(e) => setCoreConfig({ ...coreConfig, homePhotoSlotsTitle: e.target.value })}
                              className="w-full px-3 py-1.5 bg-black/70 border border-slate-800 rounded-lg text-xs font-bold text-cyan-300 focus:border-cyan-500 outline-none transition"
                              placeholder="ALUR KISAH PENJELAJAHAN ORBIT"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Sub-judul / Deskripsi Pembuka</label>
                            <input
                              type="text"
                              value={coreConfig.homePhotoSlotsSubtitle || ""}
                              onChange={(e) => setCoreConfig({ ...coreConfig, homePhotoSlotsSubtitle: e.target.value })}
                              className="w-full px-3 py-1.5 bg-black/70 border border-slate-800 rounded-lg text-xs text-slate-300 focus:border-cyan-500 outline-none transition"
                              placeholder="Rekam jejak kronologis dan narasi momentum penjelajahan..."
                            />
                          </div>
                        </div>

                        {/* Chapter Cards List */}
                        <div className="space-y-4 pt-1">
                          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                            <span>DAFTAR CHAPTER CHRONICLES ({coreConfig.homePhotoSlots?.length || 0} BABAK)</span>
                            <span className="text-[10px] text-cyan-400">Gunakan panah ⬆ ⬇ untuk mengubah urutan kronologis</span>
                          </div>

                          {(coreConfig.homePhotoSlots || []).map((slot, index) => {
                            const stepStr = String(index + 1).padStart(2, "0");
                            const total = (coreConfig.homePhotoSlots || []).length;

                            return (
                              <div 
                                key={slot.id || index} 
                                className="p-4 bg-slate-900/60 hover:bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-3.5"
                              >
                                {/* Chapter Top Header with Control Buttons */}
                                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                                  <div className="flex items-center space-x-2.5">
                                    <span className="h-6 w-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center">
                                      {stepStr}
                                    </span>
                                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                                      {slot.title || `Chapter ${stepStr}`}
                                    </span>
                                  </div>

                                  {/* Ordering & Action Toolbar */}
                                  <div className="flex items-center space-x-1.5">
                                    {/* Move Up */}
                                    <button
                                      type="button"
                                      disabled={index === 0}
                                      onClick={() => {
                                        if (index === 0) return;
                                        const updated = [...(coreConfig.homePhotoSlots || [])];
                                        const temp = updated[index - 1];
                                        updated[index - 1] = updated[index];
                                        updated[index] = temp;
                                        setCoreConfig({ ...coreConfig, homePhotoSlots: updated });
                                      }}
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                      title="Geser Naik (Sebelumnya)"
                                    >
                                      <ArrowUp className="h-3.5 w-3.5" />
                                    </button>

                                    {/* Move Down */}
                                    <button
                                      type="button"
                                      disabled={index === total - 1}
                                      onClick={() => {
                                        if (index === total - 1) return;
                                        const updated = [...(coreConfig.homePhotoSlots || [])];
                                        const temp = updated[index + 1];
                                        updated[index + 1] = updated[index];
                                        updated[index] = temp;
                                        setCoreConfig({ ...coreConfig, homePhotoSlots: updated });
                                      }}
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                      title="Geser Turun (Berikutnya)"
                                    >
                                      <ArrowDown className="h-3.5 w-3.5" />
                                    </button>

                                    {/* Duplicate */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...(coreConfig.homePhotoSlots || [])];
                                        const cloned = {
                                          ...slot,
                                          id: `slot-${Date.now()}`,
                                          title: `${slot.title} (Salinan)`,
                                        };
                                        updated.splice(index + 1, 0, cloned);
                                        setCoreConfig({ ...coreConfig, homePhotoSlots: updated });
                                      }}
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                                      title="Duplikat Babak Ini"
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </button>

                                    {/* Delete */}
                                    {total > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = (coreConfig.homePhotoSlots || []).filter((_, i) => i !== index);
                                          setCoreConfig({ ...coreConfig, homePhotoSlots: updated });
                                        }}
                                        className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 border border-rose-900/40 transition"
                                        title="Hapus Chapter"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Form Fields Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                                  
                                  {/* Left/Middle Column: Inputs */}
                                  <div className="lg:col-span-2 space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                      <div>
                                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                                          Badge Tag / Babak
                                        </label>
                                        <input
                                          type="text"
                                          value={slot.badge || ""}
                                          onChange={(e) => {
                                            const updated = [...(coreConfig.homePhotoSlots || [])];
                                            updated[index] = { ...updated[index], badge: e.target.value };
                                            setCoreConfig({ ...coreConfig, homePhotoSlots: updated });
                                          }}
                                          className="w-full px-2.5 py-1.5 bg-black/70 border border-slate-800 rounded-lg text-xs font-mono text-purple-300 focus:border-purple-500 outline-none transition"
                                          placeholder={`Chapter ${stepStr} // Inisiasi Orbit`}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                                          Judul Babak Cerita
                                        </label>
                                        <input
                                          type="text"
                                          value={slot.title}
                                          onChange={(e) => {
                                            const updated = [...(coreConfig.homePhotoSlots || [])];
                                            updated[index] = { ...updated[index], title: e.target.value };
                                            setCoreConfig({ ...coreConfig, homePhotoSlots: updated });
                                          }}
                                          className="w-full px-2.5 py-1.5 bg-black/70 border border-slate-800 rounded-lg text-xs font-bold text-slate-100 focus:border-cyan-500 outline-none transition"
                                          placeholder="Pemberangkatan & Orientasi Perdana"
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <div className="flex items-center justify-between mb-1">
                                        <label className="block text-[9px] font-bold text-slate-400 uppercase">
                                          URL Foto Google Drive / Image
                                        </label>
                                        {slot.gdriveUrl && (
                                          <a
                                            href={slot.gdriveUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[9px] text-cyan-400 hover:underline flex items-center space-x-0.5"
                                          >
                                            <span>Buka Sumber</span>
                                            <ExternalLink className="h-2.5 w-2.5" />
                                          </a>
                                        )}
                                      </div>
                                      <input
                                        type="text"
                                        value={slot.gdriveUrl}
                                        onChange={(e) => {
                                          const updated = [...(coreConfig.homePhotoSlots || [])];
                                          updated[index] = { ...updated[index], gdriveUrl: e.target.value };
                                          setCoreConfig({ ...coreConfig, homePhotoSlots: updated });
                                        }}
                                        className="w-full px-2.5 py-1.5 bg-black/70 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 focus:border-cyan-500 outline-none transition"
                                        placeholder="https://drive.google.com/file/d/1abc.../view?usp=sharing"
                                      />
                                      <p className="text-[9px] text-slate-500 mt-1">
                                        Mendukung link Google Drive (/file/d/ID/view), ID Drive, atau direct image URL. Diproteksi non-interaktif di tampilan publik.
                                      </p>
                                    </div>

                                    <div>
                                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                                        Deskripsi Narasi Cerita (Lengkap)
                                      </label>
                                      <textarea
                                        rows={3}
                                        value={slot.description}
                                        onChange={(e) => {
                                          const updated = [...(coreConfig.homePhotoSlots || [])];
                                          updated[index] = { ...updated[index], description: e.target.value };
                                          setCoreConfig({ ...coreConfig, homePhotoSlots: updated });
                                        }}
                                        className="w-full px-2.5 py-1.5 bg-black/70 border border-slate-800 rounded-lg text-xs text-slate-300 focus:border-cyan-500 outline-none transition leading-relaxed"
                                        placeholder="Tuliskan cerita lengkap momen perjalanan pada babak ini..."
                                      />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                      <div>
                                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                                          Label Koordinat / Lokasi
                                        </label>
                                        <input
                                          type="text"
                                          value={slot.coordinateLabel || ""}
                                          onChange={(e) => {
                                            const updated = [...(coreConfig.homePhotoSlots || [])];
                                            updated[index] = { ...updated[index], coordinateLabel: e.target.value };
                                            setCoreConfig({ ...coreConfig, homePhotoSlots: updated });
                                          }}
                                          className="w-full px-2.5 py-1 bg-black/70 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 focus:border-cyan-500 outline-none transition"
                                          placeholder={`KOORDINAT ALUR ${stepStr} - LOKASI`}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                                          Label Waktu / Tanggal
                                        </label>
                                        <input
                                          type="text"
                                          value={slot.dateTag || ""}
                                          onChange={(e) => {
                                            const updated = [...(coreConfig.homePhotoSlots || [])];
                                            updated[index] = { ...updated[index], dateTag: e.target.value };
                                            setCoreConfig({ ...coreConfig, homePhotoSlots: updated });
                                          }}
                                          className="w-full px-2.5 py-1 bg-black/70 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 focus:border-cyan-500 outline-none transition"
                                          placeholder="Status: H-7 Fase Pengkondisian"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right Column: Live Thumbnail Preview */}
                                  <div className="bg-black/60 border border-slate-800/80 rounded-xl p-3 flex flex-col items-center justify-center space-y-2">
                                    <div className="text-[10px] font-mono text-slate-400 font-bold uppercase flex items-center space-x-1 self-start">
                                      <ImageIcon className="h-3 w-3 text-cyan-400" />
                                      <span>LIVE THUMBNAIL PREVIEW</span>
                                    </div>

                                    <div className="relative w-full aspect-[16/10] rounded-lg bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center">
                                      {slot.gdriveUrl ? (
                                        <img
                                          src={
                                            slot.gdriveUrl.includes("drive.google.com")
                                              ? `https://lh3.googleusercontent.com/d/${(slot.gdriveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || slot.gdriveUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/) || [])[1] || ""}=w400`
                                              : slot.gdriveUrl
                                          }
                                          alt={slot.title}
                                          className="w-full h-full object-cover select-none pointer-events-none"
                                          onError={(e) => {
                                            // Fallback graphic
                                            (e.currentTarget as HTMLElement).style.display = "none";
                                          }}
                                        />
                                      ) : (
                                        <span className="text-[10px] text-slate-600 font-mono">Belum ada URL</span>
                                      )}
                                    </div>

                                    <div className="text-[9px] font-mono text-slate-500 text-center truncate w-full">
                                      {slot.badge || `Chapter ${stepStr}`}
                                    </div>
                                  </div>

                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="bg-black/50 border border-slate-800/80 rounded-xl p-5 space-y-4">
                        <h3 className="text-xs font-bold text-amber-400 tracking-wider mb-2 border-b border-slate-800/60 pb-2">HERO SECTION - HALAMAN LAIN</h3>
                        
                        <div className="space-y-2 p-3 bg-slate-900/40 rounded-lg border border-slate-800/60">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Status & Info Page (Title, Subtitle, Warning)</label>
                          <input type="text" value={coreConfig.infoHeroTitle} onChange={(e) => setCoreConfig({ ...coreConfig, infoHeroTitle: e.target.value })} className="w-full px-3 py-1.5 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition" />
                          <input type="text" value={coreConfig.infoHeroSubtitle} onChange={(e) => setCoreConfig({ ...coreConfig, infoHeroSubtitle: e.target.value })} className="w-full px-3 py-1.5 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition" />
                          <input type="text" value={coreConfig.infoWarningNotice} placeholder="Warning Notice..." onChange={(e) => setCoreConfig({ ...coreConfig, infoWarningNotice: e.target.value })} className="w-full px-3 py-1.5 bg-rose-950/20 border border-rose-900/50 rounded-lg text-xs focus:border-rose-500 text-rose-300 outline-none transition mt-1" />
                        </div>

                        <div className="space-y-2 p-3 bg-slate-900/40 rounded-lg border border-slate-800/60">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Pusat Hub Page (Title, Subtitle, Search)</label>
                          <input type="text" value={coreConfig.hubHeroTitle} onChange={(e) => setCoreConfig({ ...coreConfig, hubHeroTitle: e.target.value })} className="w-full px-3 py-1.5 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition" />
                          <input type="text" value={coreConfig.hubHeroSubtitle} onChange={(e) => setCoreConfig({ ...coreConfig, hubHeroSubtitle: e.target.value })} className="w-full px-3 py-1.5 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition" />
                          <input type="text" value={coreConfig.hubSearchPlaceholder} onChange={(e) => setCoreConfig({ ...coreConfig, hubSearchPlaceholder: e.target.value })} className="w-full px-3 py-1.5 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2 p-3 bg-slate-900/40 rounded-lg border border-slate-800/60">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase">Panduan Page</label>
                            <input type="text" value={coreConfig.guideHeroTitle} onChange={(e) => setCoreConfig({ ...coreConfig, guideHeroTitle: e.target.value })} className="w-full px-3 py-1.5 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition mb-1" />
                            <input type="text" value={coreConfig.guideHeroSubtitle} onChange={(e) => setCoreConfig({ ...coreConfig, guideHeroSubtitle: e.target.value })} className="w-full px-3 py-1.5 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition" />
                          </div>
                          <div className="space-y-2 p-3 bg-slate-900/40 rounded-lg border border-slate-800/60">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase">Contact LO Page</label>
                            <input type="text" value={coreConfig.contactHeroTitle} onChange={(e) => setCoreConfig({ ...coreConfig, contactHeroTitle: e.target.value })} className="w-full px-3 py-1.5 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition mb-1" />
                            <input type="text" value={coreConfig.contactHeroSubtitle} onChange={(e) => setCoreConfig({ ...coreConfig, contactHeroSubtitle: e.target.value })} className="w-full px-3 py-1.5 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition" />
                          </div>
                          <div className="space-y-2 p-3 bg-slate-900/40 rounded-lg border border-slate-800/60">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase">ID Card Page</label>
                            <input type="text" value={coreConfig.idCardHeroTitle} onChange={(e) => setCoreConfig({ ...coreConfig, idCardHeroTitle: e.target.value })} className="w-full px-3 py-1.5 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition mb-1" />
                            <input type="text" value={coreConfig.idCardHeroSubtitle} onChange={(e) => setCoreConfig({ ...coreConfig, idCardHeroSubtitle: e.target.value })} className="w-full px-3 py-1.5 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition" />
                          </div>
                          <div className="space-y-2 p-3 bg-slate-900/40 rounded-lg border border-slate-800/60">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase">Documents Page</label>
                            <input type="text" value={coreConfig.documentsHeroTitle} onChange={(e) => setCoreConfig({ ...coreConfig, documentsHeroTitle: e.target.value })} className="w-full px-3 py-1.5 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition mb-1" />
                            <input type="text" value={coreConfig.documentsHeroSubtitle} onChange={(e) => setCoreConfig({ ...coreConfig, documentsHeroSubtitle: e.target.value })} className="w-full px-3 py-1.5 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition" />
                          </div>
                        </div>
                      </div>

                     <div className="bg-black/50 border border-slate-800/80 rounded-xl p-5 space-y-4">
                       <h3 className="text-xs font-bold text-rose-400 tracking-wider mb-2 border-b border-slate-800/60 pb-2">GLOBAL TEXT</h3>
                       <div>
                         <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Global Banner Text</label>
                         <textarea rows={2} value={coreConfig.globalBannerText} onChange={(e) => setCoreConfig({ ...coreConfig, globalBannerText: e.target.value })} className="w-full px-3 py-2 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition" />
                       </div>
                       <div>
                         <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Footer Text</label>
                         <input type="text" value={coreConfig.footerText} onChange={(e) => setCoreConfig({ ...coreConfig, footerText: e.target.value })} className="w-full px-3 py-2 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition" />
                       </div>
                     </div>
                  </div>
                )}

                {activeTab === "home_nodes" && (
                  <div className="space-y-6">
                    <div className="bg-black/50 border border-slate-800/80 rounded-xl p-5">
                      <h3 className="text-xs font-bold text-slate-300 mb-4 flex items-center space-x-2 tracking-wider">
                        <LayoutGrid className="h-4 w-4 text-cyan-400" />
                        <span>URUTAN MENU BERANDA (NODE GRAPH)</span>
                      </h3>
                      <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
                        Atur urutan fitur yang ditampilkan pada halaman utama. Urutan ini akan memengaruhi jalur konstelasi (node graph) dari atas ke bawah.
                      </p>
                      
                      <div className="space-y-2">
                        {coreConfig.homeNodesOrder?.map((nodeId, idx) => {
                           const nodeLabels: Record<string, string> = {
                             "guide": "Panduan & Embed Dokumen",
                             "hub": "Pusat Penjelajahan (Hub)",
                             "info": "Status Tugas Kelompok",
                             "idcard": "ID Card Generator",
                             "documents": "Auto-Form Generator",
                             "contact": "Kontak & Pendamping"
                           };
                           return (
                             <div key={nodeId} className="flex items-center justify-between p-3 bg-black/70 border border-slate-800 rounded-lg">
                               <div className="flex items-center space-x-3">
                                 <div className="flex flex-col items-center justify-center w-6 h-6 rounded bg-slate-800 text-xs text-slate-400 font-mono">
                                   {idx + 1}
                                 </div>
                                 <span className="text-sm font-semibold text-slate-300">{nodeLabels[nodeId] || nodeId}</span>
                               </div>
                               <div className="flex items-center space-x-1">
                                 <button
                                   onClick={() => {
                                      if (idx > 0) {
                                        const newOrder = [...coreConfig.homeNodesOrder];
                                        [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
                                        setCoreConfig({ ...coreConfig, homeNodesOrder: newOrder });
                                      }
                                   }}
                                   disabled={idx === 0}
                                   className="p-1.5 bg-slate-800 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 rounded transition disabled:opacity-30 disabled:hover:bg-slate-800 disabled:hover:text-slate-400"
                                 >
                                   <ChevronUp className="w-4 h-4" />
                                 </button>
                                 <button
                                   onClick={() => {
                                      if (idx < coreConfig.homeNodesOrder.length - 1) {
                                        const newOrder = [...coreConfig.homeNodesOrder];
                                        [newOrder[idx + 1], newOrder[idx]] = [newOrder[idx], newOrder[idx + 1]];
                                        setCoreConfig({ ...coreConfig, homeNodesOrder: newOrder });
                                      }
                                   }}
                                   disabled={idx === coreConfig.homeNodesOrder.length - 1}
                                   className="p-1.5 bg-slate-800 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 rounded transition disabled:opacity-30 disabled:hover:bg-slate-800 disabled:hover:text-slate-400"
                                 >
                                   <ChevronDown className="w-4 h-4" />
                                 </button>
                               </div>
                             </div>
                           )
                        })}
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === "audio_player" && (
                  <div className="space-y-6">
                    <div className="bg-black/50 border border-slate-800/80 rounded-xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-300 tracking-wider flex items-center space-x-2">
                          <Music className="w-4 h-4 text-fuchsia-400" />
                          <span>GLOBAL AUDIO PLAYER</span>
                        </h3>
                        <button onClick={() => setCoreConfig({ ...coreConfig, musicPlayerEnabled: !coreConfig.musicPlayerEnabled })} className={`px-3.5 py-1.5 rounded-xl text-[10px] tracking-widest font-bold transition ${coreConfig.musicPlayerEnabled ? "bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.2)]" : "bg-black/70 text-slate-400 border border-slate-800"}`}>
                          {coreConfig.musicPlayerEnabled ? "PLAYER ACTIVE" : "PLAYER DISABLED"}
                        </button>
                      </div>
                      
                      {coreConfig.musicPlayerEnabled && (
                        <>
                          <div className="space-y-4 pt-4 border-t border-slate-800/50">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Audio Stream URL (MP3/WAV)</label>
                              <input type="text" value={coreConfig.musicUrl} onChange={(e) => setCoreConfig({ ...coreConfig, musicUrl: e.target.value })} className="w-full px-3 py-2 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition" placeholder="https://..." />
                              <p className="text-[9px] text-slate-500 mt-1">Direct link to audio file. Can be from Supabase Storage or external link.</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Track Title</label>
                                <input type="text" value={coreConfig.musicTitle} onChange={(e) => setCoreConfig({ ...coreConfig, musicTitle: e.target.value })} className="w-full px-3 py-2 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Artist Name</label>
                                <input type="text" value={coreConfig.musicArtist} onChange={(e) => setCoreConfig({ ...coreConfig, musicArtist: e.target.value })} className="w-full px-3 py-2 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 outline-none transition" />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Album Art (Image URL)</label>
                              <div className="flex space-x-3">
                                <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-700 flex-shrink-0 bg-slate-900">
                                  {coreConfig.musicAlbumArt ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={coreConfig.musicAlbumArt} alt="Art" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-600"><Music className="w-4 h-4" /></div>
                                  )}
                                </div>
                                <input type="text" value={coreConfig.musicAlbumArt} onChange={(e) => setCoreConfig({ ...coreConfig, musicAlbumArt: e.target.value })} className="w-full px-3 py-2 bg-black/70 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition" placeholder="https://..." />
                              </div>
                              <p className="text-[9px] text-slate-500 mt-1">Image will be displayed as a spinning vinyl record.</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              

              {/* Modal Footer / Save Action */}
              <div className="p-5 border-t border-slate-800/80 bg-black/60 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Close
                </button>
                <button
                  onClick={() => handleSaveAll()}
                  disabled={saving || loading}
                  className="px-6 py-2.5 rounded-xl bg-cyan-600/20 border border-cyan-500/50 hover:bg-cyan-500/40 text-cyan-300 text-xs tracking-[0.2em] uppercase font-bold transition flex items-center space-x-2 disabled:opacity-50 shadow-[0_0_20px_rgba(34,211,238,0.25)]"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? "UPLOADING..." : "SAVE NODE CONFIG"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
