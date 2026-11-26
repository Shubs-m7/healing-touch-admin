"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  ThemeMasterData,
  defaultThemeMaster,
  getThemeMaster,
  updateThemeMaster,
  resetThemeMaster,
  extractCleanFontUrl,
  parseFontFamiliesFromUrl,
} from "@/services/masterApiService";

interface ThemeMasterContextType {
  theme: ThemeMasterData;
  loading: boolean;
  saveTheme: (newTheme: Partial<ThemeMasterData>) => Promise<ThemeMasterData>;
  resetToDefault: () => Promise<ThemeMasterData>;
  previewTheme: (tempTheme: ThemeMasterData) => void;
  revertPreview: () => void;
}

const ThemeMasterContext = createContext<ThemeMasterContextType>({
  theme: defaultThemeMaster,
  loading: true,
  saveTheme: async () => defaultThemeMaster,
  resetToDefault: async () => defaultThemeMaster,
  previewTheme: () => {},
  revertPreview: () => {},
});

function formatGoogleFontFamily(name: string): string {
  const trimmed = name.trim();
  const encoded = encodeURIComponent(trimmed).replace(/%20/g, "+");
  return `${encoded}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600`;
}

function ensurePreconnect() {
  if (typeof document === "undefined") return;
  if (!document.getElementById("google-fonts-preconnect-api")) {
    const l1 = document.createElement("link");
    l1.id = "google-fonts-preconnect-api";
    l1.rel = "preconnect";
    l1.href = "https://fonts.googleapis.com";
    document.head.appendChild(l1);
  }
  if (!document.getElementById("google-fonts-preconnect-static")) {
    const l2 = document.createElement("link");
    l2.id = "google-fonts-preconnect-static";
    l2.rel = "preconnect";
    l2.href = "https://fonts.gstatic.com";
    l2.crossOrigin = "anonymous";
    document.head.appendChild(l2);
  }
}

function injectFonts(heading: string, body: string, customUrl?: string) {
  if (typeof document === "undefined") return;

  ensurePreconnect();

  const cleanUrl = customUrl ? extractCleanFontUrl(customUrl) : "";
  const detectedFamilies = cleanUrl ? parseFontFamiliesFromUrl(cleanUrl) : [];

  const fontsToLoad: string[] = [];
  const cleanHeading = heading?.trim();
  const cleanBody = body?.trim();

  const standardFallbacks = ["system-ui", "-apple-system", "sans-serif", "serif", "monospace", "aptos"];
  
  // If the font is not already covered by the external custom stylesheet
  const isLoadedByCustomUrl = (name: string) =>
    detectedFamilies.some((f) => f.toLowerCase() === name.toLowerCase());

  if (cleanHeading && !standardFallbacks.includes(cleanHeading.toLowerCase()) && !isLoadedByCustomUrl(cleanHeading)) {
    fontsToLoad.push(formatGoogleFontFamily(cleanHeading));
  }
  if (
    cleanBody &&
    cleanBody.toLowerCase() !== cleanHeading?.toLowerCase() &&
    !standardFallbacks.includes(cleanBody.toLowerCase()) &&
    !isLoadedByCustomUrl(cleanBody)
  ) {
    fontsToLoad.push(formatGoogleFontFamily(cleanBody));
  }

  // 1. Google Fonts Dynamic Link
  if (fontsToLoad.length > 0) {
    const fontHref = `https://fonts.googleapis.com/css2?${fontsToLoad.map((f) => `family=${f}`).join("&")}&display=swap`;
    let linkEl = document.getElementById("dynamic-theme-fonts") as HTMLLinkElement | null;
    if (!linkEl) {
      linkEl = document.createElement("link");
      linkEl.id = "dynamic-theme-fonts";
      linkEl.rel = "stylesheet";
      document.head.appendChild(linkEl);
    }
    if (linkEl.href !== fontHref) {
      linkEl.href = fontHref;
    }
  }

  // 2. Custom Web Font URL (direct CSS stylesheet or direct font file)
  if (cleanUrl && cleanUrl.startsWith("http")) {
    const isDirectFontFile = /\.(woff2?|ttf|otf|eot)($|\?)/i.test(cleanUrl);

    if (isDirectFontFile) {
      // Direct binary font file - inject @font-face style tag
      const fontName = cleanHeading || detectedFamilies[0] || "CustomFont";
      let styleEl = document.getElementById("custom-font-file-face") as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "custom-font-file-face";
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = `
        @font-face {
          font-family: '${fontName}';
          src: url('${cleanUrl}');
          font-display: swap;
        }
      `;
    } else {
      // CSS stylesheet link (Google Fonts, Bunny, Typekit, CDN CSS)
      let customLink = document.getElementById("custom-external-font-url") as HTMLLinkElement | null;
      if (!customLink) {
        customLink = document.createElement("link");
        customLink.id = "custom-external-font-url";
        customLink.rel = "stylesheet";
        document.head.appendChild(customLink);
      }
      if (customLink.href !== cleanUrl) {
        customLink.href = cleanUrl;
      }
    }
  } else {
    // If URL cleared, remove custom tags
    const existingLink = document.getElementById("custom-external-font-url");
    if (existingLink) existingLink.remove();
    const existingStyle = document.getElementById("custom-font-file-face");
    if (existingStyle) existingStyle.remove();
  }
}

