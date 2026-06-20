"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface EyeLogoProps {
  size?: number;
  className?: string;
}

/**
 * Animated all-seeing eye logo.
 * Pure SVG with CSS keyframe animations — no external assets.
 * Uses the app's CSS custom properties for theming.
 * Renders client-only to avoid SVG hydration mismatches.
 */
export function EyeLogo({ size = 36, className = "" }: EyeLogoProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <motion.div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      {mounted && (
        <svg
          viewBox="0 0 48 48"
          width={size}
          height={size}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="eye-logo"
        >
          <defs>
            <radialGradient id="eye-iris-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(175, 80%, 60%)" />
              <stop offset="70%" stopColor="hsl(175, 70%, 45%)" />
              <stop offset="100%" stopColor="hsl(175, 60%, 30%)" />
            </radialGradient>
            <radialGradient id="eye-pupil-grad" cx="45%" cy="40%" r="50%">
              <stop offset="0%" stopColor="hsl(200, 30%, 18%)" />
              <stop offset="100%" stopColor="hsl(220, 40%, 5%)" />
            </radialGradient>
            <filter id="eye-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="iris-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
            </filter>
          </defs>

          {/* Outer orbit ring */}
          <circle cx="24" cy="24" r="22" stroke="hsl(175, 60%, 40%)"
            strokeWidth="0.4" opacity="0.3" className="eye-orbit" />

          {/* Scan line */}
          <line x1="24" y1="24" x2="24" y2="5"
            stroke="hsl(175, 70%, 55%)" strokeWidth="0.3" opacity="0.25"
            className="eye-scan" />

          {/* Iris glow backdrop */}
          <circle cx="24" cy="24" r="10" fill="hsl(175, 70%, 50%)"
            filter="url(#iris-glow)" opacity="0.2" className="eye-iris-pulse" />

          {/* Iris ring */}
          <circle cx="24" cy="24" r="9" stroke="url(#eye-iris-grad)"
            strokeWidth="2.2" fill="none" opacity="0.85" className="eye-iris" />

          {/* Iris detail ring */}
          <circle cx="24" cy="24" r="7" stroke="hsl(175, 65%, 55%)"
            strokeWidth="0.35" fill="none" opacity="0.4" />

          {/* Pupil */}
          <circle cx="24" cy="24" r="4.5" fill="url(#eye-pupil-grad)"
            className="eye-pupil" />

          {/* Pupil highlights */}
          <circle cx="22.5" cy="22.5" r="1.5" fill="hsl(175, 70%, 70%)" opacity="0.6" />
          <circle cx="25.5" cy="23" r="0.6" fill="white" opacity="0.35" />

          {/* Corner nodes */}
          {[0, 90, 180, 270].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x = 24 + Math.cos(rad) * 22;
            const y = 24 + Math.sin(rad) * 22;
            return (
              <circle key={angle} cx={x} cy={y} r="1"
                fill="hsl(175, 60%, 50%)" opacity="0.5" className="eye-node" />
            );
          })}

          {/* Hash marks on orbit */}
          {Array.from({ length: 24 }, (_, i) => {
            const angle = (i * 15 * Math.PI) / 180;
            return (
              <line key={i}
                x1={24 + Math.cos(angle) * 21} y1={24 + Math.sin(angle) * 21}
                x2={24 + Math.cos(angle) * 22} y2={24 + Math.sin(angle) * 22}
                stroke="hsl(175, 50%, 45%)" strokeWidth="0.25"
                opacity={i % 6 === 0 ? 0.5 : 0.2} />
            );
          })}
        </svg>
      )}

      <style jsx>{`
        .eye-logo { filter: url(#eye-glow); }

        .eye-orbit {
          transform-origin: 24px 24px;
          animation: eye-spin 20s linear infinite;
        }
        .eye-scan {
          transform-origin: 24px 24px;
          animation: eye-spin 4s linear infinite;
        }
        .eye-iris-pulse {
          transform-origin: 24px 24px;
          animation: eye-iris-breathe 3s ease-in-out infinite;
        }
        .eye-iris {
          transform-origin: 24px 24px;
          animation: eye-iris-rotate 12s linear infinite;
        }
        .eye-pupil {
          transform-origin: 24px 24px;
          animation: eye-pupil-breathe 3s ease-in-out infinite;
        }
        .eye-node {
          animation: eye-node-blink 4s ease-in-out infinite;
        }
        .eye-node:nth-child(odd) {
          animation-delay: 1s;
        }

        @keyframes eye-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes eye-iris-breathe {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.08); }
        }
        @keyframes eye-iris-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes eye-pupil-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes eye-node-blink {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.15; }
        }
      `}</style>
    </motion.div>
  );
}
