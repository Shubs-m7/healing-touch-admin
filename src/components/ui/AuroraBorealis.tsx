"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AuroraBorealisProps {
  className?: string;
  intensity?: number;
  speed?: number;
  enableStars?: boolean;
  enableMouseInteraction?: boolean;
}

const VERTEX_SHADER_SOURCE = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
uniform float uIntensity;
uniform float uSpeed;
uniform float uEnableStars;

// 2D Hash function
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// 2D Noise
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Vertical ray pillars / striations (Magnetic field lines)
float rayStriations(vec2 uv, float t, float speed) {
  float x = uv.x * 42.0;
  float y = uv.y * 2.2 - t * speed;
  
  // Wavy lateral deflection as vertical rays rise into the ionosphere
  float sway = sin(uv.y * 5.2 + t * 0.75) * 0.85;
  float rx = x + sway;
  
  float r1 = sin(rx);
  float r2 = sin(rx * 1.83 + 1.35);
  float r3 = sin(rx * 3.47 + 2.7) * 0.55;
  float r4 = cos(rx * 0.45 - t * 0.35);
  
  float rays = (r1 + r2 + r3 + r4 * 0.5) / 2.85;
  rays = rays * 0.5 + 0.5;
  return pow(rays, 1.85); // Sharpen vertical light shafts
}

// Single undulating aurora curtain
float auroraCurtain(vec2 uv, float t, float xOffset, float yBase, float freq, float raySpeed, float curveAmp) {
  // Sinuous baseline undulating across the Arctic night sky
  float wave1 = sin(uv.x * freq + t * 0.35 + xOffset) * curveAmp;
  float wave2 = sin(uv.x * (freq * 2.2) - t * 0.28 + xOffset * 1.4) * (curveAmp * 0.45);
  float wave3 = cos(uv.x * (freq * 0.55) + t * 0.18) * (curveAmp * 0.6);
  float noiseWave = (noise(vec2(uv.x * 2.8 + t * 0.1, t * 0.15)) - 0.5) * 0.12;
  
  float baseAltitude = yBase + wave1 + wave2 + wave3 + noiseWave;
  float d = uv.y - baseAltitude;
  
  if (d < -0.04) return 0.0;
  
  float bottomLip = smoothstep(-0.04, 0.035, d);
  float verticalFade = exp(-max(0.0, d) * 3.3);
  float envelope = bottomLip * verticalFade;
  
  // Modulate curtain with vertical ray striations
  float rays = rayStriations(vec2(uv.x + xOffset * 0.08, uv.y), t, raySpeed);
  
  // High-frequency flutter shimmer
  float flutter = sin(uv.x * 68.0 + uv.y * 14.0 + t * 2.2) * 0.14 + 0.86;
  
  return envelope * (0.30 + 0.70 * rays) * flutter;
}

