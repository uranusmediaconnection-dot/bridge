"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Loader2,
  Settings2,
  Clock,
  Link,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ScrollText,
} from "lucide-react";
import { scraperAPI, ScrapeRequest, ScrapeResponse } from "../lib/api";

interface ScraperPanelProps {
  onComplete: (result: ScrapeResponse) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const scraperOptions = [
  {
    value: "requests" as const,
    label: "Requests",
    description: "Fast HTTP client for static pages",
    gradient: "from-blue-600 to-blue-700",
  },
  {
    value: "beautifulsoup" as const,
    label: "BeautifulSoup",
    description: "Advanced HTML parsing engine",
    gradient: "from-emerald-600 to-emerald-700",
  },
  {
    value: "selenium" as const,
    label: "Selenium",
    description: "Full browser automation for JS sites",
    gradient: "from-rose-600 to-rose-700",
  },
];

export function ScraperPanel({ onComplete, loading, setLoading }: ScraperPanelProps) {
  const [url, setUrl] = useState("");
  const [scraper, setScraper] = useState<"requests" | "beautifulsoup" | "selenium">("requests");
  const [timeout, setTimeout] = useState(30);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateUrl = (value: string): boolean => {
    if (!value.trim()) {
      setValidationError("Please enter a URL");
      return false;
    }
    try {
      const parsed = new URL(value.startsWith("http") ? value : `https://${value}`);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        setValidationError("URL must start with http:// or https://");
        return false;
      }
      setValidationError(null);
      return true;
    } catch {
      setValidationError("Invalid URL format");
      return false;
    }
  };

  const handleScrape = async () => {
    if (!validateUrl(url)) return;

    setLoading(true);
    try {
      const request: ScrapeRequest = {
        url: url.startsWith("http") ? url : `https://${url}`,
        scraper,
        timeout,
      };
      const result = await scraperAPI.scrape(request);
      onComplete(result);
    } catch (error) {
      onComplete({
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedScraper = scraperOptions.find((o) => o.value === scraper)!;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00d4ff] to-[#8b5cf6] flex items-center justify-center shadow-lg shadow-[#00d4ff]/15">
          <Globe className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Web Scraper</h2>
          <p className="text-sm text-muted-foreground">
            Extract content from any website
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="section-card space-y-6">
        {/* URL Input */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Link className="w-4 h-4 text-primary" />
            Target URL
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (validationError) validateUrl(e.target.value);
              }}
              onBlur={() => url && validateUrl(url)}
              disabled={loading}
              className="input-modern w-full pl-11 pr-4"
            />
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
          <AnimatePresence>
            {validationError && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-1.5 text-xs text-red-400 mt-1"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                {validationError}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Scraper Engine Selection */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Settings2 className="w-4 h-4 text-primary" />
            Scraper Engine
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {scraperOptions.map((option) => {
              const isSelected = scraper === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setScraper(option.value)}
                  disabled={loading}
                  className={`relative p-4 rounded-xl border text-left ${
                    isSelected
                      ? "border-primary/30 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 shadow-lg shadow-cyan-500/5"
                      : "border-border bg-muted/30 hover:bg-muted/50 hover:border-border"
                  } disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]`}
                  style={{ transition: "transform 160ms cubic-bezier(0.23,1,0.32,1), background 160ms cubic-bezier(0.23,1,0.32,1), border-color 160ms cubic-bezier(0.23,1,0.32,1), box-shadow 160ms cubic-bezier(0.23,1,0.32,1)" }}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="scraper-selected"
                      className="absolute top-3 right-3"
                    >
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </motion.div>
                  )}
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${option.gradient} flex items-center justify-center mb-2`}
                  >
                    <ScrollText className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-0.5">
                    {option.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeout */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Clock className="w-4 h-4 text-primary" />
            Timeout: <span className="text-primary font-semibold">{timeout}s</span>
          </label>
          <input
            type="range"
            min={5}
            max={120}
            step={5}
            value={timeout}
            onChange={(e) => setTimeout(Number(e.target.value))}
            disabled={loading}
            className="w-full h-2 rounded-full appearance-none bg-muted cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r
              [&::-webkit-slider-thumb]:from-[#00d4ff] [&::-webkit-slider-thumb]:to-[#8b5cf6]
              [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-[#00d4ff]/30
              [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform
              [&::-webkit-slider-thumb]:hover:scale-110"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5s</span>
            <span>60s</span>
            <span>120s</span>
          </div>
        </div>

        {/* Action */}
        <button
          onClick={handleScrape}
          disabled={loading || !url.trim()}
          className="btn-gradient-primary w-full inline-flex items-center justify-center gap-2 text-base"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Scraping with {selectedScraper.label}...
            </>
          ) : (
            <>
              <Globe className="w-5 h-5" />
              Start Scraping
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Info Card */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-5">
        <h4 className="text-sm font-semibold text-foreground mb-3">
          About Web Scraping
        </h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
            <span><strong className="text-foreground">Requests:</strong> Best for simple, static HTML pages. Fastest option.</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <span><strong className="text-foreground">BeautifulSoup:</strong> Advanced parsing with metadata extraction, link analysis, and content structuring.</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
            <span><strong className="text-foreground">Selenium:</strong> Full browser automation for JavaScript-rendered websites.</span>
          </li>
        </ul>
      </div>
    </motion.div>
  );
}
