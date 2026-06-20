"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface Particle {
  id: number;
  text: string;
  angle: number;
  radius: number;
  speed: number;
  size: number;
  color: string;
  opacity: number;
}

const COLORS = ["#2dd4bf", "#a78bfa", "#22d3ee", "#c084fc", "#34d399", "#fb923c"];
const ORBIT_ITEMS = [
  "192.168.1.1", "8.8.8.8", "::1", "1337", "0xFF",
  "443", "∞", "0xDEAD", "/24", "3.14159",
  "127.0.0.1", "2^16", "80", "3000",
];

export function OctopusAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(800);
  const [particles, setParticles] = useState<Particle[]>([]);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  // 3D tilt on mouse
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), { stiffness: 180, damping: 28 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 180, damping: 28 });

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }, [mx, my]);

  const onLeave = useCallback(() => { mx.set(0); my.set(0); }, [mx, my]);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) setW(containerRef.current.getBoundingClientRect().width);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const ps: Particle[] = ORBIT_ITEMS.map((text, i) => ({
      id: i,
      text,
      angle: (i / ORBIT_ITEMS.length) * Math.PI * 2,
      radius: 110 + (i % 3) * 35,
      speed: (0.004 + (i % 4) * 0.0008) * (i % 2 === 0 ? 1 : -1),
      size: 9 + (i % 3) * 2,
      color: COLORS[i % COLORS.length],
      opacity: 0.55 + (i % 3) * 0.12,
    }));
    setParticles(ps);

    let running = true;
    const step = (ts: number) => {
      if (!running) return;
      const dt = ts - (timeRef.current || ts);
      timeRef.current = ts;
      setParticles((prev: Particle[]) => prev.map((p: Particle) => ({ ...p, angle: p.angle + p.speed * (dt / 16) })));
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, []);

  const cx = w / 2;
  const cy = 200;

  return (
    <motion.div
      ref={containerRef}
      className="relative w-full select-none"
      style={{
        height: "340px",
        background: "none",
        border: "none",
        perspective: "900px",
        rotateX,
        rotateY,
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {/* Orbital data particles */}
      {particles.map(p => {
        const x = cx + Math.cos(p.angle) * p.radius;
        const y = cy + Math.sin(p.angle) * p.radius * 0.32;
        return (
          <motion.span
            key={p.id}
            className="absolute font-mono font-bold pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: p.opacity }}
            transition={{ duration: 1.5, delay: p.id * 0.06 }}
            style={{
              left: x, top: y,
              fontSize: p.size,
              color: p.color,
              textShadow: `0 0 10px ${p.color}bb, 0 0 22px ${p.color}44`,
              transform: "translate(-50%,-50%)",
              willChange: "transform",
            }}
          >
            {p.text}
          </motion.span>
        );
      })}

      {/* The Octopus SVG — fully transparent background */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 400 420"
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Body skin gradient — realistic dark purple/teal cephalopod */}
          <radialGradient id="skinGrad" cx="42%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#3ecfb8" stopOpacity="0.95" />
            <stop offset="30%" stopColor="#1a9e8c" stopOpacity="0.88" />
            <stop offset="65%" stopColor="#0e6e72" stopOpacity="0.80" />
            <stop offset="100%" stopColor="#052e3d" stopOpacity="0.70" />
          </radialGradient>

          {/* Mantle highlight */}
          <radialGradient id="mantleShine" cx="38%" cy="28%" r="55%">
            <stop offset="0%" stopColor="#a5f3eb" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#a5f3eb" stopOpacity="0" />
          </radialGradient>

          {/* Sucker gradient */}
          <radialGradient id="suckerGrad" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#5eead4" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#134e4a" stopOpacity="0.6" />
          </radialGradient>

          {/* Eye gradient */}
          <radialGradient id="eyeGrad" cx="35%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="1" />
            <stop offset="45%" stopColor="#7c3aed" stopOpacity="1" />
            <stop offset="100%" stopColor="#1e1b4b" stopOpacity="1" />
          </radialGradient>
          <radialGradient id="pupilGrad" cx="40%" cy="38%" r="55%">
            <stop offset="0%" stopColor="#0d0d1a" stopOpacity="1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="1" />
          </radialGradient>

          {/* Tentacle gradients */}
          <linearGradient id="tentA" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#0e7490" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#0e7490" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="tentB" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5eead4" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#0d9488" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="tentC" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#6d28d9" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.04" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="strongGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="bodyFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── Ambient underbelly glow ── */}
        <ellipse cx="200" cy="310" rx="90" ry="20" fill="#2dd4bf" opacity="0.08" filter="url(#strongGlow)">
          <animate attributeName="opacity" values="0.06;0.14;0.06" dur="3.2s" repeatCount="indefinite" />
        </ellipse>

        {/* ══ TENTACLES (drawn behind body) ══ */}

        {/* Far-left long tentacle */}
        <path d="M 172 280 C 140 310 100 340 70 390 C 55 415 48 430 40 450" fill="none" stroke="url(#tentA)" strokeWidth="7" strokeLinecap="round" filter="url(#glow)">
          <animate attributeName="d"
            values="M 172 280 C 140 310 100 340 70 390 C 55 415 48 430 40 450;M 172 280 C 135 315 92 348 62 398 C 47 422 38 435 30 456;M 172 280 C 140 310 100 340 70 390 C 55 415 48 430 40 450"
            dur="3.6s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" />
        </path>
        {/* Suckers on far-left */}
        {[{cx:155,cy:298},{cx:130,cy:325},{cx:105,cy:352},{cx:83,cy:378},{cx:65,cy:405}].map((s,i)=>(
          <circle key={`sl${i}`} cx={s.cx} cy={s.cy} r="3.5" fill="url(#suckerGrad)" stroke="#2dd4bf" strokeWidth="0.6" opacity="0.7" />
        ))}

        {/* Left tentacle */}
        <path d="M 178 286 C 158 320 145 355 138 395 C 134 415 132 430 130 448" fill="none" stroke="url(#tentB)" strokeWidth="8" strokeLinecap="round" filter="url(#glow)">
          <animate attributeName="d"
            values="M 178 286 C 158 320 145 355 138 395 C 134 415 132 430 130 448;M 178 286 C 155 324 140 360 132 400 C 127 420 124 435 122 453;M 178 286 C 158 320 145 355 138 395 C 134 415 132 430 130 448"
            dur="2.9s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" begin="0.4s" />
        </path>
        {[{cx:168,cy:308},{cx:152,cy:338},{cx:142,cy:368},{cx:136,cy:398}].map((s,i)=>(
          <circle key={`sl2${i}`} cx={s.cx} cy={s.cy} r="4" fill="url(#suckerGrad)" stroke="#5eead4" strokeWidth="0.6" opacity="0.65" />
        ))}

        {/* Center-left tentacle */}
        <path d="M 188 292 C 178 328 172 365 170 400 C 169 418 168 432 168 450" fill="none" stroke="url(#tentA)" strokeWidth="9" strokeLinecap="round" filter="url(#glow)">
          <animate attributeName="d"
            values="M 188 292 C 178 328 172 365 170 400 C 169 418 168 432 168 450;M 188 292 C 175 330 168 368 165 403 C 163 421 162 435 162 453;M 188 292 C 178 328 172 365 170 400 C 169 418 168 432 168 450"
            dur="3.1s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" begin="0.7s" />
        </path>

        {/* Center tentacle */}
        <path d="M 200 295 C 200 332 200 368 200 404 C 200 422 200 436 200 454" fill="none" stroke="url(#tentB)" strokeWidth="10" strokeLinecap="round" filter="url(#glow)">
          <animate attributeName="d"
            values="M 200 295 C 200 332 200 368 200 404 C 200 422 200 436 200 454;M 200 295 C 198 334 196 370 196 406 C 196 424 196 438 196 456;M 200 295 C 200 332 200 368 200 404 C 200 422 200 436 200 454"
            dur="2.7s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" begin="0.2s" />
        </path>
        {[{cx:200,cy:315},{cx:200,cy:345},{cx:200,cy:375},{cx:200,cy:404}].map((s,i)=>(
          <circle key={`sc${i}`} cx={s.cx} cy={s.cy} r="4.5" fill="url(#suckerGrad)" stroke="#2dd4bf" strokeWidth="0.7" opacity="0.7" />
        ))}

        {/* Center-right tentacle */}
        <path d="M 212 292 C 222 328 228 365 230 400 C 231 418 232 432 232 450" fill="none" stroke="url(#tentA)" strokeWidth="9" strokeLinecap="round" filter="url(#glow)">
          <animate attributeName="d"
            values="M 212 292 C 222 328 228 365 230 400 C 231 418 232 432 232 450;M 212 292 C 225 330 232 368 235 403 C 237 421 238 435 238 453;M 212 292 C 222 328 228 365 230 400 C 231 418 232 432 232 450"
            dur="3.3s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" begin="1.0s" />
        </path>

        {/* Right tentacle */}
        <path d="M 222 286 C 242 320 255 355 262 395 C 266 415 268 430 270 448" fill="none" stroke="url(#tentB)" strokeWidth="8" strokeLinecap="round" filter="url(#glow)">
          <animate attributeName="d"
            values="M 222 286 C 242 320 255 355 262 395 C 266 415 268 430 270 448;M 222 286 C 245 324 260 360 268 400 C 273 420 276 435 278 453;M 222 286 C 242 320 255 355 262 395 C 266 415 268 430 270 448"
            dur="2.8s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" begin="0.6s" />
        </path>
        {[{cx:232,cy:308},{cx:248,cy:338},{cx:258,cy:368},{cx:264,cy:398}].map((s,i)=>(
          <circle key={`sr${i}`} cx={s.cx} cy={s.cy} r="4" fill="url(#suckerGrad)" stroke="#5eead4" strokeWidth="0.6" opacity="0.65" />
        ))}

        {/* Far-right long tentacle */}
        <path d="M 228 280 C 260 310 300 340 330 390 C 345 415 352 430 360 450" fill="none" stroke="url(#tentC)" strokeWidth="7" strokeLinecap="round" filter="url(#glow)">
          <animate attributeName="d"
            values="M 228 280 C 260 310 300 340 330 390 C 345 415 352 430 360 450;M 228 280 C 265 315 308 348 338 398 C 353 422 362 435 370 456;M 228 280 C 260 310 300 340 330 390 C 345 415 352 430 360 450"
            dur="3.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" begin="0.9s" />
        </path>
        {[{cx:245,cy:298},{cx:270,cy:325},{cx:295,cy:352},{cx:317,cy:378},{cx:335,cy:405}].map((s,i)=>(
          <circle key={`sr2${i}`} cx={s.cx} cy={s.cy} r="3.5" fill="url(#suckerGrad)" stroke="#a78bfa" strokeWidth="0.6" opacity="0.65" />
        ))}

        {/* Extra side tentacle left — wraps outward */}
        <path d="M 165 270 C 120 295 80 310 50 330 C 30 345 18 358 10 375" fill="none" stroke="url(#tentC)" strokeWidth="5.5" strokeLinecap="round" filter="url(#glow)" opacity="0.7">
          <animate attributeName="d"
            values="M 165 270 C 120 295 80 310 50 330 C 30 345 18 358 10 375;M 165 270 C 118 298 76 316 44 338 C 24 352 12 366 4 383;M 165 270 C 120 295 80 310 50 330 C 30 345 18 358 10 375"
            dur="4.1s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" begin="1.3s" />
        </path>

        {/* Extra side tentacle right — wraps outward */}
        <path d="M 235 270 C 280 295 320 310 350 330 C 370 345 382 358 390 375" fill="none" stroke="url(#tentA)" strokeWidth="5.5" strokeLinecap="round" filter="url(#glow)" opacity="0.7">
          <animate attributeName="d"
            values="M 235 270 C 280 295 320 310 350 330 C 370 345 382 358 390 375;M 235 270 C 282 298 324 316 356 338 C 376 352 388 366 396 383;M 235 270 C 280 295 320 310 350 330 C 370 345 382 358 390 375"
            dur="3.8s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" begin="0.5s" />
        </path>

        {/* ══ BODY ══ */}
        <g filter="url(#bodyFilter)">
          {/* Breathing group */}
          <g>
            <animateTransform attributeName="transform" type="scale" values="1 1;1.015 1.02;1 1" dur="3s" repeatCount="indefinite" additive="sum" />
            <animateTransform attributeName="transform" type="translate" values="0 0;-1.5 -2;0 0" dur="3s" repeatCount="indefinite" additive="sum" />

            {/* Lower body / mantle */}
            <path d="M 148 270 C 148 300 152 315 160 285 C 168 295 178 305 200 308 C 222 305 232 295 240 285 C 248 315 252 300 252 270 Z"
              fill="url(#skinGrad)" opacity="0.95" />

            {/* Main body ellipse */}
            <ellipse cx="200" cy="225" rx="68" ry="82" fill="url(#skinGrad)" />

            {/* Head dome */}
            <ellipse cx="200" cy="168" rx="56" ry="66" fill="url(#skinGrad)" />

            {/* Skin sheen highlight */}
            <ellipse cx="188" cy="148" rx="26" ry="34" fill="url(#mantleShine)" />
            <ellipse cx="192" cy="145" rx="10" ry="16" fill="rgba(255,255,255,0.12)" />

            {/* Texture wrinkle lines */}
            {[232,250,265,278,290].map((y, i) => (
              <path key={i}
                d={`M ${148+i*2} ${y} Q 200 ${y+4} ${252-i*2} ${y}`}
                fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth={1.5 - i * 0.15}
              />
            ))}

            {/* Bioluminescent patches */}
            {[
              {cx:210,cy:210,r:4.5,c:"#2dd4bf",dur:"2.1s"},
              {cx:192,cy:228,r:3.5,c:"#a78bfa",dur:"2.8s"},
              {cx:215,cy:245,r:3,c:"#34d399",dur:"1.9s"},
              {cx:186,cy:258,r:4,c:"#2dd4bf",dur:"3.2s"},
              {cx:208,cy:270,r:3,c:"#c084fc",dur:"2.4s"},
            ].map((sp, i) => (
              <circle key={i} cx={sp.cx} cy={sp.cy} r={sp.r} fill={sp.c} opacity="0.25" filter="url(#glow)">
                <animate attributeName="opacity" values={`0.2;0.65;0.2`} dur={sp.dur} repeatCount="indefinite" begin={`${i*0.5}s`} />
                <animate attributeName="r" values={`${sp.r};${sp.r*1.35};${sp.r}`} dur={sp.dur} repeatCount="indefinite" begin={`${i*0.5}s`} />
              </circle>
            ))}

            {/* ── LEFT EYE ── */}
            <g filter="url(#glow)">
              <circle cx="175" cy="185" r="14" fill="url(#eyeGrad)" />
              <circle cx="175" cy="185" r="10" fill="url(#pupilGrad)" />
              {/* iris ring */}
              <circle cx="175" cy="185" r="11.5" fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.6" />
              {/* pupil slit — horizontal like real cephalopod */}
              <ellipse cx="175" cy="185" rx="4" ry="7" fill="#050510">
                <animate attributeName="ry" values="7;8;7" dur="4s" repeatCount="indefinite" />
              </ellipse>
              {/* Specular highlight */}
              <ellipse cx="171" cy="181" rx="3.5" ry="2.5" fill="rgba(255,255,255,0.75)" />
              <circle cx="178" cy="188" r="1.2" fill="rgba(255,255,255,0.4)" />
              {/* Eye glow ring */}
              <circle cx="175" cy="185" r="14" fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity="0.4" filter="url(#glow)">
                <animate attributeName="opacity" values="0.3;0.7;0.3" dur="3s" repeatCount="indefinite" />
              </circle>
              {/* Blink */}
              <ellipse cx="175" cy="185" rx="14" ry="0" fill="#0a1a1a" opacity="0">
                <animate attributeName="ry" values="0;0;0;14;0" dur="0.25s" repeatCount="indefinite" begin="5s;9.5s;14s" />
                <animate attributeName="opacity" values="0;0;0;1;0" dur="0.25s" repeatCount="indefinite" begin="5s;9.5s;14s" />
              </ellipse>
            </g>

            {/* ── RIGHT EYE ── */}
            <g filter="url(#glow)">
              <circle cx="225" cy="185" r="14" fill="url(#eyeGrad)" />
              <circle cx="225" cy="185" r="10" fill="url(#pupilGrad)" />
              <circle cx="225" cy="185" r="11.5" fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.6" />
              <ellipse cx="225" cy="185" rx="4" ry="7" fill="#050510">
                <animate attributeName="ry" values="7;8;7" dur="4s" repeatCount="indefinite" begin="0.3s" />
              </ellipse>
              <ellipse cx="221" cy="181" rx="3.5" ry="2.5" fill="rgba(255,255,255,0.75)" />
              <circle cx="228" cy="188" r="1.2" fill="rgba(255,255,255,0.4)" />
              <circle cx="225" cy="185" r="14" fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity="0.4" filter="url(#glow)">
                <animate attributeName="opacity" values="0.3;0.7;0.3" dur="3s" repeatCount="indefinite" begin="0.5s" />
              </circle>
              <ellipse cx="225" cy="185" rx="14" ry="0" fill="#0a1a1a" opacity="0">
                <animate attributeName="ry" values="0;0;0;14;0" dur="0.25s" repeatCount="indefinite" begin="5s;9.5s;14s" />
                <animate attributeName="opacity" values="0;0;0;1;0" dur="0.25s" repeatCount="indefinite" begin="5s;9.5s;14s" />
              </ellipse>
            </g>

            {/* Siphon / beak hint */}
            <path d="M 196 215 Q 200 222 204 215" fill="none" stroke="#2dd4bf" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
          </g>
        </g>
      </svg>

      {/* Floating label */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none" style={{ zIndex: 30 }}>
        <motion.span
          className="text-[9px] font-mono tracking-widest uppercase"
          style={{ color: "rgba(45,212,191,0.38)" }}
          animate={{ opacity: [0.38, 0.7, 0.38] }}
          transition={{ duration: 3.5, repeat: Infinity }}
        >
          SPEKTOR-34 ◆ WEB INTELLIGENCE ENGINE ◆ ONLINE
        </motion.span>
      </div>
    </motion.div>
  );
}
