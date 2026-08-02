"use client";

import React, { useState, useEffect } from "react";
import StarfieldBackground from "@/components/StarfieldBackground";
import Card from "@/components/Card";
import Button from "@/components/Button";
import ImoLogo from "@/components/ImoLogo";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { DEFAULT_ID_CARD_TEMPLATE } from "@/lib/defaultTemplate";

type ActiveTab = "links" | "contacts" | "announcements" | "templates" | "tasks";

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
  const [gdriveLink, setGdriveLink] = useState<string>("");
  const [targetTotalGroups, setTargetTotalGroups] = useState<number>(20);
  const [targetMembersPerGroup, setTargetMembersPerGroup] = useState<number>(10);
  const [savingGdrive, setSavingGdrive] = useState<boolean>(false);
  const [syncingFolders, setSyncingFolders] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

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
  const [newContact, setNewContact] = useState({
    name: "",
    role: "LO",
    group_name: "Kelompok 1",
    whatsapp: "",
    instagram: "",
  });

  const [showAddAnnoModal, setShowAddAnnoModal] = useState(false);
  const [newAnno, setNewAnno] = useState({
    title: "",
    notes: "",
    gdrive_url: "",
    autoform_url: "/documents",
    category: "Contoh Surat",
    pinned: false,
  });

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
      nama: "Budi Santoso",
      nim: "2026010042",
      kelompok: "Kelompok 1",
      jurusan: "Informatika / STEI",
      peran: "Peserta Resmi",
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
      } catch (e) {}
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

      const { data: settingData } = await supabase.from("system_settings").select("key, value").in("key", ["gdrive_parent_folder", "total_groups_count", "target_members_per_group", "task_definitions_individu"]);
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
        const individuSetting = settingData.find((s: any) => s.key === "task_definitions_individu");
        if (individuSetting && individuSetting.value) {
          try {
            const parsed = JSON.parse(individuSetting.value);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setIndividuTaskDefs(parsed);
            }
          } catch {}
        }
      }

    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setLoading(false);
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
          description: "Target Jumlah Anggota Per Kelompok untuk Tugas Individu",
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
      const { error } = await supabase.from("contact_persons").insert([newContact]);
      if (error) throw error;
      setShowAddContactModal(false);
      setNewContact({ name: "", role: "LO", group_name: "Kelompok 1", whatsapp: "", instagram: "" });
      loadData();
    } catch (err: any) {
      alert("Gagal menambahkan kontak: " + err.message);
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

      const { error } = await supabase.from("announcements").insert([{
        title: newAnno.title,
        content: contentPayload,
        category: newAnno.category,
        pinned: newAnno.pinned,
      }]);

      if (error) throw error;
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

      const data = await res.json();
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
      const data = await res.json();
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
      const data = await res.json();
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
      const data = await res.json();
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
        <div className="flex flex-wrap gap-3 mb-8 border-b border-card-border/30 pb-4 items-center justify-between">
          <div className="flex flex-wrap gap-3">
            {[
              { id: "links", label: "Grid Menu Links (/hub)", icon: Layers, count: links.length },
              { id: "contacts", label: "Kontak LO (/contact)", icon: Users, count: contacts.length },
              { id: "announcements", label: "Pengumuman Misi", icon: Megaphone, count: announcements.length },
              { id: "templates", label: "Template ID Card", icon: CreditCard, count: templates.length },
              { id: "tasks", label: "Penugasan Kelompok", icon: ListChecks, count: tasks.length },
            ].map((t) => {
              const Icon = t.icon;
              const isCurrent = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as ActiveTab)}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition duration-300 cursor-pointer ${
                    isCurrent
                      ? "bg-accent-cyan text-black font-extrabold shadow-[0_0_20px_rgba(125,249,255,0.35)]"
                      : "bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-card-border/40"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{t.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${isCurrent ? "bg-black/30 text-black" : "bg-slate-800 text-slate-400"}`}>
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-2">
            <a
              href="/admin/settings"
              className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-mono font-bold bg-accent-purple/20 text-accent-purple border border-accent-purple/40 hover:bg-accent-purple hover:text-black transition duration-300 shadow-[0_0_15px_rgba(179,136,255,0.3)]"
            >
              <Sparkles className="h-4 w-4" />
              <span>Pengaturan Web & Push Notif</span>
            </a>

            <a
              href="/admin/document-templates"
              className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-mono font-bold bg-slate-900 border border-white/10 text-slate-300 hover:text-accent-cyan transition"
            >
              <FileCode2 className="h-4 w-4 text-accent-cyan" />
              <span>Auto-Form Generator</span>
            </a>
          </div>
        </div>

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
                        className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border cursor-pointer ${
                          link.is_active
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                            : "bg-slate-800 text-slate-500 border-slate-700"
                        }`}
                      >
                        {link.is_active ? "Aktif" : "Nonaktif"}
                      </button>
                    </div>

                    <h3 className="font-display font-bold text-base text-slate-100">{link.label}</h3>
                    <p className="text-xs text-slate-400 font-sans mt-1 line-clamp-2">{link.description || "Tidak ada deskripsi."}</p>
                    <a href={link.url} target="_blank" rel="noreferrer" className="text-[11px] text-accent-cyan font-mono hover:underline mt-2 inline-flex items-center space-x-1">
                      <span>{link.url}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4 mt-4 border-t border-card-border/20">
                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white transition cursor-pointer"
                      title="Hapus Link"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "contacts" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="font-display font-black text-xl text-slate-100">Kelola Kontak LO (/contact)</h2>
                <p className="text-xs text-slate-400">Daftar Liaison Officer & Pendamping kelompok yang tampil di halaman kontak.</p>
              </div>
              <Button variant="primary" size="sm" onClick={() => setShowAddContactModal(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                <span>Tambah Kontak LO</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map((c) => (
                <div key={c.id} className="glass rounded-2xl p-5 border border-card-border/40 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase bg-accent-purple/15 text-accent-purple border border-accent-purple/30 px-2.5 py-0.5 rounded-full font-bold">
                        {c.role}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{c.group_name}</span>
                    </div>

                    <h3 className="font-display font-bold text-base text-slate-100">{c.name}</h3>
                    <p className="text-xs text-emerald-400 font-mono mt-1">WA: {c.whatsapp}</p>
                    {c.instagram && <p className="text-xs text-pink-400 font-mono">IG: @{c.instagram}</p>}
                  </div>

                  <div className="flex justify-end pt-4 mt-4 border-t border-card-border/20">
                    <button
                      onClick={() => handleDeleteContact(c.id)}
                      className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white transition cursor-pointer"
                      title="Hapus Kontak"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
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
                } catch (e) {}

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
                            <span>📄 Embedded Doc</span>
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

                    <button
                      onClick={() => handleDeleteAnno(a.id)}
                      className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white transition cursor-pointer ml-4 flex-shrink-0"
                      title="Hapus Pengumuman"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                                  t.is_active !== false
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
            <div className="glass rounded-2xl p-6 border border-accent-cyan/30">
              <h3 className="font-display font-bold text-sm text-accent-cyan uppercase tracking-wider mb-2 flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                <span>Sumber Google Drive & Parameter Kelompok</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Atur Link Folder Google Drive Utama dan Jumlah Kelompok (misal: 20 kelompok). Saat menekan <strong>"Sinkronkan Folder Kelompok"</strong>, sistem akan membuat folder dari <strong>Kelompok 1 s/d Kelompok {targetTotalGroups}</strong> sekaligus (folder yang sudah ada tidak dibuat ulang).
              </p>
              <form onSubmit={handleSaveGdriveLink} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                  <div className="flex-grow">
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Link / ID Folder Induk Google Drive</label>
                    <input
                      type="text"
                      value={gdriveLink}
                      onChange={(e) => setGdriveLink(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/1abc... atau ID Folder"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-card-border text-slate-100 text-xs font-mono focus:border-accent-cyan focus:outline-none"
                    />
                  </div>

                  <div className="w-full sm:w-44">
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

                  <div className="w-full sm:w-56">
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Target Anggota / Kelompok (Individu)</label>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={targetMembersPerGroup}
                      onChange={(e) => setTargetMembersPerGroup(Math.max(1, parseInt(e.target.value) || 1))}
                      placeholder="10"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-card-border text-accent-purple font-bold text-xs font-mono focus:border-accent-purple focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={savingGdrive}
                    className="px-5 py-2.5 rounded-xl bg-accent-cyan text-black font-extrabold text-xs hover:bg-accent-cyan/90 transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{savingGdrive ? "Menyimpan..." : "Simpan Pengaturan"}</span>
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
                            className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border cursor-pointer ${
                              task.is_active
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
                            className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border cursor-pointer ${
                              task.is_active !== false
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
          <div className="glass rounded-2xl p-6 border border-accent-purple/40 max-w-md w-full">
            <h3 className="font-display font-bold text-lg text-slate-100 mb-4">Tambah Kontak LO Baru</h3>
            <form onSubmit={handleCreateContact} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">Nama Lengkap LO</label>
                <input
                  type="text"
                  required
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="Kak Ahmad"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase font-mono mb-1">Peran / Role</label>
                  <select
                    value={newContact.role}
                    onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-xs"
                  >
                    <option value="LO">LO</option>
                    <option value="Pendamping">Pendamping</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase font-mono mb-1">Kelompok</label>
                  <select
                    value={newContact.group_name}
                    onChange={(e) => setNewContact({ ...newContact, group_name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-xs"
                  >
                    {[...Array(20)].map((_, i) => (
                      <option key={i} value={`Kelompok ${i + 1}`}>
                        Kelompok {i + 1}
                      </option>
                    ))}
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
    </div>
  );
}