function applyThemeVariables(t: ThemeMasterData) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  if (t.colors.primaryHsl) {
    root.style.setProperty("--primary", t.colors.primaryHsl);
    root.style.setProperty("--sage-600", t.colors.primaryHsl);
  }
  if (t.colors.secondaryHsl) {
    root.style.setProperty("--secondary", t.colors.secondaryHsl);
    root.style.setProperty("--blue-500", t.colors.secondaryHsl);
    root.style.setProperty("--ring", t.colors.secondaryHsl);
  }
  if (t.colors.accentHsl) {
    root.style.setProperty("--accent", t.colors.accentHsl);
    root.style.setProperty("--aurora-green", t.colors.accentHsl);
  }
  if (t.colors.backgroundHsl) {
    root.style.setProperty("--background", t.colors.backgroundHsl);
    root.style.setProperty("--sage-50", t.colors.backgroundHsl);
  }
  if (t.colors.cardBackgroundHsl) {
    root.style.setProperty("--card", t.colors.cardBackgroundHsl);
  }
  if (t.colors.foregroundHsl) {
    root.style.setProperty("--foreground", t.colors.foregroundHsl);
  }
  if (t.styling?.radiusValue) {
    root.style.setProperty("--radius", t.styling.radiusValue);
  }

  // Detect font families from URL if present
  const cleanUrl = t.typography?.customFontUrl ? extractCleanFontUrl(t.typography.customFontUrl) : "";
  const detectedFamilies = cleanUrl ? parseFontFamiliesFromUrl(cleanUrl) : [];
  const urlFallbackFont = detectedFamilies.length > 0 ? detectedFamilies[0] : "";

  // If user provided a URL with fonts, but customHeadingFont is blank, auto-use the font from URL!
  const effectiveHeading =
    t.typography?.customHeadingFont?.trim() ||
    urlFallbackFont ||
    t.typography?.headingFont ||
    "Plus Jakarta Sans";

  const effectiveBody =
    t.typography?.customBodyFont?.trim() ||
    (detectedFamilies.length > 1 ? detectedFamilies[1] : "") ||
    t.typography?.bodyFont ||
    "Inter";

  root.style.setProperty("--font-display", `'${effectiveHeading}', system-ui, -apple-system, sans-serif`);
  root.style.setProperty("--font-sans", `'${effectiveBody}', system-ui, -apple-system, sans-serif`);

  // Inject fonts dynamically into DOM
  injectFonts(effectiveHeading, effectiveBody, t.typography?.customFontUrl);
}

export function ThemeMasterProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMasterData>(defaultThemeMaster);
  const [savedTheme, setSavedTheme] = useState<ThemeMasterData>(defaultThemeMaster);
  const [loading, setLoading] = useState(true);

  // Initialize from cache then server
  useEffect(() => {
    // 1. Try local cache first for instant render
    try {
      const cached = localStorage.getItem("clinic_theme_master");
      if (cached) {
        const parsed = JSON.parse(cached);
        setTheme(parsed);
        setSavedTheme(parsed);
        applyThemeVariables(parsed);
      } else {
        applyThemeVariables(defaultThemeMaster);
      }
    } catch (e) {
      applyThemeVariables(defaultThemeMaster);
    }

    // 2. Fetch from backend
    getThemeMaster()
      .then((data) => {
        setTheme(data);
        setSavedTheme(data);
        applyThemeVariables(data);
        try {
          localStorage.setItem("clinic_theme_master", JSON.stringify(data));
        } catch (_) {}
      })
      .catch((err) => {
        console.warn("Could not load backend theme master, using local defaults:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const saveThemeHandler = useCallback(async (newTheme: Partial<ThemeMasterData>) => {
    const merged = {
      ...savedTheme,
      ...newTheme,
      colors: { ...savedTheme.colors, ...(newTheme.colors || {}) },
      typography: { ...savedTheme.typography, ...(newTheme.typography || {}) },
      styling: { ...savedTheme.styling, ...(newTheme.styling || {}) },
      branding: { ...savedTheme.branding, ...(newTheme.branding || {}) },
    };

    const updated = await updateThemeMaster(merged);
    setTheme(updated);
    setSavedTheme(updated);
    applyThemeVariables(updated);
    try {
      localStorage.setItem("clinic_theme_master", JSON.stringify(updated));
    } catch (_) {}
    return updated;
  }, [savedTheme]);

  const resetToDefaultHandler = useCallback(async () => {
    const def = await resetThemeMaster();
    setTheme(def);
    setSavedTheme(def);
    applyThemeVariables(def);
    try {
      localStorage.setItem("clinic_theme_master", JSON.stringify(def));
    } catch (_) {}
    return def;
  }, []);

  const previewTheme = useCallback((tempTheme: ThemeMasterData) => {
    setTheme(tempTheme);
    applyThemeVariables(tempTheme);
  }, []);

  const revertPreview = useCallback(() => {
    setTheme(savedTheme);
    applyThemeVariables(savedTheme);
  }, [savedTheme]);

  return (
    <ThemeMasterContext.Provider
      value={{
        theme,
        loading,
        saveTheme: saveThemeHandler,
        resetToDefault: resetToDefaultHandler,
        previewTheme,
        revertPreview,
      }}
    >
      {children}
    </ThemeMasterContext.Provider>
  );
}

export const useThemeMaster = () => useContext(ThemeMasterContext);
