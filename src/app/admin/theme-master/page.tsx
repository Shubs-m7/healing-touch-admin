"use client";

import React, { useState, useEffect } from "react";
import {
  Palette,
  Type,
  Sparkles,
  Save,
  RotateCcw,
  Eye,
  CheckCircle,
  Sliders,
  Layers,
  Building,
  Check,
  RefreshCw,
  Sun,
  Layout,
  Calendar,
  Clock,
  Activity,
  ArrowRight,
  Plus,
  X,
  Link as LinkIcon,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useThemeMaster } from "@/context/ThemeMasterContext";
import Aurora from "@/components/ui/Aurora";
import {
  ThemeMasterData,
  defaultThemeMaster,
  hexToHsl,
  extractCleanFontUrl,
  parseFontFamiliesFromUrl,
} from "@/services/masterApiService";

interface PresetOption {
  id: string;
  name: string;
  desc: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  bgHsl: string;
  cardHsl: string;
  fgHsl: string;
  primaryHsl: string;
  secondaryHsl: string;
  accentHsl: string;
}

const PRESET_PALETTES: PresetOption[] = [
  {
    id: "emerald-sage",
    name: "Emerald & Sage",
    desc: "Calming medical-grade healing greens and soft emerald tones",
    primary: "#10b981",
    primaryHsl: "150 45% 52%",
    secondary: "#0ea5e9",
    secondaryHsl: "200 75% 60%",
    accent: "#059669",
    accentHsl: "158 60% 50%",
    background: "#f6fbf8",
    bgHsl: "150 35% 97%",
    cardHsl: "0 0% 100%",
    fgHsl: "230 20% 15%",
  },
  {
    id: "ocean-cyan",
    name: "Ocean & Cyan",
    desc: "Trustworthy clinical deep azure and soothing cyan highlights",
    primary: "#0284c7",
    primaryHsl: "201 96% 39%",
    secondary: "#0d9488",
    secondaryHsl: "173 80% 40%",
    accent: "#06b6d4",
    accentHsl: "189 94% 43%",
    background: "#f0f9ff",
    bgHsl: "204 100% 97%",
    cardHsl: "0 0% 100%",
    fgHsl: "222 47% 11%",
  },
  {
    id: "royal-indigo",
    name: "Royal Violet & Indigo",
    desc: "Prestigious wellness, orthopedic precision & calm luxury",
    primary: "#6366f1",
    primaryHsl: "239 84% 67%",
    secondary: "#8b5cf6",
    secondaryHsl: "258 90% 66%",
    accent: "#4f46e5",
    accentHsl: "243 75% 59%",
    background: "#f8fafc",
    bgHsl: "210 40% 98%",
    cardHsl: "0 0% 100%",
    fgHsl: "222 47% 11%",
  },
  {
    id: "rose-coral",
    name: "Rose Quartz & Coral",
    desc: "Compassionate, warm, patient-first holistic care aesthetic",
    primary: "#e11d48",
    primaryHsl: "347 77% 50%",
    secondary: "#f43f5e",
    secondaryHsl: "351 89% 60%",
    accent: "#fb7185",
    accentHsl: "353 96% 71%",
    background: "#fff1f2",
    bgHsl: "356 100% 97%",
    cardHsl: "0 0% 100%",
    fgHsl: "345 50% 12%",
  },
  {
    id: "amber-sunset",
    name: "Amber Sunset & Slate",
    desc: "Invigorating vitality, active rehabilitation and strength",
    primary: "#d97706",
    primaryHsl: "38 92% 50%",
    secondary: "#b45309",
    secondaryHsl: "28 86% 40%",
    accent: "#f59e0b",
    accentHsl: "45 93% 47%",
    background: "#fffbeb",
    bgHsl: "48 100% 96%",
    cardHsl: "0 0% 100%",
    fgHsl: "24 35% 14%",
  },
  {
    id: "slate-minimal",
    name: "Modern Titanium Slate",
    desc: "High-tech minimalist medical clinic styling with crisp contrast",
    primary: "#334155",
    primaryHsl: "215 25% 27%",
    secondary: "#475569",
    secondaryHsl: "215 19% 35%",
    accent: "#0ea5e9",
    accentHsl: "200 75% 60%",
    background: "#f8fafc",
    bgHsl: "210 40% 98%",
    cardHsl: "0 0% 100%",
    fgHsl: "222 47% 11%",
  },
];

const HEADING_FONTS = [
  { name: "Plus Jakarta Sans", style: "Modern, clean & architectural" },
  { name: "Outfit", style: "Contemporary, geometric & friendly" },
  { name: "Inter", style: "Universal digital readability" },
  { name: "Poppins", style: "Bold, rounded & energetic" },
  { name: "Montserrat", style: "Authoritative & premium clinical" },
  { name: "Playfair Display", style: "High-end serif luxury flair" },
  { name: "Manrope", style: "Precision tech & modern healthcare" },
];

const BODY_FONTS = [
  { name: "Inter", style: "Industry gold-standard screen legibility" },
  { name: "Roboto", style: "Clean, neutral and familiar" },
  { name: "Plus Jakarta Sans", style: "Consistent with modern branding" },
  { name: "DM Sans", style: "Compact, crisp, and humanist" },
  { name: "Open Sans", style: "Warm, open apertures for accessibility" },
];

