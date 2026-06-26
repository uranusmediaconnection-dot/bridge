"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  Globe,
  SlidersHorizontal,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Bug,
  Terminal,
  Info,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  X,
  Copy,
  Download,
} from "lucide-react";
import { scraperAPI, SearchResult } from "../lib/api";

interface DebugLog {
  timestamp: string;
  level: "info" | "warn" | "error" | "success";
  section: string;
  message: string;
  data?: any;
}

interface SearchPanelProps {
  onComplete: (results: SearchResult[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const engineOptions = [
  {
    value: "google" as const,
    label: "Google",
    description: "Comprehensive results",
    color: "text-primary",
    bgColor: "bg-primary/[0.06]",
    borderColor: "border-primary/20",
  },
  {
    value: "bing" as const,
    label: "Bing",
    description: "Microsoft search",
    color: "text-secondary",
    bgColor: "bg-secondary/[0.06]",
    borderColor: "border-secondary/20",
  },
  {
    value: "duckduckgo" as const,
    label: "DuckDuckGo",
    description: "Privacy-focused",
    color: "text-accent",
    bgColor: "bg-accent/[0.06]",
    borderColor: "border-accent/20",
  },
];

export function SearchPanel({ onComplete, loading, setLoading }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [engine, setEngine] = useState<"google" | "bing" | "duckduckgo">("google");
  const [numResults, setNumResults] = useState(10);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [debugOpen, setDebugOpen] = useState(true);
  const [activeDebugSection, setActiveDebugSection] = useState<string>("all");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchTime, setSearchTime] = useState<number | null>(null);

  const logEndRef = useRef<HTMLDivElement>(null);
  const debugContainerRef = useRef<HTMLDivElement>(null);

  const addDebugLog = (level: DebugLog["level"], section: string, message: string, data?: any) => {
    const log: DebugLog = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      section,
      message,
      data,
    };
    setDebugLogs((prev) => [...prev, log]);
  };

  // Auto-scroll debug logs
  useEffect(() => {
    if (debugContainerRef.current) {
      debugContainerRef.current.scrollTop = debugContainerRef.current.scrollHeight;
    }
  }, [debugLogs]);

  const clearDebugLogs = () => {
    setDebugLogs([]);
    setSearchResults([]);
    setSearchTime(null);
  };

  const copyDebugLogs = () => {
    const text = debugLogs.map((log) => `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.section}] ${log.message}${log.data ? "\n  " + JSON.stringify(log.data, null, 2) : ""}`).join("\n");
    navigator.clipboard.writeText(text);
  };

  const exportDebugLogs = () => {
    const text = debugLogs.map((log) => `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.section}] ${log.message}${log.data ? "\n  " + JSON.stringify(log.data, null, 2) : ""}`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `search-debug-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setValidationError("Please enter a search query");
      return;
    }
    setValidationError(null);
    setSearchResults([]);
    setSearchTime(null);
    setDebugLogs([]);
    setLoading(true);

    const startTime = Date.now();

    addDebugLog("info", "Initialization", `Starting search for "${query}"`);
    addDebugLog("info", "Initialization", `Engine: ${engine}, Results: ${numResults}`, { engine, numResults });

    try {
      addDebugLog("info", "API Request", `POST /api/search`, { query, engine, num_results: numResults });
      
      const response = await scraperAPI.search({ query, engine, num_results: numResults });
      const elapsed = Date.now() - startTime;
      setSearchTime(elapsed);

      addDebugLog("info", "API Response", `Received response in ${elapsed}ms`, {
        success: response.success,
        resultCount: response.results?.length || 0,
        status: response.success ? "OK" : "Error",
      });

      if (response.success) {
        addDebugLog("success", "Results", `Found ${response.results.length} results`, {
          firstResult: response.results[0]?.title,
        });
        setSearchResults(response.results);
        onComplete(response.results);
      } else {
        addDebugLog("error", "Results", `Search failed: ${response.error || "Unknown error"}`);
        onComplete([]);
      }
    } catch (error: any) {
      const elapsed = Date.now() - startTime;
      setSearchTime(elapsed);
      addDebugLog("error", "Error", `Request failed after ${elapsed}ms: ${error.message || "Network error"}`, {
        error: error.toString(),
      });
      onComplete([]);
    } finally {
      setLoading(false);
      addDebugLog("info", "Complete", `Search operation finished`);
    }
  };

  const handleSearchAll = async () => {
    if (!query.trim()) {
      setValidationError("Please enter a search query");
      return;
    }
    setValidationError(null);
    setSearchResults([]);
    setSearchTime(null);
    setDebugLogs([]);
    setLoading(true);

    const startTime = Date.now();

    addDebugLog("info", "Initialization", `Starting search ALL engines for "${query}"`);
    addDebugLog("info", "Initialization", `Engines: google, bing, duckduckgo | Results per engine: ${numResults}`);

    try {
      addDebugLog("info", "API Request", `GET /api/search/all`, { query, num_results: numResults });
      
      const response = await scraperAPI.searchAll(query, numResults);
      const elapsed = Date.now() - startTime;
      setSearchTime(elapsed);

      addDebugLog("info", "API Response", `Received response in ${elapsed}ms`, {
        success: response.success,
        engines: Object.keys(response.results || {}).join(", "),
      });

      if (response.success) {
        const allResults: SearchResult[] = [];
        Object.entries(response.results || {}).forEach(([engineName, results]: [string, any]) => {
          if (Array.isArray(results)) {
            addDebugLog("info", "Engine Results", `${engineName}: ${results.length} results`);
            allResults.push(...results);
          }
        });

        addDebugLog("success", "Results", `Total: ${allResults.length} results from all engines`);
        setSearchResults(allResults);
        onComplete(allResults);
      } else {
        addDebugLog("error", "Results", `Search failed: ${response.error || "Unknown error"}`);
        onComplete([]);
      }
    } catch (error: any) {
      const elapsed = Date.now() - startTime;
      setSearchTime(elapsed);
      addDebugLog("error", "Error", `Request failed after ${elapsed}ms: ${error.message || "Network error"}`, {
        error: error.toString(),
      });
      onComplete([]);
    } finally {
      setLoading(false);
      addDebugLog("info", "Complete", `Search ALL operation finished`);
    }
  };

  const selectedEngine = engineOptions.find((o) => o.value === engine)!;

  const debugSections = [
    { id: "all", label: "All Logs", icon: Terminal },
    { id: "Initialization", label: "Initialization", icon: Info },
    { id: "API Request", label: "API Requests", icon: Globe },
    { id: "API Response", label: "API Responses", icon: Database },
    { id: "Results", label: "Results", icon: CheckCircle2 },
    { id: "Error", label: "Errors", icon: AlertCircle },
  ];

  const filteredLogs = activeDebugSection === "all"
    ? debugLogs
    : debugLogs.filter((log) => log.section === activeDebugSection);

  const logLevelColors: Record<DebugLog["level"], string> = {
    info: "text-blue-400",
    warn: "text-amber-400",
    error: "text-pink-400",
    success: "text-emerald-400",
  };

  const logLevelIcons: Record<DebugLog["level"], React.ReactNode> = {
    info: <ChevronRight className="w-3 h-3" />,
    warn: <AlertCircle className="w-3 h-3" />,
    error: <X className="w-3 h-3" />,
    success: <CheckCircle2 className="w-3 h-3" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="max-w-4xl mx-auto space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <Search className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Web Search</h2>
          <p className="text-xs text-muted-foreground">Search across multiple engines with full debugging</p>
        </div>
      </div>

      {/* Main Card */}
      <div className="section-card space-y-5">
        {/* Query Input */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            Search Query
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Enter your search query..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (validationError) setValidationError(null);
              }}
              disabled={loading}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="input-modern w-full pl-10 pr-4"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          </div>
          <AnimatePresence>
            {validationError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5 text-xs text-pink-400 mt-1"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                {validationError}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Engine Selection */}
        <div className="space-y-2.5">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            Search Engine
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {engineOptions.map((option) => {
              const isSelected = engine === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setEngine(option.value)}
                  disabled={loading}
                  className={`relative p-3.5 rounded-xl border text-left
                    ${isSelected
                      ? `${option.borderColor} ${option.bgColor}`
                      : "border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.08]"
                    }
                    disabled:opacity-40 disabled:cursor-not-allowed
                    transition-all duration-150 ease-out`}
                >
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${option.color}`} />
                    </div>
                  )}
                  <div className={`w-7 h-7 rounded-lg ${option.bgColor} border ${option.borderColor} flex items-center justify-center mb-2`}>
                    <Globe className={`w-3.5 h-3.5 ${option.color}`} />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-0.5">{option.label}</p>
                  <p className="text-[11px] text-muted-foreground">{option.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results count slider */}
        <div className="space-y-2.5">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            Results per engine: <span className="text-primary font-semibold">{numResults}</span>
          </label>
          <input
            type="range"
            min={5}
            max={50}
            step={5}
            value={numResults}
            onChange={(e) => setNumResults(Number(e.target.value))}
            disabled={loading}
            className="w-full h-1.5 rounded-full appearance-none bg-white/[0.06] cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary
              [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-primary/20
              [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform
              [&::-webkit-slider-thumb]:hover:scale-110"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground/50">
            <span>5</span>
            <span>25</span>
            <span>50</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5">
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="btn-gradient-secondary flex-1 inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Search {selectedEngine.label}
              </>
            )}
          </button>
          <button
            onClick={handleSearchAll}
            disabled={loading || !query.trim()}
            className="btn-outline flex-1 inline-flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Search All
          </button>
        </div>

