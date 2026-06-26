"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Bot,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  Globe,
  Key,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  Loader2,
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
  baseUrl: string;
  docsUrl: string;
  modelsEndpoint: string;
  models: ProviderModel[];
  apiKeyPlaceholder: string;
}

const providerConfigs: Provider[] = [
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "Unified API for 200+ models including Llama, Mistral, Gemma, and more.",
    icon: "OR",
    gradient: "from-amber-500 to-orange-600",
    baseUrl: "https://openrouter.ai/api/v1",
    docsUrl: "https://openrouter.ai/keys",
    modelsEndpoint: "/models",
    models: [],
    apiKeyPlaceholder: "sk-or-v1-...",
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4, GPT-4o, GPT-4o-mini, o1, and more advanced models.",
    icon: "AI",
    gradient: "from-emerald-500 to-teal-600",
    baseUrl: "https://api.openai.com/v1",
    docsUrl: "https://platform.openai.com/api-keys",
    modelsEndpoint: "/models",
    models: [],
    apiKeyPlaceholder: "sk-proj-...",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude 3.5 Sonnet, Claude 3 Opus, Haiku, and more.",
    icon: "AN",
    gradient: "from-purple-500 to-violet-600",
    baseUrl: "https://api.anthropic.com",
    docsUrl: "https://console.anthropic.com/settings/keys",
    modelsEndpoint: "/v1/models",
    models: [],
    apiKeyPlaceholder: "sk-ant-...",
  },
];

function StatusDot({ status }: { status: "online" | "checking" | "offline" | "no-key" }) {
  const colors = {
    online: "bg-emerald-500",
    checking: "bg-amber-500 animate-pulse",
    offline: "bg-red-500",
    "no-key": "bg-gray-500",
  };
  return <div className={`w-2 h-2 rounded-full ${colors[status]} shrink-0`} />;
}

interface ProviderApiState {
  apiKey: string;
  status: "no-key" | "checking" | "online" | "offline";
  models: ProviderModel[];
  error: string | null;
}

interface ProvidersSlidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeysChange?: (keys: Record<string, string>) => void;
}

