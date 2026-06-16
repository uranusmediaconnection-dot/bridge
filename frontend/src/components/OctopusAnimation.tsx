"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface FloatingItem {
  id: number;
  text: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

const COLORS = ["#14b8a6", "#8b5cf6", "#f59e0b", "#06b6d4", "#a855f7", "#10b981"];
const ITEMS = [
  "192.168.1.1", "10.0.0.1", "8.8.8.8", "::1", "10.42.0.1",
  "42", "1337", "0xFF", "0b1010", "3.14159",
  "255.255.0", "127.0.0.1", "2^16", "∞", "0xDEAD",
  "/24", "22", "443", "80", "3000",
];

export function OctopusAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<FloatingItem[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    const initial: FloatingItem[] = ITEMS.map((text, i) => ({
      id: i,
      text,
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2 - 0.6,
      size: 9 + Math.random() * 5,
      color: COLORS[i % COLORS.length],
    }));
    setItems(initial);

    let running = true;
    const step = () => {
      if (!running) return;
      setItems(prev => prev.map(item => {
        let nx = item.x + item.vx;
        let ny = item.y + item.vy;

        // Bounce off walls
        if (nx < 0 || nx > w) {
          item.vx *= -1;
          nx = Math.max(0, Math.min(w, nx));
        }
        if (ny < 0 || ny > h) {
          item.vy *= -1;
          ny = Math.max(0, Math.min(h, ny));
        }

        // Apply tentacle "pull" toward center
        const cx = w / 2;
        const cy = h / 2.2;
        const dx = cx - nx;
        const dy = cy - ny;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 20) {
          const pull = 0.002;
          item.vx += dx * pull;
          item.vy += dy * pull;
        }

        // Damping
        item.vx *= 0.99;
        item.vy *= 0.99;

        return { ...item, x: nx, y: ny };
      }));
      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);

    const handleResize = () => {
      if (!containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      // update w, h
    };
    window.addEventListener("resize", handleResize);

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="octopus-container w-full rounded-xl border overflow-hidden"
      style={{
        height: "200px",
        borderColor: "hsl(var(--border))",
        backgroundColor: "hsl(var(--muted) / 0.2)",
      }}
    >
      {/* SVG Octopus */}
      <svg
        viewBox="0 0 400 280"
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "none", opacity: 0.6 }}
      >
        {/* Body */}
        <ellipse cx="200" cy="160" rx="50" ry="60" fill="hsl(var(--primary) / 0.12)" stroke="hsl(var(--primary) / 0.25)" strokeWidth="1.5" />
        {/* Eyes */}
        <circle cx="182" cy="148" r="6" fill="hsl(var(--primary))" opacity="0.6" />
        <circle cx="218" cy="148" r="6" fill="hsl(var(--primary))" opacity="0.6" />
        <circle cx="182" cy="148" r="2.5" fill="hsl(var(--background))" />
        <circle cx="218" cy="148" r="2.5" fill="hsl(var(--background))" />
        {/* Tentacles */}
        {[
          { d: "M 165 200 Q 130 230 110 260", delay: "0s" },
          { d: "M 180 210 Q 160 250 150 270", delay: "0.3s" },
          { d: "M 200 215 Q 200 255 200 275", delay: "0.6s" },
          { d: "M 220 210 Q 240 250 250 270", delay: "0.9s" },
          { d: "M 235 200 Q 270 230 290 260", delay: "1.2s" },
          { d: "M 170 205 Q 145 240 125 265", delay: "0.5s" },
          { d: "M 230 205 Q 255 240 275 265", delay: "0.8s" },
          { d: "M 190 215 Q 180 260 170 275", delay: "0.2s" },
        ].map((tent, i) => (
          <path
            key={i}
            d={tent.d}
            fill="none"
            stroke="hsl(var(--primary) / 0.2)"
            strokeWidth="3"
            strokeLinecap="round"
          >
            <animate
              attributeName="d"
              values={`${tent.d};${tent.d.replace(/Q [\d.]+ [\d.]+,/, (m) => {
                const parts = m.match(/[\d.]+/g);
                if (!parts) return m;
                const offset = (Math.random() - 0.5) * 20;
                return `Q ${parseFloat(parts[0]) + offset} ${parseFloat(parts[1]) + offset},`;
              })};${tent.d}`}
              dur="3s"
              repeatCount="indefinite"
              begin={tent.delay}
            />
          </path>
        ))}
      </svg>

      {/* Floating items */}
      {items.map((item) => (
        <motion.span
          key={item.id}
          className="absolute text-xs font-mono font-bold pointer-events-none"
          style={{
            left: item.x,
            top: item.y,
            fontSize: item.size,
            color: item.color,
            opacity: 0.6,
            textShadow: "0 0 8px currentColor",
            transform: "translate(-50%, -50%)",
          }}
        >
          {item.text}
        </motion.span>
      ))}
    </div>
  );
}
