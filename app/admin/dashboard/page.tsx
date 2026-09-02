"use client";

import React, { useState, useEffect } from "react";
import StarfieldBackground from "@/components/StarfieldBackground";
import Card from "@/components/Card";
import Button from "@/components/Button";
import ImoLogo from "@/components/ImoLogo";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Link } from "next-view-transitions";
import { motion, AnimatePresence } from "framer-motion";
import ContactPhotoCropperModal from "@/components/admin/ContactPhotoCropperModal";
import {
  Layers,
  Users,
  User,
  Megaphone,
  CreditCard,
  Plus,
  Trash2,
  LogOut,
  ExternalLink,
  Pin,
  Save,
  FileCode2,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Upload,
  ListChecks,
  Edit2,
  FileText,
  Download,
  XCircle,
  CheckCircle,
  Bell,
  Video,
  Milestone,
  Compass,
  Camera,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Copy,
  RotateCcw,
  Minus,
  Search,
  Sliders,
  ChevronDown,
  ChevronUp,
  UsersRound
} from "lucide-react";
import { DEFAULT_ID_CARD_TEMPLATE } from "@/lib/defaultTemplate";
import { HomePhotoSlot } from "@/components/SiteConfigProvider";

type ActiveTab = "links" | "contacts" | "announcements" | "templates" | "tasks" | "doc_templates" | "storyline" | "notifications";