        {/* Search time display */}
        {searchTime !== null && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">
              Search completed in <span className="text-primary font-semibold">{searchTime}ms</span>
            </span>
            {searchResults.length > 0 && (
              <span className="text-xs text-muted-foreground">
                • <span className="text-emerald-400 font-semibold">{searchResults.length}</span> results found
              </span>
            )}
          </div>
        )}
      </div>

      {/* Debug Console */}
      <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] overflow-hidden">
        {/* Debug header */}
        <button
          onClick={() => setDebugOpen(!debugOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Bug className="w-4 h-4 text-primary" />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-semibold text-foreground">Debug Console</h4>
              <p className="text-[10px] text-muted-foreground">
                {debugLogs.length} log{debugLogs.length !== 1 ? "s" : ""} • {activeDebugSection === "all" ? "All sections" : activeDebugSection}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {debugOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>

        <AnimatePresence>
          {debugOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Debug section tabs */}
              <div className="flex items-center gap-1 px-4 pb-3 overflow-x-auto border-t border-white/[0.05] pt-3">
                {debugSections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeDebugSection === section.id;
                  const count = section.id === "all"
                    ? debugLogs.length
                    : debugLogs.filter((l) => l.section === section.id).length;
                  if (count === 0 && section.id !== "all") return null;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveDebugSection(section.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all ${
                        isActive
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {section.label}
                      <span className={`px-1 py-0.5 rounded text-[8px] ${isActive ? "bg-primary/20" : "bg-white/[0.05]"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
                <div className="flex-1" />
                <button
                  onClick={copyDebugLogs}
                  disabled={debugLogs.length === 0}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] text-muted-foreground hover:text-foreground hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
                <button
                  onClick={exportDebugLogs}
                  disabled={debugLogs.length === 0}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] text-muted-foreground hover:text-foreground hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Download className="w-3 h-3" />
                  Export
                </button>
                <button
                  onClick={clearDebugLogs}
                  disabled={debugLogs.length === 0}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] text-muted-foreground hover:text-foreground hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              </div>

              {/* Debug logs */}
              <div
                ref={debugContainerRef}
                className="max-h-80 overflow-y-auto p-4 space-y-1.5 font-mono text-[11px]"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
              >
                {filteredLogs.length === 0 && (
                  <p className="text-muted-foreground/40 flex items-center gap-2 py-4">
                    <Terminal className="w-3.5 h-3.5" />
                    Waiting for search operation...
                  </p>
                )}
                {filteredLogs.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.1 }}
                    className="flex items-start gap-2 py-1"
                  >
                    <span className="text-muted-foreground/30 shrink-0">[{log.timestamp}]</span>
                    <span className={`shrink-0 ${logLevelColors[log.level]}`}>
                      {logLevelIcons[log.level]}
                    </span>
                    <span className="text-muted-foreground/50 shrink-0">[{log.section}]</span>
                    <span className={logLevelColors[log.level]}>{log.message}</span>
                    {log.data && (
                      <details className="w-full">
                        <summary className="cursor-pointer text-muted-foreground/40 hover:text-muted-foreground/60">
                          Details
                        </summary>
                        <pre className="mt-1 p-2 rounded bg-white/[0.03] text-[10px] text-muted-foreground overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </motion.div>
                ))}
                <div ref={logEndRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info Card */}
      <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
        <h4 className="text-xs font-semibold text-foreground mb-2.5">About Engines</h4>
        <ul className="space-y-1.5 text-[11px] text-muted-foreground">
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
            <span><strong className="text-foreground">Google:</strong> Broad coverage, most results</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-secondary/50 shrink-0" />
            <span><strong className="text-foreground">Bing:</strong> Unique Microsoft indexing</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent/50 shrink-0" />
            <span><strong className="text-foreground">DuckDuckGo:</strong> Privacy-first search</span>
          </li>
        </ul>
      </div>
    </motion.div>
  );
}
