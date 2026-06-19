"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar, TabKey } from "../components/Navbar";
import { ProvidersSlidebar } from "../components/ProvidersSlidebar";
import { OctopusAnimation } from "../components/OctopusAnimation";
import { Bot, Cpu } from "lucide-react";
import { SearchPanel } from "../components/SearchPanel";
import { SwarmDashboard } from "../components/SwarmDashboard";
import { LeadIntelPanel } from "../components/LeadIntelPanel";
import { ScrapeResponse, SearchResult } from "../lib/api";
import {
  Code,
  Github,
  Heart,
  ArrowUp,
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("scraper");
  const [scrapeResult, setScrapeResult] = useState<ScrapeResponse | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [providersOpen, setProvidersOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrapeComplete = useCallback((result: ScrapeResponse) => {
    setScrapeResult(result);
    setSearchResults([]);
  }, []);

  const handleSearchComplete = useCallback((results: SearchResult[]) => {
    setSearchResults(results);
    setScrapeResult(null);
  }, []);

  return (
    <div className="dashboard-shell min-h-screen">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isProcessing={loading}
        onProvidersClick={() => setProvidersOpen(true)}
      />

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <AnimatePresence mode="wait">
          {activeTab === "scraper" && (
            <motion.div
              key="scraper"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="mb-4">
                <OctopusAnimation />
              </div>
              <SwarmDashboard onComplete={(r) => setScrapeResult(null)} />
            </motion.div>
          )}

          {activeTab === "search" && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            >
              <SearchPanel
                onComplete={handleSearchComplete}
                loading={loading}
                setLoading={setLoading}
              />
            </motion.div>
          )}

          {activeTab === "leads" && (
            <motion.div
              key="leads"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            >
              <LeadIntelPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Providers Slidebar */}
      <ProvidersSlidebar isOpen={providersOpen} onClose={() => setProvidersOpen(false)} />

      {/* Footer */}
      <footer className="border-t border-white/[0.04] mt-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <img
                  src="/octopus-logo.png"
                  alt="Web Intelligence Logo"
                  className="w-7 h-7 rounded-lg object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="font-semibold text-foreground text-sm">Web Intelligence</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                AI-powered web intelligence suite combining multiple scraping
                engines, search aggregation, and data extraction.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2">Resources</h4>
              <ul className="space-y-1.5">
                <li>
                  <a
                    href="http://127.0.0.1:8000/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors duration-150"
                  >
                    <Code className="w-3 h-3" />
                    API Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors duration-150"
                  >
                    <Github className="w-3 h-3" />
                    GitHub Repository
                  </a>
                </li>
              </ul>
            </div>

            {/* Tech */}
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2">Powered By</h4>
              <div className="flex flex-wrap gap-1.5">
                {["Next.js", "FastAPI", "Python", "TypeScript", "Tailwind"].map(
                  (tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.05] text-[10px] text-muted-foreground"
                    >
                      {tech}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[10px] text-muted-foreground/60">
              &copy; {new Date().getFullYear()} Web Intelligence Suite. All rights reserved.
            </p>
            <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
              Built with <Heart className="w-2.5 h-2.5 text-accent/60 fill-accent/60" /> and precision
            </p>
          </div>
        </div>
      </footer>

      {/* Scroll to top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            key="scroll-top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="fixed bottom-5 right-5 w-9 h-9 rounded-xl bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/15 hover:bg-primary z-50 transition-colors duration-150"
          >
            <ArrowUp className="w-4 h-4 text-white" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
