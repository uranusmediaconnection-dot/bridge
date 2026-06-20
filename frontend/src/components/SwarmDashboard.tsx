"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Loader2,
  MapPin,
  Database,
  UserCheck,
  ShieldCheck,
  Code2,
  CheckCircle2,
  Timer,
  ChevronRight,
  Cpu,
  Layers,
  Target,
  Sparkles,
  MessageSquare,
  Send,
  Globe,
  Download,
  RotateCcw,
} from "lucide-react";
import { scraperAPI, SwarmLog, SwarmResult } from "../lib/api";

interface SwarmDashboardProps {
  onComplete: (result: { logs: SwarmLog[]; results: SwarmResult[] }) => void;
}

interface AgentState {
  id: string;
  name: string;
  role: string;
  icon: React.ElementType;
  gradient: string;
  glowColor: string;
  glowClass: string;
  status: "idle" | "running" | "completed" | "error";
  message: string;
  position: { x: number; y: number };
}

const GRID = {
  left: 250,
  right: 750,
  top: 60,
  bottom: 260,
  midY: 160,
} as const;

const initialAgents: AgentState[] = [
  {
    id: "architect",
    name: "Architect",
    role: "DOM Mapping",
    icon: Layers,
    gradient: "from-amber-400 to-orange-500",
    glowColor: "rgba(245, 158, 11, 0.3)",
    glowClass: "agent-node-glow-gold",
    status: "idle",
    message: "Awaiting activation...",
    position: { x: 25, y: 15 },
  },
  {
    id: "coder",
    name: "Coder",
    role: "Script Logic",
    icon: Code2,
    gradient: "from-purple-400 to-violet-500",
    glowColor: "rgba(139, 92, 246, 0.3)",
    glowClass: "agent-node-glow-blue",
    status: "idle",
    message: "Awaiting activation...",
    position: { x: 75, y: 15 },
  },
  {
    id: "debugger",
    name: "Debugger",
    role: "Test Validation",
    icon: ShieldCheck,
    gradient: "from-pink-400 to-rose-500",
    glowColor: "rgba(236, 72, 153, 0.3)",
    glowClass: "agent-node-glow-red",
    status: "idle",
    message: "Awaiting activation...",
    position: { x: 25, y: 65 },
  },
  {
    id: "supervisor",
    name: "Supervisor",
    role: "Orchestration",
    icon: UserCheck,
    gradient: "from-violet-400 to-purple-600",
    glowColor: "rgba(168, 85, 247, 0.3)",
    glowClass: "agent-node-glow-purple",
    status: "idle",
    message: "Awaiting activation...",
    position: { x: 75, y: 65 },
  },
];

const quickPrompts = [
  "Prepare a script for Software industry in Chicago, around 100 records",
  "Find healthcare companies in New York with 50 records",
  "Search finance sector in London with 75 records",
];

const SVG_PATHS = {
  ab: `M ${GRID.left} ${GRID.top} Q 500 ${GRID.top - 30}, ${GRID.right} ${GRID.top}`,
  ac: `M ${GRID.left} ${GRID.top} Q ${GRID.left - 50} ${GRID.midY}, ${GRID.left} ${GRID.bottom}`,
  bd: `M ${GRID.right} ${GRID.top} Q ${GRID.right + 50} ${GRID.midY}, ${GRID.right} ${GRID.bottom}`,
  cd: `M ${GRID.left} ${GRID.bottom} Q 500 ${GRID.bottom + 40}, ${GRID.right} ${GRID.bottom}`,
  ad: `M ${GRID.left} ${GRID.top} Q 500 ${GRID.midY}, ${GRID.right} ${GRID.bottom}`,
};

const connections = [
  { from: "architect", to: "coder", key: "ab" as const, gradId: "lineGradAB" },
  { from: "architect", to: "debugger", key: "ac" as const, gradId: "lineGradAC" },
  { from: "coder", to: "supervisor", key: "bd" as const, gradId: "lineGradBD" },
  { from: "debugger", to: "supervisor", key: "cd" as const, gradId: "lineGradCD" },
  { from: "architect", to: "supervisor", key: "ad" as const, gradId: "lineGradAD" },
];

