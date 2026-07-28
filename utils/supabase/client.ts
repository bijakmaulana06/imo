import { createBrowserClient } from "@supabase/ssr";

let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export const createClient = () => {
  if (clientInstance) return clientInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  clientInstance = createBrowserClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  if (typeof window !== "undefined") {
    window.addEventListener("unhandledrejection", (event) => {
      if (
        event.reason &&
        (event.reason.name === "TypeError" || event.reason.message?.includes("Failed to fetch"))
      ) {
        // Suppress background network token refresh rejections from surfacing as unhandled errors
        event.preventDefault();
      }
    });
  }

  return clientInstance;
};
