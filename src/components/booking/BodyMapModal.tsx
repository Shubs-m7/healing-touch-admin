import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Activity, Info } from "lucide-react";
import BodyMap from "./BodyMap";
import { BodyPartId } from "@/data/painCategories";
import { cn } from "@/lib/utils";

export interface BodyPartPainLevel {
    selected: boolean;
    painLevel: number;
    notes?: string;
    conditions?: string[];
}

export interface BodyMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    bodyPartStates: Record<BodyPartId, BodyPartPainLevel>;
    onPartClick: (partId: BodyPartId) => void;
    bodyView: "front" | "back";
    onViewChange: (view: "front" | "back") => void;
    selectedCount?: number;
    title?: string;
}

export interface BodyMapTriggerButtonProps {
    onClick: () => void;
    selectedCount?: number;
    className?: string;
}

/**
 * Reusable floating or inline trigger button to launch the Body Map Modal
 */
export function BodyMapTriggerButton({
    onClick,
    selectedCount = 0,
    className,
}: BodyMapTriggerButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xl hover:scale-105 active:scale-95 text-xs font-bold transition-all border border-white/30 animate-in fade-in zoom-in-95",
                className
            )}
        >
            <Activity className="w-4 h-4" />
            <span>View Body Map</span>
            {selectedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-white/25 text-[10px] font-black">
                    {selectedCount}
                </span>
            )}
        </button>
    );
}

/**
 * Dedicated, self-contained Body Map Modal Component
 * Displays a touch-friendly, responsive anatomical figure with Front/Back switching
 */
export function BodyMapModal({
    isOpen,
    onClose,
    bodyPartStates,
    onPartClick,
    bodyView,
    onViewChange,
    selectedCount = 0,
    title = "Interactive Body Map",
}: BodyMapModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[94vw] max-w-md max-h-[92vh] p-4 sm:p-6 bg-card/98 backdrop-blur-2xl border-2 border-teal-500/40 shadow-2xl rounded-3xl z-[70] flex flex-col">
                <DialogTitle className="text-base font-bold flex items-center justify-between border-b border-border/60 pb-2.5">
                    <span className="flex items-center gap-2 text-foreground">
                        <Activity className="w-4 h-4 text-teal-600" />
                        {title}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-extrabold border border-teal-200">
                        {selectedCount} Selected
                    </span>
                </DialogTitle>
                <DialogDescription className="sr-only">
                    Interactive anatomical body map modal to select and view affected areas.
                </DialogDescription>

                {/* Front / Back View Switcher */}
                <div className="flex rounded-xl bg-muted p-1 border border-border/60 my-2">
                    <button
                        type="button"
                        onClick={() => onViewChange("front")}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            bodyView === "front"
                                ? "bg-teal-600 text-white shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        Anterior (Front View)
                    </button>
                    <button
                        type="button"
                        onClick={() => onViewChange("back")}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            bodyView === "back"
                                ? "bg-teal-600 text-white shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        Posterior (Back View)
                    </button>
                </div>

                {/* Body Map Canvas */}
                <div className="flex-1 w-full flex items-center justify-center py-2 h-[380px] max-h-[50vh] overflow-hidden">
                    <BodyMap
                        bodyPartStates={bodyPartStates}
                        onPartClick={onPartClick}
                        view={bodyView}
                        height={360}
                    />
                </div>

                <p className="text-center text-[11px] text-muted-foreground mt-1 font-medium flex items-center justify-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Tap any muscle or joint to toggle selection</span>
                </p>

                {/* Action Buttons */}
                <div className="mt-3 pt-3 border-t border-border/60">
                    <Button
                        type="button"
                        variant="hero"
                        size="sm"
                        onClick={onClose}
                        className="w-full text-xs font-bold"
                    >
                        Done / Return to Categories
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default BodyMapModal;
