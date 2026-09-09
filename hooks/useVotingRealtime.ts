"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel, REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

export type VotingRealtimeStatus =
  | "connecting"
  | "live"
  | "reconnecting"
  | "offline"
  | "unconfigured";

/** Subscribe only to revision signals; voter records and results stay server-side. */
export function useVotingRealtime(onChange: () => void): VotingRealtimeStatus {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const [status, setStatus] = useState<VotingRealtimeStatus>(
    configured ? "connecting" : "unconfigured",
  );
  const callback = useRef(onChange);

  useEffect(() => {
    callback.current = onChange;
  }, [onChange]);

  useEffect(() => {
    // Initial data also loads when Realtime is unavailable or not configured.
    const initialRefresh = window.setTimeout(() => callback.current(), 0);
    let active = true;
    let generation = 0;
    let connectedOnce = false;
    let client: ReturnType<typeof createClient> | undefined;
    let channel: RealtimeChannel | undefined;

    const refresh = () => {
      if (active && navigator.onLine && document.visibilityState === "visible") {
        callback.current();
      }
    };

    const subscribe = () => {
      if (!active || !configured) return;
      const currentGeneration = ++generation;
      if (channel && client) void client.removeChannel(channel).catch(() => {});
      try {
        client = createClient();
        channel = client
          .channel(`voting-updates-${crypto.randomUUID()}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "voting_updates" },
            refresh,
          )
          .subscribe((nextStatus: REALTIME_SUBSCRIBE_STATES) => {
            if (!active || currentGeneration !== generation) return;
            if (!navigator.onLine) {
              setStatus("offline");
            } else if (nextStatus === "SUBSCRIBED") {
              connectedOnce = true;
              setStatus("live");
              refresh();
            } else if (
              nextStatus === "CHANNEL_ERROR" ||
              nextStatus === "TIMED_OUT" ||
              nextStatus === "CLOSED"
            ) {
              setStatus("reconnecting");
            }
          });
      } catch {
        setStatus("unconfigured");
      }
    };

    const onOnline = () => {
      setStatus(configured ? (connectedOnce ? "reconnecting" : "connecting") : "unconfigured");
      subscribe();
      refresh();
    };
    const onOffline = () => setStatus("offline");

    // The timer also reconciles missed events after a browser suspends a tab.
    const polling = window.setInterval(refresh, 15_000);
    const initialConnection = window.setTimeout(() => {
      if (navigator.onLine) subscribe();
      else onOffline();
    }, 0);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      active = false;
      generation += 1;
      window.clearTimeout(initialRefresh);
      window.clearTimeout(initialConnection);
      window.clearInterval(polling);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", refresh);
      if (channel && client) void client.removeChannel(channel).catch(() => {});
    };
  }, [configured]);

  return status;
}