const RADIUS_OPTIONS = [
  { id: "rounded-md", label: "Crisp & Sharp", value: "0.375rem", preview: "rounded-md" },
  { id: "rounded-xl", label: "Modern Standard", value: "0.75rem", preview: "rounded-xl" },
  { id: "rounded-2xl", label: "Curved Luxury (Default)", value: "1.25rem", preview: "rounded-2xl" },
  { id: "rounded-3xl", label: "Pill / Ultra-Rounded", value: "1.75rem", preview: "rounded-3xl" },
];

export default function ThemeMasterPage() {
  const { theme, loading, saveTheme, resetToDefault, previewTheme, revertPreview } = useThemeMaster();

  const [formData, setFormData] = useState<ThemeMasterData>(defaultThemeMaster);
  const [activeTab, setActiveTab] = useState<"colors" | "typography" | "styling" | "aurora" | "branding">("colors");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [customPresetName, setCustomPresetName] = useState("");

  useEffect(() => {
    if (theme) {
      setFormData(theme);
    }
  }, [theme]);

  // Live preview as user edits
  const handleColorChange = (key: "primary" | "secondary" | "accent" | "background", hex: string) => {
    const hsl = hexToHsl(hex);
    let updatedColors = { ...formData.colors };

    if (key === "primary") {
      updatedColors.primary = hex;
      updatedColors.primaryHsl = hsl;
    } else if (key === "secondary") {
      updatedColors.secondary = hex;
      updatedColors.secondaryHsl = hsl;
      updatedColors.ring = hex;
      updatedColors.ringHsl = hsl;
    } else if (key === "accent") {
      updatedColors.accent = hex;
      updatedColors.accentHsl = hsl;
    } else if (key === "background") {
      updatedColors.background = hex;
      updatedColors.backgroundHsl = hsl;
    }

    const updated = {
      ...formData,
      activePreset: "custom",
      colors: updatedColors,
    };
    setFormData(updated);
    previewTheme(updated);
  };

  const handlePresetSelect = (preset: PresetOption) => {
    const updated: ThemeMasterData = {
      ...formData,
      activePreset: preset.id,
      colors: {
        ...formData.colors,
        primary: preset.primary,
        primaryHsl: preset.primaryHsl,
        secondary: preset.secondary,
        secondaryHsl: preset.secondaryHsl,
        accent: preset.accent,
        accentHsl: preset.accentHsl,
        background: preset.background,
        backgroundHsl: preset.bgHsl,
        cardBackground: "#ffffff",
        cardBackgroundHsl: preset.cardHsl,
        foregroundHsl: preset.fgHsl,
        ring: preset.secondary,
        ringHsl: preset.secondaryHsl,
      },
    };
    setFormData(updated);
    previewTheme(updated);
    toast.info(`Switched to ${preset.name} theme preview`);
  };

  const handleFontSelect = (type: "heading" | "body", fontName: string) => {
    const updated: ThemeMasterData = {
      ...formData,
      typography: {
        ...formData.typography,
        [type === "heading" ? "headingFont" : "bodyFont"]: fontName,
        [type === "heading" ? "customHeadingFont" : "customBodyFont"]: "",
      },
    };
    setFormData(updated);
    previewTheme(updated);
  };

  const handleCustomFontChange = (
    field: "customHeadingFont" | "customBodyFont" | "customFontUrl",
    value: string
  ) => {
    let newTypography = { ...formData.typography };

    if (field === "customFontUrl") {
      const cleanUrl = extractCleanFontUrl(value);
      newTypography.customFontUrl = cleanUrl;
      const detected = parseFontFamiliesFromUrl(cleanUrl);
      if (detected.length > 0) {
        // If heading font wasn't explicitly set yet, auto-assign detected font
        if (!newTypography.customHeadingFont) {
          newTypography.customHeadingFont = detected[0];
          toast.info(`Found font "${detected[0]}" from URL & set as Heading font!`);
        }
        if (detected.length > 1 && !newTypography.customBodyFont) {
          newTypography.customBodyFont = detected[1];
        }
      }
    } else {
      // Check if user accidentally pasted a full URL or <link> into a font name field
      const isUrlLike =
        value.includes("http") ||
        value.includes("<link") ||
        value.includes("@import") ||
        value.includes("fonts.googleapis.com");

      if (isUrlLike) {
        const cleanUrl = extractCleanFontUrl(value);
        const detected = parseFontFamiliesFromUrl(cleanUrl);
        newTypography.customFontUrl = cleanUrl;
        if (detected.length > 0) {
          newTypography[field] = detected[0];
          toast.success(
            `Extracted "${detected[0]}" for ${
              field === "customHeadingFont" ? "Heading" : "Body"
            } Font and saved the URL!`
          );
        } else {
          newTypography[field] = value;
        }
      } else {
        newTypography[field] = value;
      }
    }

    const updated: ThemeMasterData = {
      ...formData,
      typography: newTypography,
    };
    setFormData(updated);
    previewTheme(updated);
  };

  const handleRadiusSelect = (opt: typeof RADIUS_OPTIONS[0]) => {
    const updated: ThemeMasterData = {
      ...formData,
      styling: {
        ...formData.styling,
        borderRadius: opt.preview,
        radiusValue: opt.value,
      },
    };
    setFormData(updated);
    previewTheme(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveTheme(formData);
      toast.success("Theme & Branding Saved Successfully!", {
        description: "Your live website and portal are now updated with the new appearance.",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to save theme settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset all styling, colors, and fonts back to clinic defaults?")) {
      return;
    }
    setResetting(true);
    try {
      const def = await resetToDefault();
      setFormData(def);
      toast.success("Theme Reset to Default Clinic Palette");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset theme");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm font-semibold text-muted-foreground">Loading Theme Master...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 via-sky-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
            <Palette className="h-3.5 w-3.5" />
            Global Appearance Master
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Theme, Colors & Fonts
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
            Live style customizer for the public website, booking engine, and patient dashboard.
            Changes update instantly on the preview panel below.
          </p>
        </div>

        <div className="flex items-center gap-2.5 z-10 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={resetting || saving}
            className="rounded-xl h-10 px-4 text-xs font-bold gap-2 border-border hover:bg-muted"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${resetting ? "animate-spin" : ""}`} />
            Reset Defaults
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving || resetting}
            className="rounded-xl h-10 px-6 text-xs font-bold gap-2 bg-primary hover:bg-primary/90 text-white shadow-md shadow-teal-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {saving ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-2 overflow-x-auto custom-slim-scrollbar">
        {[
          { id: "colors", label: "Color Palette", icon: Palette },
          { id: "typography", label: "Typography & Fonts", icon: Type },
          { id: "styling", label: "Radius & Shapes", icon: Sliders },
          { id: "aurora", label: "Aurora", icon: Sparkles },
          { id: "branding", label: "Clinic Identity", icon: Building },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "border-primary text-primary bg-primary/5 rounded-t-xl"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Grid: Controls (Left) + Interactive Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* TAB 1: COLORS */}
          {activeTab === "colors" && (
            <div className="space-y-6">
              {/* Presets Card */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Curated Clinical Palettes
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select a harmonious, accessibility-tested color theme tailored for medical care.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[...PRESET_PALETTES, ...(formData.customPresets || []).map((cp) => ({
                    ...cp,
                    desc: cp.desc || "Saved custom color preset",
                    foregroundHsl: cp.foregroundHsl || "222 47% 11%",
                    isCustom: true,
                  }))].map((preset: PresetOption & { isCustom?: boolean }) => {
                    const isSelected = formData.activePreset === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handlePresetSelect(preset)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left relative ${
                          isSelected
                            ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs"
                            : "border-border hover:border-primary/40 hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-bold text-foreground truncate">{preset.name}</span>
                            {preset.isCustom && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/15 text-primary shrink-0">
                                Custom
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {preset.isCustom && (
                              <button
                                type="button"
                                title="Delete custom preset"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const nextCustom = (formData.customPresets || []).filter((p) => p.id !== preset.id);
                                  const updated: ThemeMasterData = {
                                    ...formData,
                                    customPresets: nextCustom,
                                    activePreset: formData.activePreset === preset.id ? "custom" : formData.activePreset,
                                  };
                                  setFormData(updated);
                                  await saveTheme(updated);
                                  toast.success(`Removed custom preset "${preset.name}"`);
                                }}
                                className="w-5 h-5 rounded-full hover:bg-destructive/15 text-muted-foreground hover:text-destructive flex items-center justify-center"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                            {isSelected && (
                              <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">
                                <Check className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mb-2.5">
                          {preset.desc}
                        </p>
                        {/* Swatches */}
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-5 h-5 rounded-full shadow-2xs border border-white/50"
                            style={{ backgroundColor: preset.primary }}
                            title="Primary Color"
                          />
                          <div
                            className="w-5 h-5 rounded-full shadow-2xs border border-white/50"
                            style={{ backgroundColor: preset.secondary }}
                            title="Secondary Color"
                          />
                          <div
                            className="w-5 h-5 rounded-full shadow-2xs border border-white/50"
                            style={{ backgroundColor: preset.accent }}
                            title="Accent Color"
                          />
                          <div
                            className="w-5 h-5 rounded-full shadow-2xs border border-black/10"
                            style={{ backgroundColor: preset.background }}
                            title="Background Color"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Palette className="h-4 w-4 text-primary" />
                    Custom Color Fine-Tuning
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Click the color circle or type custom hex values for precise brand alignment.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Primary Color */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      Primary Brand Color
                    </Label>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="color"
                        value={formData.colors.primary}
                        onChange={(e) => handleColorChange("primary", e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border border-border p-1 bg-background shrink-0"
                      />
                      <Input
                        value={formData.colors.primary}
                        onChange={(e) => handleColorChange("primary", e.target.value)}
                        placeholder="#10b981"
                        className="h-10 text-xs font-mono uppercase font-bold"
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground block">
                      Used for primary CTA buttons, main hero headings, badges.
                    </span>
                  </div>

                  {/* Secondary Color */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      Secondary / Focus Ring Color
                    </Label>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="color"
                        value={formData.colors.secondary}
                        onChange={(e) => handleColorChange("secondary", e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border border-border p-1 bg-background shrink-0"
                      />
                      <Input
                        value={formData.colors.secondary}
                        onChange={(e) => handleColorChange("secondary", e.target.value)}
                        placeholder="#0ea5e9"
                        className="h-10 text-xs font-mono uppercase font-bold"
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground block">
                      Used for interactive focus borders, secondary CTAs & pills.
                    </span>
                  </div>

                  {/* Accent Color */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      Accent Highlight Color
                    </Label>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="color"
                        value={formData.colors.accent}
                        onChange={(e) => handleColorChange("accent", e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border border-border p-1 bg-background shrink-0"
                      />
                      <Input
                        value={formData.colors.accent}
                        onChange={(e) => handleColorChange("accent", e.target.value)}
                        placeholder="#059669"
                        className="h-10 text-xs font-mono uppercase font-bold"
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground block">
                      Used for verified checkmarks, highlights & success badges.
                    </span>
                  </div>

                  {/* Background Tint */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      Canvas / Page Background
                    </Label>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="color"
                        value={formData.colors.background}
                        onChange={(e) => handleColorChange("background", e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border border-border p-1 bg-background shrink-0"
                      />
                      <Input
                        value={formData.colors.background}
                        onChange={(e) => handleColorChange("background", e.target.value)}
                        placeholder="#f6fbf8"
                        className="h-10 text-xs font-mono uppercase font-bold"
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground block">
                      Overall portal backdrop tint for comfortable clinical contrast.
                    </span>
                  </div>
                </div>

                {/* Save Current Colors as Custom Preset */}
                <div className="pt-4 mt-2 border-t border-border/70 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <Input
                    value={customPresetName}
                    onChange={(e) => setCustomPresetName(e.target.value)}
                    placeholder="Custom preset name (e.g. Clinic Mint Pro)"
                    className="h-9 text-xs flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!customPresetName.trim() || saving}
                    onClick={async () => {
                      const name = customPresetName.trim();
                      if (!name) return;
                      const id = `custom-${Date.now()}`;
                      const newPreset = {
                        id,
                        name,
                        desc: "Saved custom color preset",
                        primary: formData.colors.primary,
                        primaryHsl: formData.colors.primaryHsl,
                        secondary: formData.colors.secondary,
                        secondaryHsl: formData.colors.secondaryHsl,
                        accent: formData.colors.accent,
                        accentHsl: formData.colors.accentHsl,
                        background: formData.colors.background,
                        backgroundHsl: formData.colors.backgroundHsl,
                        foregroundHsl: formData.colors.foregroundHsl,
                      };
                      const updated: ThemeMasterData = {
                        ...formData,
                        activePreset: id,
                        customPresets: [...(formData.customPresets || []), newPreset],
                      };
                      setFormData(updated);
                      setCustomPresetName("");
                      await saveTheme(updated);
                      toast.success(`Saved custom preset "${name}"`);
                    }}
                    className="h-9 text-xs font-bold gap-1.5 shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Save as Custom Preset
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TYPOGRAPHY & FONTS */}
          {activeTab === "typography" && (
            <div className="space-y-6">
              {/* Custom Fonts & External Import */}
              <div className="bg-card border-2 border-primary/30 rounded-2xl p-5 shadow-xs space-y-5 bg-gradient-to-br from-card via-card to-secondary/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider mb-1">
                      <Sparkles className="h-3 w-3" />
                      Custom Font Support
                    </div>
                    <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                      <Plus className="h-4 w-4 text-primary" />
                      Add Any Google Font or Web Font
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Type any font name available on Google Fonts (e.g. <em>Cinzel, Sora, Space Grotesk, Lexend, Urbanist, Lora</em>), or paste an external CSS/CDN font URL. The font will automatically download and render across the entire site!
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Custom Heading Font */}
                  <div className="space-y-2 bg-background/60 p-3.5 rounded-xl border border-border">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Type className="h-3.5 w-3.5 text-primary" />
                        Custom Heading Font Name
                      </Label>
                      {formData.typography.customHeadingFont && (
                        <button
                          type="button"
                          onClick={() => handleCustomFontChange("customHeadingFont", "")}
                          className="text-[10px] text-muted-foreground hover:text-rose-500 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Clear custom heading font"
                        >
                          <X className="h-3 w-3" />
                          Clear
                        </button>
                      )}
                    </div>
                    <Input
                      value={formData.typography.customHeadingFont || ""}
                      onChange={(e) => handleCustomFontChange("customHeadingFont", e.target.value)}
                      placeholder="e.g. Cinzel, Sora, Urbanist"
                      className="h-9 text-xs font-semibold"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-muted-foreground font-medium">Suggestions:</span>
                      {["Cinzel", "Sora", "Space Grotesk", "Urbanist", "Raleway", "Lora"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleCustomFontChange("customHeadingFont", s)}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-muted hover:bg-primary/10 hover:text-primary font-medium transition-colors cursor-pointer"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {formData.typography.customHeadingFont && (
                      <p
                        className="text-sm font-extrabold text-primary dark:text-teal-300 pt-1 truncate"
                        style={{ fontFamily: `'${formData.typography.customHeadingFont}', system-ui, sans-serif` }}
                      >
                        Preview: {formData.typography.customHeadingFont} — Specialized Care
                      </p>
                    )}
                  </div>

                  {/* Custom Body Font */}
                  <div className="space-y-2 bg-background/60 p-3.5 rounded-xl border border-border">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Type className="h-3.5 w-3.5 text-primary" />
                        Custom Body Font Name
                      </Label>
                      {formData.typography.customBodyFont && (
                        <button
                          type="button"
                          onClick={() => handleCustomFontChange("customBodyFont", "")}
                          className="text-[10px] text-muted-foreground hover:text-rose-500 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Clear custom body font"
                        >
                          <X className="h-3 w-3" />
                          Clear
                        </button>
                      )}
                    </div>
                    <Input
                      value={formData.typography.customBodyFont || ""}
                      onChange={(e) => handleCustomFontChange("customBodyFont", e.target.value)}
                      placeholder="e.g. Lexend, Mulish, Nunito"
                      className="h-9 text-xs font-semibold"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-muted-foreground font-medium">Suggestions:</span>
                      {["Lexend", "Mulish", "Nunito", "Quicksand", "Source Sans 3", "Cabin"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleCustomFontChange("customBodyFont", s)}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-muted hover:bg-primary/10 hover:text-primary font-medium transition-colors cursor-pointer"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {formData.typography.customBodyFont && (
                      <p
                        className="text-xs text-primary dark:text-teal-300 pt-1 line-clamp-1"
                        style={{ fontFamily: `'${formData.typography.customBodyFont}', system-ui, sans-serif` }}
                      >
                        Preview: {formData.typography.customBodyFont} — Clear, accessible clinical guidance.
                      </p>
                    )}
                  </div>
                </div>

                {/* External Font Stylesheet URL (Optional) */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <LinkIcon className="h-3.5 w-3.5 text-primary" />
                      External Font Stylesheet / CDN Link (Optional)
                    </Label>
                    {formData.typography.customFontUrl && (
                      <button
                        type="button"
                        onClick={() => handleCustomFontChange("customFontUrl", "")}
                        className="text-[10px] text-muted-foreground hover:text-rose-500 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                        Clear URL
                      </button>
                    )}
                  </div>
                  <Input
                    value={formData.typography.customFontUrl || ""}
                    onChange={(e) => handleCustomFontChange("customFontUrl", e.target.value)}
                    placeholder="e.g. https://fonts.googleapis.com/css2?family=Playfair+Display&display=swap"
                    className="h-9 text-xs font-mono"
                  />
                  <span className="text-[10px] text-muted-foreground block">
                    Paste any Google Fonts link, &lt;link&gt; tag, CSS @import, Adobe Typekit, or direct font file.
                  </span>

                  {/* Dynamic Detection & Feedback */}
                  {(() => {
                    const detectedFamilies = parseFontFamiliesFromUrl(formData.typography.customFontUrl || "");
                    if (formData.typography.customFontUrl && detectedFamilies.length > 0) {
                      return (
                        <div className="p-3.5 bg-primary/10 border-2 border-primary/30 rounded-xl space-y-3 mt-2 transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-extrabold text-primary dark:text-teal-200">
                              <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                              <span>Detected Web Font: <strong>{detectedFamilies.join(", ")}</strong></span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-wider">
                              Connected
                            </span>
                          </div>

                          {/* Quick Apply Buttons */}
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                              Quick Apply:
                            </span>
                            {detectedFamilies.map((fam) => (
                              <div key={fam} className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = {
                                      ...formData,
                                      typography: {
                                        ...formData.typography,
                                        customHeadingFont: fam,
                                      },
                                    };
                                    setFormData(updated);
                                    previewTheme(updated);
                                    toast.success(`Set "${fam}" as Heading Font`);
                                  }}
                                  className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                                    formData.typography.customHeadingFont === fam
                                      ? "bg-primary text-white ring-2 ring-primary/30 shadow-xs"
                                      : "bg-card border border-border hover:border-primary text-foreground"
                                  }`}
                                >
                                  {formData.typography.customHeadingFont === fam ? (
                                    <span className="inline-flex items-center gap-1"><Check className="w-3 h-3" /> Active Heading</span>
                                  ) : (
                                    `Set as Heading`
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = {
                                      ...formData,
                                      typography: {
                                        ...formData.typography,
                                        customBodyFont: fam,
                                      },
                                    };
                                    setFormData(updated);
                                    previewTheme(updated);
                                    toast.success(`Set "${fam}" as Body Font`);
                                  }}
                                  className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                                    formData.typography.customBodyFont === fam
                                      ? "bg-primary text-white ring-2 ring-primary/30 shadow-xs"
                                      : "bg-card border border-border hover:border-primary text-foreground"
                                  }`}
                                >
                                  {formData.typography.customBodyFont === fam ? (
                                    <span className="inline-flex items-center gap-1"><Check className="w-3 h-3" /> Active Body</span>
                                  ) : (
                                    `Set as Body`
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = {
                                      ...formData,
                                      typography: {
                                        ...formData.typography,
                                        customHeadingFont: fam,
                                        customBodyFont: fam,
                                      },
                                    };
                                    setFormData(updated);
                                    previewTheme(updated);
                                    toast.success(`Applied "${fam}" to Headings & Body`);
                                  }}
                                  className="text-[11px] px-2.5 py-1 rounded-lg font-bold bg-muted hover:bg-primary/20 text-primary dark:text-teal-200 transition-all cursor-pointer"
                                >
                                  Apply to All
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Live Type Specimen of the URL Font */}
                          <div className="pt-2 border-t border-primary/20 bg-background/60 p-2.5 rounded-lg">
                            <p className="text-[10px] text-muted-foreground font-semibold mb-0.5">Live Font Render Specimen:</p>
                            {detectedFamilies.map((fam) => (
                              <p
                                key={fam}
                                className="text-base sm:text-lg font-bold text-foreground leading-snug tracking-tight truncate"
                                style={{ fontFamily: `'${fam}', system-ui, sans-serif` }}
                              >
                                {fam} — Adaptus Advanced Healing Clinic
                              </p>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (formData.typography.customFontUrl && detectedFamilies.length === 0) {
                      return (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl space-y-1 mt-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                            <Info className="h-4 w-4 text-blue-600 shrink-0" />
                            <span>External Web Font Stylesheet Connected!</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Type your font family name into <strong>Custom Heading Font</strong> or <strong>Custom Body Font</strong> above so the browser renders it.
                          </p>
                        </div>
                      );
                    }

                    return null;
                  })()}
                </div>
              </div>

              {/* Heading Font Picker */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Type className="h-4 w-4 text-primary" />
                    Curated Heading Fonts
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Click any curated font to apply, or use the custom font input above.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formData.typography.customHeadingFont && (
                    <div
                      className="p-3.5 rounded-2xl border-2 border-primary bg-teal-50/50 dark:bg-teal-950/30 shadow-xs relative text-left"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-base font-extrabold text-primary dark:text-teal-300 truncate"
                          style={{ fontFamily: `'${formData.typography.customHeadingFont}', system-ui, sans-serif` }}
                        >
                          {formData.typography.customHeadingFont}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold">
                          Active Custom
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">User-defined custom heading font</p>
                      <p
                        className="text-xs font-semibold text-foreground/80 mt-2 truncate"
                        style={{ fontFamily: `'${formData.typography.customHeadingFont}', system-ui, sans-serif` }}
                      >
                        Comprehensive Spine & Knee Care
                      </p>
                    </div>
                  )}

                  {HEADING_FONTS.map((font) => {
                    const isSelected = !formData.typography.customHeadingFont && formData.typography.headingFont === font.name;
                    return (
                      <div
                        key={font.name}
                        onClick={() => handleFontSelect("heading", font.name)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left relative ${
                          isSelected
                            ? "border-primary bg-teal-50/40 dark:bg-teal-950/20 ring-2 ring-primary/20 shadow-xs"
                            : "border-border hover:border-teal-300 hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className="text-base font-extrabold text-foreground truncate"
                            style={{ fontFamily: `'${font.name}', system-ui, sans-serif` }}
                          >
                            {font.name}
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">
                              <Check className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{font.style}</p>
                        <p
                          className="text-xs font-semibold text-foreground/80 mt-2 truncate"
                          style={{ fontFamily: `'${font.name}', system-ui, sans-serif` }}
                        >
                          Comprehensive Spine & Knee Care
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Body Font Picker */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Type className="h-4 w-4 text-primary" />
                    Curated Body & Content Fonts
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Controls typography for paragraphs, forms, patient cards, and descriptions.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formData.typography.customBodyFont && (
                    <div
                      className="p-3.5 rounded-2xl border-2 border-primary bg-teal-50/50 dark:bg-teal-950/30 shadow-xs relative text-left"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-sm font-extrabold text-primary dark:text-teal-300 truncate"
                          style={{ fontFamily: `'${formData.typography.customBodyFont}', system-ui, sans-serif` }}
                        >
                          {formData.typography.customBodyFont}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold">
                          Active Custom
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">User-defined custom body font</p>
                      <p
                        className="text-[11px] text-foreground/70 mt-1.5 line-clamp-2"
                        style={{ fontFamily: `'${formData.typography.customBodyFont}', system-ui, sans-serif` }}
                      >
                        Every patient session includes targeted therapy, functional assessment, and personalized recovery roadmaps.
                      </p>
                    </div>
                  )}

                  {BODY_FONTS.map((font) => {
                    const isSelected = !formData.typography.customBodyFont && formData.typography.bodyFont === font.name;
                    return (
                      <div
                        key={font.name}
                        onClick={() => handleFontSelect("body", font.name)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left relative ${
                          isSelected
                            ? "border-primary bg-teal-50/40 dark:bg-teal-950/20 ring-2 ring-primary/20 shadow-xs"
                            : "border-border hover:border-teal-300 hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className="text-sm font-bold text-foreground truncate"
                            style={{ fontFamily: `'${font.name}', system-ui, sans-serif` }}
                          >
                            {font.name}
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">
                              <Check className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{font.style}</p>
                        <p
                          className="text-[11px] text-foreground/70 mt-1.5 line-clamp-2"
                          style={{ fontFamily: `'${font.name}', system-ui, sans-serif` }}
                        >
                          Every patient session includes targeted therapy, functional assessment, and personalized recovery roadmaps.
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STYLING & SHAPES */}
          {activeTab === "styling" && (
            <div className="space-y-6">
              {/* Corner Radius */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-primary" />
                    Corner Curvature / Border Radius
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Defines the curvature of buttons, cards, modal dialogs, and interactive pills.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {RADIUS_OPTIONS.map((opt) => {
                    const isSelected = formData.styling.radiusValue === opt.value;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleRadiusSelect(opt)}
                        className={`p-3 border text-center transition-all cursor-pointer ${opt.preview} ${
                          isSelected
                            ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs"
                            : "border-border hover:border-teal-300 bg-muted/30"
                        }`}
                      >
                        <div
                          className="w-full h-8 bg-primary/20 border border-primary/40 flex items-center justify-center mb-2 mx-auto"
                          style={{ borderRadius: opt.value }}
                        >
                          <span className="text-[10px] font-bold text-primary dark:text-teal-300">
                            {opt.value}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-foreground block">
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Button Shape Style */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    Button & Interactive Styling
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Choose the visual presentation of action buttons and CTA widgets.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "curved", label: "Curved Modern (Default)", radius: "rounded-xl", cssRadius: "0.75rem" },
                    { id: "pill", label: "Full Pill Shape", radius: "rounded-full", cssRadius: "9999px" },
                    { id: "sharp", label: "Crisp Sharp", radius: "rounded-md", cssRadius: "0.25rem" },
                  ].map((btn) => {
                    const isSelected = formData.styling.buttonStyle === btn.id;
                    return (
                      <button
                        key={btn.id}
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...formData,
                            styling: { ...formData.styling, buttonStyle: btn.id as any },
                          };
                          setFormData(updated);
                          previewTheme(updated);
                        }}
                        className={`p-3 border text-center transition-all cursor-pointer rounded-2xl ${
                          isSelected
                            ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs"
                            : "border-border hover:border-teal-300 bg-muted/30"
                        }`}
                      >
                        <div
                          className="w-full h-8 bg-primary text-white flex items-center justify-center text-xs font-bold mb-2 shadow-2xs"
                          style={{ borderRadius: btn.cssRadius }}
                        >
                          Click Me
                        </div>
                        <span className="text-xs font-bold text-foreground block">
                          {btn.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AURORA */}
          {activeTab === "aurora" && (
            <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-5">
              {(() => {
                const stops =
                  formData.styling.auroraColors && formData.styling.auroraColors.length >= 3
                    ? formData.styling.auroraColors.slice(0, 5)
                    : ["#036137", "#05dcc1", "#00fa87", "#126e45"];
                return (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          Hero Aurora Background Colors
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Customize 3 to 5 animated WebGL aurora color stops behind the public hero section.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {stops.length < 5 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => {
                              const next = [...stops, "#10b981"];
                              const updated: ThemeMasterData = {
                                ...formData,
                                styling: { ...formData.styling, auroraColors: next },
                              };
                              setFormData(updated);
                              previewTheme(updated);
                            }}
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Color
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            const updated: ThemeMasterData = {
                              ...formData,
                              styling: {
                                ...formData.styling,
                                auroraColors: ["#036137", "#05dcc1", "#00fa87", "#126e45"],
                              },
                            };
                            setFormData(updated);
                            previewTheme(updated);
                          }}
                        >
                          Reset Aurora
                        </Button>
                      </div>
                    </div>

                    {/* Live WebGL Aurora Preview */}
                    <div className="relative h-40 w-full rounded-2xl border border-border overflow-hidden bg-gradient-to-b from-[#edf7f2] to-[#eef8f3]">
                      <Aurora
                        colorStops={stops}
                        amplitude={2.45}
                        blend={0}
                        height={0.43}
                        speed={3}
                        glow={1.75}
                        scale={3}
                        brightness={2}
                        mouseInteraction={false}
                        className="w-full h-full"
                      />
                      <div className="absolute bottom-2.5 left-3 px-2.5 py-1 rounded-full bg-white/85 backdrop-blur-sm border border-border text-[11px] font-semibold text-slate-800">
                        Live Aurora Preview ({stops.length} stops)
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {stops.map((colorVal, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-border bg-muted/30 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-muted-foreground">
                              Stop {idx + 1}
                            </Label>
                            {stops.length > 3 && (
                              <button
                                type="button"
                                title="Remove color stop"
                                onClick={() => {
                                  const next = stops.filter((_, i) => i !== idx);
                                  const updated: ThemeMasterData = {
                                    ...formData,
                                    styling: { ...formData.styling, auroraColors: next },
                                  };
                                  setFormData(updated);
                                  previewTheme(updated);
                                }}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2.5">
                            <input
                              type="color"
                              value={/^#[0-9A-Fa-f]{6}$/.test(colorVal) ? colorVal : "#05dcc1"}
                              onChange={(e) => {
                                const next = [...stops];
                                next[idx] = e.target.value;
                                const updated: ThemeMasterData = {
                                  ...formData,
                                  styling: { ...formData.styling, auroraColors: next },
                                };
                                setFormData(updated);
                                previewTheme(updated);
                              }}
                              className="w-9 h-9 rounded-lg border border-border cursor-pointer bg-transparent p-0 shrink-0"
                            />
                            <Input
                              value={colorVal}
                              onChange={(e) => {
                                const next = [...stops];
                                next[idx] = e.target.value;
                                const updated: ThemeMasterData = {
                                  ...formData,
                                  styling: { ...formData.styling, auroraColors: next },
                                };
                                setFormData(updated);
                                previewTheme(updated);
                              }}
                              className="h-9 text-xs font-mono"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* TAB 5: CLINIC BRANDING */}
          {activeTab === "branding" && (
            <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-5">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Building className="h-4 w-4 text-primary" />
                  Clinic Brand Identity
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Update clinic branding details rendered across headers, footers, and patient portals.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Clinic Display Name</Label>
                  <Input
                    value={formData.branding.clinicDisplayName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        branding: { ...formData.branding, clinicDisplayName: e.target.value },
                      })
                    }
                    placeholder="e.g. Adaptus Physiotherapy & Health Care"
                    className="h-10 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Clinic Tagline / Subtitle</Label>
                  <Input
                    value={formData.branding.tagline}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        branding: { ...formData.branding, tagline: e.target.value },
                      })
                    }
                    placeholder="e.g. Advanced Healing & Rehabilitation Clinic"
                    className="h-10 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Brand Keyword Highlight</Label>
                  <Input
                    value={formData.branding.logoTextHighlight || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        branding: { ...formData.branding, logoTextHighlight: e.target.value },
                      })
                    }
                    placeholder="e.g. Physiotherapy"
                    className="h-10 text-xs font-semibold"
                  />
                  <span className="text-[10px] text-muted-foreground block">
                    Highlighted in the primary brand gradient across headers.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Interactive Preview Column (5 cols) */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="bg-card border-2 border-primary/30 rounded-3xl p-5 shadow-xl space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                  Live UI Demonstration
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase">
                Real-Time
              </span>
            </div>

            {/* Simulated Public & Patient UI Snippet */}
            {(() => {
              const urlDetected = parseFontFamiliesFromUrl(formData.typography.customFontUrl || "");
              const urlFallback = urlDetected[0] || "";

              const effectiveHeading =
                formData.typography.customHeadingFont?.trim() ||
                urlFallback ||
                formData.typography.headingFont ||
                "Plus Jakarta Sans";
              const effectiveBody =
                formData.typography.customBodyFont?.trim() ||
                (urlDetected.length > 1 ? urlDetected[1] : "") ||
                formData.typography.bodyFont ||
                "Inter";

              return (
                <div
                  className="p-5 rounded-2xl border space-y-4 shadow-sm transition-all"
                  style={{
                    backgroundColor: formData.colors.background,
                    borderColor: formData.colors.secondary,
                    borderRadius: formData.styling.radiusValue,
                    fontFamily: `'${effectiveBody}', system-ui, sans-serif`,
                  }}
                >
                  {/* Badge & Heading */}
                  <div>
                    <span
                      className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 shadow-2xs"
                      style={{
                        backgroundColor: formData.colors.primary,
                        color: formData.colors.primaryForeground,
                        borderRadius: formData.styling.radiusValue,
                      }}
                    >
                      <Activity className="h-3 w-3" />
                      Verified Care Clinic
                    </span>

                    <h3
                      className="text-lg font-black mt-2 text-foreground leading-snug"
                      style={{
                        fontFamily: `'${effectiveHeading}', system-ui, sans-serif`,
                      }}
                    >
                      {formData.branding.clinicDisplayName}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {formData.branding.tagline}
                    </p>
                  </div>

                  {/* Sample Card */}
                  <div
                    className="bg-card p-3.5 border shadow-sm space-y-2.5"
                    style={{
                      borderRadius: formData.styling.radiusValue,
                      borderColor: `${formData.colors.primary}33`,
                    }}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        Initial Assessment
                      </span>
                      <span
                        className="font-black text-xs"
                        style={{ color: formData.colors.primary }}
                      >
                        ₹700
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Includes comprehensive spine assessment, postural screening, and pain mapping.
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-[11px]">
                      <span className="flex items-center gap-1 text-primary font-bold">
                        <CheckCircle className="h-3 w-3" /> 45 Minutes
                      </span>
                      <span className="text-muted-foreground">• In-Clinic Visit</span>
                    </div>
                  </div>

                  {/* Interactive Button Samples */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      className={`w-full py-2.5 px-4 text-xs font-extrabold shadow-md flex items-center justify-center gap-2 transition-all hover:opacity-95 ${
                        formData.styling.buttonStyle === "pill"
                          ? "rounded-full"
                          : formData.styling.buttonStyle === "sharp"
                          ? "rounded-md"
                          : "rounded-xl"
                      }`}
                      style={{
                        backgroundColor: formData.colors.primary,
                        color: formData.colors.primaryForeground,
                      }}
                    >
                      Book Instant Appointment
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      className={`w-full py-2 px-4 text-xs font-bold border transition-all hover:bg-muted ${
                        formData.styling.buttonStyle === "pill"
                          ? "rounded-full"
                          : formData.styling.buttonStyle === "sharp"
                          ? "rounded-md"
                          : "rounded-xl"
                      }`}
                      style={{
                        borderColor: formData.colors.secondary,
                        color: formData.colors.secondary,
                      }}
                    >
                      Explore Treatment Packages
                    </button>
                  </div>

                  {/* Active Tokens Summary */}
                  <div className="pt-2 border-t border-border/50 text-[10px] text-muted-foreground space-y-1">
                    <div className="flex justify-between items-center">
                      <span>Heading Font:</span>
                      <strong className="text-foreground flex items-center gap-1">
                        {effectiveHeading}
                        {formData.typography.customHeadingFont?.trim() && (
                          <span className="text-[9px] px-1 py-0.2 bg-primary/10 text-primary rounded">
                            Custom
                          </span>
                        )}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Body Font:</span>
                      <strong className="text-foreground flex items-center gap-1">
                        {effectiveBody}
                        {formData.typography.customBodyFont?.trim() && (
                          <span className="text-[9px] px-1 py-0.2 bg-primary/10 text-primary rounded">
                            Custom
                          </span>
                        )}
                      </strong>
                    </div>
                    {formData.typography.customFontUrl && (
                      <div className="flex justify-between items-center">
                        <span>External Font CDN:</span>
                        <strong className="text-primary truncate max-w-[140px] text-[9px] font-mono">
                          Connected
                        </strong>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Radius:</span>
                      <strong className="text-foreground">{formData.styling.radiusValue}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Primary Hex:</span>
                      <strong className="text-foreground">{formData.colors.primary.toUpperCase()}</strong>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
