"use client";

import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { painCategories, BodyPartId } from "@/data/painCategories";
import { cn } from "@/lib/utils";
import { 
  Smile, 
  Dumbbell, 
  Activity, 
  ShieldAlert, 
  Footprints, 
  Layers, 
  ChevronDown, 
  ChevronUp,
  Search,
  ChevronsUpDown
} from "lucide-react";

interface BodyPartPainLevel {
  selected: boolean;
  painLevel: number;
  side?: "left" | "right" | "both";
}

interface BodyPartSelectorProps {
  bodyPartStates: Record<BodyPartId, BodyPartPainLevel>;
  onTogglePart: (partId: BodyPartId) => void;
  onPainLevelChange: (partId: BodyPartId, level: number) => void;
  onSideChange: (partId: BodyPartId, side: "left" | "right" | "both") => void;
  selectedConditions: Record<string, string[]>;
  onConditionToggle: (partId: string, condition: string) => void;
  onConditionCustomChange?: (partId: string, customText: string) => void;
  onViewChange?: (view: "front" | "back") => void;
  className?: string;
}

export interface BodyRegionCategory {
  id: string;
  name: string;
  shortLabel: string;
  icon: any;
  parts: BodyPartId[];
  description: string;
}

export const bodyRegionCategories: BodyRegionCategory[] = [
  {
    id: "head_neck",
    name: "Head & Neck",
    shortLabel: "Head & Neck",
    icon: Smile,
    parts: ["neck"],
    description: "Cervical spine, neck stiffness, spasms & postural strain"
  },
  {
    id: "arms",
    name: "Arms & Shoulders",
    shortLabel: "Arms",
    icon: Dumbbell,
    parts: ["shoulder", "biceps", "elbow", "forearm", "wrist", "hand"],
    description: "Shoulder joint, biceps, tennis/golfer elbow, wrist & fingers"
  },
  {
    id: "upper_body",
    name: "Upper Body & Chest / Torso",
    shortLabel: "Upper Body",
    icon: Activity,
    parts: ["chest", "abdomen"],
    description: "Chest wall, rib cage, thoracic front & abdominal core"
  },
  {
    id: "back_spine",
    name: "Back & Spine (Upper Back, Mid Back, Spine, Lower Back & Waist)",
    shortLabel: "Back & Spine",
    icon: ShieldAlert,
    parts: ["back", "mid_back", "spine", "waist"],
    description: "Upper back, mid back thoracic, spinal column, lumbar lower back & waist"
  },
  {
    id: "legs",
    name: "Legs & Lower Limbs",
    shortLabel: "Legs",
    icon: Footprints,
    parts: ["hip", "glute", "thigh", "knee", "shin", "calf", "ankle", "foot"],
    description: "Hip joint, glutes, quads/hamstrings, knee, shin, calf, ankle & feet"
  }
];

const sidedBodyParts: BodyPartId[] = [
  "shoulder", "biceps", "elbow", "forearm", "wrist", "hand",
  "hip", "thigh", "knee", "shin", "calf", "foot", "ankle"
];

const getPainLevelLabel = (level: number) => {
  if (level <= 3) return "Mild";
  if (level <= 6) return "Moderate";
  return "Severe";
};

const getPainLevelColor = (level: number) => {
  if (level <= 3) return "bg-amber-400";
  if (level <= 6) return "bg-orange-500";
  return "bg-rose-500";
};

const getPainLevelTextColor = (level: number) => {
  if (level <= 3) return "text-amber-600 bg-amber-50 border-amber-200";
  if (level <= 6) return "text-orange-600 bg-orange-50 border-orange-200";
  return "text-rose-600 bg-rose-50 border-rose-200";
};

