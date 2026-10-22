import { flushSync } from "react-dom";

/**
 * Full-Screen Directional Fluid Water-Flow Theme Transition Engine
 *
 * Implements an organic, directional liquid wave sweeping across the entire viewport:
 * - Light Mode -> Dark Mode: Dark liquid wave sweeps horizontally from Left to Right.
 * - Dark Mode -> Light Mode: Light liquid wave sweeps horizontally from Right to Left.
 *
 * The wavefront features an authentic multi-harmonic liquid boundary with
 * dynamic capillary ripples, water crest meniscus highlights, fluid caustics,
 * and floating micro-droplets.
 *
 * Built with the View Transitions API and Web Animations API clip-path interpolation
 * for 60+ FPS performance, zero layout shift, and instant start on click.
 */

export interface WaterFlowOptions {
  x?: number;
  y?: number;
  toDark: boolean;
  onThemeSwitch: () => void;
  duration?: number; // In ms (default 1100ms)
}

// Controller for cleanly handling rapid consecutive clicks
let activeTransitionCleanup: (() => void) | null = null;
let activeWebAnimation: Animation | null = null;

// Natural fluid wave acceleration:
// Starts moving on frame 1 without delay (immediate positive initial velocity),
// swells organically mid-screen, and gently settles as it washes out of the viewport.
export function easeFluid(t: number): number {
  return 0.35 * Math.sin((t * Math.PI) / 2) + 0.65 * (t * t * (3 - 2 * t));
}

/**
 * Calculates the horizontal X position of the organic water wave at a given vertical Y coordinate.
 * Uses multi-frequency sinusoidal harmonics + stream center bulge to create an authentic liquid contour.
 */
export function calculateWaveX(
  y: number,
  height: number,
  width: number,
  progress: number,
  toDark: boolean
): number {
  const eased = easeFluid(progress);

  // Dynamic wave envelope: smoothly grows from 0 at edge, peaks mid-screen, settles to 0 at exit
  const ampEnvelope = Math.sin(progress * Math.PI);

  // Normalized vertical coordinate (0 to 1)
  const ny = Math.max(0, Math.min(1, y / (height || 1)));

  // Stream center bulge: fluids travel faster in open space away from container bounds
  const centerBulge = Math.sin(ny * Math.PI) * (width * 0.038 + 24);

  // Harmonic Wave 1: Primary organic water swell (wavelength ~ 0.45 * screen height)
  const harmonic1 = Math.sin(ny * Math.PI * 2.4 + progress * 5.6) * (width * 0.024 + 18);

  // Harmonic Wave 2: Secondary undulating ripples (wavelength ~ 0.2 * screen height)
  const harmonic2 = Math.sin(ny * Math.PI * 5.8 - progress * 7.4) * (width * 0.013 + 10);

  // Harmonic Wave 3: High-frequency liquid surface tension ripples
  const harmonic3 = Math.cos(ny * Math.PI * 10.5 + progress * 9.2) * 5.5;

  const totalDisplacement = (centerBulge + harmonic1 + harmonic2 + harmonic3) * ampEnvelope;

  // Sweep base position edge-to-edge without dead-space margins:
  // For toDark (Left to Right): starts right at -2px, sweeps to width + 24px
  // For toLight (Right to Left): starts right at width + 2px, sweeps to -24px
  const sweepStart = toDark ? -2 : width + 2;
  const sweepEnd = toDark ? width + 24 : -24;
  const baseX = sweepStart + (sweepEnd - sweepStart) * eased;

  // For Left-to-Right wave (entering Dark Mode), wave crest bulges forward to the right (+x)
  // For Right-to-Left wave (entering Light Mode), wave crest bulges forward to the left (-x)
  return toDark
    ? baseX + totalDisplacement
    : baseX - totalDisplacement;
}

/**
 * Generates an SVG/CSS Polygon clip-path string for the View Transition element.
 * Every keyframe contains the exact same number of vertices for smooth GPU interpolation.
 */