const DEFAULT_ADMIN_HTML_TEMPLATE = DEFAULT_ID_CARD_TEMPLATE;

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("links");
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [links, setLinks] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [docTemplates, setDocTemplates] = useState<any[]>([]);
  const [gdriveLink, setGdriveLink] = useState<string>("");
  const [targetTotalGroups, setTargetTotalGroups] = useState<number>(20);
  const [targetMembersPerGroup, setTargetMembersPerGroup] = useState<number>(10);
  const [groupMemberCounts, setGroupMemberCounts] = useState<Record<string, number>>({});
  const [groupNames, setGroupNames] = useState<Record<string, string>>({});
  const [showCustomGroupCounts, setShowCustomGroupCounts] = useState<boolean>(false);
  const [groupSearchQuery, setGroupSearchQuery] = useState<string>("");
  const [savingGdrive, setSavingGdrive] = useState<boolean>(false);
  const [syncingFolders, setSyncingFolders] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const [notifSettings, setNotifSettings] = useState<any>({
    newTaskTemplate: { title: "Tugas Baru: {taskName}", body: "Ada tugas baru yang perlu dikerjakan. Cek sekarang!" },
    deadlineTemplate: { title: "Peringatan Deadline: {taskName}", body: "Tugas ini akan segera mencapai tenggat waktu!" },
    announcementTemplate: { title: "Pengumuman: {title}", body: "Ada pengumuman baru dari panitia." },
    linktreeTemplate: { title: "Tautan Baru: {label}", body: "Tautan baru telah ditambahkan ke pusat informasi." },
    deadlineReminderHours: 24,
  });
  const [savingNotif, setSavingNotif] = useState(false);
  const [customPush, setCustomPush] = useState({ title: "", body: "", url: "/info" });
  const [sendingCustomPush, setSendingCustomPush] = useState(false);

  // State Penugasan Individu
  const [individuTaskDefs, setIndividuTaskDefs] = useState<any[]>([
    { id: "ind-1", name: "Jurnal Harian & Resume", keyword: "jurnal", is_active: true },
    { id: "ind-2", name: "Berkas Administrasi Mandiri", keyword: "administrasi", is_active: true },
    { id: "ind-3", name: "Twibbon & ID Card", keyword: "twibbon", is_active: true },
  ]);
  const [showAddIndividuModal, setShowAddIndividuModal] = useState(false);
  const [newIndividuTask, setNewIndividuTask] = useState({ name: "", keyword: "", is_active: true });
  const [editingIndividuTask, setEditingIndividuTask] = useState<any | null>(null);

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ name: "", keyword: "", is_active: true });
  const [editingTask, setEditingTask] = useState<any | null>(null);

  // Admin Custom HTML Template State
  const [adminTemplateHtml, setAdminTemplateHtml] = useState<string>(DEFAULT_ADMIN_HTML_TEMPLATE);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Storyline (Alur Kisah Beranda) State
  const [storylineEnabled, setStorylineEnabled] = useState<boolean>(true);
  const [storylineTitle, setStorylineTitle] = useState<string>("ALUR KISAH PENJELAJAHAN ORBIT");
  const [storylineSubtitle, setStorylineSubtitle] = useState<string>("Rekam jejak kronologis dan narasi momentum penjelajahan Mahasiswa Baru IMO 2026 dari awal keberangkatan hingga puncak inovasi.");
  const [storylineSlots, setStorylineSlots] = useState<HomePhotoSlot[]>([
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
  ]);
  const [savingStoryline, setSavingStoryline] = useState<boolean>(false);
  const [storylineSuccessMsg, setStorylineSuccessMsg] = useState<string | null>(null);

  // PSD Template Manager State
  const [psdTemplates, setPsdTemplates] = useState<any[]>([]);
  const [uploadingPsd, setUploadingPsd] = useState(false);
  const [newPsd, setNewPsd] = useState({ name: "", description: "", is_default: true });
  const [selectedPsdFile, setSelectedPsdFile] = useState<File | null>(null);
  const [psdSuccessMsg, setPsdSuccessMsg] = useState<string | null>(null);
  const [psdErrorMsg, setPsdErrorMsg] = useState<string | null>(null);

  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [newLink, setNewLink] = useState({
    label: "",
    url: "",
    category: "Panduan & Berkas",
    icon_key: "book",
    description: "",
    sort_order: 0,
  });

  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [newContact, setNewContact] = useState({
    name: "",
    role: "",
    group_name: "None",
    whatsapp: "",
    instagram: "",
    button_text: "",
    ig_button_text: "",
    photo_url: "",
  });
  const [selectedContactCropFile, setSelectedContactCropFile] = useState<File | null>(null);
  const [isContactCropperOpen, setIsContactCropperOpen] = useState(false);
  const [contactCropTarget, setContactCropTarget] = useState<"new" | "edit">("new");

  const [showAddAnnoModal, setShowAddAnnoModal] = useState(false);
  const [newAnno, setNewAnno] = useState({
    title: "",
    notes: "",
    gdrive_url: "",
    autoform_url: "/documents",
    category: "Contoh Surat",
    pinned: false,
  });
  const [editingAnno, setEditingAnno] = useState<any | null>(null);

  // Extract placeholders inside {key}
  const adminDetectedPlaceholders = React.useMemo(() => {
    const matches = adminTemplateHtml.match(/{([a-zA-Z0-9_]+)}/g);
    if (!matches) return [];
    const keys = matches.map((m) => m.slice(1, -1));
    return Array.from(new Set(keys));
  }, [adminTemplateHtml]);

  // Render preview sample
  const renderedAdminPreviewHtml = React.useMemo(() => {
    const sampleValues: Record<string, string> = {
      nama: "Xaviera Putri",
      nim: "260xxxxxxxx",
      kelompok: "Kelompok 1",
      jurusan: "Teknologi Pendidikan",
      peran: "Peserta",
      quote: "Different Minds, One Generation Chasing Glories",
    };

    const samplePhoto = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="250" viewBox="0 0 200 250" fill="%230f172a"><rect width="200" height="250" fill="%230f172a"/><circle cx="100" cy="90" r="45" fill="%23334155"/><path d="M 30 220 C 30 150, 170 150, 170 220 Z" fill="%23334155"/><text x="100" y="240" font-family="sans-serif" font-size="12" fill="%237df9ff" text-anchor="middle">PASFOTO</text></svg>`;

    let result = adminTemplateHtml;
    ["foto", "photo"].forEach((photoKey) => {
      const srcAttrMatch = result.includes(`src="{${photoKey}}"`) || result.includes(`src='{${photoKey}}'`);
      const hrefAttrMatch =
        result.includes(`href="{${photoKey}}"`) ||
        result.includes(`href='{${photoKey}}'`) ||
        result.includes(`xlink:href="{${photoKey}}"`) ||
        result.includes(`xlink:href='{${photoKey}}'`);
      const urlCSSMatch = result.includes(`url('{${photoKey}}')`) || result.includes(`url("{${photoKey}}")`) || result.includes(`url({${photoKey}})`);
      const rawTagRegex = new RegExp(`{${photoKey}}`, "g");

      if (srcAttrMatch || hrefAttrMatch || urlCSSMatch) {
        result = result.replace(rawTagRegex, samplePhoto);
      } else if (result.includes(`{${photoKey}}`)) {
        const imgElement = `<span style="display:inline-block; max-width:100%; max-height:100%; vertical-align:middle; overflow:hidden; border-radius:inherit;"><img src="${samplePhoto}" style="max-width:100%; max-height:100%; width:auto; height:auto; object-fit:contain; display:block;" alt="Pasfoto" /></span>`;
        result = result.replace(rawTagRegex, imgElement);
      }
    });

    adminDetectedPlaceholders.forEach((key) => {
      if (key === "foto" || key === "photo") return;
      const val = sampleValues[key] || `[Isi ${key}]`;
      const regex = new RegExp(`{${key}}`, "g");
      result = result.replace(regex, val);
    });

    // Scope <style> blocks so CSS rules don't leak into outer document
    return result.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (match, cssContent) => {
      const scopedCss = cssContent.replace(
        /([^{}+>,\s][^{}]+)\s*\{/g,
        (m: string, selector: string) => {
          const trimmed = selector.trim();
          if (trimmed.startsWith("@")) return m;
          const scopedSelectors = trimmed
            .split(",")
            .map((s: string) => `.id-card-preview-scope ${s.trim()}`)
            .join(", ");
          return `${scopedSelectors} {`;
        }
      );
      return `<style>${scopedCss}</style>`;
    });
  }, [adminTemplateHtml, adminDetectedPlaceholders]);

  // Load saved Admin template on mount (localStorage + Supabase DB)
  useEffect(() => {
    async function loadSavedTemplate() {
      try {
        const saved = localStorage.getItem("imo2026_id_card_html_template");
        if (saved) {
          setAdminTemplateHtml(saved);
          return;
        }
      } catch (e) {
        console.warn("Local storage read error", e);
      }

      try {
        const { data, error } = await supabase
          .from("id_card_templates")
          .select("layout_json")
          .eq("is_active", true)
          .order("updated_at", { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0 && data[0].layout_json?.html) {
          setAdminTemplateHtml(data[0].layout_json.html);
        }
      } catch (e) {
        console.warn("Could not load template from Supabase:", e);
      }
    }

    loadSavedTemplate();
  }, []);

  const handleSaveAdminHtmlTemplate = async () => {
    try {
      localStorage.setItem("imo2026_id_card_html_template", adminTemplateHtml);

      // Save to Supabase DB so it persists for all users on Vercel deployment
      const { data: existing } = await supabase.from("id_card_templates").select("id").limit(1);
      if (existing && existing.length > 0) {
        await supabase.from("id_card_templates").update({
          layout_json: { html: adminTemplateHtml },
          updated_at: new Date().toISOString(),
          is_active: true
        }).eq("id", existing[0].id);
      } else {
        await supabase.from("id_card_templates").insert([{
          name: "Official IMO Template",
          background_url: "",
          layout_json: { html: adminTemplateHtml },
          is_active: true,
          is_default: true
        }]);
      }

      setSaveSuccessMsg("Templat Resmi Berhasil Disimpan & Diterapkan ke Vercel!");
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } catch (e) {
      console.warn("Error saving template to Supabase:", e);
      setSaveSuccessMsg("Templat disimpan di browser lokal.");
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
  };

  const handleResetAdminTemplate = async () => {
    if (confirm("Apakah Anda yakin ingin mereset templat ke struktur SVG/HTML standar bawaan?")) {
      setAdminTemplateHtml(DEFAULT_ADMIN_HTML_TEMPLATE);
      try {
        localStorage.removeItem("imo2026_id_card_html_template");
        const { data: existing } = await supabase.from("id_card_templates").select("id").limit(1);
        if (existing && existing.length > 0) {
          await supabase.from("id_card_templates").update({
            layout_json: { html: DEFAULT_ADMIN_HTML_TEMPLATE },
            updated_at: new Date().toISOString()
          }).eq("id", existing[0].id);
        }
      } catch (e) { }
    }
  };

  const handleAdminTemplateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".html") && !fileName.endsWith(".htm") && !fileName.endsWith(".svg")) {
      alert("Format file tidak didukung. Harap unggah file ber-ekstensi .html atau .svg");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setAdminTemplateHtml(content);
        setSaveSuccessMsg(`File ${file.name} berhasil diunggah! Klik "Simpan Templat Resmi" untuk menerapkan.`);
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const router = useRouter();
  const supabase = createClient();

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/admin/login");
        return;
      }
      setUserEmail(session.user.email || "Admin");

      const { data: linkData } = await supabase.from("hub_links").select("*").order("sort_order", { ascending: true });
      setLinks(linkData || []);

      const { data: contactData } = await supabase.from("contact_persons").select("*").order("sort_order", { ascending: true });
      setContacts(contactData || []);

      const { data: annoData } = await supabase.from("announcements").select("*").order("published_at", { ascending: false });
      setAnnouncements(annoData || []);

      const { data: templateData } = await supabase.from("id_card_templates").select("*").order("created_at", { ascending: false });
      setTemplates(templateData || []);
      setPsdTemplates(templateData || []);

      const { data: taskData } = await supabase.from("task_definitions").select("*").order("name", { ascending: true });
      setTasks(taskData || []);

      const { data: docData } = await supabase.from("document_templates").select("*").order("created_at", { ascending: false });
      setDocTemplates(docData || []);

      const { data: settingData } = await supabase.from("system_settings").select("key, value").in("key", ["gdrive_parent_folder", "total_groups_count", "target_members_per_group", "group_member_counts", "group_names", "task_definitions_individu", "notification_settings", "site_core_config"]);
      if (settingData) {
        const folderSetting = settingData.find((s: any) => s.key === "gdrive_parent_folder");
        if (folderSetting) setGdriveLink(folderSetting.value || "");
        const countSetting = settingData.find((s: any) => s.key === "total_groups_count");
        if (countSetting && countSetting.value && !isNaN(Number(countSetting.value))) {
          setTargetTotalGroups(Number(countSetting.value));
        }
        const membersSetting = settingData.find((s: any) => s.key === "target_members_per_group");
        if (membersSetting && membersSetting.value && !isNaN(Number(membersSetting.value))) {
          setTargetMembersPerGroup(Number(membersSetting.value));
        }
        const groupCountsSetting = settingData.find((s: any) => s.key === "group_member_counts");
        if (groupCountsSetting && groupCountsSetting.value) {
          try {
            const parsed = typeof groupCountsSetting.value === "string" ? JSON.parse(groupCountsSetting.value) : groupCountsSetting.value;
            if (parsed && typeof parsed === "object") {
              setGroupMemberCounts(parsed);
            }
          } catch { }
        }
        const groupNamesSetting = settingData.find((s: any) => s.key === "group_names");
        if (groupNamesSetting && groupNamesSetting.value) {
          try {
            const parsed = typeof groupNamesSetting.value === "string" ? JSON.parse(groupNamesSetting.value) : groupNamesSetting.value;
            if (parsed && typeof parsed === "object") {
              setGroupNames(parsed);
            }
          } catch { }
        }
        const individuSetting = settingData.find((s: any) => s.key === "task_definitions_individu");
        if (individuSetting && individuSetting.value) {
          try {
            const parsed = JSON.parse(individuSetting.value);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setIndividuTaskDefs(parsed);
            }
          } catch { }
        }
        const notifSetting = settingData.find((s: any) => s.key === "notification_settings");
        if (notifSetting && notifSetting.value) {
          try {
            const parsed = JSON.parse(notifSetting.value);
            setNotifSettings((prev: any) => ({ ...prev, ...parsed }));
          } catch { }
        }
        const coreSetting = settingData.find((s: any) => s.key === "site_core_config");
        if (coreSetting && coreSetting.value) {
          try {
            const parsed = JSON.parse(coreSetting.value);
            if (parsed.homePhotoSlotsEnabled !== undefined) setStorylineEnabled(parsed.homePhotoSlotsEnabled);
            if (parsed.homePhotoSlotsTitle) setStorylineTitle(parsed.homePhotoSlotsTitle);
            if (parsed.homePhotoSlotsSubtitle) setStorylineSubtitle(parsed.homePhotoSlotsSubtitle);
            if (Array.isArray(parsed.homePhotoSlots) && parsed.homePhotoSlots.length > 0) {
              setStorylineSlots(parsed.homePhotoSlots);
            }
          } catch { }
        }
      }

    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStoryline = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingStoryline(true);
    setStorylineSuccessMsg(null);
    try {
      // 1. Get current site_core_config
      const { data: currentSetting } = await supabase.from("system_settings").select("value").eq("key", "site_core_config").maybeSingle();
      let currentConfig: any = {};
      if (currentSetting?.value) {
        try {
          currentConfig = JSON.parse(currentSetting.value);
        } catch (e) { }
      }

      const updatedConfig = {
        ...currentConfig,
        homePhotoSlotsEnabled: storylineEnabled,
        homePhotoSlotsTitle: storylineTitle,
        homePhotoSlotsSubtitle: storylineSubtitle,
        homePhotoSlots: storylineSlots,
      };

      const { error } = await supabase.from("system_settings").upsert({
        key: "site_core_config",
        value: JSON.stringify(updatedConfig),
        description: "Pengaturan Teknis Utama Web & Kustomisasi Seluruh UI",
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });

      if (error) throw error;

      // Trigger cache refresh
      fetch("/api/site-config").catch(() => { });

      setStorylineSuccessMsg("Alur Cerita (Storyline) berhasil disimpan & langsung aktif di Beranda!");
      setTimeout(() => setStorylineSuccessMsg(null), 4000);
    } catch (err: any) {
      alert("Gagal menyimpan alur cerita: " + err.message);
    } finally {
      setSavingStoryline(false);
    }
  };

  const handleToggleDocTemplateActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from("document_templates")
        .update({ is_active: !currentActive, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      loadData();
    } catch (err: any) {
      alert("Gagal mengubah status template: " + err.message);
    }
  };

  const handleDeleteDocTemplate = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus template dokumen ini?")) return;
    try {
      const { error } = await supabase.from("document_templates").delete().eq("id", id);
      if (error) throw error;
      loadData();
    } catch (err: any) {
      alert("Gagal menghapus template: " + err.message);
    }
  };

  const handleSaveIndividuTasks = async (updatedDefs: any[]) => {
    try {
      const { error } = await supabase.from("system_settings").upsert([
        {
          key: "task_definitions_individu",
          value: JSON.stringify(updatedDefs),
          description: "Daftar Tugas Individu untuk Anggota Kelompok",
          updated_at: new Date().toISOString(),
        }
      ]);
      if (error) throw error;
      setIndividuTaskDefs(updatedDefs);
    } catch (err: any) {
      alert("Gagal menyimpan tugas individu: " + err.message);
    }
  };

  const handleSendCustomPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPush.title || !customPush.body) {
      alert("Judul dan isi notifikasi wajib diisi!");
      return;
    }
    setSendingCustomPush(true);
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: customPush.title,
          message: customPush.body,
          url: customPush.url || "/info"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim notifikasi.");
      alert(`Sukses: ${data.message || 'Notifikasi berhasil dikirim!'}`);
      setCustomPush({ title: "", body: "", url: "/info" });
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSendingCustomPush(false);
    }
  };

  const handleCreateIndividuTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIndividuTask.name.trim() || !newIndividuTask.keyword.trim()) return;
    const newTaskObj = {
      id: `ind-${Date.now()}`,
      name: newIndividuTask.name.trim(),
      keyword: newIndividuTask.keyword.trim().toLowerCase(),
      is_active: newIndividuTask.is_active
    };
    const nextDefs = [...individuTaskDefs, newTaskObj];
    handleSaveIndividuTasks(nextDefs);

    // Kirim push notifikasi
    if (notifSettings?.newTaskTemplate) {
      const title = notifSettings.newTaskTemplate.title.replace(/{taskName}/g, newTaskObj.name);
      const body = notifSettings.newTaskTemplate.body.replace(/{taskName}/g, newTaskObj.name);
      fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message: body, url: "/info" })
      }).catch(e => console.warn("Push error:", e));
    }

    setShowAddIndividuModal(false);
    setNewIndividuTask({ name: "", keyword: "", is_active: true });
  };

  const handleUpdateIndividuTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIndividuTask) return;
    const nextDefs = individuTaskDefs.map((t) =>
      t.id === editingIndividuTask.id ? editingIndividuTask : t
    );
    handleSaveIndividuTasks(nextDefs);
    setEditingIndividuTask(null);
  };

  const handleToggleIndividuTaskActive = (id: string) => {
    const nextDefs = individuTaskDefs.map((t) =>
      t.id === id ? { ...t, is_active: !t.is_active } : t
    );
    handleSaveIndividuTasks(nextDefs);
  };

  const handleDeleteIndividuTask = (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus tugas individu ini?")) return;
    const nextDefs = individuTaskDefs.filter((t) => t.id !== id);
    handleSaveIndividuTasks(nextDefs);
  };

  const loadPsdTemplates = async () => {
    try {
      const res = await fetch("/api/id-card-templates");
      if (res.ok) {
        const data = await res.json();
        setPsdTemplates(data.templates || []);
      }
    } catch (e) {
      console.warn("Gagal memuat templat PSD:", e);
    }
  };

  useEffect(() => {
    loadData();
    loadPsdTemplates();
  }, []);

  const handleSaveGdriveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGdrive(true);
    setSyncingFolders(true);
    setSyncNotice(null);
    try {
      const { error } = await supabase.from("system_settings").upsert([
        {
          key: "gdrive_parent_folder",
          value: gdriveLink,
          description: "Folder ID / Link Google Drive Induk untuk mendeteksi tugas kelompok",
          updated_at: new Date().toISOString(),
        },
        {
          key: "total_groups_count",
          value: String(targetTotalGroups),
          description: "Jumlah Total Kelompok yang Dibuatkan Foldernya di Google Drive",
          updated_at: new Date().toISOString(),
        },
        {
          key: "target_members_per_group",
          value: String(targetMembersPerGroup),
          description: "Target Standar Jumlah Anggota Per Kelompok untuk Tugas Individu",
          updated_at: new Date().toISOString(),
        },
        {
          key: "group_member_counts",
          value: JSON.stringify(groupMemberCounts),
          description: "Jumlah Peserta Kustom Per Kelompok (Individu)",
          updated_at: new Date().toISOString(),
        },
        {
          key: "group_names",
          value: JSON.stringify(groupNames),
          description: "Nama Kustom Masing-Masing Kelompok",
          updated_at: new Date().toISOString(),
        }
      ]);
      if (error) throw error;

      // Automatically sync folders for all groups immediately!
      const res = await fetch("/api/drive-sync-folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalGroups: Number(targetTotalGroups) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal sinkronisasi folder");

      setSyncNotice(data.message || `Pengaturan disimpan & folder seluruh kelompok (${targetTotalGroups}) siap di Google Drive!`);
    } catch (err: any) {
      alert("Gagal menyimpan pengaturan: " + err.message);
    } finally {
      setSavingGdrive(false);
      setSyncingFolders(false);
    }
  };

  const handleSyncFolders = async () => {
    setSyncingFolders(true);
    setSyncNotice(null);
    try {
      const res = await fetch("/api/drive-sync-folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalGroups: Number(targetTotalGroups) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal sinkronisasi folder");
      setSyncNotice(data.message);
    } catch (err: any) {
      alert("Error sinkronisasi: " + err.message);
    } finally {
      setSyncingFolders(false);
    }
  };

  const handleSaveNotificationSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNotif(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationSettings: notifSettings }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");
      alert("Pengaturan notifikasi berhasil disimpan!");
    } catch (err: any) {
      alert("Gagal menyimpan notifikasi: " + err.message);
    } finally {
      setSavingNotif(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncingFolders(true);
    setSyncNotice(null);
    try {
      const { error } = await supabase.from("task_definitions").insert([{
        name: newTask.name,
        keyword: newTask.keyword,
        is_active: newTask.is_active,
      }]);
      if (error) throw error;

      setShowAddTaskModal(false);
      setNewTask({ name: "", keyword: "", is_active: true });

      // Automatically sync/generate folders for all groups immediately upon task creation!
      const res = await fetch("/api/drive-sync-folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalGroups: Number(targetTotalGroups) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal sinkronisasi folder");

      // Kirim push notifikasi
      if (notifSettings?.newTaskTemplate) {
        const title = notifSettings.newTaskTemplate.title.replace(/{taskName}/g, newTask.name);
        const body = notifSettings.newTaskTemplate.body.replace(/{taskName}/g, newTask.name);
        fetch("/api/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, message: body, url: "/info" })
        }).catch(e => console.warn("Push error:", e));
      }

      setSyncNotice(`Tugas "${newTask.name}" berhasil dibuat & folder untuk seluruh kelompok (${targetTotalGroups}) langsung disinkronkan di Google Drive!`);
      loadData();
    } catch (err: any) {
      alert("Gagal menambahkan tugas: " + err.message);
    } finally {
      setSyncingFolders(false);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    setSyncingFolders(true);
    try {
      const { error } = await supabase.from("task_definitions").update({
        name: editingTask.name,
        keyword: editingTask.keyword,
        is_active: editingTask.is_active,
        updated_at: new Date().toISOString(),
      }).eq("id", editingTask.id);
      if (error) throw error;

      setEditingTask(null);

      // Automatically sync folders for all groups upon updating task
      await fetch("/api/drive-sync-folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalGroups: Number(targetTotalGroups) }),
      });

      loadData();
    } catch (err: any) {
      alert("Gagal memperbarui tugas: " + err.message);
    } finally {
      setSyncingFolders(false);
    }
  };

  const handleToggleTaskActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase.from("task_definitions").update({
        is_active: !currentActive,
        updated_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
      loadData();
    } catch (err: any) {
      alert("Gagal memperbarui status tugas: " + err.message);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus tugas ini? (Perubahan berlaku untuk semua kelompok)")) return;
    try {
      const { error } = await supabase.from("task_definitions").delete().eq("id", id);
      if (error) throw error;
      loadData();
    } catch (err: any) {
      alert("Gagal menghapus tugas: " + err.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("hub_links").insert([newLink]);
      if (error) throw error;

      // Kirim push notifikasi
      if (notifSettings?.linktreeTemplate) {
        const title = notifSettings.linktreeTemplate.title.replace(/{label}/g, newLink.label);
        const body = notifSettings.linktreeTemplate.body.replace(/{label}/g, newLink.label);
        fetch("/api/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, message: body, url: "/hub" })
        }).catch(e => console.warn("Push error:", e));
      }

      setShowAddLinkModal(false);
      setNewLink({ label: "", url: "", category: "Panduan & Berkas", icon_key: "book", description: "", sort_order: 0 });
      loadData();
    } catch (err: any) {
      alert("Gagal menambahkan link: " + err.message);
    }
  };

  const handleToggleLinkActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase.from("hub_links").update({ is_active: !currentActive }).eq("id", id);
      if (error) throw error;
      loadData();
    } catch (err: any) {
      alert("Gagal memperbarui status: " + err.message);
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus tautan ini?")) return;
    try {
      const { error } = await supabase.from("hub_links").delete().eq("id", id);
      if (error) throw error;
      loadData();
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("contact_persons").insert([
        {
          ...newContact,
          button_text: newContact.button_text?.trim() || null,
          ig_button_text: newContact.ig_button_text?.trim() || null,
          photo_url: newContact.photo_url || null,
        },
      ]);
      if (error) throw error;
      setShowAddContactModal(false);
      setNewContact({ name: "", role: "", group_name: "None", whatsapp: "", instagram: "", button_text: "", ig_button_text: "", photo_url: "" });
      loadData();
    } catch (err: any) {
      alert("Gagal menambahkan kontak: " + err.message);
    }
  };

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;
    try {
      const { error } = await supabase
        .from("contact_persons")
        .update({
          name: editingContact.name,
          role: editingContact.role,
          group_name: editingContact.group_name,
          whatsapp: editingContact.whatsapp,
          instagram: editingContact.instagram,
          button_text: editingContact.button_text?.trim() || null,
          ig_button_text: editingContact.ig_button_text?.trim() || null,
          photo_url: editingContact.photo_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingContact.id);
      if (error) throw error;
      setShowEditContactModal(false);
      setEditingContact(null);
      loadData();
    } catch (err: any) {
      alert("Gagal memperbarui kontak: " + err.message);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Hapus kontak ini?")) return;
    try {
      const { error } = await supabase.from("contact_persons").delete().eq("id", id);
      if (error) throw error;
      loadData();
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  const handleCreateAnno = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Store notes, gdrive_url & autoform_url inside content JSON for maximum schema compatibility
      const contentPayload = JSON.stringify({
        notes: newAnno.notes,
        gdrive_url: newAnno.gdrive_url,
        autoform_url: newAnno.autoform_url,
      });

      const newId = crypto.randomUUID();
      const { error } = await supabase.from("announcements").insert([{
        id: newId,
        title: newAnno.title,
        content: contentPayload,
        category: newAnno.category,
        pinned: newAnno.pinned,
      }]);

      if (error) throw error;

      // Kirim push notifikasi
      if (notifSettings?.announcementTemplate) {
        const targetUrl = `/guide?id=${newId}`;
        const title = notifSettings.announcementTemplate.title.replace(/{title}/g, newAnno.title);
        const body = notifSettings.announcementTemplate.body.replace(/{title}/g, newAnno.title);
        fetch("/api/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, message: body, url: targetUrl })
        }).catch(e => console.warn("Push error:", e));
      }

      setShowAddAnnoModal(false);
      setNewAnno({ title: "", notes: "", gdrive_url: "", autoform_url: "/documents", category: "Contoh Surat", pinned: false });
      loadData();
    } catch (err: any) {
      alert("Gagal menambahkan pengumuman: " + err.message);
    }
  };

  const handleDeleteAnno = async (id: string) => {
    if (!confirm("Hapus pengumuman ini?")) return;
    try {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
      loadData();
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  const handleOpenEditAnno = (a: any) => {
    let notes = a.content;
    let gdrive_url = "";
    let autoform_url = "/documents";
    try {
      if (a.content && a.content.trim().startsWith("{")) {
        const parsed = JSON.parse(a.content);
        notes = parsed.notes || a.content;
        gdrive_url = parsed.gdrive_url || "";
        autoform_url = parsed.autoform_url || "/documents";
      }
    } catch (e) { }

    setEditingAnno({
      id: a.id,
      title: a.title,
      notes,
      gdrive_url,
      autoform_url,
      category: a.category || "Contoh Surat",
      pinned: !!a.pinned,
    });
  };

  const handleUpdateAnno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnno) return;
    try {
      const contentPayload = JSON.stringify({
        notes: editingAnno.notes,
        gdrive_url: editingAnno.gdrive_url,
        autoform_url: editingAnno.autoform_url,
      });

      const { error } = await supabase.from("announcements").update({
        title: editingAnno.title,
        content: contentPayload,
        category: editingAnno.category,
        pinned: editingAnno.pinned,
        updated_at: new Date().toISOString(),
      }).eq("id", editingAnno.id);

      if (error) throw error;

      // Kirim / kirim ulang push notifikasi saat pengumuman diperbarui
      if (notifSettings?.announcementTemplate) {
        const targetUrl = `/guide?id=${editingAnno.id}`;
        const title = `[Update] ${editingAnno.title}`;
        const body = `Pengumuman "${editingAnno.title}" telah diperbarui. Cek informasi terbarunya sekarang!`;
        fetch("/api/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, message: body, url: targetUrl })
        }).catch(e => console.warn("Push error:", e));
      }

      setEditingAnno(null);
      loadData();
    } catch (err: any) {
      alert("Gagal memperbarui pengumuman: " + err.message);
    }
  };

  // ── PSD TEMPLATE HANDLERS ────────────────────────────────────────────────
  const handleUploadPsdTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPsdFile) {
      setPsdErrorMsg("Pilih file .PSD terlebih dahulu.");
      return;
    }

    setUploadingPsd(true);
    setPsdErrorMsg(null);
    setPsdSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedPsdFile);
      formData.append("name", newPsd.name || selectedPsdFile.name);
      formData.append("description", newPsd.description);
      formData.append("is_default", String(newPsd.is_default));
      formData.append("is_active", "true");

      const res = await fetch("/api/id-card-templates", {
        method: "POST",
        body: formData,
      });

      const responseText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch (jsonErr) {
        if (res.status === 413 || responseText.includes("Request Entity Too Large")) {
          throw new Error("Ukuran file templat PSD terlalu besar (Maksimal 4.5MB). Silakan gunakan file PSD yang lebih kecil.");
        }
        throw new Error(`Respon server tidak valid (${res.status}): ${responseText.slice(0, 100)}`);
      }

      if (!res.ok) throw new Error(data.error || "Gagal mengunggah templat PSD.");

      setPsdSuccessMsg(`Templat "${data.template?.name || 'PSD'}" berhasil disimpan!`);
      setNewPsd({ name: "", description: "", is_default: false });
      setSelectedPsdFile(null);
      await loadPsdTemplates();
      setTimeout(() => setPsdSuccessMsg(null), 4000);
    } catch (err: any) {
      setPsdErrorMsg(err.message || "Gagal mengunggah templat PSD.");
    } finally {
      setUploadingPsd(false);
    }
  };

  const handleDeletePsdTemplate = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus templat PSD ini?")) return;
    try {
      const res = await fetch(`/api/id-card-templates?id=${id}`, { method: "DELETE" });
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { /* ignore non-JSON */ }
      if (!res.ok) throw new Error(data.error || "Gagal menghapus templat PSD");
      await loadPsdTemplates();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTogglePsdActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/id-card-templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !currentActive }),
      });
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { /* ignore non-JSON */ }
      if (!res.ok) throw new Error(data.error || "Gagal mengubah status");
      await loadPsdTemplates();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSetPsdDefault = async (id: string) => {
    try {
      const res = await fetch("/api/id-card-templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_default: true }),
      });
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { /* ignore non-JSON */ }
      if (!res.ok) throw new Error(data.error || "Gagal menyetel default");
      await loadPsdTemplates();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col z-0 overflow-hidden bg-[#020510] text-slate-100 font-sans">
      <StarfieldBackground />

      <header className="sticky top-0 z-40 w-full glass border-b border-card-border backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ImoLogo height={32} />
          <span className="font-display font-extrabold text-accent-purple text-base">2026</span>
          <span className="text-[10px] font-mono uppercase bg-accent-purple/20 text-accent-purple border border-accent-purple/40 px-2.5 py-0.5 rounded-full font-bold ml-2">
            ADMIN DASHBOARD
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="hidden sm:inline text-xs font-mono text-slate-400">
            Logged in as: <strong className="text-slate-200">{userEmail}</strong>
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold hover:bg-rose-500 hover:text-white transition cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-10 relative z-10">
        {/* Simple Node Map UI with Connected Circuit SVG */}
        <div className="relative flex flex-col items-center py-6 w-full mb-8 border-b border-card-border/30">

          {/* Quick Actions floating at top right */}
          <div className="absolute top-2 right-2 z-20">
            <Link href="/admin/settings" className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-bold bg-accent-purple/10 text-accent-purple border border-accent-purple/30 hover:bg-accent-purple hover:text-black hover:shadow-[0_0_15px_rgba(179,136,255,0.4)] transition duration-300">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Pengaturan Web & Push</span>
            </Link>
          </div>

          {/* Central Hub IMO Node */}
          <div className="relative z-20 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, type: "spring" }}
              className="h-20 w-20 bg-slate-900 border-2 border-accent-cyan/60 rounded-3xl flex items-center justify-center shadow-[0_0_35px_rgba(125,249,255,0.25)] relative group cursor-pointer"
            >
              <ImoLogo height={42} />
              <span className="absolute -inset-1 rounded-3xl border border-accent-cyan/40 animate-ping opacity-20 pointer-events-none"></span>
            </motion.div>
            <h1 className="mt-3 text-sm font-display font-extrabold text-accent-cyan tracking-widest uppercase">Admin Dashboard</h1>
            <p className="text-[10px] text-slate-400 font-mono">Pusat Kendali Data</p>
          </div>

          {/* Connected Circuit Lines Canvas (Desktop) */}
          <div className="relative w-full max-w-4xl h-16 my-1 hidden sm:block pointer-events-none">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 70" preserveAspectRatio="none">
              {/* Central Vertical Trunk Line coming down from IMO Logo (x=500, y=0 to y=35) */}
              <line x1="500" y1="0" x2="500" y2="35" stroke="#7df9ff" strokeWidth="2.5" strokeDasharray="5 3" className="animate-pulse" />
              <circle cx="500" cy="35" r="4" fill="#7df9ff" className="shadow-[0_0_12px_#7df9ff]" />

              {/* Horizontal Bus Line across all 8 nodes (y=35, x=55 to x=945) */}
              <line x1="55" y1="35" x2="945" y2="35" stroke="rgba(125,249,255,0.35)" strokeWidth="2" />

              {/* Vertical Drop Lines to 8 Nodes */}
              {[55, 182, 309, 436, 563, 690, 817, 945].map((x, idx) => {
                const nodeIds: ActiveTab[] = ["links", "contacts", "announcements", "templates", "tasks", "doc_templates", "storyline", "notifications"];
                const isSelected = activeTab === nodeIds[idx];
                return (
                  <g key={idx}>
                    <line
                      x1={x}
                      y1="35"
                      x2={x}
                      y2="70"
                      stroke={isSelected ? "#7df9ff" : "rgba(255,255,255,0.25)"}
                      strokeWidth={isSelected ? "3" : "1.5"}
                    />
                    <circle
                      cx={x}
                      cy="35"
                      r={isSelected ? "4" : "2.5"}
                      fill={isSelected ? "#7df9ff" : "rgba(255,255,255,0.4)"}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Node Buttons Bar (Desktop - 8 Nodes) */}
          <div className="relative w-full max-w-5xl flex justify-between items-start mt-2 z-10 hidden sm:flex gap-1.5">
            {[
              { id: "links", label: "Menu Links", icon: Layers, count: links.length, color: "text-blue-400", border: "border-blue-500/50", shadow: "shadow-[0_0_20px_rgba(59,130,246,0.3)]" },
              { id: "contacts", label: "Kontak", icon: Users, count: contacts.length, color: "text-emerald-400", border: "border-emerald-500/50", shadow: "shadow-[0_0_20px_rgba(16,185,129,0.3)]" },
              { id: "announcements", label: "Pengumuman", icon: Megaphone, count: announcements.length, color: "text-amber-400", border: "border-amber-500/50", shadow: "shadow-[0_0_20px_rgba(245,158,11,0.3)]" },
              { id: "templates", label: "Template ID", icon: CreditCard, count: templates.length, color: "text-purple-400", border: "border-purple-500/50", shadow: "shadow-[0_0_20px_rgba(168,85,247,0.3)]" },
              { id: "tasks", label: "Penugasan", icon: ListChecks, count: tasks.length, color: "text-rose-400", border: "border-rose-500/50", shadow: "shadow-[0_0_20px_rgba(244,63,114,0.3)]" },
              { id: "doc_templates", label: "Auto-Form", icon: FileCode2, count: docTemplates.length, color: "text-cyan-400", border: "border-cyan-500/50", shadow: "shadow-[0_0_20px_rgba(125,249,255,0.3)]" },
              { id: "storyline", label: "Storyline", icon: Milestone, count: storylineSlots.length, color: "text-cyan-300", border: "border-cyan-500/50", shadow: "shadow-[0_0_20px_rgba(125,249,255,0.3)]" },
              { id: "notifications", label: "Notifikasi", icon: Bell, count: 0, color: "text-rose-500", border: "border-rose-500/50", shadow: "shadow-[0_0_20px_rgba(244,63,114,0.3)]" },
            ].map((t) => {
              const Icon = t.icon;
              const isCurrent = activeTab === t.id;

              return (
                <div key={t.id} className="relative flex flex-col items-center group cursor-pointer flex-1" onClick={() => setActiveTab(t.id as ActiveTab)}>
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={`h-15 w-15 sm:h-16 sm:w-16 flex flex-col items-center justify-center rounded-2xl border transition-all duration-300 z-10 ${isCurrent
                      ? `bg-slate-800 ${t.border} ${t.shadow} scale-110 ring-2 ring-white/10`
                      : `bg-slate-900/90 border-card-border/50 group-hover:border-slate-500`
                      }`}
                  >
                    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 mb-1 transition-colors ${isCurrent ? t.color : 'text-slate-400 group-hover:text-slate-200'}`} />
                    <span className="text-[9px] font-mono font-bold bg-black/40 px-1.5 rounded text-slate-300">{t.count}</span>
                  </motion.div>
                  <span className={`mt-2.5 text-[10.5px] font-bold tracking-wider text-center ${isCurrent ? t.color : 'text-slate-400 group-hover:text-slate-200'} transition-colors`}>{t.label}</span>
                </div>
              );
            })}
          </div>

          {/* Mobile Node Buttons Grid (2 rows of 4) */}
          <div className="w-full grid grid-cols-4 sm:hidden gap-2 mt-6 px-1">
            {[
              { id: "links", label: "Menu", icon: Layers, count: links.length, color: "text-blue-400", border: "border-blue-500/50" },
              { id: "contacts", label: "Kontak", icon: Users, count: contacts.length, color: "text-emerald-400", border: "border-emerald-500/50" },
              { id: "announcements", label: "Warta", icon: Megaphone, count: announcements.length, color: "text-amber-400", border: "border-amber-500/50" },
              { id: "templates", label: "ID Card", icon: CreditCard, count: templates.length, color: "text-purple-400", border: "border-purple-500/50" },
              { id: "tasks", label: "Tugas", icon: ListChecks, count: tasks.length, color: "text-rose-400", border: "border-rose-500/50" },
              { id: "doc_templates", label: "Form", icon: FileCode2, count: docTemplates.length, color: "text-cyan-400", border: "border-cyan-500/50" },
              { id: "storyline", label: "Story", icon: Milestone, count: storylineSlots.length, color: "text-cyan-300", border: "border-cyan-500/50" },
              { id: "notifications", label: "Notif", icon: Bell, count: 0, color: "text-rose-500", border: "border-rose-500/50" },
            ].map((t) => {
              const Icon = t.icon;
              const isCurrent = activeTab === t.id;

              return (
                <div key={t.id} className="relative flex flex-col items-center cursor-pointer" onClick={() => setActiveTab(t.id as ActiveTab)}>
                  <div className={`h-12 w-12 flex flex-col items-center justify-center rounded-xl border transition-all duration-300 z-10 ${isCurrent
                    ? `bg-slate-800 ${t.border} scale-105 ring-1 ring-white/20`
                    : `bg-slate-900/90 border-card-border/50`
                    }`}
                  >
                    <Icon className={`h-4 w-4 mb-0.5 ${isCurrent ? t.color : 'text-slate-400'}`} />
                    <span className="text-[8px] font-mono font-bold bg-black/40 px-1 rounded text-slate-300">{t.count}</span>
                  </div>
                  <span className={`mt-1 text-[9px] font-bold text-center truncate w-full ${isCurrent ? t.color : 'text-slate-400'}`}>{t.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {activeTab === "links" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-slate-100">Kelola Grid Menu (/hub)</h2>
                    <p className="text-xs text-slate-400">Tambah, ubah, atau hapus kartu menu navigasi cepat di halaman Mission Control.</p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setShowAddLinkModal(true)}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    <span>Tambah Tautan Baru</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {links.map((link) => (
                    <div key={link.id} className="glass rounded-2xl p-5 border border-card-border/40 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono uppercase bg-slate-900 px-2.5 py-0.5 rounded-full border border-card-border/40 text-accent-cyan font-bold">
                            {link.category}
                          </span>
                          <button
                            onClick={() => handleToggleLinkActive(link.id, link.is_active)}
                            className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border cursor-pointer ${link.is_active
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                              : "bg-slate-800 text-slate-500 border-slate-700"
                              }`}
                          >
                            {link.is_active ? "Aktif" : "Nonaktif"}
                          </button>
                        </div>

                        <h3 className="font-display font-bold text-lg text-slate-100">{link.label}</h3>
                        <p className="text-xs text-slate-400 font-sans mt-1 line-clamp-2">{link.description || "Tidak ada deskripsi."}</p>
                        <a href={link.url} target="_blank" rel="noreferrer" className="text-[11px] text-accent-cyan font-mono hover:underline mt-2 inline-flex items-center space-x-1">
                          <span>{link.url}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>

                      <div className="flex items-center justify-end space-x-2 border-t border-card-border/30 pt-3 mt-4">
                        <button
                          onClick={() => handleDeleteLink(link.id)}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold hover:bg-rose-500 hover:text-white transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "doc_templates" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-accent-cyan flex items-center gap-2">
                      <FileCode2 className="h-6 w-6" />
                      <span>Kelola Auto-Form Generator (.docx)</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Kelola template dokumen Word (.docx) dan tag pengisian otomatis dinamis seperti &#123;nama&#125;, &#123;nim&#125;.
                    </p>
                  </div>
                  <Link href="/admin/document-templates/create">
                    <Button variant="galaxy" size="sm">
                      <Plus className="h-4 w-4 mr-1.5" />
                      <span>Tambah Template Baru</span>
                    </Button>
                  </Link>
                </div>

                {docTemplates.length === 0 ? (
                  <div className="glass rounded-2xl p-12 border border-card-border/40 text-center">
                    <FileText className="w-12 h-12 mx-auto text-accent-cyan/50 mb-3 animate-pulse" />
                    <h3 className="text-lg font-bold text-slate-200">Belum Ada Template Dokumen</h3>
                    <p className="text-slate-400 text-xs max-w-md mx-auto mt-1 mb-4">
                      Unggah file .docx pertama Anda berisi tag seperti &#123;nama&#125; untuk mengaktifkan Auto-Form generator.
                    </p>
                    <Link href="/admin/document-templates/create">
                      <Button variant="primary" size="sm">
                        <Plus className="h-4 w-4 mr-1.5" /> Unggah .docx
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {docTemplates.map((tpl) => (
                      <div key={tpl.id} className="glass rounded-2xl p-5 border border-card-border/40 flex flex-col justify-between hover:border-accent-cyan/40 transition">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-accent-cyan/30 text-accent-cyan">
                              <FileText className="w-5 h-5" />
                            </div>

                            <button
                              onClick={() => handleToggleDocTemplateActive(tpl.id, tpl.is_active)}
                              className={`px-2.5 py-0.5 text-[10px] font-mono rounded-full border transition flex items-center gap-1 cursor-pointer ${tpl.is_active
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                                }`}
                            >
                              {tpl.is_active ? (
                                <>
                                  <CheckCircle className="w-3 h-3" /> Aktif
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3" /> Non-aktif
                                </>
                              )}
                            </button>
                          </div>

                          <h3 className="text-base font-bold text-white mb-1 line-clamp-1">{tpl.title}</h3>
                          <p className="text-slate-400 text-xs line-clamp-2 mb-3">{tpl.description || "Tidak ada deskripsi"}</p>

                          <div className="space-y-1.5 mb-4">
                            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                              <span>Jumlah Tag/Field:</span>
                              <span className="text-accent-cyan font-bold">
                                {Array.isArray(tpl.fields_config) ? tpl.fields_config.length : 0} Field
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 pt-1">
                              {Array.isArray(tpl.fields_config) &&
                                tpl.fields_config.slice(0, 4).map((f: any, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 text-[10px] font-mono bg-slate-950 text-accent-cyan border border-accent-cyan/20 rounded-md"
                                  >
                                    &#123;{f.tag}&#125;
                                  </span>
                                ))}
                              {Array.isArray(tpl.fields_config) && tpl.fields_config.length > 4 && (
                                <span className="px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-900/50 rounded-md">
                                  +{tpl.fields_config.length - 4} lagi
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-card-border/30 gap-2">
                          <a
                            href={tpl.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-slate-400 hover:text-accent-cyan transition rounded-lg hover:bg-slate-900"
                            title="Unduh Master Docx"
                          >
                            <Download className="w-4 h-4" />
                          </a>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/documents/${tpl.id}`}
                              target="_blank"
                              className="px-2.5 py-1 text-xs font-mono rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan/20 transition"
                            >
                              Uji Form
                            </Link>

                            <button
                              onClick={() => handleDeleteDocTemplate(tpl.id)}
                              className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg border border-rose-500/20 transition"
                              title="Hapus Template"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "contacts" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-slate-100">Kelola Kontak (/contact)</h2>
                    <p className="text-xs text-slate-400">Daftar kontak pendamping & narahubung kelompok yang tampil di halaman kontak.</p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setShowAddContactModal(true)}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    <span>Tambah Kontak Baru</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contacts.map((c) => {
                    const isNoneGroup = !c.group_name || c.group_name.trim().toLowerCase() === "none";
                    const groupNum = c.group_name?.match(/\d+/)?.[0];
                    const customName = groupNum && groupNames[groupNum] ? groupNames[groupNum].trim() : "";
                    const displayGroupName = isNoneGroup ? "Bukan LO" : customName ? `${customName} (${c.group_name})` : c.group_name;
                    const isAdminB = c.name.trim().toLowerCase() === "admin b";
                    const isWebmaster = isAdminB || (c.role && c.role.trim().toLowerCase().includes("webmaster"));

                    return (
                      <div
                        key={c.id}
                        className={`group relative rounded-[28px] p-5 backdrop-blur-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                          isWebmaster
                            ? "border border-amber-500/40 hover:border-amber-400/80 bg-gradient-to-b from-amber-500/[0.1] via-white/[0.03] to-black/[0.5] shadow-[0_12px_32px_rgba(245,158,11,0.15)]"
                            : "border border-white/[0.12] hover:border-white/[0.25] bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-black/[0.45] shadow-[0_12px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.25)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.35)]"
                        }`}
                      >
                        {/* Specular glass sheen reflection */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-b via-transparent to-transparent pointer-events-none rounded-[28px] ${
                            isWebmaster ? "from-amber-300/[0.15]" : "from-white/[0.08]"
                          }`}
                        />

                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <span
                              className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full ${
                                isWebmaster
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)]"
                                  : "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                              }`}
                            >
                              {isWebmaster ? "👑 " : ""}{c.role || "Narahubung"}
                            </span>
                            {isWebmaster ? (
                              <span className="text-[10px] font-mono text-amber-300 font-bold bg-amber-500/15 border border-amber-500/35 px-2.5 py-0.5 rounded-full">
                                Webmaster
                              </span>
                            ) : isNoneGroup ? (
                              <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-800/80 border border-slate-700/60 px-2.5 py-0.5 rounded-full">
                                Panitia
                              </span>
                            ) : (
                              <span
                                className="text-[10px] font-mono text-cyan-300 font-semibold truncate max-w-[150px] bg-cyan-500/10 border border-cyan-500/25 px-2.5 py-0.5 rounded-full"
                                title={displayGroupName}
                              >
                                {displayGroupName}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3.5 mb-3">
                            {/* Circular avatar with smooth double-ringed frosted glass border */}
                            <div
                              className={`relative h-14 w-14 rounded-full overflow-hidden flex-shrink-0 p-0.5 bg-gradient-to-b shadow-[0_4px_16px_rgba(0,0,0,0.4)] ${
                                isWebmaster
                                  ? "from-amber-300 via-amber-500/30 to-yellow-500/10 ring-2 ring-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                                  : "from-white/30 via-white/10 to-white/5 ring-1 ring-white/20"
                              }`}
                            >
                              {c.photo_url ? (
                                <img
                                  src={c.photo_url}
                                  alt={c.name}
                                  className="h-full w-full object-cover rounded-full"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-slate-900 rounded-full text-slate-500 font-mono text-[10px] uppercase">
                                  Astro
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3
                                className={`font-display font-bold text-base truncate ${
                                  isWebmaster
                                    ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400"
                                    : "text-slate-100"
                                }`}
                              >
                                {c.name}
                              </h3>
                              <p className="text-xs text-emerald-400 font-mono mt-0.5 truncate flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                <span>WA: {c.whatsapp}</span>
                              </p>
                              {c.instagram && (
                                <p className="text-xs text-pink-300 font-mono truncate flex items-center gap-1.5 mt-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                                  <span>IG: @{c.instagram.replace(/^@/, "")}</span>
                                </p>
                              )}
                              {c.button_text && (
                                <p className="text-xs text-amber-300 font-mono truncate flex items-center gap-1.5 mt-0.5" title={c.button_text}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                  <span>Tombol WA: &quot;{c.button_text}&quot;</span>
                                </p>
                              )}
                              {c.ig_button_text && (
                                <p className="text-xs text-pink-300 font-mono truncate flex items-center gap-1.5 mt-0.5" title={c.ig_button_text}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                                  <span>Tombol IG: &quot;{c.ig_button_text}&quot;</span>
                                </p>
                              )}
                              {isAdminB && (
                                <p className="text-[11px] text-amber-200/85 italic font-sans mt-1.5 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                                  &ldquo;Webnya bermasalah??, DM aja, segera tak benerin&rdquo;
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end items-center gap-2 pt-3 mt-2 border-t border-white/[0.08] relative z-10">
                          <button
                            onClick={() => {
                              setEditingContact({ ...c });
                              setShowEditContactModal(true);
                            }}
                            className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-400 hover:text-black transition cursor-pointer"
                            title="Edit Kontak"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteContact(c.id)}
                            className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500 hover:text-white transition cursor-pointer"
                            title="Hapus Kontak"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "announcements" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-slate-100">Pengumuman & Instruksi Misi</h2>
                    <p className="text-xs text-slate-400">Kelola informasi penting yang ditargetkan untuk seluruh peserta IMO 2026.</p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setShowAddAnnoModal(true)}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    <span>Buat Pengumuman Baru</span>
                  </Button>
                </div>

                <div className="space-y-4">
                  {announcements.map((a) => {
                    let parsedNotes = a.content;
                    let parsedGdriveUrl = "";
                    try {
                      if (a.content.trim().startsWith("{")) {
                        const parsed = JSON.parse(a.content);
                        parsedNotes = parsed.notes || a.content;
                        parsedGdriveUrl = parsed.gdrive_url || "";
                      }
                    } catch (e) { }

                    return (
                      <div key={a.id} className="glass rounded-2xl p-5 border border-card-border/40 flex items-start justify-between">
                        <div className="space-y-1.5 max-w-3xl">
                          <div className="flex items-center space-x-2">
                            {a.pinned && <Pin className="h-4 w-4 text-accent-yellow fill-accent-yellow" />}
                            <span className="text-[10px] font-mono uppercase bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/30 px-2.5 py-0.5 rounded-full font-bold">
                              {a.category}
                            </span>
                            {parsedGdriveUrl && (
                              <span className="text-[10px] font-mono uppercase bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30 px-2.5 py-0.5 rounded-full font-bold flex items-center space-x-1">
                                <span>{a.category?.toLowerCase().includes("video") ? "📹 Embedded Video" : "📄 Embedded Doc"}</span>
                              </span>
                            )}
                          </div>
                          <h3 className="font-display font-bold text-lg text-slate-100">{a.title}</h3>
                          <p className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">{parsedNotes}</p>
                          {parsedGdriveUrl && (
                            <a href={parsedGdriveUrl} target="_blank" rel="noreferrer" className="text-[11px] text-accent-cyan font-mono hover:underline inline-block mt-1">
                              🔗 {parsedGdriveUrl}
                            </a>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                          <button
                            onClick={() => handleOpenEditAnno(a)}
                            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Edit Pengumuman"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAnno(a.id)}
                            className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white transition cursor-pointer"
                            title="Hapus Pengumuman"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "templates" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-slate-100 flex items-center space-x-2">
                      <CreditCard className="h-6 w-6 text-accent-cyan" />
                      <span>Manajemen Templat ID Card (.PSD)</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                      Unggah dan kelola file template Photoshop <code className="text-accent-cyan font-mono font-semibold">.PSD</code> resmi. Seluruh peserta akan secara otomatis mendapatkan pilihan templat yang Anda sediakan di halaman ID Card.
                    </p>
                  </div>
                </div>

                {/* Upload Form Box */}
                <Card glowColor="purple">
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-card-border/30">
                    <span className="font-mono text-xs font-bold text-accent-purple uppercase tracking-wider flex items-center space-x-2">
                      <Upload className="h-4 w-4 text-accent-purple" />
                      <span>Unggah Templat PSD Baru</span>
                    </span>
                    {psdSuccessMsg && (
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30">
                        ✓ {psdSuccessMsg}
                      </span>
                    )}
                    {psdErrorMsg && (
                      <span className="text-xs font-mono text-rose-400 bg-rose-500/10 px-3 py-1 rounded-xl border border-rose-500/30">
                        ⚠ {psdErrorMsg}
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleUploadPsdTemplate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono text-slate-300 mb-1.5 font-bold">
                          Nama Templat *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Templat Resmi IMO 2026 (V1)"
                          value={newPsd.name}
                          onChange={(e) => setNewPsd({ ...newPsd, name: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-card-border/60 text-slate-100 text-xs focus:outline-none focus:border-accent-purple"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-slate-300 mb-1.5 font-bold">
                          File Photoshop (.PSD) *
                        </label>
                        <input
                          type="file"
                          required
                          accept=".psd"
                          onChange={(e) => setSelectedPsdFile(e.target.files?.[0] || null)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-card-border/60 text-slate-300 text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-mono file:bg-accent-purple/20 file:text-accent-purple hover:file:bg-accent-purple/30"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1.5 font-bold">
                        Deskripsi Singkat (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Desain bertema portal IMO 2026 dengan frame pasfoto & Motto"
                        value={newPsd.description}
                        onChange={(e) => setNewPsd({ ...newPsd, description: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl bg-slate-950/80 border border-card-border/60 text-slate-100 text-xs focus:outline-none focus:border-accent-purple"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center space-x-2 text-xs font-mono text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newPsd.is_default}
                          onChange={(e) => setNewPsd({ ...newPsd, is_default: e.target.checked })}
                          className="rounded border-slate-700 bg-slate-950 text-accent-purple focus:ring-accent-purple"
                        />
                        <span>Jadikan Templat Default Utama</span>
                      </label>

                      <Button variant="primary" size="sm" type="submit" disabled={uploadingPsd || !selectedPsdFile}>
                        {uploadingPsd ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                            <span>Mengunggah ke Storage...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-1.5" />
                            <span>Unggah & Simpan Templat</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Card>

                {/* List of PSD Templates */}
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-base text-slate-100 flex items-center justify-between">
                    <span>Daftar Templat PSD Tersimpan ({psdTemplates.length})</span>
                  </h3>

                  {psdTemplates.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-card-border/30 bg-slate-900/40 text-slate-400 text-xs font-mono">
                      Belum ada templat PSD kustom yang diunggah. Silakan unggah templat PSD di atas.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {psdTemplates.map((t) => {
                        const psdUrl = t.background_url || t.layout_json?.psd_url || "";
                        return (
                          <div key={t.id} className="glass rounded-2xl p-5 border border-card-border/40 flex flex-col justify-between gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-display font-bold text-base text-slate-100">{t.name}</span>
                                <div className="flex items-center space-x-1.5">
                                  {t.is_default && (
                                    <span className="text-[10px] font-mono uppercase bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40 px-2 py-0.5 rounded-full font-bold">
                                      Default
                                    </span>
                                  )}
                                  <span
                                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${t.is_active !== false
                                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                                      : "bg-slate-800 text-slate-500 border-slate-700"
                                      }`}
                                  >
                                    {t.is_active !== false ? "Aktif" : "Nonaktif"}
                                  </span>
                                </div>
                              </div>

                              {t.description && (
                                <p className="text-xs text-slate-400 leading-snug">{t.description}</p>
                              )}

                              <div className="text-[11px] font-mono text-slate-500 flex items-center justify-between pt-1">
                                <span>File: {t.layout_json?.file_name || "Template.psd"}</span>
                                <span>{new Date(t.created_at || Date.now()).toLocaleDateString("id-ID")}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-card-border/20 flex-wrap gap-2">
                              <div className="flex items-center space-x-2">
                                {!t.is_default && (
                                  <button
                                    onClick={() => handleSetPsdDefault(t.id)}
                                    className="text-xs font-mono text-accent-cyan hover:underline cursor-pointer"
                                  >
                                    Set Default
                                  </button>
                                )}
                                <button
                                  onClick={() => handleTogglePsdActive(t.id, t.is_active !== false)}
                                  className="text-xs font-mono text-slate-400 hover:text-slate-200 cursor-pointer"
                                >
                                  {t.is_active !== false ? "Nonaktifkan" : "Aktifkan"}
                                </button>
                              </div>

                              <div className="flex items-center space-x-2">
                                {psdUrl && (
                                  <a
                                    href={psdUrl}
                                    download
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition"
                                    title="Download File PSD"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                )}
                                <button
                                  onClick={() => handleDeletePsdTemplate(t.id)}
                                  className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white transition cursor-pointer"
                                  title="Hapus Templat"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}


            {activeTab === "tasks" && (
              <div className="space-y-8">
                {/* Header & Description */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-slate-100 flex items-center gap-2">
                      <ListChecks className="h-6 w-6 text-accent-cyan" />
                      <span>Kelola Penugasan Kelompok</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Atur sumber Google Drive dan daftar tugas kelompok. Penambahan tugas berlaku otomatis untuk seluruh kelompok.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleSyncFolders}
                      disabled={syncingFolders}
                      className="px-4 py-2.5 rounded-xl bg-accent-purple/20 text-accent-purple border border-accent-purple/40 hover:bg-accent-purple/30 transition text-xs font-mono font-bold flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 ${syncingFolders ? "animate-spin" : ""}`} />
                      <span>{syncingFolders ? "Menyinkronkan..." : "Sinkronkan Folder Kelompok"}</span>
                    </button>
                    <Button variant="primary" size="sm" onClick={() => setShowAddTaskModal(true)}>
                      <Plus className="h-4 w-4 mr-1.5" />
                      <span>Tambah Tugas Kelompok Baru</span>
                    </Button>
                  </div>
                </div>

                {syncNotice && (
                  <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between">
                    <span>✓ {syncNotice}</span>
                    <button onClick={() => setSyncNotice(null)} className="text-slate-400 hover:text-white font-bold ml-4">✕</button>
                  </div>
                )}

                {/* Google Drive Parent Folder & Group Count Configuration */}
                <div className="glass rounded-2xl p-6 border border-accent-cyan/30 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-card-border/30 pb-3">
                    <h3 className="font-display font-bold text-sm text-accent-cyan uppercase tracking-wider flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      <span>Sumber Google Drive & Parameter Jumlah Peserta Kelompok</span>
                    </h3>
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2.5 py-0.5 rounded-full font-bold">
                      Dynamic Group Member Allocation
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Atur link Folder Google Drive Induk, jumlah kelompok, dan kuota anggota. Anda dapat menetapkan <strong>jumlah peserta yang berbeda untuk masing-masing kelompok</strong> (tidak harus sama rata).
                  </p>

                  <form onSubmit={handleSaveGdriveLink} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-6">
                        <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Link / ID Folder Induk Google Drive</label>
                        <input
                          type="text"
                          value={gdriveLink}
                          onChange={(e) => setGdriveLink(e.target.value)}
                          placeholder="https://drive.google.com/drive/folders/1abc... atau ID Folder"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-card-border text-slate-100 text-xs font-mono focus:border-accent-cyan focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Total Kelompok</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={targetTotalGroups}
                          onChange={(e) => setTargetTotalGroups(Math.max(1, parseInt(e.target.value) || 1))}
                          placeholder="20"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-card-border text-accent-cyan font-bold text-xs font-mono focus:border-accent-cyan focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Target Default / Standar</label>
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          value={targetMembersPerGroup}
                          onChange={(e) => setTargetMembersPerGroup(Math.max(1, parseInt(e.target.value) || 1))}
                          placeholder="10"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-card-border text-accent-purple font-bold text-xs font-mono focus:border-accent-purple focus:outline-none"
                        />
                        <span className="text-[9px] text-slate-500 mt-0.5 block">Fallback jika kelompok belum dikustom</span>
                      </div>
                    </div>

                    {/* ─────────────────────────────────────────────────────────────────────────────
                        PER-GROUP CUSTOM MEMBER COUNT & NAME MATRIX (Accordion & Custom Grid)
                        ───────────────────────────────────────────────────────────────────────────── */}
                    <div className="bg-slate-950/70 border border-card-border/60 rounded-2xl p-4 space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-2.5">
                          <UsersRound className="h-4 w-4 text-accent-purple" />
                          <div>
                            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                              Kustomisasi Nama & Kuota Anggota Per Kelompok
                            </h4>
                            <p className="text-[10px] text-slate-400">
                              Atur nama khusus dan jumlah anggota unik untuk setiap kelompok 1 s/d {targetTotalGroups}.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {/* Summary pill */}
                          {(() => {
                            let totalMembersSum = 0;
                            let customQuotaCount = 0;
                            let customNameCount = 0;
                            for (let i = 1; i <= targetTotalGroups; i++) {
                              const specific = groupMemberCounts[String(i)] ?? groupMemberCounts[`Kelompok ${i}`];
                              if (specific !== undefined) {
                                totalMembersSum += specific;
                                if (specific !== targetMembersPerGroup) customQuotaCount++;
                              } else {
                                totalMembersSum += targetMembersPerGroup;
                              }
                              const cName = groupNames[String(i)] || groupNames[`Kelompok ${i}`];
                              if (cName && cName.trim() && cName.trim() !== `Kelompok ${i}`) {
                                customNameCount++;
                              }
                            }
                            return (
                              <div className="flex items-center space-x-1.5">
                                <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2.5 py-1 rounded-lg font-bold">
                                  ∑ Total: {totalMembersSum} Peserta
                                </span>
                                {(customQuotaCount > 0 || customNameCount > 0) && (
                                  <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg font-bold">
                                    {customQuotaCount} Kuota / {customNameCount} Nama Kustom
                                  </span>
                                )}
                              </div>
                            );
                          })()}

                          <button
                            type="button"
                            onClick={() => setShowCustomGroupCounts(!showCustomGroupCounts)}
                            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono font-bold transition flex items-center space-x-1"
                          >
                            <span>{showCustomGroupCounts ? "Tutup Grid" : "Buka Grid Kelompok"}</span>
                            {showCustomGroupCounts ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>

                      {showCustomGroupCounts && (
                        <div className="space-y-3 pt-2 border-t border-card-border/40">
                          {/* Quick Toolbar */}
                          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
                            <div className="relative flex-1 max-w-xs">
                              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
                              <input
                                type="text"
                                value={groupSearchQuery}
                                onChange={(e) => setGroupSearchQuery(e.target.value)}
                                placeholder="Cari nomor / nama kelompok..."
                                className="w-full pl-8 pr-3 py-1.5 bg-black/60 border border-card-border rounded-lg text-xs text-slate-200 focus:border-accent-cyan outline-none"
                              />
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Reset semua nama kelompok ke standar default (Kelompok 1, Kelompok 2, dst)?`)) {
                                    setGroupNames({});
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-mono transition flex items-center space-x-1"
                              >
                                <RotateCcw className="h-3 w-3 text-amber-400" />
                                <span>Reset Nama ke Default</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Samakan seluruh ${targetTotalGroups} kelompok ke kuota default (${targetMembersPerGroup} orang)?`)) {
                                    const nextCounts: Record<string, number> = {};
                                    for (let i = 1; i <= targetTotalGroups; i++) {
                                      nextCounts[String(i)] = targetMembersPerGroup;
                                    }
                                    setGroupMemberCounts(nextCounts);
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-mono transition flex items-center space-x-1"
                              >
                                <RotateCcw className="h-3 w-3 text-cyan-400" />
                                <span>Setel Kuota Default ({targetMembersPerGroup})</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const nextCounts = { ...groupMemberCounts };
                                  for (let i = 1; i <= targetTotalGroups; i++) {
                                    const curr = nextCounts[String(i)] ?? targetMembersPerGroup;
                                    nextCounts[String(i)] = curr + 1;
                                  }
                                  setGroupMemberCounts(nextCounts);
                                }}
                                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono transition"
                                title="Tambah 1 peserta untuk semua kelompok"
                              >
                                +1 Semua
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const nextCounts = { ...groupMemberCounts };
                                  for (let i = 1; i <= targetTotalGroups; i++) {
                                    const curr = nextCounts[String(i)] ?? targetMembersPerGroup;
                                    nextCounts[String(i)] = Math.max(1, curr - 1);
                                  }
                                  setGroupMemberCounts(nextCounts);
                                }}
                                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono transition"
                                title="Kurangi 1 peserta untuk semua kelompok"
                              >
                                -1 Semua
                              </button>
                            </div>
                          </div>

                          {/* Groups Card Matrix */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto pr-1">
                            {Array.from({ length: targetTotalGroups }, (_, idx) => {
                              const groupNum = idx + 1;
                              const defaultGroupName = `Kelompok ${groupNum}`;
                              const customName = groupNames[String(groupNum)] || groupNames[defaultGroupName] || "";
                              const effectiveName = customName.trim() || defaultGroupName;
                              const currentQuota = groupMemberCounts[String(groupNum)] ?? groupMemberCounts[defaultGroupName] ?? targetMembersPerGroup;
                              const isCustomQuota = (groupMemberCounts[String(groupNum)] !== undefined && groupMemberCounts[String(groupNum)] !== targetMembersPerGroup) ||
                                (groupMemberCounts[defaultGroupName] !== undefined && groupMemberCounts[defaultGroupName] !== targetMembersPerGroup);
                              const isCustomName = !!customName.trim() && customName.trim() !== defaultGroupName;

                              if (groupSearchQuery) {
                                const q = groupSearchQuery.toLowerCase();
                                if (!defaultGroupName.toLowerCase().includes(q) &&
                                  !effectiveName.toLowerCase().includes(q) &&
                                  !String(groupNum).includes(q)) {
                                  return null;
                                }
                              }

                              return (
                                <div
                                  key={groupNum}
                                  className={`p-3 rounded-xl border transition-all flex flex-col justify-between space-y-2.5 ${isCustomName || isCustomQuota
                                    ? "bg-purple-950/20 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                                    }`}
                                >
                                  {/* Card Header */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-1.5">
                                      <span className="text-[10px] font-mono font-extrabold bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded border border-slate-700">
                                        #{groupNum < 10 ? `0${groupNum}` : groupNum}
                                      </span>
                                      {isCustomName && (
                                        <span className="text-[9px] font-mono text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded">
                                          Nama Kustom
                                        </span>
                                      )}
                                    </div>

                                    {(isCustomName || isCustomQuota) ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const nextCounts = { ...groupMemberCounts };
                                          delete nextCounts[String(groupNum)];
                                          delete nextCounts[defaultGroupName];
                                          setGroupMemberCounts(nextCounts);

                                          const nextNames = { ...groupNames };
                                          delete nextNames[String(groupNum)];
                                          delete nextNames[defaultGroupName];
                                          setGroupNames(nextNames);
                                        }}
                                        className="text-[9px] font-mono text-purple-400 hover:text-purple-200 bg-purple-500/20 px-1.5 py-0.5 rounded transition"
                                        title="Kembalikan nama & kuota kelompok ini ke default"
                                      >
                                        Reset ↺
                                      </button>
                                    ) : (
                                      <span className="text-[9px] font-mono text-slate-500">
                                        Default
                                      </span>
                                    )}
                                  </div>

                                  {/* Custom Name Input Field */}
                                  <div>
                                    <label className="block text-[9px] font-mono text-slate-400 uppercase mb-0.5">
                                      Nama Kelompok
                                    </label>
                                    <input
                                      type="text"
                                      value={customName}
                                      placeholder={defaultGroupName}
                                      onChange={(e) => {
                                        setGroupNames({
                                          ...groupNames,
                                          [String(groupNum)]: e.target.value
                                        });
                                      }}
                                      className="w-full px-2 py-1 bg-black/80 border border-slate-700 focus:border-accent-cyan rounded text-xs font-semibold text-slate-100 outline-none transition"
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
                                        <div className="text-[9px] font-mono text-cyan-400/90 mt-1 truncate" title={`Nama folder di Google Drive: ${previewFolder}`}>
                                          📁 {previewFolder}
                                        </div>
                                      );
                                    })()}
                                  </div>

                                  {/* Stepper Inputs for Quota */}
                                  <div>
                                    <div className="flex items-center justify-between mb-0.5">
                                      <label className="text-[9px] font-mono text-slate-400 uppercase">
                                        Kuota Peserta
                                      </label>
                                      <span className="text-[9px] font-mono text-accent-purple font-bold">
                                        {currentQuota} Peserta
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const next = { ...groupMemberCounts };
                                          next[String(groupNum)] = Math.max(1, currentQuota - 1);
                                          setGroupMemberCounts(next);
                                        }}
                                        className="h-7 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold transition"
                                      >
                                        -
                                      </button>

                                      <input
                                        type="number"
                                        min={1}
                                        max={500}
                                        value={currentQuota}
                                        onChange={(e) => {
                                          const parsed = Math.max(1, parseInt(e.target.value) || 1);
                                          const next = { ...groupMemberCounts };
                                          next[String(groupNum)] = parsed;
                                          setGroupMemberCounts(next);
                                        }}
                                        className="w-full h-7 px-1 bg-black/80 border border-slate-700 rounded-lg text-center text-xs font-mono font-bold text-cyan-300 focus:border-cyan-500 outline-none"
                                      />

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const next = { ...groupMemberCounts };
                                          next[String(groupNum)] = currentQuota + 1;
                                          setGroupMemberCounts(next);
                                        }}
                                        className="h-7 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold transition"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={savingGdrive}
                        className="px-5 py-2.5 rounded-xl bg-accent-cyan text-black font-extrabold text-xs hover:bg-accent-cyan/90 transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        <span>{savingGdrive ? "Menyimpan..." : "Simpan Pengaturan Kelompok & Kuota"}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Tasks List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-base text-slate-200">
                      Daftar Tugas Kelompok ({tasks.length})
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Urutan tampil: Berdasarkan Abjad Nama Tugas
                    </span>
                  </div>

                  {tasks.length === 0 ? (
                    <div className="glass rounded-2xl p-8 border border-card-border/40 text-center">
                      <p className="text-sm text-slate-400 font-sans">Belum ada tugas kelompok yang ditambahkan.</p>
                      <button
                        onClick={() => setShowAddTaskModal(true)}
                        className="mt-3 inline-flex items-center text-xs font-bold text-accent-cyan hover:underline cursor-pointer"
                      >
                        + Tambah Tugas Pertama Sekarang
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tasks.map((task, index) => (
                        <div
                          key={task.id}
                          className="glass rounded-2xl p-5 border border-card-border/40 flex flex-col justify-between hover:border-accent-cyan/40 transition"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] font-mono uppercase bg-slate-900 px-2.5 py-0.5 rounded-full border border-card-border/40 text-accent-purple font-bold">
                                #{index + 1} • Tugas Kelompok
                              </span>
                              <button
                                onClick={() => handleToggleTaskActive(task.id, task.is_active)}
                                className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border cursor-pointer ${task.is_active
                                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                                  : "bg-slate-800 text-slate-500 border-slate-700"
                                  }`}
                              >
                                {task.is_active ? "Aktif" : "Nonaktif"}
                              </button>
                            </div>

                            <h3 className="font-display font-bold text-base text-slate-100">{task.name}</h3>

                            <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                              <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                                Keyword Deteksi Nama File:
                              </span>
                              <code className="text-xs font-mono text-accent-cyan font-bold bg-accent-cyan/10 px-2 py-0.5 rounded border border-accent-cyan/20">
                                {task.keyword}
                              </code>
                            </div>
                          </div>

                          <div className="flex items-center justify-end space-x-2 border-t border-card-border/30 pt-3 mt-4">
                            <button
                              onClick={() => setEditingTask(task)}
                              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold hover:bg-rose-500 hover:text-white transition cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Individual Tasks List */}
                <div className="space-y-4 pt-6 border-t border-card-border/40">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <h3 className="font-display font-bold text-base text-accent-purple flex items-center gap-2">
                        <User className="h-5 w-5" />
                        <span>Daftar Penugasan Individu ({individuTaskDefs.length})</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Definisikan jenis tugas individu yang wajib dikumpulkan per anggota kelompok.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowAddIndividuModal(true)}>
                      <Plus className="h-4 w-4 mr-1.5 text-accent-purple" />
                      <span>Tambah Tugas Individu Baru</span>
                    </Button>
                  </div>

                  {individuTaskDefs.length === 0 ? (
                    <div className="glass rounded-2xl p-8 border border-card-border/40 text-center">
                      <p className="text-sm text-slate-400 font-sans">Belum ada tugas individu yang ditambahkan.</p>
                      <button
                        onClick={() => setShowAddIndividuModal(true)}
                        className="mt-3 inline-flex items-center text-xs font-bold text-accent-purple hover:underline cursor-pointer"
                      >
                        + Tambah Tugas Individu Pertama
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {individuTaskDefs.map((task, index) => (
                        <div
                          key={task.id}
                          className="glass rounded-2xl p-5 border border-accent-purple/30 flex flex-col justify-between hover:border-accent-purple/60 transition"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] font-mono uppercase bg-slate-900 px-2.5 py-0.5 rounded-full border border-accent-purple/30 text-accent-cyan font-bold">
                                #{index + 1} • Tugas Individu
                              </span>
                              <button
                                onClick={() => handleToggleIndividuTaskActive(task.id)}
                                className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border cursor-pointer ${task.is_active !== false
                                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                                  : "bg-slate-800 text-slate-500 border-slate-700"
                                  }`}
                              >
                                {task.is_active !== false ? "Aktif" : "Nonaktif"}
                              </button>
                            </div>

                            <h3 className="font-display font-bold text-base text-slate-100">{task.name}</h3>

                            <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                              <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                                Keyword Deteksi di Nama File:
                              </span>
                              <code className="text-xs font-mono text-accent-purple font-bold bg-accent-purple/10 px-2 py-0.5 rounded border border-accent-purple/20">
                                {task.keyword}
                              </code>
                            </div>
                          </div>

                          <div className="flex items-center justify-end space-x-2 border-t border-card-border/30 pt-3 mt-4">
                            <button
                              onClick={() => setEditingIndividuTask(task)}
                              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteIndividuTask(task.id)}
                              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold hover:bg-rose-500 hover:text-white transition cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {activeTab === "storyline" && (
              <div className="space-y-6">
                {/* Header & Global Controls */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-slate-100 flex items-center gap-2">
                      <Milestone className="h-6 w-6 text-cyan-400 animate-pulse" />
                      <span>Kelola Alur Kisah (Storyline Beranda)</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Atur narasi kronologis, foto Google Drive, deskripsi babak cerita, urutan, dan jumlah slot cerita di Beranda.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Toggle Section Active */}
                    <button
                      type="button"
                      onClick={() => setStorylineEnabled(!storylineEnabled)}
                      className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center space-x-1.5 cursor-pointer ${storylineEnabled
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        : "bg-rose-500/15 text-rose-300 border border-rose-500/40"
                        }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${storylineEnabled ? "bg-emerald-400 animate-ping" : "bg-rose-400"}`} />
                      <span>{storylineEnabled ? "SECTION AKTIF" : "SECTION NONAKTIF"}</span>
                    </button>

                    {/* Add Chapter Button */}
                    <Button
                      variant="galaxy"
                      size="sm"
                      onClick={() => {
                        const newSlots = [...storylineSlots];
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
                        setStorylineSlots(newSlots);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      <span>Tambah Chapter</span>
                    </Button>

                    {/* Save Button */}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSaveStoryline()}
                      disabled={savingStoryline}
                    >
                      <Save className="h-4 w-4 mr-1.5" />
                      <span>{savingStoryline ? "Menyimpan..." : "Simpan Storyline"}</span>
                    </Button>
                  </div>
                </div>

                {/* Success Notification Alert */}
                {storylineSuccessMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                  >
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <span>{storylineSuccessMsg}</span>
                    </div>
                    <button onClick={() => setStorylineSuccessMsg(null)} className="text-slate-400 hover:text-white">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}

                {/* Global Section Titles Card */}
                <div className="glass rounded-2xl p-6 border border-card-border/40 space-y-4">
                  <h3 className="font-display font-bold text-sm text-cyan-300 uppercase tracking-wider flex items-center space-x-2 border-b border-card-border/30 pb-2">
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                    <span>Judul & Narasi Pembuka Section Beranda</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                        Judul Utama Storyline
                      </label>
                      <input
                        type="text"
                        value={storylineTitle}
                        onChange={(e) => setStorylineTitle(e.target.value)}
                        placeholder="ALUR KISAH PENJELAJAHAN ORBIT"
                        className="w-full px-4 py-2 rounded-xl bg-slate-950/80 border border-card-border text-cyan-300 font-bold text-xs focus:border-cyan-500 focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                        Sub-judul / Deskripsi Pembuka
                      </label>
                      <input
                        type="text"
                        value={storylineSubtitle}
                        onChange={(e) => setStorylineSubtitle(e.target.value)}
                        placeholder="Rekam jejak kronologis dan narasi momentum penjelajahan..."
                        className="w-full px-4 py-2 rounded-xl bg-slate-950/80 border border-card-border text-slate-200 text-xs focus:border-cyan-500 focus:outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Chapters List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span className="font-bold text-slate-300">
                      DAFTAR BABAK CHRONICLES ({storylineSlots.length} BABAK TERDAFTAR)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Kembalikan alur cerita ke konfigurasi standar IMO 2026?")) {
                          setStorylineTitle("ALUR KISAH PENJELAJAHAN ORBIT");
                          setStorylineSubtitle("Rekam jejak kronologis dan narasi momentum penjelajahan Mahasiswa Baru IMO 2026 dari awal keberangkatan hingga puncak inovasi.");
                          setStorylineSlots([
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
                          ]);
                        }
                      }}
                      className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center space-x-1 transition"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset ke Default IMO 2026</span>
                    </button>
                  </div>

                  {storylineSlots.map((slot, index) => {
                    const stepStr = String(index + 1).padStart(2, "0");
                    const total = storylineSlots.length;

                    return (
                      <div
                        key={slot.id || index}
                        className="glass rounded-2xl p-5 border border-card-border/50 hover:border-accent-cyan/40 transition-all duration-300 space-y-4"
                      >
                        {/* Chapter Card Header */}
                        <div className="flex items-center justify-between border-b border-card-border/30 pb-3">
                          <div className="flex items-center space-x-2.5">
                            <span className="h-7 w-7 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center">
                              {stepStr}
                            </span>
                            <div>
                              <h4 className="text-sm font-display font-bold text-slate-100 uppercase tracking-wide">
                                {slot.title || `Chapter ${stepStr}`}
                              </h4>
                              <span className="text-[10px] font-mono text-slate-400">{slot.badge || `Chapter ${stepStr}`}</span>
                            </div>
                          </div>

                          {/* Action Toolbar */}
                          <div className="flex items-center space-x-1.5">
                            {/* Move Up */}
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => {
                                if (index === 0) return;
                                const updated = [...storylineSlots];
                                const temp = updated[index - 1];
                                updated[index - 1] = updated[index];
                                updated[index] = temp;
                                setStorylineSlots(updated);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                              title="Geser Naik (Sebelumnya)"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>

                            {/* Move Down */}
                            <button
                              type="button"
                              disabled={index === total - 1}
                              onClick={() => {
                                if (index === total - 1) return;
                                const updated = [...storylineSlots];
                                const temp = updated[index + 1];
                                updated[index + 1] = updated[index];
                                updated[index] = temp;
                                setStorylineSlots(updated);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                              title="Geser Turun (Berikutnya)"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>

                            {/* Duplicate */}
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...storylineSlots];
                                const cloned = {
                                  ...slot,
                                  id: `slot-${Date.now()}`,
                                  title: `${slot.title} (Salinan)`,
                                };
                                updated.splice(index + 1, 0, cloned);
                                setStorylineSlots(updated);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                              title="Duplikat Babak Ini"
                            >
                              <Copy className="h-4 w-4" />
                            </button>

                            {/* Delete */}
                            {total > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = storylineSlots.filter((_, i) => i !== index);
                                  setStorylineSlots(updated);
                                }}
                                className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                                title="Hapus Chapter"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Chapter Inputs and Live Preview Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                          {/* Form Inputs (Left & Middle) */}
                          <div className="lg:col-span-2 space-y-3 font-sans text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                                  Badge Tag / Babak
                                </label>
                                <input
                                  type="text"
                                  value={slot.badge || ""}
                                  onChange={(e) => {
                                    const updated = [...storylineSlots];
                                    updated[index] = { ...updated[index], badge: e.target.value };
                                    setStorylineSlots(updated);
                                  }}
                                  placeholder={`Chapter ${stepStr} // Inisiasi Orbit`}
                                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-card-border text-purple-300 font-mono text-xs focus:border-purple-500 focus:outline-none transition"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                                  Judul Babak Cerita
                                </label>
                                <input
                                  type="text"
                                  value={slot.title}
                                  onChange={(e) => {
                                    const updated = [...storylineSlots];
                                    updated[index] = { ...updated[index], title: e.target.value };
                                    setStorylineSlots(updated);
                                  }}
                                  placeholder="Pemberangkatan & Orientasi Perdana"
                                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-card-border text-slate-100 font-bold text-xs focus:border-cyan-500 focus:outline-none transition"
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-[10px] font-mono text-slate-400 uppercase">
                                  URL Foto Google Drive / Image
                                </label>
                                {slot.gdriveUrl && (
                                  <a
                                    href={slot.gdriveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-cyan-400 hover:underline flex items-center space-x-1"
                                  >
                                    <span>Buka Sumber</span>
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                              <input
                                type="text"
                                value={slot.gdriveUrl}
                                onChange={(e) => {
                                  const updated = [...storylineSlots];
                                  updated[index] = { ...updated[index], gdriveUrl: e.target.value };
                                  setStorylineSlots(updated);
                                }}
                                placeholder="https://drive.google.com/file/d/1abc.../view?usp=sharing"
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-card-border text-cyan-300 font-mono text-xs focus:border-cyan-500 focus:outline-none transition"
                              />
                              <p className="text-[10px] text-slate-500 mt-1">
                                Mendukung link sharing Google Drive (/file/d/ID/view), link preview, ID Drive, atau direct image URL. Diproteksi non-interaktif di Beranda publik.
                              </p>
                            </div>

                            <div>
                              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                                Narasi Kisah Lengkap
                              </label>
                              <textarea
                                rows={3}
                                value={slot.description}
                                onChange={(e) => {
                                  const updated = [...storylineSlots];
                                  updated[index] = { ...updated[index], description: e.target.value };
                                  setStorylineSlots(updated);
                                }}
                                placeholder="Tuliskan cerita lengkap momen perjalanan pada babak ini..."
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-card-border text-slate-200 text-xs focus:border-cyan-500 focus:outline-none transition leading-relaxed"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                                  Label Koordinat / Lokasi
                                </label>
                                <input
                                  type="text"
                                  value={slot.coordinateLabel || ""}
                                  onChange={(e) => {
                                    const updated = [...storylineSlots];
                                    updated[index] = { ...updated[index], coordinateLabel: e.target.value };
                                    setStorylineSlots(updated);
                                  }}
                                  placeholder={`KOORDINAT ALUR ${stepStr} - GEDUNG UTAMA`}
                                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950/80 border border-card-border text-slate-300 font-mono text-xs focus:border-cyan-500 focus:outline-none transition"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                                  Label Waktu / Tanggal
                                </label>
                                <input
                                  type="text"
                                  value={slot.dateTag || ""}
                                  onChange={(e) => {
                                    const updated = [...storylineSlots];
                                    updated[index] = { ...updated[index], dateTag: e.target.value };
                                    setStorylineSlots(updated);
                                  }}
                                  placeholder="Status: H-7 Fase Pengkondisian"
                                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950/80 border border-card-border text-slate-300 font-mono text-xs focus:border-cyan-500 focus:outline-none transition"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Live Thumbnail Preview (Right) */}
                          <div className="bg-slate-950/90 border border-card-border/60 rounded-2xl p-3.5 flex flex-col items-center justify-center space-y-2.5">
                            <div className="text-[10px] font-mono text-slate-400 font-bold uppercase flex items-center space-x-1.5 self-start">
                              <ImageIcon className="h-3.5 w-3.5 text-cyan-400" />
                              <span>LIVE PREVIEW FOTO</span>
                            </div>

                            <div className="relative w-full aspect-[16/10] rounded-xl bg-black overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
                              {slot.gdriveUrl ? (
                                <img
                                  src={
                                    slot.gdriveUrl.includes("drive.google.com")
                                      ? `https://lh3.googleusercontent.com/d/${(slot.gdriveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || slot.gdriveUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/) || [])[1] || ""}=w500`
                                      : slot.gdriveUrl
                                  }
                                  alt={slot.title}
                                  className="w-full h-full object-cover select-none pointer-events-none"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <span className="text-[10px] text-slate-600 font-mono">Belum ada URL</span>
                              )}
                            </div>

                            <div className="text-[10px] font-mono text-cyan-300/80 text-center truncate w-full">
                              {slot.badge || `Chapter ${stepStr}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Save Bar */}
                <div className="flex justify-end pt-4 border-t border-card-border/30">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleSaveStoryline()}
                    disabled={savingStoryline}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    <span>{savingStoryline ? "Menyimpan Alur Cerita..." : "Simpan Perubahan Storyline"}</span>
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-slate-100 flex items-center gap-2">
                      <Bell className="h-6 w-6 text-rose-500" />
                      <span>Pengaturan Notifikasi Push</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Atur format template pesan notifikasi untuk berbagai trigger yang akan dikirim ke pengguna.
                    </p>
                  </div>
                </div>

                <div className="glass rounded-2xl p-6 border border-rose-500/30">
                  <form onSubmit={handleSaveNotificationSettings} className="space-y-6">

                    {/* Tugas Baru Template */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-sm text-slate-200 border-b border-card-border/50 pb-2">Tugas Baru</h3>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Judul Notifikasi</label>
                          <input
                            type="text"
                            value={notifSettings.newTaskTemplate?.title || ""}
                            onChange={(e) => setNotifSettings({ ...notifSettings, newTaskTemplate: { ...notifSettings.newTaskTemplate, title: e.target.value } })}
                            className="w-full px-4 py-2 rounded-xl bg-slate-950/80 border border-card-border text-slate-100 text-xs font-mono focus:border-rose-500 focus:outline-none"
                            placeholder="Contoh: Tugas Baru: {taskName}"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">Variabel tersedia: <code className="text-rose-400">&#123;taskName&#125;</code></p>
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Isi Pesan Notifikasi</label>
                          <textarea
                            value={notifSettings.newTaskTemplate?.body || ""}
                            onChange={(e) => setNotifSettings({ ...notifSettings, newTaskTemplate: { ...notifSettings.newTaskTemplate, body: e.target.value } })}
                            className="w-full px-4 py-2 rounded-xl bg-slate-950/80 border border-card-border text-slate-100 text-xs font-mono focus:border-rose-500 focus:outline-none h-16"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Deadline Template */}
                    <div className="space-y-3 pt-4 border-t border-card-border/30">
                      <h3 className="font-bold text-sm text-slate-200 border-b border-card-border/50 pb-2">Peringatan Deadline</h3>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Judul Notifikasi</label>
                          <input
                            type="text"
                            value={notifSettings.deadlineTemplate?.title || ""}
                            onChange={(e) => setNotifSettings({ ...notifSettings, deadlineTemplate: { ...notifSettings.deadlineTemplate, title: e.target.value } })}
                            className="w-full px-4 py-2 rounded-xl bg-slate-950/80 border border-card-border text-slate-100 text-xs font-mono focus:border-rose-500 focus:outline-none"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">Variabel tersedia: <code className="text-rose-400">&#123;taskName&#125;</code></p>
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Isi Pesan Notifikasi</label>
                          <textarea
                            value={notifSettings.deadlineTemplate?.body || ""}
                            onChange={(e) => setNotifSettings({ ...notifSettings, deadlineTemplate: { ...notifSettings.deadlineTemplate, body: e.target.value } })}
                            className="w-full px-4 py-2 rounded-xl bg-slate-950/80 border border-card-border text-slate-100 text-xs font-mono focus:border-rose-500 focus:outline-none h-16"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Ingatkan H-Berapa Jam (Cron Schedule)</label>
                          <input
                            type="number"
                            min={1}
                            value={notifSettings.deadlineReminderHours || 24}
                            onChange={(e) => setNotifSettings({ ...notifSettings, deadlineReminderHours: parseInt(e.target.value) || 24 })}
                            className="w-full max-w-[200px] px-4 py-2 rounded-xl bg-slate-950/80 border border-card-border text-slate-100 text-xs font-mono focus:border-rose-500 focus:outline-none"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">Default 24 jam. Vercel cron akan mengecek tugas yang deadlinenya sesuai jam ini.</p>
                        </div>
                      </div>
                    </div>

                    {/* Pengumuman Template */}
                    <div className="space-y-3 pt-4 border-t border-card-border/30">
                      <h3 className="font-bold text-sm text-slate-200 border-b border-card-border/50 pb-2">Pengumuman Baru</h3>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Judul Notifikasi</label>
                          <input
                            type="text"
                            value={notifSettings.announcementTemplate?.title || ""}
                            onChange={(e) => setNotifSettings({ ...notifSettings, announcementTemplate: { ...notifSettings.announcementTemplate, title: e.target.value } })}
                            className="w-full px-4 py-2 rounded-xl bg-slate-950/80 border border-card-border text-slate-100 text-xs font-mono focus:border-rose-500 focus:outline-none"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">Variabel tersedia: <code className="text-rose-400">&#123;title&#125;</code></p>
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Isi Pesan Notifikasi</label>
                          <textarea
                            value={notifSettings.announcementTemplate?.body || ""}
                            onChange={(e) => setNotifSettings({ ...notifSettings, announcementTemplate: { ...notifSettings.announcementTemplate, body: e.target.value } })}
                            className="w-full px-4 py-2 rounded-xl bg-slate-950/80 border border-card-border text-slate-100 text-xs font-mono focus:border-rose-500 focus:outline-none h-16"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tautan Menu Template */}
                    <div className="space-y-3 pt-4 border-t border-card-border/30">
                      <h3 className="font-bold text-sm text-slate-200 border-b border-card-border/50 pb-2">Tautan Menu / Linktree Baru</h3>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Judul Notifikasi</label>
                          <input
                            type="text"
                            value={notifSettings.linktreeTemplate?.title || ""}
                            onChange={(e) => setNotifSettings({ ...notifSettings, linktreeTemplate: { ...notifSettings.linktreeTemplate, title: e.target.value } })}
                            className="w-full px-4 py-2 rounded-xl bg-slate-950/80 border border-card-border text-slate-100 text-xs font-mono focus:border-rose-500 focus:outline-none"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">Variabel tersedia: <code className="text-rose-400">&#123;label&#125;</code></p>
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Isi Pesan Notifikasi</label>
                          <textarea
                            value={notifSettings.linktreeTemplate?.body || ""}
                            onChange={(e) => setNotifSettings({ ...notifSettings, linktreeTemplate: { ...notifSettings.linktreeTemplate, body: e.target.value } })}
                            className="w-full px-4 py-2 rounded-xl bg-slate-950/80 border border-card-border text-slate-100 text-xs font-mono focus:border-rose-500 focus:outline-none h-16"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-card-border/30">
                      <button
                        type="submit"
                        disabled={savingNotif}
                        className="px-5 py-2.5 rounded-xl bg-rose-500 text-white font-extrabold text-xs hover:bg-rose-600 transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        <span>{savingNotif ? "Menyimpan..." : "Simpan Konfigurasi Notifikasi"}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Custom Push Broadcast Form */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pt-6 border-t border-card-border/30 mt-6">
                  <div>
                    <h2 className="font-display font-black text-xl text-slate-100 flex items-center gap-2">
                      <Megaphone className="h-6 w-6 text-amber-500" />
                      <span>Kirim Broadcast Custom (Manual)</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Kirim notifikasi push langsung ke semua pengguna secara instan tanpa mengaitkan ke fitur tertentu.
                    </p>
                  </div>
                </div>

                <div className="glass rounded-2xl p-6 border border-amber-500/40 mt-4">
                  <form onSubmit={handleSendCustomPush} className="space-y-4 font-sans text-xs">
                    <div>
                      <label className="block text-slate-400 uppercase font-mono mb-1">Judul Notifikasi</label>
                      <input
                        type="text"
                        required
                        value={customPush.title}
                        onChange={(e) => setCustomPush({ ...customPush, title: e.target.value })}
                        placeholder="Contoh: Info Mendadak dari Panitia!"
                        className="w-full px-4 py-2 rounded-xl bg-slate-950/80 border border-card-border text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 uppercase font-mono mb-1">Isi Pesan Notifikasi</label>
                      <textarea
                        required
                        value={customPush.body}
                        onChange={(e) => setCustomPush({ ...customPush, body: e.target.value })}
                        placeholder="Isi pemberitahuan..."
                        className="w-full px-4 py-2 rounded-xl bg-slate-950/80 border border-card-border text-slate-100 font-mono focus:border-amber-500 focus:outline-none h-20"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 uppercase font-mono mb-1">Target URL Saat Diklik</label>
                      <input
                        type="text"
                        required
                        value={customPush.url}
                        onChange={(e) => setCustomPush({ ...customPush, url: e.target.value })}
                        placeholder="/info atau https://..."
                        className="w-full px-4 py-2 rounded-xl bg-slate-950/80 border border-card-border text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end pt-4 border-t border-card-border/30">
                      <button
                        type="submit"
                        disabled={sendingCustomPush}
                        className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Megaphone className="h-4 w-4" />
                        <span>{sendingCustomPush ? "Mengirim..." : "Kirim Broadcast Sekarang"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {showAddLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass rounded-2xl p-6 border border-accent-cyan/40 max-w-md w-full">
            <h3 className="font-display font-bold text-lg text-slate-100 mb-4">Tambah Tautan Grid Menu Baru</h3>
            <form onSubmit={handleCreateLink} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">Judul Tautan (Label)</label>
                <input
                  type="text"
                  required
                  value={newLink.label}
                  onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                  placeholder="Buku Panduan IMO 2026"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">URL Tujuan</label>
                <input
                  type="text"
                  required
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  placeholder="https://drive.google.com/... atau /id-card"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase font-mono mb-1">Kategori</label>
                  <select
                    value={newLink.category}
                    onChange={(e) => setNewLink({ ...newLink, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-xs"
                  >
                    <option value="Panduan & Berkas">Panduan & Berkas</option>
                    <option value="Generator & Tools">Generator & Tools</option>
                    <option value="Media & Komunikasi">Media & Komunikasi</option>
                    <option value="Pengumpulan Tugas">Pengumpulan Tugas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase font-mono mb-1">Ikon Key</label>
                  <select
                    value={newLink.icon_key}
                    onChange={(e) => setNewLink({ ...newLink, icon_key: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-xs"
                  >
                    <option value="book">Book (Buku)</option>
                    <option value="qrcode">QR Code</option>
                    <option value="folder">Folder / File</option>
                    <option value="users">Users / Kontak</option>
                    <option value="telegram">Telegram</option>
                    <option value="instagram">Instagram</option>
                    <option value="sparkles">Sparkles / Twibbon</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">Deskripsi Singkat</label>
                <textarea
                  value={newLink.description}
                  onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                  placeholder="Jelaskan isi atau fungsi tautan ini secara singkat..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-xs h-20"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddLinkModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs"
                >
                  Batal
                </button>
                <Button variant="primary" size="sm" type="submit">
                  Simpan Tautan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass rounded-2xl p-6 border border-accent-purple/40 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-bold text-lg text-slate-100 mb-4">Tambah Kontak Baru</h3>
            <form onSubmit={handleCreateContact} className="space-y-4 text-xs font-sans">
              {/* Profile Picture Upload with circular preview matching /contact */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950/70 border border-card-border/50">
                <div className="relative h-24 w-24 rounded-full overflow-hidden mb-3 p-1 bg-gradient-to-b from-white/30 via-white/10 to-white/5 shadow-[0_8px_25px_rgba(0,0,0,0.4)] ring-1 ring-white/20">
                  {newContact.photo_url ? (
                    <img
                      src={newContact.photo_url}
                      alt="Foto Kontak"
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900 rounded-full text-slate-500">
                      <Camera className="w-6 h-6 mb-1 text-slate-400" />
                      <span className="font-mono text-[9px] uppercase tracking-wider">Astro</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="px-3.5 py-1.5 rounded-xl bg-accent-cyan/15 hover:bg-accent-cyan/25 border border-accent-cyan/40 text-accent-cyan text-xs font-bold font-mono uppercase tracking-wider cursor-pointer transition flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{newContact.photo_url ? "Ganti Foto" : "Unggah & Pangkas Foto"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setSelectedContactCropFile(f);
                          setContactCropTarget("new");
                          setIsContactCropperOpen(true);
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {newContact.photo_url && (
                    <button
                      type="button"
                      onClick={() => setNewContact({ ...newContact, photo_url: "" })}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-mono transition"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-mono text-center">
                  Foto akan otomatis di-crop 1:1, di-rescale & disimpan di Cloudflare R2 secara server-side.
                </p>
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">Nama Lengkap Kontak</label>
                <input
                  type="text"
                  required
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="Xaviera Putri"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase font-mono mb-1">Peran / Role</label>
                  <input
                    type="text"
                    required
                    value={newContact.role}
                    onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                    placeholder="e.g. LO, Koor, Panitia"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase font-mono mb-1">Kelompok</label>
                  <select
                    value={newContact.group_name}
                    onChange={(e) => setNewContact({ ...newContact, group_name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-xs"
                  >
                    <option value="None">Panitia (Bukan LO)</option>
                    {[...Array(targetTotalGroups || 20)].map((_, i) => {
                      const num = i + 1;
                      const rawGroup = `Kelompok ${num}`;
                      const custom = (groupNames[String(num)] || "").trim();
                      const label = custom ? `${custom} (${rawGroup})` : rawGroup;
                      return (
                        <option key={num} value={rawGroup}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">Nomor WhatsApp</label>
                <input
                  type="text"
                  required
                  value={newContact.whatsapp}
                  onChange={(e) => setNewContact({ ...newContact, whatsapp: e.target.value })}
                  placeholder="6281234567890"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">Username Instagram (Opsional)</label>
                <input
                  type="text"
                  value={newContact.instagram}
                  onChange={(e) => setNewContact({ ...newContact, instagram: e.target.value })}
                  placeholder="ahmad_imo2026"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase font-mono mb-1">Teks Tombol WA (Opsional)</label>
                  <input
                    type="text"
                    value={newContact.button_text || ""}
                    onChange={(e) => setNewContact({ ...newContact, button_text: e.target.value })}
                    placeholder='Default: "WhatsApp"'
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase font-mono mb-1">Teks Tombol IG (Opsional)</label>
                  <input
                    type="text"
                    value={newContact.ig_button_text || ""}
                    onChange={(e) => setNewContact({ ...newContact, ig_button_text: e.target.value })}
                    placeholder='Default: "@username"'
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-xs"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-mono -mt-1">
                Bebas kustom kata-kata tombol WA & IG. Kosongkan jika ingin memakai teks default.
              </p>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddContactModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs"
                >
                  Batal
                </button>
                <Button variant="primary" size="sm" type="submit">
                  Simpan Kontak
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditContactModal && editingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass rounded-2xl p-6 border border-accent-cyan/40 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-bold text-lg text-slate-100 mb-4">Edit Kontak</h3>
            <form onSubmit={handleUpdateContact} className="space-y-4 text-xs font-sans">
              {/* Profile Picture Upload with circular preview matching /contact */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950/70 border border-card-border/50">
                <div className="relative h-24 w-24 rounded-full overflow-hidden mb-3 p-1 bg-gradient-to-b from-white/30 via-white/10 to-white/5 shadow-[0_8px_25px_rgba(0,0,0,0.4)] ring-1 ring-white/20">
                  {editingContact.photo_url ? (
                    <img
                      src={editingContact.photo_url}
                      alt="Foto Kontak"
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900 rounded-full text-slate-500">
                      <Camera className="w-6 h-6 mb-1 text-slate-400" />
                      <span className="font-mono text-[9px] uppercase tracking-wider">Astro</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="px-3.5 py-1.5 rounded-xl bg-accent-cyan/15 hover:bg-accent-cyan/25 border border-accent-cyan/40 text-accent-cyan text-xs font-bold font-mono uppercase tracking-wider cursor-pointer transition flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{editingContact.photo_url ? "Ganti Foto" : "Unggah & Pangkas Foto"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setSelectedContactCropFile(f);
                          setContactCropTarget("edit");
                          setIsContactCropperOpen(true);
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {editingContact.photo_url && (
                    <button
                      type="button"
                      onClick={() => setEditingContact({ ...editingContact, photo_url: "" })}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-mono transition"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-mono text-center">
                  Foto akan otomatis di-crop 1:1, di-rescale & disimpan di Cloudflare R2 secara server-side.
                </p>
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">Nama Lengkap Kontak</label>
                <input
                  type="text"
                  required
                  value={editingContact.name}
                  onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                  placeholder="Xaviera Putri"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase font-mono mb-1">Peran / Role</label>
                  <input
                    type="text"
                    required
                    value={editingContact.role}
                    onChange={(e) => setEditingContact({ ...editingContact, role: e.target.value })}
                    placeholder="e.g. LO, Koor, Panitia"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase font-mono mb-1">Kelompok</label>
                  <select
                    value={editingContact.group_name}
                    onChange={(e) => setEditingContact({ ...editingContact, group_name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-xs"
                  >
                    <option value="None">Panitia (Bukan LO)</option>
                    {[...Array(targetTotalGroups || 20)].map((_, i) => {
                      const num = i + 1;
                      const rawGroup = `Kelompok ${num}`;
                      const custom = (groupNames[String(num)] || "").trim();
                      const label = custom ? `${custom} (${rawGroup})` : rawGroup;
                      return (
                        <option key={num} value={rawGroup}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">Nomor WhatsApp</label>
                <input
                  type="text"
                  required
                  value={editingContact.whatsapp}
                  onChange={(e) => setEditingContact({ ...editingContact, whatsapp: e.target.value })}
                  placeholder="6281234567890"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">Username Instagram (Opsional)</label>
                <input
                  type="text"
                  value={editingContact.instagram || ""}
                  onChange={(e) => setEditingContact({ ...editingContact, instagram: e.target.value })}
                  placeholder="ahmad_imo2026"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase font-mono mb-1">Teks Tombol WA (Opsional)</label>
                  <input
                    type="text"
                    value={editingContact.button_text || ""}
                    onChange={(e) => setEditingContact({ ...editingContact, button_text: e.target.value })}
                    placeholder='Default: "WhatsApp"'
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase font-mono mb-1">Teks Tombol IG (Opsional)</label>
                  <input
                    type="text"
                    value={editingContact.ig_button_text || ""}
                    onChange={(e) => setEditingContact({ ...editingContact, ig_button_text: e.target.value })}
                    placeholder='Default: "@username"'
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-xs"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-mono -mt-1">
                Bebas kustom kata-kata tombol WA & IG. Kosongkan jika ingin memakai teks default.
              </p>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditContactModal(false);
                    setEditingContact(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs"
                >
                  Batal
                </button>
                <Button variant="primary" size="sm" type="submit">
                  Perbarui Kontak
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddAnnoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass rounded-2xl p-6 border border-accent-yellow/40 max-w-lg w-full">
            <h3 className="font-display font-bold text-lg text-slate-100 mb-4">Buat Artikel & Dokumen Embed Baru</h3>
            <form onSubmit={handleCreateAnno} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">Judul Artikel / Informasi</label>
                <input
                  type="text"
                  required
                  value={newAnno.title}
                  onChange={(e) => setNewAnno({ ...newAnno, title: e.target.value })}
                  placeholder="Contoh: Pembagian Gesang & Kendaraan Keberangkatan"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase font-mono mb-1">Kategori</label>
                  <select
                    value={newAnno.category}
                    onChange={(e) => setNewAnno({ ...newAnno, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-xs"
                  >
                    <option value="Contoh Surat">Contoh Surat / Dokumen</option>
                    <option value="Pembagian Gesang">Pembagian Gesang (Kendaraan)</option>
                    <option value="Jadwal Acara">Jadwal Acara</option>
                    <option value="Perlengkapan">Perlengkapan Wajib</option>
                    <option value="Video">Video</option>
                    <option value="PENTING">Pengumuman Penting</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 cursor-pointer text-slate-300 font-mono text-xs">
                    <input
                      type="checkbox"
                      checked={newAnno.pinned}
                      onChange={(e) => setNewAnno({ ...newAnno, pinned: e.target.checked })}
                      className="rounded bg-slate-950 border-card-border text-accent-yellow focus:ring-0 h-4 w-4"
                    />
                    <span>Sematkan (Pin Highlight)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">Link Embed Google Drive / Dokumen (Opsional)</label>
                <input
                  type="text"
                  value={newAnno.gdrive_url}
                  onChange={(e) => setNewAnno({ ...newAnno, gdrive_url: e.target.value })}
                  placeholder="https://docs.google.com/... atau https://drive.google.com/file/d/..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-accent-cyan text-xs font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">Dukungan embed: Google Docs, Google Sheets, Google Slides, Google Form, PDF, atau File Drive.</p>
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">Tautan Tombol Autoform Generator (Opsional)</label>
                <input
                  type="text"
                  value={newAnno.autoform_url}
                  onChange={(e) => setNewAnno({ ...newAnno, autoform_url: e.target.value })}
                  placeholder="/documents atau /documents/uuid-template"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-accent-purple text-xs font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">Isi dengan Rute Autoform (misal: /documents) untuk memunculkan tombol langsung ke pengisian dokumen.</p>
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">Catatan Samping & Highlight Penting</label>
                <textarea
                  required
                  value={newAnno.notes}
                  onChange={(e) => setNewAnno({ ...newAnno, notes: e.target.value })}
                  placeholder="Tuliskan poin-poin ringkasan/catatan penting yang akan tampil di samping dokumen embed..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-xs h-28 leading-relaxed"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAnnoModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs"
                >
                  Batal
                </button>
                <Button variant="primary" size="sm" type="submit">
                  Publikasikan Artikel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingAnno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass rounded-2xl p-6 border border-accent-cyan/40 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-slate-100 flex items-center space-x-2">
                <Edit2 className="h-5 w-5 text-accent-cyan" />
                <span>Edit Artikel & Pengumuman</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                🔔 Notifikasi akan dikirim ulang
              </span>
            </div>

            <form onSubmit={handleUpdateAnno} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">Judul Artikel / Informasi</label>
                <input
                  type="text"
                  required
                  value={editingAnno.title}
                  onChange={(e) => setEditingAnno({ ...editingAnno, title: e.target.value })}
                  placeholder="Judul Pengumuman"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase font-mono mb-1">Kategori</label>
                  <select
                    value={editingAnno.category}
                    onChange={(e) => setEditingAnno({ ...editingAnno, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-xs"
                  >
                    <option value="Contoh Surat">Contoh Surat / Dokumen</option>
                    <option value="Pembagian Gesang">Pembagian Gesang (Kendaraan)</option>
                    <option value="Jadwal Acara">Jadwal Acara</option>
                    <option value="Perlengkapan">Perlengkapan Wajib</option>
                    <option value="Video">Video</option>
                    <option value="PENTING">Pengumuman Penting</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 cursor-pointer text-slate-300 font-mono text-xs">
                    <input
                      type="checkbox"
                      checked={editingAnno.pinned}
                      onChange={(e) => setEditingAnno({ ...editingAnno, pinned: e.target.checked })}
                      className="rounded bg-slate-950 border-card-border text-accent-yellow focus:ring-0 h-4 w-4"
                    />
                    <span>Sematkan (Pin Highlight)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">Link Embed Google Drive / Dokumen (Opsional)</label>
                <input
                  type="text"
                  value={editingAnno.gdrive_url}
                  onChange={(e) => setEditingAnno({ ...editingAnno, gdrive_url: e.target.value })}
                  placeholder="https://docs.google.com/... atau https://drive.google.com/file/d/..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-accent-cyan text-xs font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">Dukungan embed: Google Docs, Google Sheets, Google Slides, Google Form, PDF, File Drive, atau YouTube.</p>
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">Tautan Tombol Autoform Generator (Opsional)</label>
                <input
                  type="text"
                  value={editingAnno.autoform_url}
                  onChange={(e) => setEditingAnno({ ...editingAnno, autoform_url: e.target.value })}
                  placeholder="/documents atau /documents/uuid-template"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-accent-purple text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">Catatan Samping & Highlight Penting</label>
                <textarea
                  required
                  value={editingAnno.notes}
                  onChange={(e) => setEditingAnno({ ...editingAnno, notes: e.target.value })}
                  placeholder="Tuliskan poin-poin ringkasan/catatan penting..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-xs h-28 leading-relaxed"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAnno(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs cursor-pointer"
                >
                  Batal
                </button>
                <Button variant="primary" size="sm" type="submit">
                  Simpan & Kirim Notif Ulang
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass rounded-2xl p-6 border border-accent-cyan/40 max-w-md w-full">
            <h3 className="font-display font-bold text-lg text-slate-100 mb-4">Tambah Tugas Kelompok Baru</h3>
            <form onSubmit={handleCreateTask} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">Nama Tugas</label>
                <input
                  type="text"
                  required
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  placeholder="Contoh: Video Yel-Yel Kelompok"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">Keyword Deteksi Nama File</label>
                <input
                  type="text"
                  required
                  value={newTask.keyword}
                  onChange={(e) => setNewTask({ ...newTask, keyword: e.target.value })}
                  placeholder="Contoh: yel-yel"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-accent-cyan text-sm font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Sistem akan menganggap tugas selesai jika ada file di folder kelompok yang mengandung kata ini (case-insensitive).
                </p>
              </div>

              <div className="flex items-center pt-2">
                <label className="flex items-center space-x-2 cursor-pointer text-slate-300 font-mono text-xs">
                  <input
                    type="checkbox"
                    checked={newTask.is_active}
                    onChange={(e) => setNewTask({ ...newTask, is_active: e.target.checked })}
                    className="rounded bg-slate-950 border-card-border text-accent-cyan focus:ring-0 h-4 w-4"
                  />
                  <span>Tugas Langsung Aktif</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs cursor-pointer"
                >
                  Batal
                </button>
                <Button variant="primary" size="sm" type="submit" disabled={syncingFolders}>
                  {syncingFolders ? "Menyimpan & Membuat Folder..." : "Simpan Tugas & Buat Folder"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass rounded-2xl p-6 border border-accent-purple/40 max-w-md w-full">
            <h3 className="font-display font-bold text-lg text-slate-100 mb-4">Edit Tugas Kelompok</h3>
            <form onSubmit={handleUpdateTask} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">Nama Tugas</label>
                <input
                  type="text"
                  required
                  value={editingTask.name}
                  onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">Keyword Deteksi Nama File</label>
                <input
                  type="text"
                  required
                  value={editingTask.keyword}
                  onChange={(e) => setEditingTask({ ...editingTask, keyword: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-accent-cyan text-sm font-mono"
                />
              </div>

              <div className="flex items-center pt-2">
                <label className="flex items-center space-x-2 cursor-pointer text-slate-300 font-mono text-xs">
                  <input
                    type="checkbox"
                    checked={editingTask.is_active}
                    onChange={(e) => setEditingTask({ ...editingTask, is_active: e.target.checked })}
                    className="rounded bg-slate-950 border-card-border text-accent-purple focus:ring-0 h-4 w-4"
                  />
                  <span>Tugas Aktif</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs cursor-pointer"
                >
                  Batal
                </button>
                <Button variant="primary" size="sm" type="submit">
                  Perbarui Tugas
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddIndividuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass rounded-2xl p-6 border border-accent-purple/40 max-w-md w-full">
            <h3 className="font-display font-bold text-lg text-slate-100 mb-4">Tambah Tugas Individu Baru</h3>
            <form onSubmit={handleCreateIndividuTask} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">Nama Tugas Individu</label>
                <input
                  type="text"
                  required
                  value={newIndividuTask.name}
                  onChange={(e) => setNewIndividuTask({ ...newIndividuTask, name: e.target.value })}
                  placeholder="Contoh: Jurnal Harian & Resume"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">Keyword Deteksi Nama File</label>
                <input
                  type="text"
                  required
                  value={newIndividuTask.keyword}
                  onChange={(e) => setNewIndividuTask({ ...newIndividuTask, keyword: e.target.value })}
                  placeholder="Contoh: jurnal"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-accent-purple text-sm font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Sistem akan menganggap tugas individu selesai jika berkas milik anggota mengandung kata ini.
                </p>
              </div>

              <div className="flex items-center pt-2">
                <label className="flex items-center space-x-2 cursor-pointer text-slate-300 font-mono text-xs">
                  <input
                    type="checkbox"
                    checked={newIndividuTask.is_active}
                    onChange={(e) => setNewIndividuTask({ ...newIndividuTask, is_active: e.target.checked })}
                    className="rounded bg-slate-950 border-card-border text-accent-purple focus:ring-0 h-4 w-4"
                  />
                  <span>Tugas Langsung Aktif</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddIndividuModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs cursor-pointer"
                >
                  Batal
                </button>
                <Button variant="primary" size="sm" type="submit">
                  Simpan Tugas Individu
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingIndividuTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass rounded-2xl p-6 border border-accent-purple/40 max-w-md w-full">
            <h3 className="font-display font-bold text-lg text-slate-100 mb-4">Edit Tugas Individu</h3>
            <form onSubmit={handleUpdateIndividuTask} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">Nama Tugas Individu</label>
                <input
                  type="text"
                  required
                  value={editingIndividuTask.name}
                  onChange={(e) => setEditingIndividuTask({ ...editingIndividuTask, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">Keyword Deteksi Nama File</label>
                <input
                  type="text"
                  required
                  value={editingIndividuTask.keyword}
                  onChange={(e) => setEditingIndividuTask({ ...editingIndividuTask, keyword: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-accent-purple text-sm font-mono"
                />
              </div>

              <div className="flex items-center pt-2">
                <label className="flex items-center space-x-2 cursor-pointer text-slate-300 font-mono text-xs">
                  <input
                    type="checkbox"
                    checked={editingIndividuTask.is_active !== false}
                    onChange={(e) => setEditingIndividuTask({ ...editingIndividuTask, is_active: e.target.checked })}
                    className="rounded bg-slate-950 border-card-border text-accent-purple focus:ring-0 h-4 w-4"
                  />
                  <span>Tugas Aktif</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingIndividuTask(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs cursor-pointer"
                >
                  Batal
                </button>
                <Button variant="primary" size="sm" type="submit">
                  Perbarui Tugas Individu
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact Photo Cropper Modal (Server-Side Processing) */}
      <ContactPhotoCropperModal
        isOpen={isContactCropperOpen}
        file={selectedContactCropFile}
        onClose={() => {
          setIsContactCropperOpen(false);
          setSelectedContactCropFile(null);
        }}
        onSuccess={(uploadedUrl) => {
          if (contactCropTarget === "new") {
            setNewContact((prev) => ({ ...prev, photo_url: uploadedUrl }));
          } else if (editingContact) {
            setEditingContact((prev: any) => ({ ...prev, photo_url: uploadedUrl }));
          }
        }}
      />
    </div>
  );
}
