"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  Globe,
  SlidersHorizontal,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { scraperAPI, SearchResult } from "../lib/api";

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

  const handleSearch = async () => {
    if (!query.trim()) {
      setValidationError("Please enter a search query");
      return;
    }
    setValidationError(null);
    setLoading(true);
    try {
      const response = await scraperAPI.search({ query, engine, num_results: numResults });
      if (response.success) {
        onComplete(response.results);
      } else {
        onComplete([]);
      }
    } catch {
      onComplete([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchAll = async () => {
    if (!query.trim()) {
      setValidationError("Please enter a search query");
      return;
    }
    setValidationError(null);
    setLoading(true);
    try {
      const response = await scraperAPI.searchAll(query, numResults);
      if (response.success) {
        const allResults: SearchResult[] = [];
        Object.values(response.results).forEach((results: any) => {
          if (Array.isArray(results)) allResults.push(...results);
        });
        onComplete(allResults);
      } else {
        onComplete([]);
      }
    } catch {
      onComplete([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedEngine = engineOptions.find((o) => o.value === engine)!;

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
          <p className="text-xs text-muted-foreground">Search across multiple engines</p>
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