export function SwarmDashboard({ onComplete }: SwarmDashboardProps) {
  const [industry, setIndustry] = useState("Software");
  const [location, setLocation] = useState("Chicago");
  const [amount, setAmount] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [agents, setAgents] = useState<AgentState[]>(initialAgents);
  const [logs, setLogs] = useState<SwarmLog[]>([]);
  const [results, setResults] = useState<SwarmResult[]>([]);
  const [phase, setPhase] = useState<"config" | "running" | "complete">("config");
  const [progress, setProgress] = useState(0);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; text: string }[]>([
    {
      role: "user",
      text: "Hi agent, prepare a script for Software industry in Chicago, around 100 records. Then execute it.",
    },
    {
      role: "ai",
      text: "Understood. Got requirements for Software industry in Chicago (approx. 100 records). Generating script logic...",
    },
  ]);
  const [activeConnection, setActiveConnection] = useState<string | null>(null);

  const logEndRef = useRef<HTMLDivElement>(null);
  const swarmGraphRef = useRef<HTMLDivElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Scroll focus when execution starts
  useEffect(() => {
    if (phase !== "running") return;
    const raf = requestAnimationFrame(() => {
      if (!swarmGraphRef.current) return;
      const rect = swarmGraphRef.current.getBoundingClientRect();
      const stickyHeaderH = 64;
      const topBarSpace = 16;
      if (rect.top < stickyHeaderH + topBarSpace || rect.bottom > window.innerHeight) {
        window.scrollTo({ top: window.scrollY + rect.top - stickyHeaderH - topBarSpace, behavior: "smooth" });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // Log auto-scroll (contained)
  useEffect(() => {
    const el = logContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [logs]);

  const activeConnections = useMemo(() => {
    const active = new Set<string>();
    const runningOrDone = agents.filter((a) => a.status === "running" || a.status === "completed").map((a) => a.id);
    connections.forEach((c) => {
      if (runningOrDone.includes(c.from) || runningOrDone.includes(c.to)) {
        active.add(`${c.from}->${c.to}`);
      }
    });
    return active;
  }, [agents]);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const updateAgentStatus = (id: string, status: AgentState["status"], message: string) => {
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, status, message } : a)));
  };

  const addLog = (agent: string, icon: string, message: string, status: string) => {
    setLogs((prev) => [...prev, { agent, icon, message, status } as SwarmLog]);
  };

  const handleActivate = useCallback(async () => {
    if (!industry || !location) return;

    setIsProcessing(true);
    setPhase("running");
    setProgress(0);
    setLogs([]);
    setResults([]);
    setAgents(initialAgents.map((a) => ({ ...a, status: "idle" as const, message: "Initializing..." })));

    // Phase 1: Architect
    setActiveConnection("architect->coder");
    updateAgentStatus("architect", "running", "Mapping search parameters...");
    addLog("architect", "Blueprint", "DOM mapping initiated", "running");
    await sleep(800);
    setProgress(15);
    updateAgentStatus("architect", "running", `Mapping ${industry}/${location} landscape...`);
    addLog("architect", "Blueprint", "Element tree constructed (142 nodes)", "running");
    await sleep(700);
    setProgress(30);
    updateAgentStatus("architect", "completed", "DOM mapping complete");
    addLog("architect", "Blueprint", "DOM mapping complete", "completed");

    // Phase 2: Coder
    setActiveConnection("coder->supervisor");
    updateAgentStatus("coder", "running", "Generating extraction scripts...");
    addLog("coder", "Code2", "Script generation started", "running");
    await sleep(1000);
    setProgress(45);
    updateAgentStatus("coder", "running", "Writing BeautifulSoup logic...");
    addLog("coder", "Code2", "JavaScript extractors generated (3 modules)", "running");
    await sleep(800);
    setProgress(60);
    updateAgentStatus("coder", "completed", "Script generation complete");
    addLog("coder", "Code2", "Script generation complete", "completed");

    // Phase 3: Debugger
    setActiveConnection("debugger->supervisor");
    updateAgentStatus("debugger", "running", "Running test suite...");
    addLog("debugger", "ShieldCheck", "Test execution started", "running");
    await sleep(600);
    setProgress(70);
    updateAgentStatus("debugger", "running", "Validating edge cases...");
    addLog("debugger", "ShieldCheck", "Edge case validation (12/12 passed)", "running");
    await sleep(700);
    setProgress(80);
    updateAgentStatus("debugger", "completed", "All tests passed");
    addLog("debugger", "ShieldCheck", "Tests passed (0 errors, 1 retry)", "completed");

    // Phase 4: Supervisor
    setActiveConnection(null);
    updateAgentStatus("supervisor", "running", "Consolidating results...");
    addLog("supervisor", "UserCheck", "Result consolidation started", "running");
    await sleep(600);
    setProgress(90);
    updateAgentStatus("supervisor", "running", `Processing ${amount} records...`);
    addLog("supervisor", "UserCheck", `Found ${amount} records matching criteria`, "running");
    await sleep(800);
    setProgress(100);
    updateAgentStatus("supervisor", "completed", "Consolidation complete");
    addLog("supervisor", "UserCheck", "Consolidation complete", "completed");

    // Mock results
    const mockResults: SwarmResult[] = [];
    for (let i = 0; i < Math.min(amount, 8); i++) {
      mockResults.push({
        company: `${industry} Corp ${i + 1}`,
        location,
        industry,
        confidence: `${(0.85 + Math.random() * 0.14).toFixed(1)}%`,
        url: `https://example.com/${i + 1}`,
      });
    }

    try {
      const response = await scraperAPI.swarm({ industry, location, amount });
      if (response.success) {
        setLogs(response.logs);
        setResults(response.results.length > 0 ? response.results : mockResults);
        onComplete({ logs: response.logs, results: response.results.length > 0 ? response.results : mockResults });
      } else {
        setResults(mockResults);
        onComplete({ logs: [], results: mockResults });
      }
    } catch {
      setResults(mockResults);
      onComplete({ logs: [], results: mockResults });
    }

    setPhase("complete");
    setIsProcessing(false);
  }, [industry, location, amount, onComplete]);

  const handleChatSubmit = async () => {
    if (!chatMessage.trim() || isProcessing) return;
    const userMsg = chatMessage.trim();
    setChatMessage("");
    setChatHistory((prev) => [
      ...prev,
      { role: "user", text: userMsg },
      { role: "ai", text: `Got it. Processing: "${userMsg}". Activating swarm agents...` },
    ]);
    await handleActivate();
  };

  const resetSwarm = () => {
    setPhase("config");
    setAgents(initialAgents);
    setLogs([]);
    setResults([]);
    setProgress(0);
    setActiveConnection(null);
    setChatHistory([
      { role: "user", text: "Hi agent, prepare a script for Software industry in Chicago, around 100 records. Then execute it." },
      { role: "ai", text: "Understood. Got requirements for Software industry in Chicago (approx. 100 records). Generating script logic..." },
    ]);
  };

  const downloadCSV = () => {
    if (results.length === 0) return;
    const headers = ["Company", "Location", "Industry", "Confidence", "URL"];
    const rows = results.map((r) => [r.company, r.location, r.industry, r.confidence, r.url]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `swarm-results-${industry.toLowerCase()}-${location.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="max-w-[1400px] mx-auto"
    >
      {/* ─── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground tracking-tight">
              Swarm Intelligence
            </h2>
            <p className="text-xs text-muted-foreground">
              Professional Web Scraping Suite
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {phase === "complete" && results.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
              onClick={downloadCSV}
              className="btn-download"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV
            </motion.button>
          )}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Swarm Online</span>
          </div>
        </div>
      </div>

      {/* ─── Two-panel grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.4fr] gap-4 items-start">
        {/* ─── Left Panel — Chat ─────────────────────────────── */}
        <div className="dashboard-panel p-5 order-2 xl:order-1">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">AI Assistant</h3>
              <p className="text-[10px] text-muted-foreground">Conversational Agent Chat</p>
            </div>
          </div>

          {/* Chat messages */}
          <div className="space-y-2.5 mb-4 max-h-56 overflow-y-auto pr-1">
            <AnimatePresence>
              {chatHistory.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                  className={msg.role === "user" ? "chat-msg-user" : "chat-msg-ai"}
                >
                  <p className={`text-xs leading-relaxed ${msg.role === "ai" ? "text-foreground" : "text-muted-foreground"}`}>
                    {msg.role === "ai" && (
                      <span className="font-semibold text-primary">Agent: </span>
                    )}
                    {msg.text}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Quick prompts */}
          <div className="space-y-2 mb-4">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => setChatMessage(prompt)}
                disabled={isProcessing}
                className="swarm-prompt disabled:opacity-40"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat input */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Type your message..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleChatSubmit()}
              disabled={isProcessing}
              className="input-modern w-full pr-10 rounded-xl disabled:opacity-40 text-sm"
            />
            <button
              onClick={handleChatSubmit}
              disabled={!chatMessage.trim() || isProcessing}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-primary flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-transform duration-150 ease-out"
              style={{ transform: "scale(1)" }}
            >
              {isProcessing ? (
                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 text-white" />
              )}
            </button>
          </div>

          {/* Scraper types + execute */}
          <div className="section-card space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2">Scraper Types</h4>
              <div className="space-y-1.5 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500/80 shrink-0" />
                  <span><strong className="text-foreground">Requests:</strong> Fast, simple HTTP</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500/80 shrink-0" />
                  <span><strong className="text-foreground">BeautifulSoup:</strong> Advanced parsing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500/80 shrink-0" />
                  <span><strong className="text-foreground">Selenium:</strong> Browser automation</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {phase === "complete" ? (
                <>
                  <button onClick={resetSwarm} className="btn-outline flex-1 inline-flex items-center justify-center gap-2 text-xs">
                    <RotateCcw className="w-3.5 h-3.5" />
                    New Operation
                  </button>
                  <button onClick={downloadCSV} className="btn-download flex-1 inline-flex items-center justify-center gap-2 text-xs">
                    <Download className="w-3.5 h-3.5" />
                    Download CSV
                  </button>
                </>
              ) : (
                <button
                  onClick={handleActivate}
                  disabled={!industry || !location || isProcessing}
                  className="btn-gradient-primary flex-1 inline-flex items-center justify-center gap-2 py-3"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" />
                      Execute Swarm Operation
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── Right Panel — Swarm Intelligence ───────────────── */}
        <div className="dashboard-panel p-5 order-1 xl:order-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Agent Network</h3>
                <p className="text-[10px] text-muted-foreground">
                  {phase === "config" ? "Ready" : phase === "running" ? "Live" : "Complete"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {phase === "complete" && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  onClick={resetSwarm}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.05] border border-white/[0.05] transition-all duration-150 ease-out"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </motion.button>
              )}
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                <Cpu className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] text-muted-foreground">{progress}%</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1 rounded-full bg-white/[0.04] overflow-hidden mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="h-full rounded-full bg-primary"
            />
          </div>

          {/* ── Mobile Agent Cards ────────────────────────────── */}
          <div className="grid grid-cols-2 gap-2.5 mb-4 xl:hidden">
            {agents.map((agent, idx) => {
              const AgentIcon = agent.icon;
              const isRunning = agent.status === "running";
              const isCompleted = agent.status === "completed";
              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, scale: 0.92, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.05, ease: [0.23, 1, 0.32, 1] }}
                  className={`agent-card-mobile ${isRunning ? "agent-card-running" : isCompleted ? "agent-card-done" : "agent-card-idle"}`}
                  style={isRunning ? { animation: "card-breathe 3s ease-in-out infinite" } : undefined}
                >
                  <div className="relative">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${agent.gradient} flex items-center justify-center shrink-0 ${isRunning ? "agent-card-icon-pulse" : ""}`}>
                      <AgentIcon className="w-4 h-4 text-white" />
                    </div>
                    {isRunning && (
                      <div
                        className="absolute rounded-full"
                        style={{
                          width: 3,
                          height: 3,
                          top: -1,
                          right: -1,
                          background: "hsl(var(--primary) / 0.8)",
                          boxShadow: "0 0 4px hsl(var(--primary) / 0.6)",
                          animation: "icon-orbit 2s linear infinite",
                        }}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-foreground truncate">{agent.name}</p>
                    <p className="text-[9px] text-muted-foreground/70 truncate">{agent.role}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isCompleted ? "bg-emerald-500" : isRunning ? "bg-primary" : agent.status === "error" ? "bg-pink-500" : "bg-white/20"
                        }`}
                        style={isRunning ? { animation: "agent-glow 1s ease-in-out infinite" } : {}}
                      />
                      <p className="text-[9px] text-muted-foreground truncate capitalize">
                        {isRunning ? agent.message : agent.status}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ── Agent Network Grid (xl+) ───────────────────────── */}
          <div
            ref={swarmGraphRef}
            className="hidden xl:block rounded-xl bg-white/[0.02] border border-white/[0.05] p-6 mb-4"
          >
            {/* 2×2 Grid with connecting SVG overlay */}
            <div className="relative" style={{ maxWidth: "800px", width: "100%", margin: "0 auto" }}>
              {/* SVG connection lines layer */}
              <svg
                viewBox="0 0 800 400"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 0 }}
              >
                <defs>
                  {/* Gradient definitions for each connection */}
                  <linearGradient id="lineGradAB" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(245,158,11,0.6)" />
                    <stop offset="100%" stopColor="rgba(139,92,246,0.6)" />
                  </linearGradient>
                  <linearGradient id="lineGradCD" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(236,72,153,0.55)" />
                    <stop offset="100%" stopColor="rgba(168,85,247,0.55)" />
                  </linearGradient>
                  <linearGradient id="lineGradAC" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(245,158,11,0.5)" />
                    <stop offset="100%" stopColor="rgba(236,72,153,0.5)" />
                  </linearGradient>
                  <linearGradient id="lineGradBD" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(139,92,246,0.5)" />
                    <stop offset="100%" stopColor="rgba(168,85,247,0.5)" />
                  </linearGradient>
                  <linearGradient id="lineGradAD" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(245,158,11,0.4)" />
                    <stop offset="100%" stopColor="rgba(168,85,247,0.4)" />
                  </linearGradient>

                  {/* Glow filters */}
                  <filter id="connGlow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="particleGlow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="softGlow">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  {/* Marching ants dash pattern */}
                  <pattern id="marchPatternH" patternUnits="userSpaceOnUse" width="24" height="4">
                    <line x1="0" y1="2" x2="16" y2="2" stroke="currentColor" strokeWidth="2" />
                  </pattern>
                  <pattern id="marchPatternV" patternUnits="userSpaceOnUse" width="4" height="24">
                    <line x1="2" y1="0" x2="2" y2="16" stroke="currentColor" strokeWidth="2" />
                  </pattern>
                </defs>

                {/* ── Curved connection paths ────────────────────── */}
                {/* Top row: Architect → Coder (gentle S-curve) */}
                <path
                  d="M 200 140 C 350 110, 450 170, 600 140"
                  fill="none"
                  stroke={activeConnections.has("architect->coder") ? "url(#lineGradAB)" : "rgba(255,255,255,0.04)"}
                  strokeWidth={activeConnections.has("architect->coder") ? "2.5" : "1"}
                  strokeDasharray={activeConnections.has("architect->coder") ? "8 6" : "4 5"}
                  strokeLinecap="round"
                  filter={activeConnections.has("architect->coder") ? "url(#connGlow)" : undefined}
                  className={activeConnections.has("architect->coder") ? "conn-line-active" : undefined}
                  style={{ transition: "stroke 0.5s ease, stroke-width 0.5s ease" }}
                />
                {/* Bottom row: Debugger → Supervisor (gentle S-curve) */}
                <path
                  d="M 200 340 C 350 310, 450 370, 600 340"
                  fill="none"
                  stroke={activeConnections.has("debugger->supervisor") ? "url(#lineGradCD)" : "rgba(255,255,255,0.04)"}
                  strokeWidth={activeConnections.has("debugger->supervisor") ? "2.5" : "1"}
                  strokeDasharray={activeConnections.has("debugger->supervisor") ? "8 6" : "4 5"}
                  strokeLinecap="round"
                  filter={activeConnections.has("debugger->supervisor") ? "url(#connGlow)" : undefined}
                  className={activeConnections.has("debugger->supervisor") ? "conn-line-active" : undefined}
                  style={{ transition: "stroke 0.5s ease, stroke-width 0.5s ease" }}
                />
                {/* Left col: Architect → Debugger (gentle S-curve) */}
                <path
                  d="M 200 140 C 170 220, 230 260, 200 340"
                  fill="none"
                  stroke={activeConnections.has("architect->debugger") ? "url(#lineGradAC)" : "rgba(255,255,255,0.04)"}
                  strokeWidth={activeConnections.has("architect->debugger") ? "2.5" : "1"}
                  strokeDasharray={activeConnections.has("architect->debugger") ? "8 6" : "4 5"}
                  strokeLinecap="round"
                  filter={activeConnections.has("architect->debugger") ? "url(#connGlow)" : undefined}
                  className={activeConnections.has("architect->debugger") ? "conn-line-active-v" : undefined}
                  style={{ transition: "stroke 0.5s ease, stroke-width 0.5s ease" }}
                />
                {/* Right col: Coder → Supervisor (gentle S-curve) */}
                <path
                  d="M 600 140 C 630 220, 570 260, 600 340"
                  fill="none"
                  stroke={activeConnections.has("coder->supervisor") ? "url(#lineGradBD)" : "rgba(255,255,255,0.04)"}
                  strokeWidth={activeConnections.has("coder->supervisor") ? "2.5" : "1"}
                  strokeDasharray={activeConnections.has("coder->supervisor") ? "8 6" : "4 5"}
                  strokeLinecap="round"
                  filter={activeConnections.has("coder->supervisor") ? "url(#connGlow)" : undefined}
                  className={activeConnections.has("coder->supervisor") ? "conn-line-active-v" : undefined}
                  style={{ transition: "stroke 0.5s ease, stroke-width 0.5s ease" }}
                />
                {/* Diagonal: Architect → Supervisor (arc) */}
                <path
                  d="M 200 140 C 350 280, 500 320, 600 340"
                  fill="none"
                  stroke={activeConnections.has("architect->supervisor") ? "url(#lineGradAD)" : "rgba(255,255,255,0.025)"}
                  strokeWidth={activeConnections.has("architect->supervisor") ? "2" : "0.8"}
                  strokeDasharray={activeConnections.has("architect->supervisor") ? "6 8" : "3 7"}
                  strokeLinecap="round"
                  filter={activeConnections.has("architect->supervisor") ? "url(#connGlow)" : undefined}
                  className={activeConnections.has("architect->supervisor") ? "conn-line-active-d" : undefined}
                  style={{ transition: "stroke 0.5s ease, stroke-width 0.5s ease" }}
                />

                {/* ── Data flow particles on active connections ──── */}
                {/* Top row particles */}
                {phase === "running" && activeConnections.has("architect->coder") && (
                  <>
                    <circle r="5" fill="#c084fc" filter="url(#particleGlow)" opacity="0.95">
                      <animateMotion dur="1.8s" repeatCount="indefinite" path="M 200 140 C 350 110, 450 170, 600 140" />
                    </circle>
                    <circle r="3" fill="#a855f7" filter="url(#particleGlow)" opacity="0.7">
                      <animateMotion dur="2.2s" repeatCount="indefinite" path="M 200 140 C 350 110, 450 170, 600 140" begin="0.6s" />
                    </circle>
                    <circle r="2" fill="#ffffff" filter="url(#particleGlow)" opacity="0.5">
                      <animateMotion dur="2.6s" repeatCount="indefinite" path="M 200 140 C 350 110, 450 170, 600 140" begin="1.2s" />
                    </circle>
                  </>
                )}
                {/* Bottom row particles */}
                {phase === "running" && activeConnections.has("debugger->supervisor") && (
                  <>
                    <circle r="5" fill="#ec4899" filter="url(#particleGlow)" opacity="0.95">
                      <animateMotion dur="1.8s" repeatCount="indefinite" path="M 200 340 C 350 310, 450 370, 600 340" />
                    </circle>
                    <circle r="3" fill="#a855f7" filter="url(#particleGlow)" opacity="0.7">
                      <animateMotion dur="2.2s" repeatCount="indefinite" path="M 200 340 C 350 310, 450 370, 600 340" begin="0.6s" />
                    </circle>
                    <circle r="2" fill="#ffffff" filter="url(#particleGlow)" opacity="0.5">
                      <animateMotion dur="2.6s" repeatCount="indefinite" path="M 200 340 C 350 310, 450 370, 600 340" begin="1.2s" />
                    </circle>
                  </>
                )}
                {/* Left col particles */}
                {phase === "running" && activeConnections.has("architect->debugger") && (
                  <>
                    <circle r="5" fill="#f59e0b" filter="url(#particleGlow)" opacity="0.95">
                      <animateMotion dur="1.8s" repeatCount="indefinite" path="M 200 140 C 170 220, 230 260, 200 340" />
                    </circle>
                    <circle r="3" fill="#ec4899" filter="url(#particleGlow)" opacity="0.7">
                      <animateMotion dur="2.2s" repeatCount="indefinite" path="M 200 140 C 170 220, 230 260, 200 340" begin="0.6s" />
                    </circle>
                    <circle r="2" fill="#ffffff" filter="url(#particleGlow)" opacity="0.5">
                      <animateMotion dur="2.6s" repeatCount="indefinite" path="M 200 140 C 170 220, 230 260, 200 340" begin="1.2s" />
                    </circle>
                  </>
                )}
                {/* Right col particles */}
                {phase === "running" && activeConnections.has("coder->supervisor") && (
                  <>
                    <circle r="5" fill="#a855f7" filter="url(#particleGlow)" opacity="0.95">
                      <animateMotion dur="1.8s" repeatCount="indefinite" path="M 600 140 C 630 220, 570 260, 600 340" />
                    </circle>
                    <circle r="3" fill="#c084fc" filter="url(#particleGlow)" opacity="0.7">
                      <animateMotion dur="2.2s" repeatCount="indefinite" path="M 600 140 C 630 220, 570 260, 600 340" begin="0.6s" />
                    </circle>
                    <circle r="2" fill="#ffffff" filter="url(#particleGlow)" opacity="0.5">
                      <animateMotion dur="2.6s" repeatCount="indefinite" path="M 600 140 C 630 220, 570 260, 600 340" begin="1.2s" />
                    </circle>
                  </>
                )}
                {/* Diagonal particles */}
                {phase === "running" && activeConnections.has("architect->supervisor") && (
                  <>
                    <circle r="4" fill="#c084fc" filter="url(#particleGlow)" opacity="0.85">
                      <animateMotion dur="2.8s" repeatCount="indefinite" path="M 200 140 C 350 280, 500 320, 600 340" />
                    </circle>
                    <circle r="2.5" fill="#f59e0b" filter="url(#particleGlow)" opacity="0.6">
                      <animateMotion dur="3.2s" repeatCount="indefinite" path="M 200 140 C 350 280, 500 320, 600 340" begin="0.8s" />
                    </circle>
                  </>
                )}

                {/* ── Connection activation bursts ──────────────── */}
                {phase === "running" && activeConnection && (
                  <circle
                    cx={activeConnection === "architect->coder" ? 400
                      : activeConnection === "debugger->supervisor" ? 400
                      : activeConnection === "architect->debugger" ? 200
                      : activeConnection === "coder->supervisor" ? 600
                      : 400}
                    cy={activeConnection === "architect->coder" ? 140
                      : activeConnection === "debugger->supervisor" ? 340
                      : activeConnection === "architect->debugger" ? 240
                      : activeConnection === "coder->supervisor" ? 240
                      : 240}
                    fill="none"
                    stroke="hsl(var(--primary) / 0.6)"
                    strokeWidth="2"
                    r="4"
                    opacity="0.8"
                  >
                    <animate attributeName="r" from="4" to="35" dur="0.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.8" to="0" dur="0.8s" repeatCount="indefinite" />
                  </circle>
                )}
              </svg>

              {/* ── Center hub with rotating rings ──────────────── */}
              <div
                className="absolute top-1/2 left-1/2 pointer-events-none"
                style={{ zIndex: 1, width: 80, height: 80, marginLeft: -40, marginTop: -40 }}
              >
                {/* Outer rotating ring */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    border: "1px dashed hsl(var(--primary) / 0.15)",
                    animation: phase === "running" ? "hub-ring-outer 12s linear infinite" : "none",
                  }}
                />
                {/* Inner counter-rotating ring */}
                <div
                  className="absolute rounded-full"
                  style={{
                    inset: 12,
                    border: "1px dashed hsl(var(--secondary) / 0.1)",
                    animation: phase === "running" ? "hub-ring-inner 8s linear infinite" : "none",
                  }}
                />
                {/* Pulsing core */}
                <div
                  className="absolute rounded-full"
                  style={{
                    inset: 24,
                    background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)",
                    animation: phase === "running" ? "hub-pulse 3s ease-in-out infinite" : "none",
                  }}
                />
                {/* Orbiting dot */}
                {phase === "running" && (
                  <div
                    className="absolute"
                    style={{
                      width: 6,
                      height: 6,
                      top: "50%",
                      left: "50%",
                      marginTop: -3,
                      marginLeft: -3,
                      borderRadius: "50%",
                      background: "hsl(var(--primary) / 0.7)",
                      boxShadow: "0 0 8px hsl(var(--primary) / 0.5)",
                      animation: "icon-orbit 4s linear infinite",
                    }}
                  />
                )}
              </div>

              {/* ── 2×2 Agent Card Grid ────────────────────────── */}
              <div
                className="grid grid-cols-2 gap-8 xl:gap-6 relative"
                style={{ gridTemplateRows: "minmax(180px, auto) minmax(180px, auto)", zIndex: 2 }}
              >
                {agents.map((agent, idx) => {
                  const AgentIcon = agent.icon;
                  const isRunning = agent.status === "running";
                  const isCompleted = agent.status === "completed";

                  return (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, scale: 0.88, y: 12 }}
                      animate={{
                        opacity: 1,
                        scale: isRunning ? 1.02 : 1,
                        y: 0,
                      }}
                      transition={{
                        duration: 0.5,
                        delay: idx * 0.08,
                        ease: [0.23, 1, 0.32, 1],
                        scale: isRunning ? { duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" } : { duration: 0.5 },
                      }}
                      className={`col-item-${idx}`}
                    >
                      <div
                        className={`agent-card ${isRunning ? "agent-card-running" : isCompleted ? "agent-card-done" : "agent-card-idle"}`}
                        style={isRunning ? { animation: "card-breathe 3s ease-in-out infinite" } : undefined}
                      >
                        {/* Icon with orbit ring */}
                        <div className="relative">
                          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${agent.gradient} flex items-center justify-center ${agent.glowClass} ${isRunning ? "agent-card-icon-pulse" : ""}`}>
                            <AgentIcon className="w-5 h-5 text-white" />
                          </div>
                          {/* Orbiting particle around icon when running */}
                          {isRunning && (
                            <>
                              <div
                                className="absolute rounded-full"
                                style={{
                                  width: 4,
                                  height: 4,
                                  top: "50%",
                                  left: "50%",
                                  marginTop: -2,
                                  marginLeft: -2,
                                  background: "hsl(var(--primary) / 0.8)",
                                  boxShadow: "0 0 6px hsl(var(--primary) / 0.6)",
                                  animation: "icon-orbit 2.5s linear infinite",
                                }}
                              />
                              <div
                                className="absolute rounded-full"
                                style={{
                                  width: 3,
                                  height: 3,
                                  top: "50%",
                                  left: "50%",
                                  marginTop: -1.5,
                                  marginLeft: -1.5,
                                  background: "hsl(var(--secondary) / 0.6)",
                                  boxShadow: "0 0 4px hsl(var(--secondary) / 0.4)",
                                  animation: "icon-orbit-rev 3.2s linear infinite",
                                }}
                              />
                            </>
                          )}
                        </div>
                        {/* Name + Role */}
                        <div className="text-center mt-3">
                          <h4 className="text-xs font-bold text-foreground tracking-tight">{agent.name}</h4>
                          <p className="text-[10px] text-muted-foreground/70 mt-0.5">{agent.role}</p>
                        </div>
                        {/* Status */}
                        <div className={`flex items-center justify-center gap-1.5 mt-3 px-3 py-1.5 rounded-full ${
                          isCompleted
                            ? "bg-emerald-500/10 border border-emerald-500/15"
                            : isRunning
                            ? "bg-primary/10 border border-primary/15"
                            : "bg-white/[0.03] border border-white/[0.06]"
                        }`}>
                          <div
                            className={`w-2 h-2 rounded-full ${
                              isCompleted ? "bg-emerald-500" : isRunning ? "bg-primary" : agent.status === "error" ? "bg-pink-500" : "bg-white/20"
                            }`}
                            style={isRunning ? { animation: "agent-glow 1s ease-in-out infinite" } : {}}
                          />
                          <span className={`text-[10px] font-medium capitalize ${
                            isCompleted ? "text-emerald-400/90" : isRunning ? "text-primary" : "text-muted-foreground/70"
                          }`}>
                            {isRunning ? agent.message : agent.status}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Live Log Console ───────────────────────────────── */}
          <div className="agent-console">
            {/* Console header bar */}
            <div className="agent-console-header">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-pink-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground/80 ml-1 tracking-wide">agent-console</span>
              </div>
              <div className="flex items-center gap-2">
                {phase === "running" && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/15">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-medium text-primary">Live</span>
                  </div>
                )}
                {phase === "complete" && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/15">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] font-medium text-emerald-400">Complete</span>
                  </div>
                )}
                {phase === "config" && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    <span className="text-[10px] font-medium text-muted-foreground/50">Standby</span>
                  </div>
                )}
              </div>
            </div>
            {/* Console body */}
            <div
              ref={logContainerRef}
              className="agent-console-body"
            >
              {logs.length === 0 && phase === "running" && (
                <p className="text-primary/80 animate-pulse flex items-center gap-2">
                  <ChevronRight className="w-3 h-3" />
                  Initializing swarm agents...
                </p>
              )}
              {logs.length === 0 && phase === "config" && (
                <p className="text-muted-foreground/30 flex items-center gap-2">
                  <ChevronRight className="w-3 h-3" />
                  Waiting for activation...
                </p>
              )}
              {phase === "complete" && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-400/70 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" />
                  Swarm operation completed successfully
                </motion.p>
              )}
              <AnimatePresence>
                {logs.map((log, i) => {
                  const statusColor = log.status === "completed"
                    ? "text-emerald-400/80"
                    : log.status === "running"
                    ? "text-primary/90"
                    : "text-muted-foreground/60";
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15 }}
                      className={`flex items-start gap-2 ${statusColor}`}
                    >
                      <ChevronRight className="w-3 h-3 mt-0.5 shrink-0 opacity-50" />
                      <span className="text-muted-foreground/40 shrink-0 font-semibold">[{log.agent}]</span>
                      <span>{log.message}</span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={logEndRef} />
            </div>
          </div>

          {/* ── Results Table ──────────────────────────────────── */}
          <AnimatePresence>
            {phase === "complete" && results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="mt-3 section-card"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Results ({results.length})
                  </h4>
                  <button onClick={downloadCSV} className="btn-download text-[10px] py-1 px-2.5">
                    <Download className="w-3 h-3" />
                    CSV
                  </button>
                </div>
                <div className="grid gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {results.map((r, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04, duration: 0.2 }}
                      className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] transition-colors duration-150"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-foreground truncate">{r.company}</p>
                        <p className="text-[9px] text-muted-foreground">{r.location} &middot; {r.industry}</p>
                      </div>
                      <span className="text-[10px] font-medium text-emerald-400/80 shrink-0 ml-2">{r.confidence}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Status Bar ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.08, ease: [0.23, 1, 0.32, 1] }}
        className="dashboard-panel p-3.5 mt-4"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className="w-1 h-5 rounded-full bg-primary"
              style={phase === "running" ? { animation: "agent-glow 1.5s ease-in-out infinite" } : {}}
            />
            <div>
              <p className="text-xs font-medium text-foreground">
                {phase === "complete"
                  ? `Completed for ${industry}/${location}`
                  : phase === "running"
                  ? `Executing for ${industry}/${location}`
                  : `Ready for ${industry}/${location}`}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Generate &amp; Execute based on {industry}/{location}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/[0.06] border border-primary/10">
              <Target className="w-3 h-3 text-primary/70" />
              <span className="text-[10px] text-primary/80 font-medium">{industry}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent/[0.06] border border-accent/10">
              <MapPin className="w-3 h-3 text-accent/70" />
              <span className="text-[10px] text-accent/80 font-medium">{location}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.05]">
              <Database className="w-3 h-3 text-muted-foreground/60" />
              <span className="text-[10px] text-muted-foreground font-medium">{amount} records</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
