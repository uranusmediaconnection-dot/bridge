"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ScrapeResponse, SearchResult } from "../lib/api";
import {
  FileText,
  Link as LinkIcon,
  Image,
  Calendar,
  XCircle,
  ExternalLink,
  Search,
  Globe,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface ResultsDisplayProps {
  scrapeResult: ScrapeResponse | null;
  searchResults: SearchResult[];
  loading: boolean;
}

function ResultCard({
  children,
  icon: Icon,
  title,
  subtitle,
  gradient,
}: {
  children: React.ReactNode;
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  gradient: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="section-card space-y-5"
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      <div>{children}</div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="section-card flex flex-col items-center justify-center py-20"
    >
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 flex items-center justify-center mb-6">
        <FileText className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No results yet
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        Start scraping or searching to see results here. Your extracted data will
        appear in real-time.
      </p>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="section-card flex flex-col items-center justify-center py-20"
    >
      <div className="relative mb-6">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <div className="absolute inset-0 w-12 h-12 rounded-full bg-primary/5 animate-ping" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Processing...
      </h3>
      <p className="text-sm text-muted-foreground">
        Please wait while your request is being processed
      </p>
    </motion.div>
  );
}

export function ResultsDisplay({
  scrapeResult,
  searchResults,
  loading,
}: ResultsDisplayProps) {
  // Loading state
  if (loading)
    return <LoadingState />;

  // No data yet
  if (!scrapeResult && searchResults.length === 0)
    return <EmptyState />;

  // Search Results
  if (searchResults.length > 0) {
    return (
      <ResultCard
        icon={Search}
        title="Search Results"
        subtitle={`${searchResults.length} results found`}
        gradient="from-teal-600 to-cyan-600"
      >
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          <AnimatePresence>
            {searchResults.map((result, index) => (
              <motion.a
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.025, duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/20 hover:bg-muted/50 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {result.title}
                  </h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                      {result.engine}
                    </span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                {result.snippet && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
                    {result.snippet}
                  </p>
                )}
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <LinkIcon className="w-3 h-3" />
                  <span className="truncate">{result.url}</span>
                </div>
              </motion.a>
            ))}
          </AnimatePresence>
        </div>
      </ResultCard>
    );
  }

  // Scrape Results
  if (scrapeResult) {
    // Error state
    if (!scrapeResult.success) {
      return (
        <ResultCard
          icon={XCircle}
          title="Scraping Failed"
          subtitle={scrapeResult.error || "An unknown error occurred"}
          gradient="from-red-600 to-rose-600"
        >
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400 mb-1">
                Error Details
              </p>
              <p className="text-xs text-muted-foreground">
                {scrapeResult.error ||
                  "The scraper encountered an error while processing your request. Please check the URL and try again."}
              </p>
            </div>
          </div>
        </ResultCard>
      );
    }

    const data = scrapeResult.data;
    if (!data) return <EmptyState />;

    return (
      <ResultCard
        icon={Globe}
        title="Scraped Content"
        subtitle={data.title || "Untitled Page"}
        gradient="from-cyan-600 to-violet-600"
      >
        <div className="space-y-5 max-h-[500px] overflow-y-auto pr-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">
                <LinkIcon className="w-3 h-3" />
                Status
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    data.status_code === 200 ? "bg-green-500" : "bg-yellow-500"
                  }`}
                />
                <span className="text-sm font-semibold text-foreground">
                  {data.status_code || "N/A"}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">
                <Calendar className="w-3 h-3" />
                Scraped at
              </div>
              <p className="text-sm font-medium text-foreground">
                {data.timestamp
                  ? new Date(data.timestamp).toLocaleTimeString()
                  : "N/A"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">
                <FileText className="w-3 h-3" />
                Size
              </div>
              <p className="text-sm font-medium text-foreground">
                {data.content
                  ? `${(data.content.length / 1024).toFixed(1)} KB`
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Links */}
          {data.links && data.links.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-primary" />
                Links ({data.links.length})
              </h3>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {data.links.slice(0, 15).map((link: string, i: number) => (
                  <a
                    key={i}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors truncate"
                  >
                    <ChevronRight className="w-3 h-3 shrink-0" />
                    <span className="truncate">{link}</span>
                  </a>
                ))}
                {data.links.length > 15 && (
                  <p className="text-[10px] text-muted-foreground">
                    +{data.links.length - 15} more links
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Images */}
          {data.images && data.images.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Image className="w-4 h-4 text-primary" />
                Images ({data.images.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.images.slice(0, 8).map((img: string, i: number) => (
                  <a
                    key={i}
                    href={img}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative w-16 h-16 rounded-xl bg-muted border border-border/50 overflow-hidden hover:border-primary/30 transition-all duration-200"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Image className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Content Preview */}
          {data.content && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Content Preview
              </h3>
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50 max-h-40 overflow-y-auto">
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
                  {data.content.slice(0, 1500)}
                  {data.content.length > 1500 && (
                    <span className="text-primary">...</span>
                  )}
                </pre>
              </div>
            </div>
          )}
        </div>
      </ResultCard>
    );
  }

  return <EmptyState />;
}
