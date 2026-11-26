"use client";

import React, { useState, useEffect } from "react";
import {
  Tags,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle,
  Home,
  Building,
  Video,
  Stethoscope,
  Sparkles,
  IndianRupee,
  Layers,
  Star,
  Check,
  Percent,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  getPricingMaster,
  updatePricingMaster,
  resetPricingMaster,
  PricingMasterData,
  PackageMasterItem,
  defaultPricingMaster,
} from "@/services/masterApiService";

export default function PricingMasterPage() {
  const [pricing, setPricing] = useState<PricingMasterData>(defaultPricingMaster);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    setLoading(true);
    try {
      const data = await getPricingMaster();
      setPricing(data);
    } catch (err: any) {
      toast.error("Failed to load pricing master. Loaded defaults.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updatePricingMaster(pricing);
      setPricing(updated);
      toast.success("Pricing & Packages Saved!", {
        description: "Clinic session charges and care package rates updated across patient & admin portals.",
      });
    } catch (err: any) {
      toast.error("Failed to save pricing", {
        description: err.message || "An unexpected error occurred.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset all rates and packages to standard clinic defaults?")) {
      return;
    }
    setResetting(true);
    try {
      const res = await resetPricingMaster();
      setPricing(res);
      toast.success("Reset to Defaults", {
        description: "Standard session rates and package prices have been restored.",
      });
    } catch (err: any) {
      toast.error("Reset Failed", {
        description: err.message || "Could not reset pricing.",
      });
    } finally {
      setResetting(false);
    }
  };

  const updateBaseRate = (field: keyof PricingMasterData["baseRates"], value: number) => {
    setPricing((prev) => ({
      ...prev,
      baseRates: {
        ...prev.baseRates,
        [field]: value,
      },
    }));
  };

  const updatePackage = (idx: number, field: keyof PackageMasterItem, value: any) => {
    setPricing((prev) => {
      const updatedPackages = [...prev.packages];
      const target = { ...updatedPackages[idx] };

      if (field === "discountPercent") {
        const discount = Math.max(0, Math.min(100, Number(value) || 0));
        target.discountPercent = discount;

        // Base rates
        const baseClinic = target.originalPricePerSession ?? target.pricePerSession;
        const baseHome = target.originalHomeVisitPricePerSession ?? (target.homeVisitPricePerSession || 1000);

        if (discount > 0) {
          target.originalPricePerSession = baseClinic;
          target.pricePerSession = Math.round(baseClinic * (1 - discount / 100));
          target.originalTotalPrice = baseClinic * target.sessions;
          target.totalPrice = target.pricePerSession * target.sessions;

          target.originalHomeVisitPricePerSession = baseHome;
          target.homeVisitPricePerSession = Math.round(baseHome * (1 - discount / 100));
          target.originalHomeVisitTotalPrice = baseHome * target.sessions;
          target.homeVisitTotalPrice = target.homeVisitPricePerSession * target.sessions;
        } else {
          target.discountPercent = 0;
          target.pricePerSession = baseClinic;
          target.totalPrice = baseClinic * target.sessions;
          target.originalPricePerSession = undefined;
          target.originalTotalPrice = undefined;

          target.homeVisitPricePerSession = baseHome;
          target.homeVisitTotalPrice = baseHome * target.sessions;
          target.originalHomeVisitPricePerSession = undefined;
          target.originalHomeVisitTotalPrice = undefined;
        }
      } else if (field === "pricePerSession") {
        const inputRate = Number(value);
        if (target.discountPercent && target.discountPercent > 0) {
          target.originalPricePerSession = inputRate;
          target.pricePerSession = Math.round(inputRate * (1 - target.discountPercent / 100));
          target.originalTotalPrice = inputRate * target.sessions;
          target.totalPrice = target.pricePerSession * target.sessions;
        } else {
          target.pricePerSession = inputRate;
          target.originalPricePerSession = undefined;
          target.originalTotalPrice = undefined;
          target.totalPrice = inputRate * target.sessions;
        }
      } else if (field === "homeVisitPricePerSession") {
        const inputRate = Number(value);
        if (target.discountPercent && target.discountPercent > 0) {
          target.originalHomeVisitPricePerSession = inputRate;
          target.homeVisitPricePerSession = Math.round(inputRate * (1 - target.discountPercent / 100));
          target.originalHomeVisitTotalPrice = inputRate * target.sessions;
          target.homeVisitTotalPrice = target.homeVisitPricePerSession * target.sessions;
        } else {
          target.homeVisitPricePerSession = inputRate;
          target.originalHomeVisitPricePerSession = undefined;
          target.originalHomeVisitTotalPrice = undefined;
          target.homeVisitTotalPrice = inputRate * target.sessions;
        }
      } else if (field === "sessions") {
        const sess = Math.max(1, Number(value) || 1);
        target.sessions = sess;
        const baseClinic = target.originalPricePerSession ?? target.pricePerSession;
        const baseHome = target.originalHomeVisitPricePerSession ?? (target.homeVisitPricePerSession || 1000);

        if (target.discountPercent && target.discountPercent > 0) {
          target.originalTotalPrice = baseClinic * sess;
          target.totalPrice = target.pricePerSession * sess;
          target.originalHomeVisitTotalPrice = baseHome * sess;
          target.homeVisitTotalPrice = target.homeVisitPricePerSession * sess;
        } else {
          target.totalPrice = sess * target.pricePerSession;
          target.homeVisitTotalPrice = sess * (target.homeVisitPricePerSession || 1000);
        }
      } else {
        (target as any)[field] = value;
      }

      updatedPackages[idx] = target;
      return { ...prev, packages: updatedPackages };
    });
  };

  const addPackage = () => {
    const newId = `custom_pkg_${Date.now()}`;
    const newPackage: PackageMasterItem = {
      id: newId,
      title: "New Care Package",
      badge: "Specialized Protocol",
      sessions: 8,
      pricePerSession: pricing.baseRates.inClinicSession || 700,
      totalPrice: (pricing.baseRates.inClinicSession || 700) * 8,
      homeVisitPricePerSession: pricing.baseRates.homeVisitSession || 1000,
      homeVisitTotalPrice: (pricing.baseRates.homeVisitSession || 1000) * 8,
      description: "Comprehensive physiotherapy care tailored for patient recovery goals.",
      features: [
        "Structured rehabilitation sessions",
        "Clinical progress assessments",
        "Targeted exercise regimen monitoring",
      ],
      recommended: false,
      isActive: true,
    };

    setPricing((prev) => ({
      ...prev,
      packages: [...prev.packages, newPackage],
    }));
  };

  const removePackage = (idx: number) => {
    if (pricing.packages.length <= 1) {
      toast.warning("At least one package is required.");
      return;
    }
    setPricing((prev) => ({
      ...prev,
      packages: prev.packages.filter((_, i) => i !== idx),
    }));
  };

  const addFeatureToPackage = (pkgIdx: number) => {
    const pkg = pricing.packages[pkgIdx];
    const updatedFeatures = [...pkg.features, "Custom rehabilitation benefit"];
    updatePackage(pkgIdx, "features", updatedFeatures);
  };

  const removeFeatureFromPackage = (pkgIdx: number, featIdx: number) => {
    const pkg = pricing.packages[pkgIdx];
    const updatedFeatures = pkg.features.filter((_, i) => i !== featIdx);
    updatePackage(pkgIdx, "features", updatedFeatures);
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-2xl border-4 border-teal-600 border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground font-semibold">Loading Pricing & Package Master...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* EXECUTIVE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent border border-teal-500/20 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
            <Tags className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                Pricing & Packages Master
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                Billing Engine
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Configure clinic fees for In-Clinic, Home-Visit, and Online sessions, and manage multi-session care plans.
            </p>
          </div>
        </div>

        {/* TOP ACTIONS */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={resetting || saving}
            className="gap-1.5 h-9 text-xs rounded-xl border-border hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? "animate-spin" : ""}`} />
            <span>Reset Defaults</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving || resetting}
            className="gap-1.5 h-9 text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 rounded-xl shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : "Save Pricing & Packages"}</span>
          </Button>
        </div>
      </div>

      {/* SECTION 1: BASE CLINICAL RATES (MODALITY CHARGES) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            <h2 className="text-base font-bold text-foreground">Base Clinical Session Rates & Modality Fees</h2>
          </div>
          <span className="text-xs text-muted-foreground font-semibold">Standard Rates per Visit</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {([
            {
              key: "inClinicSession" as const,
              label: "In-Clinic Session",
              badge: "Standard",
              icon: Building,
              desc: "Standard 45-min treatment session conducted at the clinic.",
            },
            {
              key: "homeVisitSession" as const,
              label: "Home Visit Care",
              badge: "Home Care",
              icon: Home,
              desc: "Physiotherapist travel & in-home rehabilitation visit.",
            },
            {
              key: "onlineSession" as const,
              label: "Online Virtual Session",
              badge: "Remote",
              icon: Video,
              desc: "1-on-1 virtual tele-rehab and guided exercise consultation.",
            },
            {
              key: "initialConsultation" as const,
              label: "Initial Consultation",
              badge: "Assessment",
              icon: Stethoscope,
              desc: "First-time full clinical body assessment & recovery roadmap.",
            },
          ] as const).map(({ key, label, badge, icon: Icon, desc }) => (
            <div
              key={key}
              className="p-4 rounded-2xl bg-emerald-500/[0.05] border border-emerald-500/20 space-y-2 transition-all hover:border-emerald-500/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  {label}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  {badge}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-black text-muted-foreground">₹</span>
                <Input
                  type="number"
                  min={0}
                  value={pricing.baseRates[key]}
                  onChange={(e) => updateBaseRate(key, Number(e.target.value))}
                  className="pl-7 h-9 text-sm font-black text-foreground focus-visible:ring-emerald-500"
                />
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: REHABILITATION CARE PACKAGES */}
      <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            <h2 className="text-base font-bold text-foreground">Rehabilitation Care Packages</h2>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPackage}
            className="gap-1.5 h-8 text-xs font-bold rounded-xl border-teal-500/40 text-teal-700 dark:text-teal-300 hover:bg-teal-500/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Package</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {pricing.packages.map((pkg, idx) => (
            <div
              key={pkg.id || idx}
              className={`p-5 sm:p-6 rounded-3xl border-2 transition-all space-y-4 relative ${
                pkg.recommended
                  ? "border-teal-600 bg-teal-500/[0.02] shadow-md ring-1 ring-teal-500/20"
                  : "border-border/80 bg-background"
              }`}
            >
              {/* Top Row: Package Title, Sessions Count, Recommended Toggle */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Input
                      value={pkg.title}
                      onChange={(e) => updatePackage(idx, "title", e.target.value)}
                      placeholder="Package Title"
                      className="h-8 text-sm font-black"
                    />
                    {pkg.recommended && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-extrabold uppercase shrink-0 inline-flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" /> Recommended
                      </span>
                    )}
                    {pkg.discountPercent && pkg.discountPercent > 0 ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-extrabold uppercase shrink-0 inline-flex items-center gap-1">
                        <Tag className="w-3 h-3" /> {pkg.discountPercent}% OFF
                      </span>
                    ) : null}
                  </div>
                  <Input
                    value={pkg.badge}
                    onChange={(e) => updatePackage(idx, "badge", e.target.value)}
                    placeholder="Badge / Tagline (e.g. Most Popular Rehab)"
                    className="h-7 text-xs font-semibold text-teal-700 dark:text-teal-300"
                  />
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    title={pkg.recommended ? "Remove Recommended Badge" : "Mark as Recommended"}
                    onClick={() => updatePackage(idx, "recommended", !pkg.recommended)}
                    className={`p-1.5 rounded-xl border transition-all ${
                      pkg.recommended
                        ? "bg-amber-500 text-white border-amber-600 shadow-2xs"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    title="Delete Package"
                    onClick={() => removePackage(idx)}
                    className="p-1.5 rounded-xl border border-transparent text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Sessions, Discount, Clinic Price, Home Visit Price Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-muted/25 border border-border/70">
                {/* Total Sessions */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Layers className="w-3 h-3 text-teal-600" />
                    Sessions
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={pkg.sessions}
                    onChange={(e) => updatePackage(idx, "sessions", Number(e.target.value))}
                    className="h-8 text-xs font-black"
                  />
                  <div className="text-[10px] text-muted-foreground font-semibold">
                    Count: <strong className="text-foreground">{pkg.sessions} visits</strong>
                  </div>
                </div>

                {/* Discount Percentage */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <Percent className="w-3 h-3 text-emerald-600" />
                    Discount (%)
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={pkg.discountPercent ?? 0}
                      onChange={(e) => updatePackage(idx, "discountPercent", Number(e.target.value))}
                      className="h-8 text-xs font-black text-emerald-700 dark:text-emerald-400 pr-6"
                    />
                    <span className="absolute right-2.5 top-2 text-[11px] font-bold text-muted-foreground">%</span>
                  </div>
                  <div className="text-[10px] font-semibold text-muted-foreground truncate">
                    {pkg.discountPercent && pkg.discountPercent > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
                        <Check className="w-3 h-3" /> {pkg.discountPercent}% Off Applied
                      </span>
                    ) : (
                      <span>Standard rate</span>
                    )}
                  </div>
                </div>

                {/* In-Clinic Pricing */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1">
                    <Building className="w-3 h-3 text-teal-600" />
                    In-Clinic (₹/sess)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={pkg.discountPercent && pkg.discountPercent > 0 ? (pkg.originalPricePerSession ?? pkg.pricePerSession) : pkg.pricePerSession}
                    onChange={(e) => updatePackage(idx, "pricePerSession", Number(e.target.value))}
                    className="h-8 text-xs font-black"
                  />
                  <div className="text-[10px] text-muted-foreground font-semibold">
                    {pkg.discountPercent && pkg.discountPercent > 0 ? (
                      <div className="flex flex-col">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          Eff: ₹{pkg.pricePerSession}/sess
                        </span>
                        <span>
                          Total: <strong className="text-foreground">₹{pkg.totalPrice}</strong>{" "}
                          <span className="line-through text-muted-foreground/60 text-[9px]">
                            ₹{pkg.originalTotalPrice}
                          </span>
                        </span>
                      </div>
                    ) : (
                      <span>Total: <strong className="text-foreground">₹{pkg.totalPrice}</strong></span>
                    )}
                  </div>
                </div>

                {/* Home-Visit Pricing */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1">
                    <Home className="w-3 h-3 text-amber-600" />
                    Home Care (₹/sess)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={pkg.discountPercent && pkg.discountPercent > 0 ? (pkg.originalHomeVisitPricePerSession ?? pkg.homeVisitPricePerSession ?? 1000) : (pkg.homeVisitPricePerSession || 1000)}
                    onChange={(e) => updatePackage(idx, "homeVisitPricePerSession", Number(e.target.value))}
                    className="h-8 text-xs font-black text-amber-700 dark:text-amber-300"
                  />
                  <div className="text-[10px] text-muted-foreground font-semibold">
                    {pkg.discountPercent && pkg.discountPercent > 0 ? (
                      <div className="flex flex-col">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          Eff: ₹{pkg.homeVisitPricePerSession}/sess
                        </span>
                        <span>
                          Total: <strong className="text-amber-800 dark:text-amber-200">₹{pkg.homeVisitTotalPrice}</strong>{" "}
                          <span className="line-through text-muted-foreground/60 text-[9px]">
                            ₹{pkg.originalHomeVisitTotalPrice}
                          </span>
                        </span>
                      </div>
                    ) : (
                      <span>Total: <strong className="text-amber-800 dark:text-amber-200">₹{pkg.homeVisitTotalPrice || (pkg.sessions * 1000)}</strong></span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Package Clinical Scope & Description
                </label>
                <Textarea
                  value={pkg.description}
                  onChange={(e) => updatePackage(idx, "description", e.target.value)}
                  rows={2}
                  className="text-xs"
                />
              </div>

              {/* Package Features List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Included Benefits & Features
                  </label>
                  <button
                    type="button"
                    onClick={() => addFeatureToPackage(idx)}
                    className="text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Add Benefit
                  </button>
                </div>

                <div className="space-y-1.5">
                  {pkg.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 p-1.5 rounded-xl bg-muted/20 border border-border/60">
                      <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <Input
                        value={feat}
                        onChange={(e) => {
                          const updated = [...pkg.features];
                          updated[fIdx] = e.target.value;
                          updatePackage(idx, "features", updated);
                        }}
                        className="h-7 text-xs border-0 bg-transparent shadow-none px-1"
                      />
                      {pkg.features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFeatureFromPackage(idx, fIdx)}
                          className="p-1 text-muted-foreground hover:text-rose-600 shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM FLOATING SAVE BAR */}
      <div className="sticky bottom-4 z-30 p-3 sm:p-4 rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-xl flex items-center justify-between gap-4">
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Rates take effect immediately across online bookings and package checkouts.</span>
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
            <span>{saving ? "Saving..." : "Save Pricing & Packages"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