// Procedural stars in the upper night sky
float starField(vec2 uv, float t) {
  if (uv.y < 0.20) return 0.0;
  vec2 p = uv * 95.0;
  vec2 id = floor(p);
  vec2 f = fract(p) - 0.5;
  
  float h = hash21(id);
  if (h > 0.982) {
    float twinkle = sin(t * 3.2 + h * 6.28) * 0.5 + 0.5;
    float d = length(f);
    float star = smoothstep(0.18, 0.02, d) * (0.35 + 0.65 * twinkle);
    return star * smoothstep(0.2, 0.45, uv.y);
  }
  return 0.0;
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  float t = iTime * uSpeed;
  
  // Gentle mouse deflection
  vec2 mouseNorm = iMouse / iResolution.xy;
  vec2 mouseOffset = (mouseNorm - 0.5) * 0.08;
  vec2 warpedUv = uv + mouseOffset * (1.0 - uv.y);
  
  // -------------------------------------------------------------------
  // DEEP ARCTIC NIGHT SKY BACKGROUND
  // -------------------------------------------------------------------
  // Indigo / Midnight teal / Dark emerald gradient
  vec3 skyTop = vec3(0.003, 0.028, 0.048);
  vec3 skyMid = vec3(0.006, 0.055, 0.072);
  vec3 skyBot = vec3(0.010, 0.075, 0.065);
  vec3 col = mix(skyBot, mix(skyMid, skyTop, smoothstep(0.3, 1.0, uv.y)), smoothstep(0.0, 0.5, uv.y));
  
  // Procedural stars
  if (uEnableStars > 0.5) {
    col += vec3(0.85, 0.96, 1.0) * starField(uv, t);
  }
  
  // -------------------------------------------------------------------
  // 3 LAYERS OF AURORA CURTAINS (Matches user reference photo)
  // -------------------------------------------------------------------
  
  // Curtain 1: Grand sweeping arch across upper sky
  float c1 = auroraCurtain(warpedUv, t * 0.8, 0.0, 0.42, 2.1, 0.35, 0.18);
  
  // Curtain 2: Swirling folded center loop (dense, luminous emerald S-curve)
  vec2 uvLoop = warpedUv;
  uvLoop.x += sin(warpedUv.y * 3.2 + t * 0.25) * 0.16;
  float c2 = auroraCurtain(uvLoop, t * 0.95, 2.6, 0.36, 2.9, 0.42, 0.15) * 1.35;
  
  // Curtain 3: Distant high-altitude atmospheric veil
  float c3 = auroraCurtain(warpedUv, t * 0.6, 5.1, 0.56, 1.6, 0.25, 0.12) * 0.75;
  
  // Combined density
  float density = (c1 + c2 + c3) * uIntensity;
  
  // -------------------------------------------------------------------
  // VIBRANT NORTHERN LIGHTS EMERALD & CYAN PALETTE
  // -------------------------------------------------------------------
  vec3 cEmerald = vec3(0.0, 0.98, 0.53);       // Neon electric emerald (#00fa87)
  vec3 cCyan = vec3(0.02, 0.86, 0.82);          // Celestial cyan oxygen line (#05dcc1)
  vec3 cDeepJade = vec3(0.012, 0.38, 0.22);     // Deep ambient jade (#036137)
  vec3 cWhiteCore = vec3(0.94, 1.0, 0.97);      // White-hot core highlight (#f0fff8)
  
  // Upper altitude cyan tint
  float altitudeTint = smoothstep(0.38, 0.85, uv.y);
  vec3 curtainBaseCol = mix(cEmerald, cCyan, altitudeTint * 0.45);
  
  // Density gradient
  vec3 auroraCol = mix(cDeepJade, curtainBaseCol, smoothstep(0.06, 0.45, density));
  
  // Intense white-hot core where curtains fold and overlap (matches photo)
  float coreSparkle = smoothstep(0.65, 1.45, density);
  auroraCol = mix(auroraCol, cWhiteCore, coreSparkle * 0.88);
  
  // Additive aurora blending
  col += auroraCol * (density * 1.45);
  
  // Atmospheric ambient glow
  float ambientGlow = (c1 * 0.3 + c2 * 0.4 + c3 * 0.2) * uIntensity;
  col += vec3(0.0, 0.46, 0.28) * ambientGlow * 0.38;
  
  // -------------------------------------------------------------------
  // WATER / HORIZON SHIMMER REFLECTION (Lake at bottom of photo)
  // -------------------------------------------------------------------
  if (uv.y < 0.24) {
    float waterFade = uv.y / 0.24;
    float ripple1 = sin(uv.y * 95.0 + t * 2.8) * 0.012;
    float ripple2 = sin(uv.x * 55.0 - t * 2.1) * 0.008;
    vec2 reflUv = vec2(uv.x + (ripple1 + ripple2) * (1.0 - waterFade * 0.3), 
                       0.44 - (uv.y - 0.24) * 0.9);
    
    float reflC1 = auroraCurtain(reflUv, t * 0.8, 0.0, 0.42, 2.1, 0.35, 0.18);
    float reflC2 = auroraCurtain(reflUv, t * 0.95, 2.6, 0.36, 2.9, 0.42, 0.15) * 1.1;
    float reflDensity = (reflC1 + reflC2) * uIntensity;
    
    vec3 reflCol = mix(vec3(0.0, 0.24, 0.15), cEmerald, smoothstep(0.05, 0.5, reflDensity));
    reflCol *= reflDensity * 0.65 * (0.6 + 0.4 * waterFade);
    
    float glitter = sin(uv.x * 120.0 + uv.y * 240.0 + t * 4.0) * 0.5 + 0.5;
    reflCol += vec3(0.3, 1.0, 0.7) * pow(glitter, 8.0) * reflDensity * 0.32;
    
    col = mix(col, col + reflCol, 0.85);
  }
  
  // Soft optical vignette
  vec2 vigUv = (uv - 0.5) * vec2(iResolution.x / iResolution.y, 1.0);
  float vig = 1.0 - dot(vigUv, vigUv) * 0.18;
  col *= clamp(vig, 0.0, 1.0);
  
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function AuroraBorealis({
  className,
  intensity = 1.0,
  speed = 1.0,
  enableStars = true,
  enableMouseInteraction = true,
}: AuroraBorealisProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize WebGL context
    const gl =
      canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false,
      }) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

    if (!gl) {
      setWebglSupported(false);
      return;
    }

    // Compile Shader Helper
    const compileShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn("Shader compilation failed:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertShader = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fragShader = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);

    if (!vertShader || !fragShader) {
      setWebglSupported(false);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      setWebglSupported(false);
      return;
    }

    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn("Program linking failed:", gl.getProgramInfoLog(program));
      setWebglSupported(false);
      return;
    }

    // Set up full-screen quad geometry
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const vertices = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
       1.0,  1.0,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const aPositionLoc = gl.getAttribLocation(program, "aPosition");
    const uResolutionLoc = gl.getUniformLocation(program, "iResolution");
    const uTimeLoc = gl.getUniformLocation(program, "iTime");
    const uMouseLoc = gl.getUniformLocation(program, "iMouse");
    const uIntensityLoc = gl.getUniformLocation(program, "uIntensity");
    const uSpeedLoc = gl.getUniformLocation(program, "uSpeed");
    const uEnableStarsLoc = gl.getUniformLocation(program, "uEnableStars");

    gl.useProgram(program);
    gl.enableVertexAttribArray(aPositionLoc);
    gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

    // Mouse Tracking with smooth interpolation
    let targetMouseX = canvas.clientWidth * 0.5;
    let targetMouseY = canvas.clientHeight * 0.5;
    let currentMouseX = targetMouseX;
    let currentMouseY = targetMouseY;

    const handleMouseMove = (e: MouseEvent) => {
      if (!enableMouseInteraction) return;
      const rect = canvas.getBoundingClientRect();
      targetMouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
      targetMouseY = (canvas.clientHeight - (e.clientY - rect.top)) * (canvas.height / rect.height);
    };

    if (enableMouseInteraction) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
    }

    // Resize handling with devicePixelRatio cap (1.5 max for 60fps fluidity)
    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.floor(canvas.clientWidth * dpr);
      const height = Math.floor(canvas.clientHeight * dpr);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    window.addEventListener("resize", resize, { passive: true });
    resize();

    // Render Loop
    let animationFrameId: number;
    const startTime = performance.now();

    const render = (now: number) => {
      const elapsed = (now - startTime) * 0.001;

      // Smooth mouse lerp
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      gl.useProgram(program);

      if (uResolutionLoc) gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);
      if (uTimeLoc) gl.uniform1f(uTimeLoc, elapsed);
      if (uMouseLoc) gl.uniform2f(uMouseLoc, currentMouseX, currentMouseY);
      if (uIntensityLoc) gl.uniform1f(uIntensityLoc, intensity);
      if (uSpeedLoc) gl.uniform1f(uSpeedLoc, speed);
      if (uEnableStarsLoc) gl.uniform1f(uEnableStarsLoc, enableStars ? 1.0 : 0.0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    // Context loss handling
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(animationFrameId);
    };
    canvas.addEventListener("webglcontextlost", handleContextLost, false);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      if (enableMouseInteraction) {
        window.removeEventListener("mousemove", handleMouseMove);
      }
      canvas.removeEventListener("webglcontextlost", handleContextLost);

      if (positionBuffer) gl.deleteBuffer(positionBuffer);
      if (vertShader) gl.deleteShader(vertShader);
      if (fragShader) gl.deleteShader(fragShader);
      if (program) gl.deleteProgram(program);

      const ext = gl.getExtension("WEBGL_lose_context");
      if (ext) ext.loseContext();
    };
  }, [intensity, speed, enableStars, enableMouseInteraction]);

  return (
    <div className={cn("relative w-full h-full overflow-hidden select-none", className)}>
      {webglSupported ? (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block"
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        /* CSS Fallback if WebGL unavailable */
        <div className="absolute inset-0 bg-[#02151c] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(0,255,136,0.35)_0%,rgba(5,150,105,0.2)_40%,transparent_70%)] animate-pulse" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-emerald-500/20 to-transparent" />
        </div>
      )}

      {/* Atmospheric Depth Vignette & Ground Fade */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-background/95" />
    </div>
  );
}
