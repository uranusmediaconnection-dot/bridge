"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  Search,
  Bot,
  Activity,
  Zap,
  Shield,
  ArrowRight,
  TrendingUp,
  Code2,
  Database,
  Cpu,
} from "lucide-react";
import { scraperAPI } from "../lib/api";
import type { TabKey } from "./Navbar";

interface DashboardOverviewProps {
  onNavigate: (tab: TabKey) => void;
}

const features = [
  {
    key: "scraper" as TabKey,
    title: "AI Swarm Agent",
    description: "Multi-agent AI system for intelligent data extraction",
    icon: Bot,
    gradient: "from-primary/80 to-secondary/80",
    stats: ["Architect Agent", "Coder Agent", "Supervisor Agent"],
  },
  {
    key: "search" as TabKey,
    title: "Search Aggregator",
    description: "Search across Google, Bing, and DuckDuckGo simultaneously",
    icon: Search,
    gradient: "from-primary/70 to-accent/70",
    stats: ["Multi-engine", "Unified Results", "Smart Ranking"],
  },
];

const metrics = [
  { label: "Scraping Engines", value: "3", icon: Code2, color: "text-primary/70" },
  { label: "Search Engines", value: "3", icon: Search, color: "text-secondary/70" },
  { label: "AI Agents", value: "4", icon: Cpu, color: "text-accent/70" },
  { label: "API Endpoints", value: "5+", icon: Database, color: "text-primary/60" },
];
function Card3D({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 300, damping: 40 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 40 });
  const brightness = useSpring(useTransform(mx, [-0.5, 0.5], [0.97, 1.04]), { stiffness: 300, damping: 40 });

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }, [mx, my]);

  const onLeave = useCallback(() => { mx.set(0); my.set(0); }, [mx, my]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        rotateX: rx, rotateY: ry, filter: brightness ? undefined : undefined,
        transformStyle: "preserve-3d",
        perspective: "800px",
        ...style,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function DashboardOverview({ onNavigate }: DashboardOverviewProps) {
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      try {
        const res = await scraperAPI.healthCheck();
        if (mounted) setApiStatus(res.status === "healthy" ? "online" : "offline");
      } catch {
        if (mounted) setApiStatus("offline");
      }
    };
    // Delay the health check slightly so the UI renders first
    const timer = setTimeout(checkHealth, 500);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="space-y-8 animate-in">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="dashboard-panel relative overflow-hidden p-8 md:p-12"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/8 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-secondary/5 to-transparent rounded-full blur-3xl" />

        <div className="relative z-10">
          {/* Logo in hero */}
          <div className="mb-6">
            <img
              src="/octopus-logo.png"
              alt="Bringenton-Cosmic Logo"
              className="w-16 h-16 rounded-2xl object-cover shadow-lg shadow-cyan-500/20"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-xs font-medium text-secondary">
              V1.2
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border/50 text-xs text-muted-foreground">
              <Activity className="w-3 h-3" />
              <span>API:</span>
              {apiStatus === "checking" ? (
                <span className="text-yellow-500">Checking...</span>
              ) : apiStatus === "online" ? (
                <span className="text-green-500">Online</span>
              ) : (
                <span className="text-red-500">Offline</span>
              )}
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  apiStatus === "checking"
                    ? "bg-yellow-500"
                    : apiStatus === "online"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />
            </div>
            {/* API Docs Link */}
            <a
              href="/api"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              API Docs
            </a>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            <span className="text-gradient">Web Intelligence</span>
            <br />
            <span className="text-foreground">at Your Fingertips</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mb-8 leading-relaxed">
            A powerful suite of web scraping, search aggregation, and AI-driven
            data extraction tools. Extract, analyze, and transform web data with
            enterprise-grade reliability.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate("scraper")}
              className="btn-gradient-primary inline-flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              AI Swarm Agent
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate("search")}
              className="btn-outline inline-flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search Web
            </button>
          </div>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 * i, ease: [0.23, 1, 0.32, 1] }}
          >
            <Card3D className="stat-card h-full cursor-default">
              <div className="flex items-center justify-between mb-3">
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
                <TrendingUp className="w-4 h-4 text-green-500/80" />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">
                {metric.value}
              </div>
              <div className="text-sm text-muted-foreground">{metric.label}</div>
              {/* 3D inner sheen */}
              <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%)", transform: "translateZ(4px)" }} />
            </Card3D>
          </motion.div>
        ))}
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 * i, ease: [0.23, 1, 0.32, 1] }}
            >
              <Card3D
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card cursor-pointer w-full text-left"
                style={{ display: "block" }}
              >
                <button
                  onClick={() => onNavigate(feature.key)}
                  className="w-full text-left p-6"
                  style={{ background: "none", border: "none" }}
                >
                  {/* Gradient accent bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${feature.gradient} opacity-70 group-hover:opacity-100 transition-opacity duration-300`}
                  />

                  {/* Neon spotlight on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{
                    background: `radial-gradient(350px circle at 50% 0%, rgba(45,212,191,0.07), transparent 70%)`,
                  }} />

                  {/* 3D sheen layer */}
                  <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 55%)",
                    transform: "translateZ(6px)",
                  }} />

                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {feature.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {feature.stats.map((stat) => (
                      <span
                        key={stat}
                        className="px-2.5 py-1 rounded-lg bg-muted/50 border border-border/50 text-xs text-muted-foreground"
                      >
                        {stat}
                      </span>
                    ))}
                  </div>

                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <ArrowRight className="w-5 h-5 text-primary" />
                  </div>
                </button>
              </Card3D>
            </motion.div>
          );
        })}
      </div>

      {/* Tech Stack Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45, ease: [0.23, 1, 0.32, 1] }}
        className="rounded-2xl border border-border/50 bg-card/50 p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            Tech Stack
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            "Next.js 14",
            "React 18",
            "TypeScript",
            "Tailwind CSS",
            "Framer Motion",
            "FastAPI",
            "Python 3",
            "BeautifulSoup",
            "Selenium",
            "HeroUI",
          ].map((tech) => (
            <span
              key={tech}
              className="px-3 py-1.5 rounded-xl bg-muted/30 border border-border/40 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-200"
            >
              {tech}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
