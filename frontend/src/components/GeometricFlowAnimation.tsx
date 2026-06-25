"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/* ─── Types ─────────────────────────────────────────────────── */
interface Pt {
  x: number;
  y: number;
  tx: number;
  ty: number;
  size: number;
  r: number;
  g: number;
  b: number;
  speed: number;
  pulse: number;
}

type FormType = "geometric" | "glagolitic" | "numeric";

interface FormDef {
  name: string;
  type: FormType;
  subtitle: string;
  build: (particles: Pt[], cx: number, cy: number) => void;
}

/* ─── Brand palette (Anthropic) ─────────────────────────────── */
const BRAND = {
  dark: [20, 20, 19] as const,
  light: [250, 249, 245] as const,
  orange: [217, 119, 87] as const,
  blue: [106, 155, 204] as const,
  green: [120, 140, 93] as const,
};

const TYPE_COLORS: Record<FormType, readonly number[]> = {
  geometric: BRAND.blue,
  glagolitic: BRAND.orange,
  numeric: BRAND.green,
};

const BG = "#0D1117";
const CANVAS_W = 720;
const CANVAS_H = 420;
const PARTICLE_COUNT = 120;
const TRANSITION_MS = 3200;
const HOLD_MS = 2600;

/* ─── Segment helpers ───────────────────────────────────────── */
function circleSegs(cx: number, cy: number, r: number, n: number) {
  const s: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a1 = (i / n) * Math.PI * 2;
    const a2 = ((i + 1) / n) * Math.PI * 2;
    s.push({
      x1: cx + Math.cos(a1) * r,
      y1: cy + Math.sin(a1) * r,
      x2: cx + Math.cos(a2) * r,
      y2: cy + Math.sin(a2) * r,
    });
  }
  return s;
}

function arcSegs(
  cx: number,
  cy: number,
  r: number,
  s0: number,
  s1: number,
  n: number
) {
  const s: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a1 = s0 + (i / n) * (s1 - s0);
    const a2 = s0 + ((i + 1) / n) * (s1 - s0);
    s.push({
      x1: cx + Math.cos(a1) * r,
      y1: cy + Math.sin(a1) * r,
      x2: cx + Math.cos(a2) * r,
      y2: cy + Math.sin(a2) * r,
    });
  }
  return s;
}

type Seg = { x1: number; y1: number; x2: number; y2: number };

function distributeSegs(
  pts: Pt[],
  segs: Seg[],
  cx: number,
  cy: number,
  scale: number,
  start: number
) {
  let total = 0;
  for (const s of segs) {
    const dx = s.x2 - s.x1;
    const dy = s.y2 - s.y1;
    total += Math.sqrt(dx * dx + dy * dy);
  }
  if (total === 0) return start;
  let idx = start;
  const avail = pts.length - idx;
  for (const seg of segs) {
    if (idx >= pts.length) break;
    const dx = seg.x2 - seg.x1;
    const dy = seg.y2 - seg.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const count = Math.max(1, Math.floor((len / total) * avail));
    for (let i = 0; i < count && idx < pts.length; i++) {
      const t = count > 1 ? i / (count - 1) : 0.5;
      pts[idx].tx = cx + (seg.x1 + dx * t) * scale;
      pts[idx].ty = cy + (seg.y1 + dy * t) * scale;
      idx++;
    }
  }
  return idx;
}

function fallbackScatter(
  pts: Pt[],
  from: number,
  cx: number,
  cy: number,
  rMin: number,
  rMax: number
) {
  for (let i = from; i < pts.length; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = rMin + Math.random() * (rMax - rMin);
    pts[i].tx = cx + Math.cos(a) * r;
    pts[i].ty = cy + Math.sin(a) * r;
  }
}

/* ─── Letter / digit shapes ─────────────────────────────────── */
const L = {
  A: circleSegs(0, 0, 70, 20).concat([
    { x1: -70, y1: 0, x2: 70, y2: 0 },
    { x1: -15, y1: -70, x2: 0, y2: -90 },
    { x1: 0, y1: -90, x2: 15, y2: -70 },
    { x1: -15, y1: -70, x2: 15, y2: -70 },
  ]),
  M: [
    { x1: -60, y1: 70, x2: -60, y2: -70 },
    { x1: -60, y1: -70, x2: 0, y2: 20 },
    { x1: 0, y1: 20, x2: 60, y2: -70 },
    { x1: 60, y1: -70, x2: 60, y2: 70 },
  ],
  H: [
    { x1: -50, y1: -70, x2: 50, y2: 70 },
    { x1: 50, y1: -70, x2: -50, y2: 70 },
  ],
  F: circleSegs(0, 0, 60, 20).concat([
    { x1: 0, y1: -90, x2: 0, y2: 90 },
  ]),
  O: circleSegs(0, 0, 70, 24),
  T: [
    { x1: -70, y1: -70, x2: 70, y2: -70 },
    { x1: 0, y1: -70, x2: 0, y2: 70 },
  ],
  S: arcSegs(0, 0, 70, Math.PI * 0.7, -Math.PI * 0.7, 20),
};

