"use client";

import { useMemo } from "react";
import DetailedBodyMap from "./DetailedBodyMap";
import { BodyPartId } from "@/data/painCategories";
import { cn } from "@/lib/utils";

interface BodyPartPainLevel {
  selected: boolean;
  painLevel: number;
  side?: "left" | "right" | "both";
}

interface BodyMapProps {
  bodyPartStates: Record<BodyPartId, BodyPartPainLevel>;
  onPartClick: (part: BodyPartId, side?: "left" | "right") => void;
  view: "front" | "back";
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
}

// Sided body parts that have distinct left and right anatomical segments
const sidedParts: BodyPartId[] = [
  "shoulder", "biceps", "elbow", "forearm", "wrist", "hand",
  "hip", "thigh", "knee", "shin", "calf", "foot", "ankle"
];

// Reverse mapping: body part to associated muscles (SVG IDs)
const partToMusclesMap: Record<BodyPartId, string[]> = {
  neck: ['head', 'head-back', 'nape'],
  shoulder: ['left-shoulder', 'right-shoulder', 'shoulder-back-left', 'shoulder-back-right'],
  chest: ['chest'],
  spine: ['column'], // Spine is its own separate category
  biceps: ['left-arm-bicep', 'right-arm-bicep', 'tricep-left', 'tricep-right'],
  elbow: ['left-arm-elbow', 'right-arm-elbow'],
  forearm: ['left-arm-forearm', 'right-arm-forearm', 'forearm-back-left', 'forearm-back-right'],
  wrist: ['left-wrist', 'right-wrist', 'hand-back-left', 'hand-back-right'], // Dedicated wrist joint
  hand: ['left-hand', 'right-hand', 'hand-back-left', 'hand-back-right'],
  back: ['upperback-left', 'upperback-right', 'clavicule-left', 'clavicule-right'], // Upper Back
  mid_back: ['midback-left', 'midback-right'], // Mid Back
  waist: ['loin'], // Waist / Lower Back / Loin
  abdomen: ['stomach'],
  hip: ['left-hip', 'right-hip'],
  glute: ['buttock'],
  thigh: ['left-thigh', 'right-thigh', 'thigh-left', 'thigh-right'],
  knee: ['left-knee', 'right-knee'],
  shin: ['left-shin', 'right-shin'],
  calf: ['calf-left', 'calf-right'],
  ankle: ['left-ankle', 'right-ankle', 'foot-left', 'foot-right'],
  foot: ['left-foot', 'right-foot', 'foot-left', 'foot-right'],
};

// Get color based on pain level
const getPainLevelColor = (painLevel: number): string => {
  if (painLevel <= 3) return "#EAB308"; // Yellow - Mild
  if (painLevel <= 6) return "#F97316"; // Orange - Moderate
  return "#EF4444"; // Red - Severe
};

const BodyMap = ({ bodyPartStates, onPartClick, view, height, style, className }: BodyMapProps) => {
  // Build data array for highlighting with pain levels
  const { data, colorMap } = useMemo(() => {
    const exercises: { name: string; muscles: string[] }[] = [];
    const muscleColorMap: Record<string, string> = {};

    Object.entries(bodyPartStates).forEach(([partId, state]) => {
      if (state.selected) {
        let muscles = partToMusclesMap[partId as BodyPartId] || [];
        const isSided = sidedParts.includes(partId as BodyPartId);

        // Filter muscles strictly based on selected side
        if (isSided) {
          if (state.side === 'left') {
            muscles = muscles.filter(m => m.includes('left'));
          } else if (state.side === 'right') {
            muscles = muscles.filter(m => m.includes('right'));
          }
        }

        exercises.push({
          name: partId,
          muscles: muscles,
        });

        // Map colors for all active muscles for this part
        const color = getPainLevelColor(state.painLevel);
        muscles.forEach(muscle => {
          muscleColorMap[muscle] = color;
        });

        // ONLY assign the generic partId if it is NOT a sided part OR if both sides are selected!
        if (!isSided || state.side === 'both' || !state.side) {
          muscleColorMap[partId] = color;
        }
      }
    });

    return { data: exercises, colorMap: muscleColorMap };
  }, [bodyPartStates]);

  const handleClick = (muscle: string) => {
    // Reverse lookup from muscle to body part
    const paperDollMapping: Record<string, BodyPartId> = {
      'head': 'neck',
      'neck': 'neck',
      'clavicule-left': 'back',
      'clavicule-right': 'back',
      'shoulder-back-left': 'shoulder',
      'shoulder-back-right': 'shoulder',
      'left-shoulder': 'shoulder',
      'right-shoulder': 'shoulder',
      'deltoids': 'shoulder',
      'chest': 'chest',
      'abs': 'abdomen',
      'stomach': 'abdomen',
      'obliques': 'waist',
      'loin': 'waist',
      'upperback-left': 'back',
      'upperback-right': 'back',
      'midback-left': 'mid_back',
      'midback-right': 'mid_back',
      'back-left': 'back',
      'back-right': 'back',
      'back': 'mid_back',
      'trapezius': 'back',
      'column': 'spine',
      'left-arm-bicep': 'biceps',
      'right-arm-bicep': 'biceps',
      'biceps': 'biceps',
      'tricep-left': 'biceps',
      'tricep-right': 'biceps',
      'left-arm-forearm': 'forearm',
      'right-arm-forearm': 'forearm',
      'forearm-back-left': 'forearm',
      'forearm-back-right': 'forearm',
      'left-arm-elbow': 'elbow',
      'right-arm-elbow': 'elbow',
      'left-wrist': 'wrist',
      'right-wrist': 'wrist',
      'left-hand': 'hand',
      'right-hand': 'hand',
      'hand-back-left': 'hand',
      'hand-back-right': 'hand',
      'hands': 'hand',
      'left-hip': 'hip',
      'right-hip': 'hip',
      'buttock': 'glute',
      'glutes': 'glute',
      'left-thigh': 'thigh',
      'right-thigh': 'thigh',
      'thighs': 'thigh',
      'left-knee': 'knee',
      'right-knee': 'knee',
      'knees': 'knee',
      'left-shin': 'shin',
      'right-shin': 'shin',
      'calf-left': 'calf',
      'calf-right': 'calf',
      'calves': 'calf',
      'left-ankle': 'ankle',
      'right-ankle': 'ankle',
      'ankles': 'ankle',
      'left-foot': 'foot',
      'right-foot': 'foot',
      'feet': 'foot',
    };

    const mappedPart = paperDollMapping[muscle];

    if (mappedPart) {
      const side: "left" | "right" | undefined = 
        muscle.includes('left') ? "left" : 
        muscle.includes('right') ? "right" : 
        undefined;
      onPartClick(mappedPart, side);
    }
  };

  return (
    <div className={cn("w-full h-full flex items-center justify-center p-1 sm:p-2", className)}>
      <DetailedBodyMap
        type={view === "front" ? "anterior" : "posterior"}
        data={data}
        colorMap={colorMap}
        height={height}
        style={style}
        onClick={handleClick}
        bodyColor="#9CA3AF" // Grey default
      />
    </div>
  );
};

export default BodyMap;
