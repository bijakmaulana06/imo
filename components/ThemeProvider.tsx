"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function ThemeProvider() {
  useEffect(() => {
    const applyTheme = async () => {
      try {
        const supabase = createClient();
        const { data: settingsRows } = await supabase
          .from("system_settings")
          .select("key, value");

        if (!settingsRows) return;
        const map: Record<string, string> = {};
        settingsRows.forEach((r: any) => { map[r.key] = r.value; });

        const root = document.documentElement;

        // 1. Brand Config & Color Palette
        if (map.brand_config) {
          try {
            const cfg = JSON.parse(map.brand_config);
            if (cfg.accentCyan) root.style.setProperty("--accent-cyan", cfg.accentCyan);
            if (cfg.accentPurple) root.style.setProperty("--accent-purple", cfg.accentPurple);
            if (cfg.accentYellow) root.style.setProperty("--accent-yellow", cfg.accentYellow);
            if (cfg.bgColor) root.style.setProperty("--background", cfg.bgColor);

            // Custom Font Stack
            if (cfg.fontFamily && cfg.fontFamily !== "default") {
              root.style.setProperty("--font-sans", cfg.fontFamily);
            }

            // Glassmorphism Blur Intensity
            if (cfg.glassBlur) {
              root.style.setProperty("--glass-blur", `${cfg.glassBlur}px`);
            }

            // Global Logo URL
            if (cfg.logoUrl) {
              (window as any).__IMO_LOGO_URL__ = cfg.logoUrl;
            }

            window.dispatchEvent(new CustomEvent("imo-theme-loaded", { detail: cfg }));
          } catch {}
        }

        // 2. Advanced Styling & Injection
        if (map.advanced_style_config) {
          try {
            const adv = JSON.parse(map.advanced_style_config);

            // Custom CSS Injection
            if (adv.customCss) {
              let styleTag = document.getElementById("imo-custom-css");
              if (!styleTag) {
                styleTag = document.createElement("style");
                styleTag.id = "imo-custom-css";
                document.head.appendChild(styleTag);
              }
              styleTag.innerHTML = adv.customCss;
            }

            // Google Font URL Injection
            if (adv.googleFontUrl) {
              let fontLink = document.getElementById("imo-custom-google-font") as HTMLLinkElement;
              if (!fontLink) {
                fontLink = document.createElement("link");
                fontLink.id = "imo-custom-google-font";
                fontLink.rel = "stylesheet";
                document.head.appendChild(fontLink);
              }
              fontLink.href = adv.googleFontUrl;
            }

            // Custom Head HTML/Script Injection
            if (adv.customHeadJs) {
              let scriptTag = document.getElementById("imo-custom-js");
              if (!scriptTag) {
                scriptTag = document.createElement("script");
                scriptTag.id = "imo-custom-js";
                document.body.appendChild(scriptTag);
              }
              scriptTag.innerHTML = adv.customHeadJs;
            }
          } catch {}
        }
      } catch (err) {
        console.warn("Theme apply notice:", err);
      }
    };

    applyTheme();
  }, []);

  return null;
}