const BodyPartSelector = ({
  bodyPartStates,
  onTogglePart,
  onPainLevelChange,
  onSideChange,
  selectedConditions,
  onConditionToggle,
  onConditionCustomChange,
  onViewChange,
  className,
}: BodyPartSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [otherInputValues, setOtherInputValues] = useState<Record<string, string>>({});

  const handleOtherTextChange = (partId: string, text: string) => {
    setOtherInputValues((prev) => ({ ...prev, [partId]: text }));
    if (onConditionCustomChange) {
      onConditionCustomChange(partId, text);
    }
  };
  
  // Collapsed categories state: default all closed (collapsed)
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({
    head_neck: true,
    arms: true,
    upper_body: true,
    back_spine: true,
    legs: true,
  });

  const toggleCategoryCollapse = (catId: string) => {
    const willBeOpen = Boolean(collapsedCategories[catId]);
    if (willBeOpen) {
      if (catId === "back_spine") {
        onViewChange?.("back");
      } else if (catId === "upper_body" || catId === "arms") {
        onViewChange?.("front");
      }
    }
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleExpandAll = () => {
    setCollapsedCategories({
      head_neck: false,
      arms: false,
      upper_body: false,
      back_spine: false,
      legs: false,
    });
  };

  const handleCollapseAll = () => {
    setCollapsedCategories({
      head_neck: true,
      arms: true,
      upper_body: true,
      back_spine: true,
      legs: true,
    });
  };

  // Auto-expand category if a body part in it is selected
  useEffect(() => {
    bodyRegionCategories.forEach((cat) => {
      const hasSelectedPart = cat.parts.some((p) => bodyPartStates[p]?.selected);
      if (hasSelectedPart && collapsedCategories[cat.id]) {
        setCollapsedCategories((prev) => ({ ...prev, [cat.id]: false }));
      }
    });
  }, [bodyPartStates]);

  const totalSelectedCount = Object.values(bodyPartStates).filter((s) => s.selected).length;

  const filteredCategories = bodyRegionCategories.filter((cat) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      cat.name.toLowerCase().includes(query) ||
      cat.parts.some((p) => {
        const c = painCategories[p];
        return (
          p.toLowerCase().includes(query) ||
          (c && c.name.toLowerCase().includes(query)) ||
          (c && c.conditions.some((cond) => cond.toLowerCase().includes(query)))
        );
      })
    );
  });

  const allAreCollapsed = Object.values(collapsedCategories).every(Boolean);

  return (
    <div className={cn("h-full flex flex-col p-2 sm:p-2.5 overflow-hidden", className)}>
      {/* Pinned Top Controls: Header, Stats & Search Bar */}
      <div className="shrink-0 space-y-2 pb-2 border-b border-border/70">
        {/* Header with Title, Stats & Expand/Collapse */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-display font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              Select Pain Areas by Body Region
            </h3>
            <p className="text-[10px] sm:text-[10.5px] text-muted-foreground">
              Click category headers to expand / collapse sections
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {totalSelectedCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 font-bold text-xs border border-teal-500/30">
                {totalSelectedCount} {totalSelectedCount === 1 ? "Area" : "Areas"} Selected
              </span>
            )}
            <button
              type="button"
              onClick={allAreCollapsed ? handleExpandAll : handleCollapseAll}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 transition-colors"
            >
              <ChevronsUpDown className="w-3.5 h-3.5" />
              <span>{allAreCollapsed ? "Expand All" : "Collapse All"}</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search specific muscle, joint or condition (e.g. frozen shoulder, sciatica, knee)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-muted/30 border border-input focus:ring-1 focus:ring-teal-500 focus:outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Categorized Body Regions Accordion/List (Scrolls internally) */}
      <div className="space-y-3 pt-2.5 flex-1 min-h-0 overflow-y-auto custom-slim-scrollbar pr-1">
        {filteredCategories.map((cat) => {
          const Icon = cat.icon;
          const isCollapsed = Boolean(collapsedCategories[cat.id]);
          const partsToRender = cat.parts.filter((partId) => {
            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase();
            const c = painCategories[partId];
            return (
              partId.toLowerCase().includes(query) ||
              (c && c.name.toLowerCase().includes(query)) ||
              (c && c.conditions.some((cond) => cond.toLowerCase().includes(query)))
            );
          });

          if (partsToRender.length === 0) return null;

          const categorySelectedCount = cat.parts.filter((p) => bodyPartStates[p]?.selected).length;

          return (
            <div key={cat.id} className="rounded-2xl border border-border/80 bg-card overflow-hidden transition-all shadow-sm">
              {/* Category Group Header (Clickable for Collapse/Expand) */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleCategoryCollapse(cat.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    toggleCategoryCollapse(cat.id);
                  }
                }}
                className={cn(
                  "flex items-center justify-between px-4 py-3 cursor-pointer transition-colors select-none",
                  isCollapsed
                    ? "bg-muted/30 hover:bg-muted/60"
                    : "bg-muted/50 hover:bg-muted/70 border-b border-border/60"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      {cat.name}
                    </h4>
                    <span className="text-[11px] text-muted-foreground hidden sm:inline">
                      {cat.parts.length} anatomical areas
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {categorySelectedCount > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                      {categorySelectedCount} selected
                    </span>
                  )}
                  <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center text-muted-foreground border border-border/60">
                    {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>

              {/* Body Parts Under This Category (Hidden if Collapsed) */}
              {!isCollapsed && (
                <div className="p-3.5 space-y-2.5 bg-muted/10 animate-in fade-in duration-200">
                  {partsToRender.map((partId) => {
                    const category = painCategories[partId];
                    const state = bodyPartStates[partId] || { selected: false, painLevel: 1 };
                    const conditions = selectedConditions[partId] || [];

                    return (
                      <div
                        key={partId}
                        className={cn(
                          "rounded-xl border-2 p-3.5 transition-all duration-200",
                          state.selected
                            ? "border-teal-600 bg-teal-500/5 shadow-sm"
                            : "border-border/80 bg-background hover:bg-muted/40 hover:border-border"
                        )}
                      >
                        {/* Checkbox and Label Header */}
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={partId}
                            checked={state.selected}
                            onCheckedChange={() => onTogglePart(partId)}
                            className="h-5 w-5 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                          />
                          <Label
                            htmlFor={partId}
                            className="font-bold text-sm cursor-pointer flex-1 text-foreground"
                          >
                            {category?.name || partId}
                          </Label>
                          {state.selected && (
                            <span
                              className={cn(
                                "text-xs font-bold px-2.5 py-0.5 rounded-full border",
                                getPainLevelTextColor(state.painLevel)
                              )}
                            >
                              {getPainLevelLabel(state.painLevel)} ({state.painLevel}/10)
                            </span>
                          )}
                        </div>

                        {/* Pain Intensity Slider and Conditions (visible when selected) */}
                        {state.selected && (
                          <div className="mt-3.5 pt-3 border-t border-border/60 space-y-3.5 animate-in fade-in duration-200">
                            {/* Pain Intensity */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-foreground">Pain Intensity:</span>
                                <span className="font-bold text-teal-700 dark:text-teal-300">
                                  {state.painLevel} / 10 ({getPainLevelLabel(state.painLevel)})
                                </span>
                              </div>

                              <div className="relative pt-1">
                                {/* Background Track */}
                                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                  <div
                                    className={cn("h-full transition-all", getPainLevelColor(state.painLevel))}
                                    style={{ width: `${(state.painLevel / 10) * 100}%` }}
                                  />
                                </div>

                                {/* Invisible Range Input */}
                                <input
                                  type="range"
                                  min="1"
                                  max="10"
                                  value={state.painLevel}
                                  onChange={(e) => onPainLevelChange(partId, parseInt(e.target.value))}
                                  className="absolute top-0 left-0 w-full h-4 opacity-0 cursor-pointer"
                                />
                              </div>

                              <div className="flex justify-between text-[10px] text-muted-foreground font-semibold px-0.5">
                                <span>1 (Mild)</span>
                                <span>5 (Moderate)</span>
                                <span>10 (Severe)</span>
                              </div>
                            </div>

                            {/* Side Selection for Sided Body Parts */}
                            {sidedBodyParts.includes(partId) && (
                              <div className="space-y-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                                  Affected Side
                                </span>
                                <div className="flex gap-1.5 p-1 bg-muted/60 rounded-lg border border-border/60">
                                  {(["left", "right", "both"] as const).map((side) => (
                                    <label
                                      key={side}
                                      className={cn(
                                        "flex-1 text-center py-1 text-xs font-bold rounded-md cursor-pointer transition-all",
                                        (state.side || "both") === side
                                          ? "bg-teal-600 text-white shadow-sm"
                                          : "hover:bg-muted text-muted-foreground"
                                      )}
                                    >
                                      <input
                                        type="radio"
                                        name={`${partId}-side`}
                                        value={side}
                                        checked={(state.side || "both") === side}
                                        onChange={() => onSideChange(partId, side)}
                                        className="sr-only"
                                      />
                                      {side === "both" ? "Both Sides" : side.charAt(0).toUpperCase() + side.slice(1)}
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Conditions Selection */}
                            {category?.conditions && category.conditions.length > 0 && (
                              <div className="pt-2 border-t border-border/50 space-y-1.5">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                                  Specific Conditions & Symptoms:
                                </Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  {category.conditions.map((condition) => {
                                    const isOther = condition === "Other";
                                    const isConditionSelected = isOther
                                      ? conditions.some((c) => c === "Other" || c.startsWith("Other:"))
                                      : conditions.includes(condition);

                                    return (
                                      <div
                                        key={condition}
                                        onClick={() => onConditionToggle(partId, condition)}
                                        className={cn(
                                          "flex items-center space-x-2 p-1.5 rounded-lg cursor-pointer border text-xs transition-colors",
                                          isConditionSelected
                                            ? "bg-teal-500/10 border-teal-500/40 text-teal-900 dark:text-teal-200 font-semibold"
                                            : "bg-background border-border hover:bg-muted/50 text-foreground"
                                        )}
                                      >
                                        <Checkbox
                                          id={`${partId}-${condition}`}
                                          checked={isConditionSelected}
                                          onCheckedChange={() => onConditionToggle(partId, condition)}
                                          className="h-3.5 w-3.5 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600 pointer-events-none"
                                        />
                                        <span className="leading-tight select-none">
                                          {condition}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Custom Text Input for 'Other' Condition */}
                                {conditions.some((c) => c === "Other" || c.startsWith("Other:")) && (
                                  <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-150">
                                    <div className="flex items-center gap-2 p-2 rounded-xl bg-teal-500/5 border border-teal-500/20">
                                      <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 shrink-0">
                                        Specify Other:
                                      </span>
                                      <input
                                        type="text"
                                        placeholder="Please specify other symptoms or condition..."
                                        value={
                                          otherInputValues[partId] ??
                                          (conditions.find((c) => c.startsWith("Other: "))?.replace("Other: ", "") || "")
                                        }
                                        onChange={(e) => handleOtherTextChange(partId, e.target.value)}
                                        className="flex-1 bg-background border border-input rounded-lg px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BodyPartSelector;
