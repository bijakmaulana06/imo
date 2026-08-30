"use client";

import React, { useState } from "react";
import StarfieldBackground from "@/components/StarfieldBackground";
import Card from "@/components/Card";
import Button from "@/components/Button";
import ImoLogo from "@/components/ImoLogo";
import { createClient } from "@/utils/supabase/client";
import { ShieldAlert, LogIn, Key, Mail, ArrowLeft, AlertCircle } from "lucide-react";
import { Link } from "next-view-transitions";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/admin/dashboard`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setErrorMsg(err.message || "Gagal masuk menggunakan Google.");
      setGoogleLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Harap isi email dan kata sandi.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { role: "admin" },
            },
          });

          if (signUpError) throw signUpError;

          if (signUpData.session) {
            router.push("/admin/dashboard");
            return;
          } else {
            setErrorMsg("Akun admin baru berhasil dibuat! Silakan coba klik 'Masuk Portal Admin' sekali lagi.");
            setLoading(false);
            return;
          }
        }
        throw signInError;
      }

      router.push("/admin/dashboard");
    } catch (err: any) {
      console.error("Login Error:", err);
      setErrorMsg(err.message || "Email atau kata sandi tidak valid.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-[#020510] text-slate-100 font-sans p-4 overflow-hidden">
      <StarfieldBackground />

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-purple/10 rounded-full filter blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <ImoLogo height={38} />
            <span className="font-display font-extrabold text-accent-purple text-xl">2026</span>
          </div>
          
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-bold uppercase tracking-wider mb-2">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>RESTRICTED ACCESS PORTAL</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-display font-black text-slate-100 tracking-wider">
            ADMINISTRATOR LOGIN
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Masuk untuk mengelola data Mission Control, Kontak, dan Pengumuman.
          </p>
        </div>

        <Card glowColor="purple" className="p-8">
          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start space-x-2.5">
              <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-display font-bold text-xs uppercase tracking-wider shadow-lg transition duration-300 flex items-center justify-center space-x-3 cursor-pointer disabled:opacity-50 mb-6"
          >
            {googleLoading ? (
              <span>Menghubungkan ke Google...</span>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span>Masuk dengan Google (OAuth)</span>
              </>
            )}
          </button>

          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-card-border/40 w-full" />
            <span className="bg-slate-950 px-3 text-[10px] text-slate-500 font-mono uppercase tracking-widest absolute">
              Atau Gunakan Email
            </span>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4 text-xs font-sans">
            <div>
              <label className="block text-slate-400 uppercase font-mono tracking-wider mb-1.5">
                Email Administrator
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@imo2026.ac.id"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-card-border/50 text-slate-100 text-sm focus:outline-none focus:border-accent-purple/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 uppercase font-mono tracking-wider mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-card-border/50 text-slate-100 text-sm focus:outline-none focus:border-accent-purple/60 font-mono"
                />
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              type="submit"
              disabled={loading}
              className="w-full shadow-[0_0_20px_rgba(180,140,255,0.3)] mt-2"
            >
              {loading ? (
                <span>Memverifikasi...</span>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  <span>Masuk Portal Admin</span>
                </>
              )}
            </Button>
          </form>
        </Card>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-accent-cyan transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Halaman Utama</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
