import React, { useState } from "react";
import { Activity, Minus, X, Maximize2 } from "lucide-react";
import BodyMap from "./BodyMap";
import { BodyPartId } from "@/data/painCategories";
import { cn } from "@/lib/utils";

export interface BodyPartPainLevel {
    selected: boolean;
    painLevel: number;
    notes?: string;
    conditions?: string[];
}

export type PipSize = "sm" | "md" | "lg" | "xl";

export interface BodyMapPipProps {
    bodyPartStates: Record<BodyPartId, BodyPartPainLevel>;
    onPartClick: (partId: BodyPartId) => void;
    bodyView: "front" | "back";
    onViewChange: (view: "front" | "back") => void;
    selectedCount?: number;
    onExpandFull?: () => void;
    onClose?: () => void;
    className?: string;
    defaultMinimized?: boolean;
    size?: PipSize;            // Size preset: "sm", "md", "lg", "xl"
    width?: number;             // Custom width in pixels (optional override)
    figureHeight?: number;      // Custom anatomical doll height in pixels (optional override)
    icon?: React.ReactNode;     // Custom icon (default: Activity pulse wave)
}

// Snug size presets with proportional heights (card width automatically hugs the figure)
const sizePresets: Record<PipSize, { width: number; height: number }> = {
    sm: { width: 95, height: 130 },
    md: { width: 105, height: 160 },
    lg: { width: 118, height: 190 },
    xl: { width: 135, height: 225 },
};

/**
 * Dedicated Picture-in-Picture (PiP) Floating Component for the Anatomical Body Map
 * Snug design with zero excess side margins to wrap cleanly around the anatomical figure.
 */
export function BodyMapPip({
    bodyPartStates,
    onPartClick,
    bodyView,
    onViewChange,
    selectedCount = 0,
    onExpandFull,
    onClose,
    className,
    defaultMinimized = false,
    size = "md",
    width,
    figureHeight,
    icon,
}: BodyMapPipProps) {
    const [isMinimized, setIsMinimized] = useState(defaultMinimized);

    const defaultIcon = <Activity className="w-3.5 h-3.5 text-teal-600 animate-pulse" />;
    const displayIcon = icon ?? defaultIcon;

    // Resolve figure height from preset or prop
    const activePreset = sizePresets[size] || sizePresets.md;
    const resolvedFigureHeight = figureHeight ?? activePreset.height;

    // Compute snug card width to eliminate empty white margins on left and right
    // Figure aspect ratio is 208/504 (~0.413). Minimum header width is ~102px.
    const figureWidth = Math.round(resolvedFigureHeight * (208 / 504));
    const snugCardWidth = Math.max(102, figureWidth + 16);
    const resolvedWidth = width ?? (activePreset.width ? Math.min(activePreset.width, snugCardWidth) : snugCardWidth);

    if (isMinimized) {
        return (
            <div className={cn("fixed bottom-20 right-3 sm:right-6 z-50", className)}>
                <button
                    type="button"
                    onClick={() => setIsMinimized(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xl hover:scale-105 active:scale-95 text-xs font-bold transition-all border border-white/40 animate-in fade-in zoom-in-95"
                    title="Expand Body Map PiP"
                >
                    {icon ? <span className="w-3.5 h-3.5">{icon}</span> : <Activity className="w-3.5 h-3.5 animate-pulse" />}
                    <span>Map ({selectedCount})</span>
                    <Maximize2 className="w-2.5 h-2.5 opacity-80" />
                </button>
            </div>
        );
    }

    return (
        <div
            style={{
                width: `${resolvedWidth}px`,
                maxWidth: `${resolvedWidth}px`,
            }}
            className={cn(
                "fixed bottom-20 right-3 sm:right-6 z-50 bg-card/95 backdrop-blur-xl border-2 border-teal-500/50 shadow-[0_8px_30px_rgba(0,0,0,0.25)] rounded-2xl p-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150 overflow-hidden flex flex-col items-center",
                className
            )}
        >
            {/* PiP Header */}
            <div className="flex items-center justify-between pb-1 border-b border-border/60 w-full px-0.5">
                <div className="flex items-center gap-1">
                    {displayIcon}
                    <span className="text-[10px] font-extrabold text-foreground">Map</span>
                    <span className="px-1 py-0.2 rounded-full bg-teal-50 text-teal-700 text-[8px] font-black border border-teal-200">
                        {selectedCount}
                    </span>
                </div>

                <div className="flex items-center gap-0.5">
                    <button
                        type="button"
                        onClick={() => onViewChange(bodyView === "front" ? "back" : "front")}
                        className="px-1 py-0.5 rounded text-[8px] font-bold bg-muted hover:bg-muted/80 text-foreground transition-colors"
                        title="Flip View"
                    >
                        {bodyView === "front" ? "Back ↻" : "Front ↻"}
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsMinimized(true)}
                        className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="Minimize to Pill"
                    >
                        <Minus className="w-2.5 h-2.5" />
                    </button>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-0.5 rounded text-muted-foreground hover:text-rose-600 transition-colors"
                            title="Close PiP"
                        >
                            <X className="w-2.5 h-2.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* PiP Interactive Body Map Canvas - Snug wrapper with 0 extra horizontal padding */}
            <div className="py-0.5 flex items-center justify-center w-full overflow-hidden">
                <BodyMap
                    bodyPartStates={bodyPartStates}
                    onPartClick={onPartClick}
                    view={bodyView}
                    height={resolvedFigureHeight}
                    className="p-0"
                />
            </div>

            {/* PiP Footer */}
            <div className="pt-0.5 border-t border-border/50 flex items-center justify-between text-[8px] text-muted-foreground w-full px-0.5">
                <span className="capitalize font-bold text-teal-700">
                    {bodyView === "front" ? "Front" : "Back"}
                </span>
                {onExpandFull && (
                    <button
                        type="button"
                        onClick={onExpandFull}
                        className="text-[8px] font-bold text-teal-600 hover:underline flex items-center gap-0.5"
                    >
                        <span>Full</span>
                        <Maximize2 className="w-2 h-2" />
                    </button>
                )}
            </div>
        </div>
    );
}

export default BodyMapPip;
