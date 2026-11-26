import React, { useState, useEffect, useRef } from 'react';
import { posteriorBodyPathsData } from './body-data';
import { paperDollData } from './paper-doll-data';

interface DetailedBodyMapProps {
  data?: Array<{ name: string; muscles: string[] }>;
  colorMap?: Record<string, string>;
  bodyColor?: string;
  onClick?: (partId: string) => void;
  svgStyle?: React.CSSProperties;
  style?: React.CSSProperties;
  type?: 'anterior' | 'posterior';
  height?: number | string;
  width?: number | string;
}

// Aliases for muscle groups to map database/UI terminology to SVG sub-paths
const partAliasMapping: Record<string, string[]> = {
  neck: ['neck', 'trapezius', 'cervical-spine'],
  shoulder: ['shoulder', 'left-shoulder', 'right-shoulder', 'deltoids', 'deltoid-left', 'deltoid-right', 'shoulder-back-left', 'shoulder-back-right'],
  biceps: ['biceps', 'bicep-left', 'bicep-right', 'left-arm-bicep', 'right-arm-bicep', 'tricep-left', 'tricep-right'],
  elbow: ['elbow', 'left-elbow', 'right-elbow', 'left-arm-elbow', 'right-arm-elbow'],
  forearm: ['forearm', 'left-forearm', 'right-forearm', 'forearms', 'left-arm-forearm', 'right-arm-forearm', 'forearm-back-left', 'forearm-back-right'],
  wrist: ['wrist', 'left-wrist', 'right-wrist', 'hand-back-left', 'hand-back-right'],
  hand: ['hand', 'left-hand', 'right-hand', 'hands', 'hand-back-left', 'hand-back-right'],
  chest: ['chest', 'pectorals', 'pec-left', 'pec-right'],
  back: ['back', 'trapezius', 'lats', 'lat-left', 'lat-right', 'upper-back', 'upperback-left', 'upperback-right', 'clavicule-left', 'clavicule-right', 'back-left', 'back-right'],
  mid_back: ['mid_back', 'mid-back', 'rhomboids', 'thoracic-spine', 'midback-left', 'midback-right'],
  spine: ['spine', 'thoracic-spine', 'lumbar-spine', 'cervical-spine', 'lower-back', 'back'],
  waist: ['waist', 'obliques', 'oblique-left', 'oblique-right', 'abs', 'abdomen'],
  abdomen: ['abdomen', 'abs', 'abs-core', 'abdominals', 'stomach'],
  hip: ['hip', 'left-hip', 'right-hip'],
  glute: ['glute', 'glutes', 'buttock'],
  thigh: ['thigh', 'left-thigh', 'right-thigh', 'quadriceps', 'quad-left', 'quad-right', 'hamstrings', 'thigh-left', 'thigh-right'],
  knee: ['knee', 'left-knee', 'right-knee', 'knees'],
  shin: ['shin', 'left-shin', 'right-shin', 'left-tibialis', 'right-tibialis'],
  calf: ['calf', 'calves', 'calf-left', 'calf-right', 'left-calves', 'right-calves'],
  ankle: ['ankle', 'left-ankle', 'right-ankle', 'ankles', 'feet', 'right-feet'],
  foot: ['foot', 'left-foot', 'right-foot', 'feet', 'foot-left', 'foot-right', 'right-feet'],
};

