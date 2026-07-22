"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function AdminIndexPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/admin/login");
      }
    };
    checkAuth();
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center text-slate-400 font-mono text-xs">
      <span>Memeriksa sesi otentikasi administrator...</span>
    </div>
  );
}