const DIGIT: Record<string, Seg[]> = {
  "0": circleSegs(0, 0, 70, 20),
  "1": [
    { x1: 0, y1: -80, x2: 0, y2: 80 },
    { x1: -30, y1: -60, x2: 0, y2: -80 },
    { x1: -40, y1: 80, x2: 40, y2: 80 },
  ],
  "2": arcSegs(0, -30, 50, Math.PI, 0, 12).concat([
    { x1: 50, y1: -30, x2: -50, y2: 70 },
    { x1: -60, y1: 70, x2: 60, y2: 70 },
  ]),
  "4": [
    { x1: -40, y1: -80, x2: -40, y2: 10 },
    { x1: -40, y1: 10, x2: 50, y2: 10 },
    { x1: 50, y1: -80, x2: 50, y2: 80 },
  ],
  "7": [
    { x1: -60, y1: -70, x2: 60, y2: -70 },
    { x1: 60, y1: -70, x2: -20, y2: 80 },
  ],
};

/* ─── Form definitions (9 forms) ────────────────────────────── */
function buildForms(): FormDef[] {
  return [
    /* ── Geometric ── */
    {
      name: "Concentric Rings",
      type: "geometric",
      subtitle: "Radial Harmony",
      build(pts, cx, cy) {
        let idx = 0;
        for (let ring = 1; ring <= 5 && idx < PARTICLE_COUNT; ring++) {
          const radius = 38 * ring;
          const n = 12 * ring;
          for (let i = 0; i < n && idx < PARTICLE_COUNT; i++) {
            const a = (i / n) * Math.PI * 2;
            pts[idx].tx = cx + Math.cos(a) * radius;
            pts[idx].ty = cy + Math.sin(a) * radius;
            idx++;
          }
        }
        fallbackScatter(pts, idx, cx, cy, 200, 300);
      },
    },
    {
      name: "Fibonacci Spiral",
      type: "geometric",
      subtitle: "Golden Flow",
      build(pts, cx, cy) {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const t = i / PARTICLE_COUNT;
          const a = t * Math.PI * 2 * 3 + ((i % 3) * Math.PI * 2) / 3;
          pts[i].tx = cx + Math.cos(a) * (t * 280);
          pts[i].ty = cy + Math.sin(a) * (t * 280);
        }
      },
    },
    {
      name: "Petal Burst",
      type: "geometric",
      subtitle: "Flower Symmetry",
      build(pts, cx, cy) {
        let idx = 0;
        for (let petal = 0; petal < 8 && idx < PARTICLE_COUNT; petal++) {
          const pa = (petal / 8) * Math.PI * 2;
          for (let i = 0; i < 20 && idx < PARTICLE_COUNT; i++) {
            const t = i / 20;
            const pw = 35 * Math.sin(t * Math.PI);
            pts[idx].tx = cx + t * 190 * Math.cos(pa) + pw * Math.cos(pa + Math.PI / 2);
            pts[idx].ty = cy + t * 190 * Math.sin(pa) + pw * Math.sin(pa + Math.PI / 2);
            idx++;
          }
        }
        fallbackScatter(pts, idx, cx, cy, 10, 100);
      },
    },

    /* ── Glagolitic ── */
    {
      name: "А · АЗЪ",
      type: "glagolitic",
      subtitle: "The Beginning",
      build(pts, cx, cy) {
        const i = distributeSegs(pts, L.A, cx, cy, 1.2, 0);
        fallbackScatter(pts, i, cx, cy, 10, 80);
      },
    },
    {
      name: "М · МИСЛЕТЕ",
      type: "glagolitic",
      subtitle: "Thought · Value 40",
      build(pts, cx, cy) {
        const i = distributeSegs(pts, L.M, cx, cy, 1.3, 0);
        fallbackScatter(pts, i, cx, cy, 10, 80);
      },
    },
    {
      name: "Т · ТВРЪДО",
      type: "glagolitic",
      subtitle: "Solidity · Value 300",
      build(pts, cx, cy) {
        const i = distributeSegs(pts, L.T, cx, cy, 1.4, 0);
        fallbackScatter(pts, i, cx, cy, 10, 80);
      },
    },

    /* ── Numeric ── */
    {
      name: "Number 7",
      type: "numeric",
      subtitle: "Sacred Number",
      build(pts, cx, cy) {
        const i = distributeSegs(pts, DIGIT["7"]!, cx - 40, cy, 1.1, 0);
        fallbackScatter(pts, i, cx, cy, 10, 100);
      },
    },
    {
      name: "Number 42",
      type: "numeric",
      subtitle: "Answer to Everything",
      build(pts, cx, cy) {
        let i = distributeSegs(pts, DIGIT["4"]!, cx - 60, cy, 0.9, 0);
        i = distributeSegs(pts, DIGIT["2"]!, cx + 40, cy, 0.9, i);
        fallbackScatter(pts, i, cx, cy, 10, 100);
      },
    },
    {
      name: "Number 777",
      type: "numeric",
      subtitle: "Divine Trinity",
      build(pts, cx, cy) {
        let i = distributeSegs(pts, DIGIT["7"]!, cx - 90, cy, 0.8, 0);
        i = distributeSegs(pts, DIGIT["7"]!, cx, cy, 0.8, i);
        i = distributeSegs(pts, DIGIT["7"]!, cx + 90, cy, 0.8, i);
        fallbackScatter(pts, i, cx, cy, 10, 100);
      },
    },
  ];
}