export default function DetailedBodyMap({
  data = [],
  colorMap = {},
  bodyColor = '#94A3B8', // High-clarity neutral slate
  onClick = () => {},
  svgStyle,
  style,
  type = 'anterior',
  height,
  width,
}: DetailedBodyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState<number>(() => {
    if (typeof height === 'number' && height > 0) return height;
    if (typeof style?.height === 'number' && style.height > 0) return style.height;
    return 480;
  });

  // Dynamic ResizeObserver to scale figure to container height safely without infinite resize loops
  useEffect(() => {
    if (typeof height === 'number' && height > 0) {
      setMeasuredHeight(height);
      return;
    }
    if (typeof style?.height === 'number' && style.height > 0) {
      setMeasuredHeight(style.height);
      return;
    }

    const el = containerRef.current;
    if (!el || !el.parentElement) return;

    const parent = el.parentElement;

    const checkSize = () => {
      if (!parent) return;
      const computed = window.getComputedStyle(parent);
      const padY = (parseFloat(computed.paddingTop) || 0) + (parseFloat(computed.paddingBottom) || 0);
      const h = parent.clientHeight - padY;

      // Dynamically scale figure to fill parent container, clamped within [280, 560]
      if (h > 150) {
        const target = Math.min(Math.max(Math.round(h), 280), 560);
        setMeasuredHeight((prev) => (Math.abs(prev - target) > 4 ? target : prev));
      }
    };

    checkSize();
    const observer = new ResizeObserver(() => {
      checkSize();
    });
    observer.observe(parent);

    return () => observer.disconnect();
  }, [height, style?.height]);

  const targetHeight = typeof height === 'number' && height > 0 ? height : measuredHeight;

  // Helper to determine if a specific SVG path ID is highlighted
  const getPartColor = (partId: string): { color: string; isHighlighted: boolean } => {
    // 1. Direct colorMap check (highest priority)
    if (colorMap[partId]) {
      return { color: colorMap[partId], isHighlighted: true };
    }

    const isLeftPart = partId.includes('left');
    const isRightPart = partId.includes('right');

    // 2. Check if partId belongs to any alias in colorMap
    for (const [aliasKey, targetList] of Object.entries(partAliasMapping)) {
      if (colorMap[aliasKey] && (targetList.includes(partId) || aliasKey === partId)) {
        // If this SVG path is sided (e.g. left-thigh), but colorMap contains a specific sided key
        // for this group (e.g. right-thigh), do NOT activate via the generic alias!
        if (isLeftPart || isRightPart) {
          const hasSpecificSidedKey = targetList.some(target => colorMap[target]);
          if (hasSpecificSidedKey) {
            continue;
          }
        }
        return { color: colorMap[aliasKey], isHighlighted: true };
      }
    }

    // 3. Check if any data muscles match
    for (const item of data) {
      if (item.muscles) {
        if (item.muscles.includes(partId)) {
          return { color: colorMap[item.name] || colorMap[partId] || '#F97316', isHighlighted: true };
        }
        for (const m of item.muscles) {
          const aliases = partAliasMapping[m] || [];
          if (aliases.includes(partId)) {
            // Guard against cross-side bleeding
            const mIsLeft = m.includes('left');
            const mIsRight = m.includes('right');
            if (mIsLeft && isRightPart) continue;
            if (mIsRight && isLeftPart) continue;

            return { color: colorMap[m] || colorMap[item.name] || '#F97316', isHighlighted: true };
          }
        }
      }
    }

    return { color: bodyColor, isHighlighted: false };
  };

  if (type === 'posterior') {
    // Posterior native aspect ratio: 34 / 93 (~0.365)
    const scaledWidth = Math.round(targetHeight * (34 / 93));

    return (
      <div
        ref={containerRef}
        style={{
          ...style,
          position: 'relative',
          width: width ? (typeof width === 'number' ? `${width}px` : width) : `${scaledWidth}px`,
          height: `${targetHeight}px`,
          margin: '0 auto',
        }}
        className="body-map-wrapper flex items-center justify-center shrink-0"
      >
        <svg
          viewBox="35.5 0 34 93"
          className="w-full h-full drop-shadow-md"
          xmlns="http://www.w3.org/2000/svg"
          style={svgStyle}
        >
          {posteriorBodyPathsData.map((part) => {
            const { color, isHighlighted } = getPartColor(part.id);

            return (
              <path
                key={part.id}
                id={part.id}
                d={part.d}
                fill={color}
                fillRule="evenodd"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="0.3"
                strokeLinejoin="round"
                className={`cursor-pointer transition-colors duration-200 ${
                  isHighlighted 
                    ? "opacity-100" 
                    : "opacity-85 hover:opacity-100 hover:brightness-110"
                }`}
                onClick={() => onClick(part.id)}
              >
                <title>{part.name} {isHighlighted ? "(Selected Affected Area)" : ""}</title>
              </path>
            );
          })}
        </svg>
      </div>
    );
  }

  // Anterior view: native base dimensions
  // Native bounding box: width 208px, total height 504px (head top is at -6px, feet reach down to 494px)
  const baseWidth = 208;
  const baseHeight = 504;
  const scale = targetHeight / baseHeight;
  const scaledWidth = Math.round(baseWidth * scale);

  // Non-interactive parts for anterior view (skin tone)
  const skinToneParts = ['head', 'hands', 'feet'];
  const interactiveSkinParts = ['head'];
  const skinToneColor = '#D4C4B0';
  const layoutData = paperDollData;

  return (
    <div
      ref={containerRef}
      style={{
        ...style,
        position: 'relative',
        width: width ? (typeof width === 'number' ? `${width}px` : width) : `${scaledWidth}px`,
        height: `${targetHeight}px`,
        margin: '0 auto',
        overflow: 'hidden',
      }}
      className="body-map-wrapper flex items-center justify-center shrink-0"
    >
      <div
        style={{
          position: 'absolute',
          top: `${Math.round(6 * scale)}px`, // Compensate for head top: -6px so head is completely visible
          left: 0,
          width: `${baseWidth}px`,
          height: `${baseHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
        className="relative w-[208px] h-[504px]"
      >
        {layoutData.map((part) => {
          const { color, isHighlighted } = getPartColor(part.id);
          const isSkinTone = skinToneParts.includes(part.id);
          const finalColor = isHighlighted ? color : (isSkinTone ? skinToneColor : bodyColor);
          const isInteractive = !isSkinTone || interactiveSkinParts.includes(part.id);

          return (
            <svg
              key={part.id}
              className="paper-doll-part"
              viewBox={part.viewBox}
              style={{
                position: 'absolute',
                left: '50%',
                width: `${part.width}px`,
                height: `${part.height}px`,
                pointerEvents: 'none',
                ...part.style, // Preserves transform: 'scaleX(-1)', zIndex, and all muscle positions!
                ...svgStyle,
              }}
            >
              <path
                d={part.path}
                fill={finalColor}
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="0.4"
                strokeLinejoin="round"
                style={{ pointerEvents: isInteractive ? 'auto' : 'none' }}
                className={`transition-colors duration-200 ${
                  isHighlighted
                    ? "opacity-100"
                    : isInteractive
                    ? "cursor-pointer opacity-90 hover:opacity-100 hover:brightness-110"
                    : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isInteractive) onClick(part.id);
                }}
              >
                <title>{part.id} {isHighlighted ? "(Selected Affected Area)" : ""}</title>
              </path>
            </svg>
          );
        })}
      </div>
    </div>
  );
}
