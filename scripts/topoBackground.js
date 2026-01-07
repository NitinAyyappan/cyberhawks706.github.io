import * as Perlin from "https://esm.sh/@chriscourses/perlin-noise";

export function initTopoBackground() {
  const canvas = document.getElementById("res-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  /* ===== CONFIG ===== */
  const thresholdIncrement = 5;
  const thickLineThresholdMultiple = 3;
  const res = window.innerWidth < 768 ? 14 : 10;

  // Motion tuning
  const timeDriftSpeed = 0.0012;      // ambient time drift
  const scrollDriftStrength = 0.0012; // subtle domain shift in noise sampling
  const domainWarpStrength = 0.9;     // domain warp amplitude
  const parallaxFactor = 0.25;        // how strongly canvas translates opposite to scroll (0.0 - 1.0)

  const lineColor = "#EDEDED80";

  /* ===== STATE ===== */
  let cols, rows;
  let timeOffset = 0;
  let scrollDomain = 0;

  let inputValues = [];
  let zBoostValues = [];

  let noiseMin = 100;
  let noiseMax = 0;
  let currentThreshold = 0;

  // mouse position **relative to canvas** (updated in mouse handler)
  let mousePos = { x: -999, y: -999 };

  // parallax smoothing state
  let targetCanvasOffset = 0;
  let canvasOffsetY = 0;

  /* ===== SETUP ===== */
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // scroll handler: set targets, do not write transform directly here
  window.addEventListener(
    "scroll",
    () => {
      const scrollY = window.scrollY || 0;

      // target offset is negative scroll times factor --> moves opposite to the user's scroll
      targetCanvasOffset = -scrollY * parallaxFactor;

      // small domain offset used in noise sampling to help variation across long pages
      scrollDomain = scrollY * scrollDriftStrength;
    },
    { passive: true }
  );

  // mouse events: compute coordinates relative to the canvas (accounts for transforms)
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mousePos.x = e.clientX - rect.left;
    mousePos.y = e.clientY - rect.top;
  });

  canvas.addEventListener("mouseleave", () => {
    mousePos.x = -999;
    mousePos.y = -999;
  });

  function resizeCanvas() {
    // match CSS pixels (intentionally not using DPR to keep grid stable)
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Reset transform so drawing coordinates match CSS pixels
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    cols = Math.floor(canvas.width / res) + 1;
    rows = Math.floor(canvas.height / res) + 1;

    zBoostValues = Array.from({ length: rows }, () => Array(cols).fill(0));
  }

  /* ===== MAIN LOOP ===== */
  function animate() {
    draw();

    // smooth the transform toward target (easing)
    // higher ease factor = snappier; lower = smoother
    const ease = 0.08;
    canvasOffsetY += (targetCanvasOffset - canvasOffsetY) * ease;

    // apply GPU-accelerated transform
    canvas.style.transform = `translateY(${canvasOffsetY}px)`;

    requestAnimationFrame(animate);
  }

  function draw() {
    applyMouseOffset();

    // clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // time evolution
    timeOffset += timeDriftSpeed;

    // generate the noise grid used by marching squares
    generateNoise();

    // marching squares threshold loop (unchanged)
    const minT = Math.floor(noiseMin / thresholdIncrement) * thresholdIncrement;
    const maxT = Math.ceil(noiseMax / thresholdIncrement) * thresholdIncrement;

    for (let t = minT; t < maxT; t += thresholdIncrement) {
      currentThreshold = t;
      renderContours();
    }

    // reset trackers
    noiseMin = 100;
    noiseMax = 0;
  }

  /* ===== NOISE GRID =====
   * We translate the sampling coordinates (domain) by time + a subtle scrollDomain
   * and by a small sin/cos warp so contour lines physically slide.
   */
  function generateNoise() {
    for (let y = 0; y < rows; y++) {
      inputValues[y] = [];
      for (let x = 0; x < cols; x++) {
        // domain translation: move the sampling grid over time and slightly with scroll
        const nx =
          x * 0.02 +
          Math.sin(timeOffset * 0.6) * domainWarpStrength +
          scrollDomain * 0.6;

        const ny =
          y * 0.02 +
          Math.cos(timeOffset * 0.4) * domainWarpStrength -
          scrollDomain * 0.3;

        // call into Perlin.noise the same way you did before (scaled)
        // keep magnitude similar to original
        const value =
          Perlin.noise(nx, ny, timeOffset + zBoostValues[y][x]) * 100;

        inputValues[y][x] = value;
        noiseMin = Math.min(noiseMin, value);
        noiseMax = Math.max(noiseMax, value);

        // decay any mouse-applied z-boost
        zBoostValues[y][x] *= 0.95;
      }
    }
  }

  /* ===== RENDER ===== */
  function renderContours() {
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth =
      currentThreshold % (thresholdIncrement * thickLineThresholdMultiple) === 0
        ? 2
        : 1;

    for (let y = 0; y < rows - 1; y++) {
      for (let x = 0; x < cols - 1; x++) {
        const nw = inputValues[y][x] > currentThreshold ? 1 : 0;
        const ne = inputValues[y][x + 1] > currentThreshold ? 1 : 0;
        const se = inputValues[y + 1][x + 1] > currentThreshold ? 1 : 0;
        const sw = inputValues[y + 1][x] > currentThreshold ? 1 : 0;

        placeLines((nw << 3) | (ne << 2) | (se << 1) | sw, x, y);
      }
    }
    ctx.stroke();
  }

  function placeLines(type, x, y) {
    const interp = (a, b) => {
      if (b === a) return 0.5;
      return (currentThreshold - a) / (b - a);
    };

    const px = x * res;
    const py = y * res;
    const v = inputValues;

    const A = [px + res * interp(v[y][x], v[y][x + 1]), py];
    const B = [px + res, py + res * interp(v[y][x + 1], v[y + 1][x + 1])];
    const C = [px + res * interp(v[y + 1][x], v[y + 1][x + 1]), py + res];
    const D = [px, py + res * interp(v[y][x], v[y + 1][x])];

    const map = {
      1: [D, C],
      2: [B, C],
      3: [D, B],
      4: [A, B],
      5: [A, D, B, C],
      6: [A, C],
      7: [A, D],
      8: [A, D],
      9: [A, C],
      10: [A, B, D, C],
      11: [A, B],
      12: [D, B],
      13: [B, C],
      14: [D, C],
    };

    const lines = map[type];
    if (!lines) return;

    for (let i = 0; i < lines.length; i += 2) {
      ctx.moveTo(...lines[i]);
      ctx.lineTo(...lines[i + 1]);
    }
  }

  /* ===== MOUSE INTERACTION =====
   * Mouse is tracked relative to the canvas bounding box so transforms won't desync the grid mapping.
   */
  function applyMouseOffset() {
    // if mouse is offscreen/invalid, skip
    if (mousePos.x < 0 || mousePos.y < 0) return;

    const mx = Math.floor(mousePos.x / res);
    const my = Math.floor(mousePos.y / res);
    const radius = 10;
    const strength = 0.08;

    for (let yy = -radius; yy <= radius; yy++) {
      for (let xx = -radius; xx <= radius; xx++) {
        const gx = mx + xx;
        const gy = my + yy;

        // guard out-of-bounds
        if (gy < 0 || gy >= rows || gx < 0 || gx >= cols) continue;

        // unreliable falsy checks removed; use explicit undefined guard
        if (zBoostValues[gy][gx] === undefined) continue;

        const d = Math.sqrt(xx * xx + yy * yy);
        if (d > radius) continue;

        zBoostValues[gy][gx] += Math.exp(-(d * d) / (radius * radius)) * strength;
      }
    }
  }

  /* ===== START ===== */
  // ensure canvas is positioned/fixed behind content in CSS:
  // #res-canvas { position: fixed; inset: 0; z-index: -2; pointer-events: none; will-change: transform; }
  canvas.style.willChange = "transform";
  canvas.style.transform = `translateY(${canvasOffsetY}px)`;

  animate();
}
