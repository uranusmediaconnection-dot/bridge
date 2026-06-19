"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";
import {
  Search,
  Bot,
  Menu,
  X,
  Code,
  Cpu,
  Users,
} from "lucide-react";
import { EyeLogo } from "./EyeLogo";

export type TabKey = "scraper" | "search" | "leads";

interface NavbarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  isProcessing: boolean;
  onProvidersClick?: () => void;
}

const navItems: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "scraper", label: "Swarm Agent", icon: Bot },
  { key: "search", label: "Web Search", icon: Search },
  { key: "leads", label: "Lead Intel", icon: Users },
];

export function Navbar({ activeTab, onTabChange, isProcessing, onProvidersClick }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.05] bg-background/80 backdrop-blur-2xl">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-[var(--header-height)]">
          {/* Brand */}
          <button
            onClick={() => onTabChange("scraper")}
            className="flex items-center gap-3 group"
          >
            <div className="relative">
              <EyeLogo size={36} />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full border-[1.5px] border-background animate-pulse" />
            </div>
            <div className="hidden sm:block text-left">
              <h1 className="text-sm font-semibold text-foreground tracking-tight leading-tight">
                Web Intelligence
              </h1>
              <p className="text-[10px] text-muted-foreground -mt-0.5">
                AI-Powered Suite
              </p>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.05] mx-auto">
            {navItems.map((item) => {
              const isActive = activeTab === item.key;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => onTabChange(item.key)}
                  disabled={isProcessing}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    ${isActive
                      ? "text-white bg-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                    }
                    disabled:opacity-40 disabled:cursor-not-allowed
                    transition-all duration-150 ease-out`}
                  style={{ transform: "scale(1)" }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={onProvidersClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-all duration-150 border border-white/[0.05]"
            >
              <Cpu className="w-3 h-3" />
              Providers
            </button>
            <ThemeToggle />
            <div className="w-px h-5 bg-border" />
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-all duration-150 border border-white/[0.05]"
            >
              <Code className="w-3 h-3" />
              API Docs
            </a>
          </div>

          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors duration-150"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="md:hidden border-t border-white/[0.05] overflow-hidden"
          >
            <nav className="px-4 py-2 space-y-0.5 bg-background/95 backdrop-blur-xl">
              {navItems.map((item) => {
                const isActive = activeTab === item.key;
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      onTabChange(item.key);
                      setMobileMenuOpen(false);
                    }}
                    disabled={isProcessing}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium
                      ${isActive
                        ? "text-foreground bg-primary/10 border border-primary/15"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                      }
                      transition-all duration-150 ease-out`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
