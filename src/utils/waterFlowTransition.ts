import { flushSync } from "react-dom";

/**
 * Water-Flow Theme Transition Engine
 *
 * Creates a fluid, organic water-like wave that surges outward across the
 * viewport from the trigger corner/element to the opposite corner, revealing
 * the newly selected theme with zero lag and authentic liquid physics.
 */

export interface WaterFlowOptions {
  x: number;
  y: number;
  toDark: boolean;
  onThemeSwitch: () => void;
  duration?: number; // Duration in ms (recommended 550 - 700ms for snappy, fluid feel)
}

let isTransitionRunning = false;

export async function runWaterFlowTransition(options: WaterFlowOptions): Promise<void> {
  const {
    x = window.innerWidth - 60,
    y = 30,
    toDark,
    onThemeSwitch,
    duration = 650,
  } = options;

  // Respect prefers-reduced-motion preference
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    onThemeSwitch();
    return;
  }

  // Prevent overlapping concurrent transitions
  if (isTransitionRunning) {
    onThemeSwitch();
    return;
  }
  isTransitionRunning = true;

  const width = window.innerWidth;
  const height = window.innerHeight;

  // Calculate maximum distance to the furthest corner of viewport
  const maxDistance = Math.hypot(
    Math.max(x, width - x),
    Math.max(y, height - y)
  );

  // Check if browser supports View Transitions API
  const hasViewTransition =
    typeof document !== "undefined" &&
    "startViewTransition" in document &&
    typeof (document as any).startViewTransition === "function";

  // Create lightweight high-performance water ripple canvas overlay
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

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);

  const ctx = canvas.getContext("2d", { alpha: true });
  if (ctx) {
    ctx.scale(dpr, dpr);
  }

  // Fluid easing curve: energetic splash start, organic liquid flow deceleration
  const easeOutFluid = (t: number): number => {
    return 1 - Math.pow(1 - t, 2.6);
  };

  const startTime = performance.now();
  let animationFrameId: number;

  // Water Wave Rendering Loop
  const renderFrame = (now: number) => {
    if (!ctx) return;

    const elapsed = now - startTime;
    const rawProgress = Math.min(elapsed / duration, 1);
    const progress = easeOutFluid(rawProgress);

    ctx.clearRect(0, 0, width, height);

    // Current wave radius
    const currentR = progress * maxDistance * 1.06;

    // Organic wave edge amplitude (peaks mid-animation then settles)
    const waveAmp = Math.sin(rawProgress * Math.PI) * 15 * (1 - rawProgress * 0.3);

    // Color definitions for fluid water wave
    const crestHighlight = toDark
      ? "rgba(56, 189, 248, 0.9)" // Radiant cyan-blue water crest on dark wave
      : "rgba(255, 255, 255, 0.96)"; // Sparkling white crystalline highlight on light wave

    const crestGlow = toDark
      ? "rgba(14, 165, 233, 0.6)"
      : "rgba(186, 230, 253, 0.8)";

    const waveSurfaceColor = toDark
      ? "rgba(11, 11, 11, 0.98)"
      : "rgba(255, 255, 255, 0.98)";

    const rippleColor = toDark
      ? "rgba(56, 189, 248, "
      : "rgba(125, 211, 252, ";

    // In browsers without native View Transitions, the canvas fills the expanding water wave
    if (!hasViewTransition) {
      ctx.save();
      ctx.beginPath();
      const numPoints = 100;
      for (let i = 0; i <= numPoints; i++) {
        const theta = (i / numPoints) * Math.PI * 2;
        const perturbation =
          Math.sin(theta * 5 + rawProgress * 8) * (waveAmp * 0.6) +
          Math.cos(theta * 3 - rawProgress * 6) * (waveAmp * 0.4);
        const r = Math.max(0, currentR + perturbation);
        const px = x + Math.cos(theta) * r;
        const py = y + Math.sin(theta) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = waveSurfaceColor;
      ctx.fill();
      ctx.restore();
    }

    // 1. Draw Trailing Capillary Water Ripples (concentric fluid rings)
    const rippleFractions = [0.88, 0.74, 0.56, 0.38];
    rippleFractions.forEach((fraction, idx) => {
      const ripR = currentR * fraction;
      if (ripR <= 0 || ripR > maxDistance * 1.1) return;

      const fade = Math.sin(rawProgress * Math.PI) * (0.38 - idx * 0.08);
      if (fade <= 0) return;

      ctx.save();
      ctx.beginPath();
      const points = 64;
      for (let i = 0; i <= points; i++) {
        const theta = (i / points) * Math.PI * 2;
        const ripOffset =
          Math.sin(theta * 4 + rawProgress * 6 + idx) * (waveAmp * 0.3);
        const r = Math.max(0, ripR + ripOffset);
        const px = x + Math.cos(theta) * r;
        const py = y + Math.sin(theta) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = `${rippleColor}${Math.max(0, fade)})`;
      ctx.lineWidth = Math.max(1, 2.5 - idx * 0.4);
      ctx.stroke();
      ctx.restore();
    });

    // 2. Draw Organic Leading Wave Crest (The Water Meniscus)
    ctx.save();
    ctx.beginPath();
    const numPoints = 100;
    for (let i = 0; i <= numPoints; i++) {
      const theta = (i / numPoints) * Math.PI * 2;
      const perturbation =
        Math.sin(theta * 5 + rawProgress * 8) * (waveAmp * 0.6) +
        Math.cos(theta * 3 - rawProgress * 6) * (waveAmp * 0.4);
      const r = Math.max(0, currentR + perturbation);
      const px = x + Math.cos(theta) * r;
      const py = y + Math.sin(theta) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    // Crest refraction glow
    ctx.shadowColor = crestGlow;
    ctx.shadowBlur = toDark ? 12 : 8;
    ctx.strokeStyle = crestHighlight;
    ctx.lineWidth = Math.max(1.5, 4 * (1 - rawProgress * 0.6));
    ctx.stroke();
    ctx.restore();

    // 3. Initial Droplet Impact Splash (Around Origin corner for first 30% of animation)
    if (rawProgress < 0.3) {
      const splashProgress = rawProgress / 0.3;
      const splashFade = 1 - splashProgress;
      const splashR = splashProgress * 55;

      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, splashR, 0, Math.PI * 2);
      ctx.strokeStyle = toDark
        ? `rgba(56, 189, 248, ${splashFade * 0.7})`
        : `rgba(255, 255, 255, ${splashFade * 0.9})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }

    if (rawProgress < 1) {
      animationFrameId = requestAnimationFrame(renderFrame);
    }
  };

  animationFrameId = requestAnimationFrame(renderFrame);

  // If View Transitions API is supported, orchestrate the pseudo-element clip reveal with flushSync
  if (hasViewTransition) {
    document.documentElement.classList.add("theme-transitioning");

    try {
      const transition = (document as any).startViewTransition(() => {
        // Synchronously update React state and DOM without batching delay
        flushSync(() => {
          onThemeSwitch();
        });
      });

      await transition.ready;

      const animation = document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxDistance * 1.06}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration,
          easing: "cubic-bezier(0.18, 0.9, 0.26, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );

      await animation.finished;
    } catch (err) {
      console.warn("View transition fallback applied:", err);
      onThemeSwitch();
    } finally {
      document.documentElement.classList.remove("theme-transitioning");
      cleanup();
    }
  } else {
    // Immediate fallback: sweep wave begins instantly, theme flips as wave surges across
    setTimeout(() => {
      onThemeSwitch();
    }, duration * 0.4);

    setTimeout(() => {
      cleanup();
    }, duration + 30);
  }

  function cleanup() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    try {
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    } catch (e) {}
    isTransitionRunning = false;
  }
}
