"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Bot,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  Globe,
} from "lucide-react";

interface ProviderModel {
  id: string;
  name: string;
  description: string;
  free: boolean;
  context: string;
}

interface Provider {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  status: "online" | "limited" | "offline";
  models: ProviderModel[];
  baseUrl: string;
  docsUrl: string;
}

const providers: Provider[] = [
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "Unified API for 200+ models. Free tier includes Llama 3, Mistral, and more.",
    icon: "OR",
    gradient: "from-amber-500 to-orange-600",
    status: "online",
    baseUrl: "https://openrouter.ai/api/v1",
    docsUrl: "https://openrouter.ai/docs",
    models: [
      { id: "meta-llama/llama-3.1-8b", name: "Llama 3.1 8B", description: "Fast, general purpose", free: true, context: "128K" },
      { id: "mistralai/mistral-7b", name: "Mistral 7B", description: "Efficient & capable", free: true, context: "32K" },
      { id: "google/gemma-2-9b", name: "Gemma 2 9B", description: "Google lightweight", free: true, context: "8K" },
      { id: "microsoft/phi-3-mini", name: "Phi-3 Mini", description: "Small but powerful", free: true, context: "128K" },
    ],
  },
  {
    id: "opencode-zen",
    name: "Opencode ZEN",
    description: "Open-source coding models with free inference tier.",
    icon: "OZ",
    gradient: "from-cyan-500 to-teal-600",
    status: "online",
    baseUrl: "https://api.opencodezen.ai/v1",
    docsUrl: "https://docs.opencodezen.ai",
    models: [
      { id: "zen-coder-7b", name: "ZEN Coder 7B", description: "Code generation specialist", free: true, context: "32K" },
      { id: "zen-coder-13b", name: "ZEN Coder 13B", description: "Advanced coding", free: true, context: "32K" },
      { id: "zen-embed-384", name: "ZEN Embed 384", description: "Embeddings model", free: true, context: "512" },
    ],
  },
  {
    id: "openprovider-ai",
    name: "OpenProvider AI",
    description: "Accessible AI provider with free community models.",
    icon: "OP",
    gradient: "from-purple-500 to-violet-600",
    status: "online",
    baseUrl: "https://api.openprovider.ai/v1",
    docsUrl: "https://docs.openprovider.ai",
    models: [
      { id: "op-llama-3-8b", name: "OP Llama 3 8B", description: "Community Llama serving", free: true, context: "8K" },
      { id: "op-mistral-7b", name: "OP Mistral 7B", description: "Mistral community edition", free: true, context: "32K" },
      { id: "op-qwen-2-7b", name: "OP Qwen 2 7B", description: "Qwen community model", free: true, context: "32K" },
    ],
  },
];

function StatusDot({ status }: { status: Provider["status"] }) {
  const colors = {
    online: "bg-emerald-500",
    limited: "bg-amber-500",
    offline: "bg-red-500",
  };
  return <div className={`w-2 h-2 rounded-full ${colors[status]} shrink-0`} />;
}

interface ProvidersSlidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProvidersSlidebar({ isOpen, onClose }: ProvidersSlidebarProps) {
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed top-0 right-0 h-full w-[var(--sidebar-width)] z-50 flex flex-col"
            style={{ backgroundColor: "hsl(var(--card) / 0.96)", backdropFilter: "blur(24px)", borderLeft: "1px solid hsl(var(--border))" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">AI Providers</h2>
                  <p className="text-[10px] text-muted-foreground">Free tier models</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Provider list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {providers.map((provider) => {
                const isExpanded = expandedProvider === provider.id;
                return (
                  <div
                    key={provider.id}
                    className="rounded-xl border overflow-hidden transition-all duration-200"
                    style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--muted) / 0.3)" }}
                  >
                    {/* Provider header */}
                    <button
                      onClick={() => setExpandedProvider(isExpanded ? null : provider.id)}
                      className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-muted/20 transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${provider.gradient} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {provider.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground">{provider.name}</h3>
                          <StatusDot status={provider.status} />
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{provider.description}</p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      )}
                    </button>

                    {/* Expanded models */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-3.5 pb-3 space-y-1.5" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                            <div className="pt-2 pb-1 flex items-center gap-2">
                              <Bot className="w-3 h-3 text-primary" />
                              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Free Models</span>
                            </div>
                            {provider.models.map((model) => (
                              <div
                                key={model.id}
                                className="flex items-center justify-between p-2 rounded-lg transition-colors"
                                style={{ backgroundColor: "hsl(var(--muted) / 0.3)" }}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-medium text-foreground truncate">{model.name}</p>
                                    <span className="px-1 py-0.5 rounded text-[8px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">FREE</span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">{model.description}</p>
                                </div>
                                <span className="text-[9px] text-muted-foreground shrink-0 ml-2">{model.context}</span>
                              </div>
                            ))}
                            <a
                              href={provider.docsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors mt-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View documentation
                            </a>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-3 border-t" style={{ borderColor: "hsl(var(--border))" }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "hsl(var(--muted) / 0.3)" }}>
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] text-muted-foreground">All providers connected via proxy router</span>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