/* ─── Component ─────────────────────────────────────────────── */
export function GeometricFlowAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Pt[]>([]);
  const forms = useRef<FormDef[]>([]);
  const idxRef = useRef(0);
  const stateRef = useRef<"transition" | "hold">("transition");
  const tRef = useRef(0);
  const pausedRef = useRef(false);
  const rafRef = useRef(0);

  const [formIdx, setFormIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [totalForms, setTotalForms] = useState(0);

  /* init once */
  useEffect(() => {
    const cx = CANVAS_W / 2;
    const cy = CANVAS_H / 2;

    /* seed particles */
    particles.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: cx + (Math.random() - 0.5) * 100,
      y: cy + (Math.random() - 0.5) * 100,
      tx: cx,
      ty: cy,
      size: 2.5 + Math.random() * 3,
      r: 106,
      g: 155,
      b: 204,
      speed: 0.03 + Math.random() * 0.04,
      pulse: Math.random() * Math.PI * 2,
    }));

    forms.current = buildForms();
    setTotalForms(forms.current.length);

    /* apply first form */
    forms.current[0].build(particles.current, cx, cy);
    tRef.current = performance.now();

    /* render loop */
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      if (!pausedRef.current) {
        const now = performance.now();
        const elapsed = now - tRef.current;

        if (stateRef.current === "transition" && elapsed >= TRANSITION_MS) {
          stateRef.current = "hold";
          tRef.current = now;
        } else if (stateRef.current === "hold" && elapsed >= HOLD_MS) {
          const next = (idxRef.current + 1) % forms.current.length;
          idxRef.current = next;
          forms.current[next].build(particles.current, CANVAS_W / 2, CANVAS_H / 2);
          stateRef.current = "transition";
          tRef.current = now;
          setFormIdx(next);
        }

        /* clear */
        ctx.fillStyle = BG;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        /* get target color */
        const cur = forms.current[idxRef.current];
        const tc = TYPE_COLORS[cur.type];

        /* draw particles */
        for (const p of particles.current) {
          p.x += (p.tx - p.x) * p.speed;
          p.y += (p.ty - p.y) * p.speed;
          p.pulse += 0.04;
          p.r += (tc[0] - p.r) * 0.05;
          p.g += (tc[1] - p.g) * 0.05;
          p.b += (tc[2] - p.b) * 0.05;

          const life = 0.75 + 0.25 * Math.sin(p.pulse);
          const alpha = Math.floor(220 * life) / 255;

          ctx.save();
          ctx.shadowBlur = 6;
          ctx.shadowColor = `rgba(${Math.round(p.r)},${Math.round(p.g)},${Math.round(p.b)},0.6)`;
          ctx.fillStyle = `rgba(${Math.round(p.r)},${Math.round(p.g)},${Math.round(p.b)},${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const goTo = useCallback(
    (delta: number) => {
      if (!forms.current.length) return;
      const next =
        (idxRef.current + delta + forms.current.length) % forms.current.length;
      idxRef.current = next;
      forms.current[next].build(particles.current, CANVAS_W / 2, CANVAS_H / 2);
      stateRef.current = "transition";
      tRef.current = performance.now();
      setFormIdx(next);
    },
    []
  );

  const togglePause = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    if (!pausedRef.current) {
      stateRef.current = "hold";
      tRef.current = performance.now();
    }
  }, []);

  const curForm = forms.current[formIdx];

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ background: BG }}>
      {/* Title bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center pt-3 pointer-events-none">
        <div className="text-center">
          <h2
            className="text-sm font-bold tracking-[0.25em] uppercase"
            style={{ color: "#E8E0D5", textShadow: "0 0 16px rgba(217,119,87,0.3)" }}
          >
            Geometric Flow
          </h2>
          <p className="text-[10px] tracking-[0.15em] mt-0.5" style={{ color: "#A8D5E2", opacity: 0.8 }}>
            Glagolitic · Numeric · Geometric
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-2 right-2 z-20 flex gap-1">
        <CtrlBtn onClick={() => goTo(-1)}>◀</CtrlBtn>
        <CtrlBtn onClick={togglePause}>{paused ? "▶" : "⏸"}</CtrlBtn>
        <CtrlBtn onClick={() => goTo(1)}>▶</CtrlBtn>
      </div>

      {/* Type badge */}
      {curForm && (
        <div
          className="absolute top-10 left-1/2 -translate-x-1/2 z-10 text-[9px] tracking-[0.2em] px-3 py-0.5 border pointer-events-none uppercase font-medium"
          style={{
            color: curForm.type === "geometric" ? "#A8D5E2"
              : curForm.type === "glagolitic" ? "#d97757"
              : "#788c5d",
            borderColor: curForm.type === "geometric" ? "rgba(168,213,226,0.4)"
              : curForm.type === "glagolitic" ? "rgba(217,119,87,0.4)"
              : "rgba(120,140,93,0.4)",
          }}
        >
          {curForm.type}
        </div>
      )}

      {/* Canvas */}
      <div className="w-full">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="block w-full"
          style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
        />
      </div>

      {/* Bottom info */}
      {curForm && (
        <div className="absolute bottom-6 left-0 right-0 z-10 text-center pointer-events-none">
          <p className="text-sm font-bold tracking-[0.2em] uppercase" style={{ color: "rgba(232,224,213,0.85)" }}>
            {curForm.name}
          </p>
          <p className="text-[10px] tracking-[0.15em] mt-0.5" style={{ color: "rgba(168,213,226,0.5)" }}>
            {curForm.subtitle}
          </p>
        </div>
      )}

      {/* Counter */}
      <div className="absolute bottom-2 left-0 right-0 z-10 text-center pointer-events-none">
        <span className="text-[9px] tracking-[0.3em]" style={{ color: "rgba(168,213,226,0.35)" }}>
          {String(formIdx + 1).padStart(3, "0")} / {String(totalForms).padStart(3, "0")}
        </span>
      </div>

      {/* Progress bar */}
      <ProgressTicker stateRef={stateRef} tRef={tRef} pausedRef={pausedRef} />
    </div>
  );
}

/* ─── Sub-components ────────────────────────────────────────── */

function CtrlBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 text-[9px] tracking-[0.15em] uppercase border cursor-pointer transition-all duration-200"
      style={{
        background: "rgba(168,213,226,0.1)",
        border: "1px solid rgba(168,213,226,0.3)",
        color: "#A8D5E2",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(217,119,87,0.2)";
        e.currentTarget.style.borderColor = "rgba(217,119,87,0.5)";
        e.currentTarget.style.color = "#E8E0D5";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(168,213,226,0.1)";
        e.currentTarget.style.borderColor = "rgba(168,213,226,0.3)";
        e.currentTarget.style.color = "#A8D5E2";
      }}
    >
      {children}
    </button>
  );
}

/** Tiny progress bar that ticks using rAF — avoids re-rendering parent. */
function ProgressTicker({
  stateRef,
  tRef,
  pausedRef,
}: {
  stateRef: React.MutableRefObject<"transition" | "hold">;
  tRef: React.MutableRefObject<number>;
  pausedRef: React.MutableRefObject<boolean>;
}) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (!pausedRef.current && barRef.current) {
        const now = performance.now();
        const elapsed = stateRef.current === "transition"
          ? now - tRef.current
          : TRANSITION_MS + (now - tRef.current);
        const total = TRANSITION_MS + HOLD_MS;
        barRef.current.style.width = `${Math.min((elapsed / total) * 100, 100)}%`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stateRef, tRef, pausedRef]);

  return (
    <div
      ref={barRef}
      className="absolute bottom-0 left-0 h-[2px] pointer-events-none z-10"
      style={{
        background: `linear-gradient(90deg, rgba(217,119,87,0.6), rgba(106,155,204,0.6))`,
        width: "0%",
      }}
    />
  );
}
