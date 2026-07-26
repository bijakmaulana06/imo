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
} from "lucide-react";
import { DEFAULT_ID_CARD_TEMPLATE } from "@/lib/defaultTemplate";

type ActiveTab = "links" | "contacts" | "announcements" | "templates";

const DEFAULT_ADMIN_HTML_TEMPLATE = DEFAULT_ID_CARD_TEMPLATE;

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("links");
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  const [links, setLinks] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  // Admin Custom HTML Template State
  const [adminTemplateHtml, setAdminTemplateHtml] = useState<string>(DEFAULT_ADMIN_HTML_TEMPLATE);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

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
    content: "",
    category: "PENTING",
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

      const { data: templateData } = await supabase.from("id_card_templates").select("*");
      setTemplates(templateData || []);

    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      const { error } = await supabase.from("announcements").insert([newAnno]);
      if (error) throw error;
      setShowAddAnnoModal(false);
      setNewAnno({ title: "", content: "", category: "PENTING", pinned: false });
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
        <div className="flex flex-wrap gap-3 mb-8 border-b border-card-border/30 pb-4">
          {[
            { id: "links", label: "Grid Menu Links (/hub)", icon: Layers, count: links.length },
            { id: "contacts", label: "Kontak LO (/contact)", icon: Users, count: contacts.length },
            { id: "announcements", label: "Pengumuman Misi", icon: Megaphone, count: announcements.length },
            { id: "templates", label: "Template ID Card", icon: CreditCard, count: templates.length },
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
              {announcements.map((a) => (
                <div key={a.id} className="glass rounded-2xl p-5 border border-card-border/40 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {a.pinned && <Pin className="h-4 w-4 text-accent-yellow fill-accent-yellow" />}
                      <span className="text-[10px] font-mono uppercase bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/30 px-2.5 py-0.5 rounded-full font-bold">
                        {a.category}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-lg text-slate-100">{a.title}</h3>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">{a.content}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteAnno(a.id)}
                    className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white transition cursor-pointer ml-4 flex-shrink-0"
                    title="Hapus Pengumuman"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "templates" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="font-display font-black text-xl text-slate-100 flex items-center space-x-2">
                  <CreditCard className="h-6 w-6 text-accent-cyan" />
                  <span>Kustomisasi Templat HTML Resmi ID Card (/id-card)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Desain & atur struktur HTML kustom ID Card peserta. Tag teks seperti <code className="text-accent-cyan font-mono">{`{nama}`}</code>, <code className="text-accent-cyan font-mono">{`{nim}`}</code>, atau tag kustom baru akan **otomatis dideteksi dan dibuatkan form inputnya** untuk seluruh peserta.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                {saveSuccessMsg && (
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center space-x-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>{saveSuccessMsg}</span>
                  </span>
                )}
                <Button variant="primary" size="sm" onClick={handleSaveAdminHtmlTemplate}>
                  <Save className="h-4 w-4 mr-1.5" />
                  <span>Simpan Templat Resmi</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* HTML Code Editor */}
              <div className="lg:col-span-7 space-y-4">
                <Card glowColor="purple">
                  <div className="flex justify-between items-center mb-3 pb-3 border-b border-card-border/30 flex-wrap gap-2">
                    <span className="font-mono text-xs font-bold text-accent-purple uppercase tracking-wider flex items-center space-x-1.5">
                      <FileCode2 className="h-4 w-4" />
                      <span>Kode HTML & CSS Kustom ID Card</span>
                    </span>

                    <div className="flex items-center space-x-2">
                      <label className="text-xs font-mono text-slate-200 hover:text-accent-cyan bg-slate-900 hover:bg-slate-800 border border-card-border/60 hover:border-accent-cyan/60 px-3 py-1.5 rounded-xl cursor-pointer transition flex items-center space-x-1.5 touch-manipulation">
                        <Upload className="h-3.5 w-3.5 text-accent-cyan" />
                        <span>Unggah File (.html / .svg)</span>
                        <input
                          type="file"
                          accept=".html,.htm,.svg,text/html,image/svg+xml"
                          onChange={handleAdminTemplateFileUpload}
                          className="hidden"
                        />
                      </label>

                      <button
                        onClick={handleResetAdminTemplate}
                        className="text-xs font-mono text-slate-400 hover:text-red-400 flex items-center space-x-1 cursor-pointer bg-slate-900 hover:bg-slate-800 border border-card-border/40 px-2.5 py-1.5 rounded-xl transition"
                        title="Reset Ke HTML Default"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={16}
                    value={adminTemplateHtml}
                    onChange={(e) => setAdminTemplateHtml(e.target.value)}
                    className="w-full p-4 rounded-xl bg-slate-950/90 border border-card-border/60 text-emerald-400 font-mono text-xs focus:outline-none focus:border-accent-purple/60 leading-relaxed shadow-inner"
                  />

                  {/* Detected Tags Indicator */}
                  <div className="pt-3 border-t border-card-border/30">
                    <div className="text-[11px] font-mono text-slate-400 mb-2 font-bold uppercase tracking-wider">
                      Tag Teks Terdeteksi ({adminDetectedPlaceholders.length}):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {adminDetectedPlaceholders.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 rounded-full bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan font-mono text-[11px]"
                        >
                          {"{" + tag + "}"}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Live Preview Panel */}
              <div className="lg:col-span-5 space-y-4 sticky top-24">
                <Card glowColor="cyan">
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-card-border/30">
                    <span className="font-mono text-xs font-bold text-accent-cyan uppercase tracking-wider flex items-center space-x-1.5">
                      <Sparkles className="h-4 w-4" />
                      <span>Preview Live ID Card Admin</span>
                    </span>
                  </div>

                  {/* Card Preview Container */}
                  <div className="w-full flex justify-center items-center overflow-hidden py-2">
                    <div className="w-full max-w-[420px] min-h-[240px] rounded-2xl mx-auto overflow-hidden shadow-2xl border border-card-border/50 flex flex-col justify-center items-center">
                      <div
                        className="id-card-preview-scope w-full h-full flex flex-col justify-center items-center"
                        dangerouslySetInnerHTML={{ __html: renderedAdminPreviewHtml }}
                      />
                    </div>
                  </div>
                </Card>
              </div>
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
          <div className="glass rounded-2xl p-6 border border-accent-yellow/40 max-w-md w-full">
            <h3 className="font-display font-bold text-lg text-slate-100 mb-4">Buat Pengumuman Baru</h3>
            <form onSubmit={handleCreateAnno} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">Judul Pengumuman</label>
                <input
                  type="text"
                  required
                  value={newAnno.title}
                  onChange={(e) => setNewAnno({ ...newAnno, title: e.target.value })}
                  placeholder="Jadwal Briefing Yel-YelIMO 2026"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-mono mb-1">Isi Instruksi / Berita</label>
                <textarea
                  required
                  value={newAnno.content}
                  onChange={(e) => setNewAnno({ ...newAnno, content: e.target.value })}
                  placeholder="Tuliskan instruksi lengkap di sini..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-card-border text-slate-100 text-xs h-28"
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
                  Publikasikan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
