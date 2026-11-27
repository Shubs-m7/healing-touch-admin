"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Globe,
  Sparkles,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle,
  HelpCircle,
  Stethoscope,
  Activity,
  Heart,
  Award,
  Shield,
  Clock,
  Dumbbell,
  UserCheck,
  HelpingHand,
  ShieldCheck,
  BookOpen,
  Users,
  Target,
  FileText,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  getSiteContent,
  updateSiteContent,
  resetSiteContent,
  SiteContentData,
  defaultSiteContent,
} from "@/services/masterApiService";

export default function ContentMasterPage() {
  const [activeTab, setActiveTab] = useState<"landing" | "about">("landing");
  const [content, setContent] = useState<SiteContentData>(defaultSiteContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [switchingHero, setSwitchingHero] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      const data = await getSiteContent();
      setContent(data);
    } catch (err: any) {
      toast.error("Failed to load website content. Loaded defaults.");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchHeroVariant = async (variant: "aurora-v2" | "classic") => {
    setSwitchingHero(true);
    setContent((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        hero: {
          ...prev.landingPage.hero,
          variant,
        },
      },
    }));

    if (typeof window !== "undefined") {
      localStorage.setItem("adaptus_hero_variant", variant);
      window.dispatchEvent(new Event("storage"));
    }

    try {
      await updateSiteContent({
        landingPage: {
          ...content.landingPage,
          hero: {
            ...content.landingPage.hero,
            variant,
          },
        },
      });
      toast.success(
        variant === "classic"
          ? "Switched to Classic Hero (Live!)"
          : "Switched to Modern Aurora Hero (Live!)",
        {
          description: "Database updated. The live homepage now reflects this design.",
        }
      );
    } catch (err: any) {
      console.warn("Hero switch direct save fallback:", err);
      toast.info(`Switched to ${variant === "classic" ? "Classic" : "Modern Aurora"}. Please also click 'Save Changes' above.`);
    } finally {
      setSwitchingHero(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateSiteContent(content);
      setContent(updated);
      toast.success("Website Content Saved Successfully!", {
        description: "Your landing and about pages now reflect the updated content.",
      });
    } catch (err: any) {
      toast.error("Failed to save changes", {
        description: err.message || "An unexpected error occurred.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset website content to clinic defaults? All customizations will be reset.")) {
      return;
    }
    setResetting(true);
    try {
      const res = await resetSiteContent();
      setContent(res);
      toast.success("Reset Complete", {
        description: "Website content has been restored to default clinic copy.",
      });
    } catch (err: any) {
      toast.error("Reset Failed", {
        description: err.message || "Could not reset content.",
      });
    } finally {
      setResetting(false);
    }
  };

  // Helper updater for nested landing page fields
  const updateLanding = (section: keyof SiteContentData["landingPage"], field: string, value: any) => {
    setContent((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        [section]: {
          ...(prev.landingPage[section] as any),
          [field]: value,
        },
      },
    }));
  };

  // Helper updater for nested about page fields
  const updateAbout = (section: keyof SiteContentData["aboutPage"], field: string, value: any) => {
    setContent((prev) => ({
      ...prev,
      aboutPage: {
        ...prev.aboutPage,
        [section]: {
          ...(prev.aboutPage[section] as any),
          [field]: value,
        },
      },
    }));
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-2xl border-4 border-teal-600 border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground font-semibold">Loading Website Content Master...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* EXECUTIVE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent border border-teal-500/20 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                Website Content Master
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                Live CMS
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Customize headlines, hero message, badges, care offerings, and team specialists across public pages.
            </p>
          </div>
        </div>

        {/* TOP ACTIONS */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          <Link
            href={activeTab === "landing" ? "/" : "/about"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-all shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Preview {activeTab === "landing" ? "Landing" : "About"} Page</span>
          </Link>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={resetting || saving}
            className="gap-1.5 h-9 text-xs rounded-xl border-border hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? "animate-spin" : ""}`} />
            <span>Reset</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving || resetting}
            className="gap-1.5 h-9 text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 rounded-xl shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : "Save All Changes"}</span>
          </Button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("landing")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "landing"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Landing Page Content</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("about")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "about"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>About Page Content</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: LANDING PAGE CONTENT */}
      {/* ======================================================== */}
      {activeTab === "landing" && (
        <div className="space-y-6">
          {/* SECTION 1: HERO */}
          <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                <h2 className="text-base font-bold text-foreground">Hero Section (Top of Landing Page)</h2>
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground">
                Active: <strong className="text-teal-700 dark:text-teal-300 font-bold">{content.landingPage.hero.variant === "classic" ? "Classic Hero" : "Modern Aurora Hero"}</strong>
              </span>
            </div>

            {/* HERO SECTION LAYOUT & VERSION SWITCHER */}
            <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-teal-800 dark:text-teal-300">
                    Hero Section Layout
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-600 text-white shadow-2xs">
                    {content.landingPage.hero.variant === "classic" ? "Classic Centered" : "Modern Aurora (New)"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose which hero section displays on the live landing page. Admins can switch back and forth anytime.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={switchingHero}
                  onClick={() => handleSwitchHeroVariant("aurora-v2")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 ${
                    content.landingPage.hero.variant !== "classic"
                      ? "bg-teal-600 text-white shadow-md shadow-teal-600/25 scale-[1.02]"
                      : "bg-card text-muted-foreground border border-border hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <span>✨ Modern Aurora (New)</span>
                </button>
                <button
                  type="button"
                  disabled={switchingHero}
                  onClick={() => handleSwitchHeroVariant("classic")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 ${
                    content.landingPage.hero.variant === "classic"
                      ? "bg-teal-600 text-white shadow-md shadow-teal-600/25 scale-[1.02]"
                      : "bg-card text-muted-foreground border border-border hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <span>🏛️ Classic (Old)</span>
                </button>
                <Link
                  href="/"
                  target="_blank"
                  className="px-3 py-2 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-500/10 border border-teal-500/30 transition-all flex items-center gap-1"
                >
                  <span>View Live Site</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">Top Pill / Tagline Badge</label>
                <Input
                  value={content.landingPage.hero.badge}
                  onChange={(e) => updateLanding("hero", "badge", e.target.value)}
                  placeholder="e.g. Move. Adapt. Thrive."
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Main Headline Text</label>
                <Input
                  value={content.landingPage.hero.headline}
                  onChange={(e) => updateLanding("hero", "headline", e.target.value)}
                  placeholder="e.g. Personalized Physiotherapy Care for"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Gradient Highlighted Words <span className="text-teal-600 font-semibold">(Accent color)</span>
                </label>
                <Input
                  value={content.landingPage.hero.headlineHighlight}
                  onChange={(e) => updateLanding("hero", "headlineHighlight", e.target.value)}
                  placeholder="e.g. Pain-Free Living"
                  className="h-9 text-xs font-bold text-teal-600"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">Hero Description / Subheadline</label>
                <Textarea
                  value={content.landingPage.hero.subheadline}
                  onChange={(e) => updateLanding("hero", "subheadline", e.target.value)}
                  rows={3}
                  className="text-xs leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Primary Button Label</label>
                <Input
                  value={content.landingPage.hero.primaryCtaText}
                  onChange={(e) => updateLanding("hero", "primaryCtaText", e.target.value)}
                  placeholder="e.g. Book Appointment"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Secondary Button Label</label>
                <Input
                  value={content.landingPage.hero.secondaryCtaText}
                  onChange={(e) => updateLanding("hero", "secondaryCtaText", e.target.value)}
                  placeholder="e.g. Know More About Us"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-2 md:col-span-2 pt-2 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    Hero Specialty Pills (&quot;Specialized In:&quot;)
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] gap-1"
                    onClick={() => {
                      const current = content.landingPage.hero.specialties || [
                        "Spine & Lower Back",
                        "Neck & Cervical",
                        "Knee & Joints",
                        "Sports Injury Rehab",
                        "Post-Op Recovery",
                      ];
                      updateLanding("hero", "specialties", [...current, "New Specialty"]);
                    }}
                  >
                    <Plus className="w-3 h-3" /> Add Tag
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {(
                    content.landingPage.hero.specialties || [
                      "Spine & Lower Back",
                      "Neck & Cervical",
                      "Knee & Joints",
                      "Sports Injury Rehab",
                      "Post-Op Recovery",
                    ]
                  ).map((tag, idx, arr) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <Input
                        value={tag}
                        onChange={(e) => {
                          const next = [...arr];
                          next[idx] = e.target.value;
                          updateLanding("hero", "specialties", next);
                        }}
                        className="h-8 text-xs"
                        placeholder="Specialty name"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive shrink-0"
                        onClick={() => {
                          const next = arr.filter((_, i) => i !== idx);
                          updateLanding("hero", "specialties", next);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: TRUST BADGES */}
          <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                <h2 className="text-base font-bold text-foreground">Trust & Verification Badges</h2>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const updated = [...content.landingPage.trustBadges, { icon: "Award", label: "New Trust Badge" }];
                  setContent({ ...content, landingPage: { ...content.landingPage, trustBadges: updated } });
                }}
                className="gap-1 h-7 text-xs rounded-lg"
              >
                <Plus className="w-3 h-3" /> Add Badge
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {content.landingPage.trustBadges.map((badge, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-muted/30 border border-border/70 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <Input
                    value={badge.label}
                    onChange={(e) => {
                      const updated = [...content.landingPage.trustBadges];
                      updated[idx].label = e.target.value;
                      setContent({ ...content, landingPage: { ...content.landingPage, trustBadges: updated } });
                    }}
                    placeholder="Badge title"
                    className="h-8 text-xs font-semibold"
                  />
                  {content.landingPage.trustBadges.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = content.landingPage.trustBadges.filter((_, i) => i !== idx);
                        setContent({ ...content, landingPage: { ...content.landingPage, trustBadges: updated } });
                      }}
                      className="p-1 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: SERVICES & CARE OFFERINGS */}
          <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                <h2 className="text-base font-bold text-foreground">Services & Care Offerings (6 Cards)</h2>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newService = {
                    title: "New Treatment Program",
                    description: "Clinical description of this specialized physiotherapy therapy.",
                    icon: "Activity",
                    color: "from-primary/20 to-primary/5",
                  };
                  setContent({
                    ...content,
                    landingPage: {
                      ...content.landingPage,
                      services: [...content.landingPage.services, newService],
                    },
                  });
                }}
                className="gap-1 h-7 text-xs rounded-lg"
              >
                <Plus className="w-3 h-3" /> Add Service Card
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {content.landingPage.services.map((service, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-muted/20 border border-border/70 space-y-2.5 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600">
                      Card #{idx + 1}
                    </span>
                    {content.landingPage.services.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = content.landingPage.services.filter((_, i) => i !== idx);
                          setContent({
                            ...content,
                            landingPage: { ...content.landingPage, services: updated },
                          });
                        }}
                        className="p-1 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground">Title</label>
                    <Input
                      value={service.title}
                      onChange={(e) => {
                        const updated = [...content.landingPage.services];
                        updated[idx].title = e.target.value;
                        setContent({
                          ...content,
                          landingPage: { ...content.landingPage, services: updated },
                        });
                      }}
                      className="h-8 text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground">Description</label>
                    <Textarea
                      value={service.description}
                      onChange={(e) => {
                        const updated = [...content.landingPage.services];
                        updated[idx].description = e.target.value;
                        setContent({
                          ...content,
                          landingPage: { ...content.landingPage, services: updated },
                        });
                      }}
                      rows={2}
                      className="text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: CALL TO ACTION */}
          <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <h2 className="text-base font-bold text-foreground">Bottom Call to Action Banner</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">CTA Headline</label>
                <Input
                  value={content.landingPage.cta.title}
                  onChange={(e) => updateLanding("cta", "title", e.target.value)}
                  className="h-9 text-xs font-bold"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">CTA Description</label>
                <Textarea
                  value={content.landingPage.cta.description}
                  onChange={(e) => updateLanding("cta", "description", e.target.value)}
                  rows={2}
                  className="text-xs leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">CTA Button Label</label>
                <Input
                  value={content.landingPage.cta.buttonText}
                  onChange={(e) => updateLanding("cta", "buttonText", e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 5: CLINIC CONTACT INFO */}
          <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <h2 className="text-base font-bold text-foreground">Clinic Contact Information & Hours</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Official Clinic Name</label>
                <Input
                  value={content.landingPage.contactInfo.clinicName}
                  onChange={(e) => updateLanding("contactInfo", "clinicName", e.target.value)}
                  className="h-9 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <Phone className="w-3 h-3 text-teal-600" /> Phone Number
                </label>
                <Input
                  value={content.landingPage.contactInfo.phone}
                  onChange={(e) => updateLanding("contactInfo", "phone", e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <Mail className="w-3 h-3 text-teal-600" /> Clinic Email
                </label>
                <Input
                  value={content.landingPage.contactInfo.email}
                  onChange={(e) => updateLanding("contactInfo", "email", e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-teal-600" /> Physical Address
                </label>
                <Input
                  value={content.landingPage.contactInfo.address}
                  onChange={(e) => updateLanding("contactInfo", "address", e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3 text-teal-600" /> Working Hours
                </label>
                <Input
                  value={content.landingPage.contactInfo.workingHours}
                  onChange={(e) => updateLanding("contactInfo", "workingHours", e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: ABOUT PAGE CONTENT */}
      {/* ======================================================== */}
      {activeTab === "about" && (
        <div className="space-y-6">
          {/* SECTION 1: ABOUT HERO */}
          <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <h2 className="text-base font-bold text-foreground">About Page Hero Header</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Title Prefix</label>
                <Input
                  value={content.aboutPage.hero.title}
                  onChange={(e) => updateAbout("hero", "title", e.target.value)}
                  placeholder="e.g. About"
                  className="h-9 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Title Highlight (Clinic Brand)</label>
                <Input
                  value={content.aboutPage.hero.titleHighlight}
                  onChange={(e) => updateAbout("hero", "titleHighlight", e.target.value)}
                  placeholder="e.g. Adaptus"
                  className="h-9 text-xs font-bold text-teal-600"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">About Summary / Hero Description</label>
                <Textarea
                  value={content.aboutPage.hero.description}
                  onChange={(e) => updateAbout("hero", "description", e.target.value)}
                  rows={2}
                  className="text-xs leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: MISSION STATEMENT */}
          <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <h2 className="text-base font-bold text-foreground">Mission Statement & Pillars</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Mission Badge</label>
                  <Input
                    value={content.aboutPage.mission.badge}
                    onChange={(e) => updateAbout("mission", "badge", e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Mission Headline</label>
                  <Input
                    value={content.aboutPage.mission.title}
                    onChange={(e) => updateAbout("mission", "title", e.target.value)}
                    className="h-9 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Detailed Mission Narrative</label>
                <Textarea
                  value={content.aboutPage.mission.description}
                  onChange={(e) => updateAbout("mission", "description", e.target.value)}
                  rows={3}
                  className="text-xs leading-relaxed"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">Key Practice Pillars (Checklist)</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const updated = [...content.aboutPage.mission.points, "New clinical pillar statement"];
                      updateAbout("mission", "points", updated);
                    }}
                    className="gap-1 h-7 text-xs rounded-lg"
                  >
                    <Plus className="w-3 h-3" /> Add Pillar
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {content.aboutPage.mission.points.map((pt, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/70">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <Input
                        value={pt}
                        onChange={(e) => {
                          const updated = [...content.aboutPage.mission.points];
                          updated[idx] = e.target.value;
                          updateAbout("mission", "points", updated);
                        }}
                        className="h-7 text-xs"
                      />
                      {content.aboutPage.mission.points.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = content.aboutPage.mission.points.filter((_, i) => i !== idx);
                            updateAbout("mission", "points", updated);
                          }}
                          className="p-1 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: IMPACT & STATS */}
          <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                <h2 className="text-base font-bold text-foreground">Achievements & Impact Numbers (4 Metrics)</h2>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const updated = [...content.aboutPage.stats, { value: "100%", label: "New Metric" }];
                  setContent({ ...content, aboutPage: { ...content.aboutPage, stats: updated } });
                }}
                className="gap-1 h-7 text-xs rounded-lg"
              >
                <Plus className="w-3 h-3" /> Add Stat
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {content.aboutPage.stats.map((stat, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-muted/30 border border-border/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground">Metric #{idx + 1}</span>
                    {content.aboutPage.stats.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = content.aboutPage.stats.filter((_, i) => i !== idx);
                          setContent({ ...content, aboutPage: { ...content.aboutPage, stats: updated } });
                        }}
                        className="p-1 rounded-lg text-muted-foreground hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground">Value / Number</label>
                    <Input
                      value={stat.value}
                      onChange={(e) => {
                        const updated = [...content.aboutPage.stats];
                        updated[idx].value = e.target.value;
                        setContent({ ...content, aboutPage: { ...content.aboutPage, stats: updated } });
                      }}
                      className="h-8 text-xs font-black text-teal-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground">Label</label>
                    <Input
                      value={stat.label}
                      onChange={(e) => {
                        const updated = [...content.aboutPage.stats];
                        updated[idx].label = e.target.value;
                        setContent({ ...content, aboutPage: { ...content.aboutPage, stats: updated } });
                      }}
                      className="h-8 text-xs font-medium"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: MEET OUR SPECIALISTS */}
          <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                <h2 className="text-base font-bold text-foreground">Meet Our Specialists & Physiotherapists</h2>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newDoc = {
                    name: "Dr. New Specialist",
                    role: "Consultant Physiotherapist",
                    specialty: "Musculoskeletal Care",
                    experience: "5 years",
                  };
                  setContent({
                    ...content,
                    aboutPage: {
                      ...content.aboutPage,
                      specialists: [...content.aboutPage.specialists, newDoc],
                    },
                  });
                }}
                className="gap-1 h-7 text-xs rounded-lg"
              >
                <Plus className="w-3 h-3" /> Add Doctor
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {content.aboutPage.specialists.map((doc, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-muted/20 border border-border/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-teal-600 text-white text-[11px] font-bold flex items-center justify-center">
                        <Stethoscope className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-foreground">Specialist #{idx + 1}</span>
                    </div>
                    {content.aboutPage.specialists.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = content.aboutPage.specialists.filter((_, i) => i !== idx);
                          setContent({
                            ...content,
                            aboutPage: { ...content.aboutPage, specialists: updated },
                          });
                        }}
                        className="p-1 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground">Doctor Full Name</label>
                    <Input
                      value={doc.name}
                      onChange={(e) => {
                        const updated = [...content.aboutPage.specialists];
                        updated[idx].name = e.target.value;
                        setContent({
                          ...content,
                          aboutPage: { ...content.aboutPage, specialists: updated },
                        });
                      }}
                      className="h-8 text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground">Designation / Role</label>
                    <Input
                      value={doc.role}
                      onChange={(e) => {
                        const updated = [...content.aboutPage.specialists];
                        updated[idx].role = e.target.value;
                        setContent({
                          ...content,
                          aboutPage: { ...content.aboutPage, specialists: updated },
                        });
                      }}
                      className="h-8 text-xs font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-muted-foreground">Specialty</label>
                      <Input
                        value={doc.specialty}
                        onChange={(e) => {
                          const updated = [...content.aboutPage.specialists];
                          updated[idx].specialty = e.target.value;
                          setContent({
                            ...content,
                            aboutPage: { ...content.aboutPage, specialists: updated },
                          });
                        }}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-muted-foreground">Experience</label>
                      <Input
                        value={doc.experience}
                        onChange={(e) => {
                          const updated = [...content.aboutPage.specialists];
                          updated[idx].experience = e.target.value;
                          setContent({
                            ...content,
                            aboutPage: { ...content.aboutPage, specialists: updated },
                          });
                        }}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM FLOATING SAVE BAR */}
      <div className="sticky bottom-4 z-30 p-3 sm:p-4 rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-xl flex items-center justify-between gap-4">
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Any saved updates apply immediately to live visitors.</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={saving || resetting}
            className="h-8 text-xs rounded-xl"
          >
            Discard
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving || resetting}
            className="gap-1.5 h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 rounded-xl shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving Changes..." : "Save All Changes"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
