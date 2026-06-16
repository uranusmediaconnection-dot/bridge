"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  RefreshCw,
  Settings2,
  Globe,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";

interface ProxyConfig {
  enabled: boolean;
  strategy: "round_robin" | "random" | "least_used";
  maxRetries: number;
  rotateOnFailure: boolean;
  respectRobotsTxt: boolean;
  delayBetweenRequests: number;
}

const defaultConfig: ProxyConfig = {
  enabled: true,
  strategy: "round_robin",
  maxRetries: 3,
  rotateOnFailure: true,
  respectRobotsTxt: true,
  delayBetweenRequests: 1.0,
};

interface ProxyConfigPanelProps {
  onConfigChange?: (config: ProxyConfig) => void;
}

export function ProxyConfigPanel({ onConfigChange }: ProxyConfigPanelProps) {
  const [config, setConfig] = useState<ProxyConfig>(defaultConfig);
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);

  const updateConfig = (updates: Partial<ProxyConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const resetConfig = () => {
    setConfig(defaultConfig);
    onConfigChange?.(defaultConfig);
  };

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3.5 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Proxy & Scraping Rules</h3>
            <p className="text-[10px] text-muted-foreground">
              {config.enabled ? "Proxy rotation active" : "Direct connection"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-1 text-[10px] text-emerald-400"
            >
              <CheckCircle2 className="w-3 h-3" />
              Saved
            </motion.span>
          )}
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5 space-y-3" style={{ borderTop: "1px solid hsl(var(--border))" }}>
              {/* Enable toggle */}
              <div className="flex items-center justify-between pt-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-foreground">Enable Proxy Rotation</span>
                </div>
                <button
                  onClick={() => updateConfig({ enabled: !config.enabled })}
                  className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
                    config.enabled ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      config.enabled ? "translate-x-4.5 left-0.5" : "left-0.5"
                    }`}
                    style={{ transform: config.enabled ? "translateX(18px)" : "translateX(0)" }}
                  />
                </button>
              </div>

              {/* Strategy */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <RefreshCw className="w-3 h-3" />
                  Rotation Strategy
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["round_robin", "random", "least_used"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateConfig({ strategy: s })}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                        config.strategy === s
                          ? "bg-primary/15 text-primary border border-primary/25"
                          : "text-muted-foreground border border-border bg-muted/30"
                      }`}
                    >
                      {s === "round_robin" ? "Round Robin" : s === "random" ? "Random" : "Least Used"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max retries */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <RotateCcw className="w-3 h-3" />
                  Max Retries: <span className="text-foreground font-semibold">{config.maxRetries}</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={1}
                  value={config.maxRetries}
                  onChange={(e) => updateConfig({ maxRetries: Number(e.target.value) })}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: "hsl(var(--muted))",
                    accentColor: "hsl(var(--primary))",
                  }}
                />
              </div>

              {/* Delay */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  Delay: <span className="text-foreground font-semibold">{config.delayBetweenRequests}s</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={0.5}
                  value={config.delayBetweenRequests}
                  onChange={(e) => updateConfig({ delayBetweenRequests: Number(e.target.value) })}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: "hsl(var(--muted))",
                    accentColor: "hsl(var(--primary))",
                  }}
                />
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                <label className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Rotate on failure</span>
                  <input
                    type="checkbox"
                    checked={config.rotateOnFailure}
                    onChange={(e) => updateConfig({ rotateOnFailure: e.target.checked })}
                    className="rounded border-border text-primary"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Respect robots.txt</span>
                  <input
                    type="checkbox"
                    checked={config.respectRobotsTxt}
                    onChange={(e) => updateConfig({ respectRobotsTxt: e.target.checked })}
                    className="rounded border-border text-primary"
                  />
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button onClick={handleSave} className="btn-gradient-primary flex-1 text-xs py-2">
                  Save Configuration
                </button>
                <button onClick={resetConfig} className="btn-outline text-xs py-2 px-3">
                  Reset
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