function generateWavePolygon(
  progress: number,
  width: number,
  height: number,
  toDark: boolean,
  numSegments: number = 36
): string {
  const offscreenAnchor = 40;
  const vertices: Array<[number, number]> = [];

  const yTop = -30;
  const yBottom = height + 30;
  const totalY = yBottom - yTop;

  if (toDark) {
    // Left to Right: reveal area is to the LEFT of the wave
    // Anchor top-left outside viewport
    vertices.push([-offscreenAnchor, yTop]);

    // Wave points from top to bottom
    for (let i = 0; i <= numSegments; i++) {
      const y = yTop + (i / numSegments) * totalY;
      const x = calculateWaveX(y, height, width, progress, true);
      vertices.push([x, y]);
    }

    // Anchor bottom-left outside viewport
    vertices.push([-offscreenAnchor, yBottom]);
    // Close polygon back to start
    vertices.push([-offscreenAnchor, yTop]);
  } else {
    // Right to Left: reveal area is to the RIGHT of the wave
    // Anchor top-right outside viewport
    vertices.push([width + offscreenAnchor, yTop]);

    // Wave points from top to bottom
    for (let i = 0; i <= numSegments; i++) {
      const y = yTop + (i / numSegments) * totalY;
      const x = calculateWaveX(y, height, width, progress, false);
      vertices.push([x, y]);
    }

    // Anchor bottom-right outside viewport
    vertices.push([width + offscreenAnchor, yBottom]);
    // Close polygon back to start
    vertices.push([width + offscreenAnchor, yTop]);
  }

  const pointStrings = vertices.map(
    ([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`
  );
  return `polygon(${pointStrings.join(", ")})`;
}

/**
 * Pre-computes keyframes for the Web Animations API on ::view-transition-new(root).
 */
function createAnimationKeyframes(
  width: number,
  height: number,
  toDark: boolean,
  steps: number = 32
): Array<{ clipPath: string }> {
  const keyframes: Array<{ clipPath: string }> = [];
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const clipPath = generateWavePolygon(progress, width, height, toDark);
    keyframes.push({ clipPath });
  }
  return keyframes;
}

// Particle interface for liquid micro-droplets
interface LiquidDroplet {
  ny: number; // Normalized vertical position (0 to 1)
  dx: number; // Offset from wave crest
  radius: number;
  bobPhase: number;
  bobSpeed: number;
}

export async function runWaterFlowTransition(options: WaterFlowOptions): Promise<void> {
  const {
    toDark,
    onThemeSwitch,
    duration = 1100, // Optimal fluid transition time
  } = options;

  // Clean up any currently running transition if clicked rapidly
  if (activeTransitionCleanup) {
    activeTransitionCleanup();
  }

  // Respect user preference for reduced motion
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    onThemeSwitch();
    return;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  // Check for native View Transitions API support
  const hasViewTransition =
    typeof document !== "undefined" &&
    "startViewTransition" in document &&
    typeof (document as any).startViewTransition === "function";

  // Pre-compute keyframes synchronously so there is zero calculation delay
  const keyframes = hasViewTransition
    ? createAnimationKeyframes(width, height, toDark, 32)
    : [];

  // Create full-viewport canvas overlay for liquid wave crest highlights and ripples
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999999";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);

  const ctx = canvas.getContext("2d", { alpha: true });
  if (ctx) {
    ctx.scale(dpr, dpr);
  }

  // Generate 18 floating liquid micro-droplets along the wavefront
  const droplets: LiquidDroplet[] = Array.from({ length: 18 }, (_, idx) => ({
    ny: 0.05 + (idx / 18) * 0.9,
    dx: (Math.random() - 0.5) * 22,
    radius: 1.2 + Math.random() * 2.2,
    bobPhase: Math.random() * Math.PI * 2,
    bobSpeed: 4 + Math.random() * 5,
  }));

  let animationFrameId = 0;
  let isCleanedUp = false;

  function cleanup() {
    if (isCleanedUp) return;
    isCleanedUp = true;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
    }
    if (activeWebAnimation) {
      try {
        activeWebAnimation.cancel();
      } catch (e) {}
      activeWebAnimation = null;
    }
    document.documentElement.classList.remove("theme-transitioning");
    try {
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    } catch (e) {}
    if (activeTransitionCleanup === cleanup) {
      activeTransitionCleanup = null;
    }
  }

  activeTransitionCleanup = cleanup;

  // Canvas Liquid Animation Frame Renderer
  const renderCanvasFrame = (now: number, startTime: number) => {
    if (!ctx || isCleanedUp) return;

    const elapsed = now - startTime;
    const progress = Math.min(Math.max(elapsed / duration, 0), 1);
    const ampEnvelope = Math.sin(progress * Math.PI);

    ctx.clearRect(0, 0, width, height);

    // Fade out canvas visuals near completion (last 12% of duration)
    let globalOpacity = 1;
    if (progress > 0.88) {
      globalOpacity = Math.max(0, (1 - progress) / 0.12);
    }
    ctx.globalAlpha = globalOpacity;

    // Palette tailored for fluid water transition
    const crestColor = toDark
      ? "rgba(56, 189, 248, 0.95)" // Luminous cyan crest
      : "rgba(255, 255, 255, 0.98)"; // Sparkling crystalline white

    const crestGlowColor = toDark
      ? "rgba(14, 165, 233, 0.85)"
      : "rgba(125, 211, 252, 0.85)";

    const ribbonWashColor = toDark
      ? "rgba(14, 165, 233, 0.18)"
      : "rgba(224, 242, 254, 0.25)";

    const rippleColor = toDark
      ? "rgba(56, 189, 248, "
      : "rgba(186, 230, 253, ";

    const dropletColor = toDark
      ? "rgba(186, 230, 253, 0.95)"
      : "rgba(255, 255, 255, 0.98)";

    // Sample wave coordinates down the screen
    const sampleCount = 60;
    const wavePoints: Array<{ x: number; y: number }> = [];
    for (let i = 0; i <= sampleCount; i++) {
      const y = (i / sampleCount) * height;
      const x = calculateWaveX(y, height, width, progress, toDark);
      wavePoints.push({ x, y });
    }

    // 1. Fallback background fill for browsers lacking View Transitions API
    if (!hasViewTransition) {
      ctx.save();
      ctx.beginPath();
      if (toDark) {
        ctx.moveTo(-100, 0);
        wavePoints.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.lineTo(-100, height);
      } else {
        ctx.moveTo(width + 100, 0);
        wavePoints.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.lineTo(width + 100, height);
      }
      ctx.closePath();
      ctx.fillStyle = toDark ? "#0b0f19" : "#ffffff";
      ctx.fill();
      ctx.restore();
    }

    // 2. Liquid Meniscus Wash Ribbon (translucent fluid depth right behind the crest)
    if (ampEnvelope > 0.05) {
      const ribbonWidth = 28 * ampEnvelope;
      const trailSign = toDark ? -1 : 1;

      ctx.save();
      ctx.beginPath();
      wavePoints.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      for (let i = wavePoints.length - 1; i >= 0; i--) {
        const p = wavePoints[i];
        ctx.lineTo(p.x + trailSign * ribbonWidth, p.y);
      }
      ctx.closePath();
      ctx.fillStyle = ribbonWashColor;
      ctx.fill();
      ctx.restore();
    }

    // 3. Trailing Capillary Ripples (Secondary & Tertiary waves flowing behind the crest)
    if (ampEnvelope > 0.08) {
      const ripples = [
        { offset: 16, width: 1.8, alpha: 0.42 * ampEnvelope },
        { offset: 34, width: 1.0, alpha: 0.24 * ampEnvelope },
      ];

      ripples.forEach((rip) => {
        const trailOffset = (toDark ? -1 : 1) * rip.offset;
        ctx.save();
        ctx.beginPath();
        wavePoints.forEach((p, idx) => {
          const ripY = p.y;
          const lag = Math.sin((ripY / height) * Math.PI * 4 + progress * 7) * 4;
          const ripX = p.x + trailOffset + lag;
          if (idx === 0) ctx.moveTo(ripX, ripY);
          else ctx.lineTo(ripX, ripY);
        });
        ctx.strokeStyle = `${rippleColor}${rip.alpha.toFixed(2)})`;
        ctx.lineWidth = rip.width;
        ctx.stroke();
        ctx.restore();
      });
    }

    // 4. Primary Leading Water Crest (Glowing Meniscus)
    ctx.save();
    ctx.beginPath();
    wavePoints.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.shadowColor = crestGlowColor;
    ctx.shadowBlur = toDark ? 18 : 14;
    ctx.strokeStyle = crestColor;
    ctx.lineWidth = Math.max(1.8, 3.8 * ampEnvelope);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.restore();

    // 5. Floating Micro-Droplets / Liquid Foam Particles along the Wavefront
    if (ampEnvelope > 0.12) {
      droplets.forEach((drop) => {
        const baseY = drop.ny * height;
        const bob = Math.sin(progress * drop.bobSpeed + drop.bobPhase) * 5;
        const dropY = baseY + bob;
        const waveAtY = calculateWaveX(dropY, height, width, progress, toDark);
        const dropX = waveAtY + (toDark ? -1 : 1) * Math.abs(drop.dx) * ampEnvelope;

        ctx.save();
        ctx.beginPath();
        ctx.arc(dropX, dropY, drop.radius, 0, Math.PI * 2);
        ctx.fillStyle = dropletColor;
        ctx.shadowColor = crestGlowColor;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
      });
    }
  };

  // View Transitions API execution with instant synchronized start
  if (hasViewTransition) {
    document.documentElement.classList.add("theme-transitioning");

    try {
      const transition = (document as any).startViewTransition(() => {
        flushSync(() => {
          onThemeSwitch();
        });
      });

      await transition.ready;

      if (isCleanedUp) return;

      // Start the synchronized Web Animation and Canvas Liquid Wave in the EXACT same frame
      const startTime = performance.now();

      const animation = document.documentElement.animate(keyframes, {
        duration,
        easing: "linear", // Keyframe coordinates already encode the fluid easing
        pseudoElement: "::view-transition-new(root)",
        fill: "forwards",
      });
      activeWebAnimation = animation;

      const runFrame = (now: number) => {
        if (isCleanedUp) return;
        renderCanvasFrame(now, startTime);
        if (now - startTime < duration) {
          animationFrameId = requestAnimationFrame(runFrame);
        }
      };
      animationFrameId = requestAnimationFrame(runFrame);

      await animation.finished;
    } catch (err) {
      console.warn("View transition fallback applied:", err);
      onThemeSwitch();
    } finally {
      cleanup();
    }
  } else {
    // Instant fallback for non-supporting browsers:
    // Switch theme immediately without any artificial delay
    onThemeSwitch();

    const startTime = performance.now();
    const runFallbackFrame = (now: number) => {
      if (isCleanedUp) return;
      renderCanvasFrame(now, startTime);
      if (now - startTime < duration) {
        animationFrameId = requestAnimationFrame(runFallbackFrame);
      } else {
        cleanup();
      }
    };
    animationFrameId = requestAnimationFrame(runFallbackFrame);
  }
}