export function ProvidersSlidebar({ isOpen, onClose, onApiKeysChange }: ProvidersSlidebarProps) {
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [apiStates, setApiStates] = useState<Record<string, ProviderApiState>>(() => {
    const initial: Record<string, ProviderApiState> = {};
    providerConfigs.forEach((p) => {
      initial[p.id] = { apiKey: "", status: "no-key", models: [], error: null };
    });
    return initial;
  });

  // Load saved API keys from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("provider-api-keys");
    if (saved) {
      try {
        const keys = JSON.parse(saved);
        const newStates = { ...apiStates };
        Object.entries(keys).forEach(([providerId, key]) => {
          if (newStates[providerId]) {
            newStates[providerId] = { ...newStates[providerId], apiKey: key as string };
          }
        });
        setApiStates(newStates);
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  const handleApiKeyChange = (providerId: string, apiKey: string) => {
    setApiStates((prev) => ({
      ...prev,
      [providerId]: { ...prev[providerId], apiKey, status: apiKey ? "checking" : "no-key", error: null },
    }));

    // Save to localStorage
    const newKeys = { ...apiStates };
    newKeys[providerId].apiKey = apiKey;
    const keysToSave: Record<string, string> = {};
    Object.entries(newKeys).forEach(([id, state]) => {
      if (state.apiKey) keysToSave[id] = state.apiKey;
    });
    localStorage.setItem("provider-api-keys", JSON.stringify(keysToSave));
    onApiKeysChange?.(keysToSave);
  };

  const testApiKey = async (providerId: string) => {
    const state = apiStates[providerId];
    if (!state.apiKey) return;

    setApiStates((prev) => ({
      ...prev,
      [providerId]: { ...prev[providerId], status: "checking", error: null },
    }));

    const config = providerConfigs.find((p) => p.id === providerId)!;

    try {
      let models: ProviderModel[] = [];

      if (providerId === "openrouter") {
        const response = await fetch(`${config.baseUrl}${config.modelsEndpoint}`, {
          headers: { Authorization: `Bearer ${state.apiKey}` },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const data = await response.json();
        models = (data.data || [])
          .filter((m: any) => m.id.includes("free") || parseFloat((m.pricing?.prompt || "0").toString()) === 0)
          .slice(0, 20)
          .map((m: any) => ({
            id: m.id,
            name: m.name || m.id.split("/").pop(),
            description: `Context: ${m.context_length ? `${(m.context_length / 1000).toFixed(0)}K` : "N/A"}`,
            free: true,
            context: m.context_length ? `${(m.context_length / 1000).toFixed(0)}K` : "N/A",
          }));
      } else if (providerId === "openai") {
        const response = await fetch(`${config.baseUrl}${config.modelsEndpoint}`, {
          headers: { Authorization: `Bearer ${state.apiKey}` },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const data = await response.json();
        models = (data.data || [])
          .filter((m: any) => m.id.startsWith("gpt") || m.id.startsWith("o"))
          .map((m: any) => ({
            id: m.id,
            name: m.id,
            description: `Created: ${new Date(m.created * 1000).toLocaleDateString()}`,
            free: false,
            context: "N/A",
          }));
      } else if (providerId === "anthropic") {
        const response = await fetch(`${config.baseUrl}${config.modelsEndpoint}`, {
          headers: { "x-api-key": state.apiKey, "anthropic-version": "2023-06-01" },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const data = await response.json();
        models = (data.data || []).map((m: any) => ({
          id: m.id,
          name: m.display_name || m.id,
          description: `Max tokens: ${m.context_window || "N/A"}`,
          free: false,
          context: m.context_window ? `${(parseInt(m.context_window) / 1000).toFixed(0)}K` : "N/A",
        }));
      }

      setApiStates((prev) => ({
        ...prev,
        [providerId]: { ...prev[providerId], status: "online", models: models.length > 0 ? models : getDefaultModels(providerId), error: null },
      }));
    } catch (error: any) {
      setApiStates((prev) => ({
        ...prev,
        [providerId]: { ...prev[providerId], status: "offline", error: error.message || "Connection failed", models: getDefaultModels(providerId) },
      }));
    }
  };

  const getDefaultModels = (providerId: string): ProviderModel[] => {
    const defaults: Record<string, ProviderModel[]> = {
      openrouter: [
        { id: "meta-llama/llama-3.1-8b-instruct", name: "Llama 3.1 8B", description: "Fast, general purpose", free: true, context: "128K" },
        { id: "mistralai/mistral-7b-instruct", name: "Mistral 7B", description: "Efficient & capable", free: true, context: "32K" },
        { id: "google/gemma-2-9b-it", name: "Gemma 2 9B", description: "Google lightweight", free: true, context: "8K" },
        { id: "microsoft/phi-3-mini-128k-instruct", name: "Phi-3 Mini", description: "Small but powerful", free: true, context: "128K" },
      ],
      openai: [
        { id: "gpt-4o", name: "GPT-4o", description: "Most capable model", free: false, context: "128K" },
        { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Fast & affordable", free: false, context: "128K" },
        { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "Legacy model", free: false, context: "16K" },
      ],
      anthropic: [
        { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", description: "Most intelligent model", free: false, context: "200K" },
        { id: "claude-3-opus-20240229", name: "Claude 3 Opus", description: "Highly capable", free: false, context: "200K" },
        { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku", description: "Fast & efficient", free: false, context: "200K" },
      ],
    };
    return defaults[providerId] || [];
  };

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
            className="fixed top-0 right-0 h-full w-[var(--sidebar-width)] max-w-md z-50 flex flex-col"
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
                  <p className="text-[10px] text-muted-foreground">Enter your API keys to invoke models</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Provider list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {providerConfigs.map((provider) => {
                const isExpanded = expandedProvider === provider.id;
                const apiState = apiStates[provider.id];
                const hasKey = !!apiState.apiKey;

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
                          <StatusDot status={apiState.status} />
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{provider.description}</p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      )}
                    </button>

                    {/* Expanded content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-3.5 pb-3 space-y-3" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                            {/* API Key Input */}
                            <div className="pt-3 space-y-2">
                              <label className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                <Key className="w-3 h-3" />
                                API Key
                              </label>
                              <div className="relative">
                                <input
                                  type={showKeys[provider.id] ? "text" : "password"}
                                  value={apiState.apiKey}
                                  onChange={(e) => handleApiKeyChange(provider.id, e.target.value)}
                                  placeholder={provider.apiKeyPlaceholder}
                                  className="w-full px-3 py-2 pr-16 rounded-lg border text-xs bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                                  style={{ borderColor: "hsl(var(--border))" }}
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                  <button
                                    onClick={() => setShowKeys((prev) => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                                    className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                    title={showKeys[provider.id] ? "Hide key" : "Show key"}
                                  >
                                    {showKeys[provider.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  </button>
                                  <button
                                    onClick={() => testApiKey(provider.id)}
                                    disabled={!hasKey || apiState.status === "checking"}
                                    className="w-6 h-6 rounded flex items-center justify-center text-primary hover:text-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    title="Test API key"
                                  >
                                    {apiState.status === "checking" ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <RefreshCw className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Status message */}
                              {apiState.error && (
                                <p className="flex items-center gap-1.5 text-[10px] text-pink-400">
                                  <AlertCircle className="w-3 h-3" />
                                  {apiState.error}
                                </p>
                              )}
                              {apiState.status === "online" && (
                                <p className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Connected! {apiState.models.length} models available
                                </p>
                              )}
                            </div>

                            {/* Models list */}
                            {(apiState.models.length > 0 || !hasKey) && (
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <Bot className="w-3 h-3 text-primary" />
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                    Available Models {hasKey ? `(${apiState.models.length})` : "(default)"}
                                  </span>
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-1">
                                  {(hasKey ? apiState.models : getDefaultModels(provider.id)).slice(0, 15).map((model) => (
                                    <div
                                      key={model.id}
                                      className="flex items-center justify-between p-2 rounded-lg transition-colors"
                                      style={{ backgroundColor: "hsl(var(--muted) / 0.3)" }}
                                    >
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                          <p className="text-xs font-medium text-foreground truncate">{model.name}</p>
                                          {model.free && (
                                            <span className="px-1 py-0.5 rounded text-[8px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">FREE</span>
                                          )}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">{model.description}</p>
                                      </div>
                                      <span className="text-[9px] text-muted-foreground shrink-0 ml-2">{model.context}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <a
                              href={provider.docsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Get API key
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
                <span className="text-[10px] text-muted-foreground">API keys stored locally in your browser</span>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
