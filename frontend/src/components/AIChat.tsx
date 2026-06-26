"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, X, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Model {
  id: string;
  name: string;
  provider: string;
  free: boolean;
}

interface ProviderModels {
  provider: string;
  models: Model[];
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys?: Record<string, string>;
}

export function AIChat({ isOpen, onClose, apiKeys = {} }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");
  const [allModels, setAllModels] = useState<Model[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch models when component opens or API keys change
  useEffect(() => {
    if (isOpen) {
      fetchModels();
      scrollToBottom();
    }
  }, [isOpen, apiKeys]);

  const fetchModels = useCallback(async () => {
    const fetched: Model[] = [];

    // Try to get models from backend first
    try {
      const response = await fetch("/api/chat/models");
      const data = await response.json();
      if (data.success && data.models) {
        fetched.push(...data.models.map((m: any) => ({ ...m, provider: "OpenRouter" })));
      }
    } catch {
      // fallback to defaults
    }

    // Add OpenAI models if key exists
    if (apiKeys.openai) {
      try {
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${apiKeys.openai}` },
        });
        if (response.ok) {
          const data = await response.json();
          const openaiModels = (data.data || [])
            .filter((m: any) => m.id.startsWith("gpt") || m.id.startsWith("o"))
            .map((m: any) => ({
              id: m.id,
              name: m.id,
              provider: "OpenAI",
              free: false,
            }));
          fetched.push(...openaiModels);
        }
      } catch {
        // add defaults
      }
      if (!fetched.some((m) => m.provider === "OpenAI")) {
        fetched.push(
          { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", free: false },
          { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", free: false },
        );
      }
    }

    // Add Anthropic models if key exists
    if (apiKeys.anthropic) {
      fetched.push(
        { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", provider: "Anthropic", free: false },
        { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku", provider: "Anthropic", free: false },
      );
    }

    // Default fallback if nothing fetched
    if (fetched.length === 0) {
      fetched.push(
        { id: "meta-llama/llama-3.1-8b-instruct", name: "Llama 3.1 8B", provider: "OpenRouter", free: true },
        { id: "mistralai/mistral-7b-instruct", name: "Mistral 7B", provider: "OpenRouter", free: true },
        { id: "google/gemma-2-9b-it", name: "Gemma 2 9B", provider: "OpenRouter", free: true },
      );
    }

    setAllModels(fetched);
    if (fetched.length > 0 && !selectedModel) {
      setSelectedModel(fetched[0].id);
    }
  }, [apiKeys]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const selectedModelData = allModels.find((m) => m.id === selectedModel);
    const provider = selectedModelData?.provider || "OpenRouter";

    try {
      let aiResponse = "";

      if (provider === "OpenRouter") {
        // Use backend proxy for OpenRouter
        const response = await fetch("/api/chat/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage.content, model: selectedModel }),
        });
        const data = await response.json();
        if (data.success) {
          aiResponse = data.response;
        } else {
          aiResponse = `Error: ${data.error || "Unknown error occurred"}`;
        }
      } else if (provider === "OpenAI" && apiKeys.openai) {
        // Direct OpenAI API call
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKeys.openai}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: "system", content: "You are a helpful AI assistant." },
              { role: "user", content: userMessage.content },
            ],
            temperature: 0.7,
            max_tokens: 2000,
          }),
        });
        const data = await response.json();
        if (data.choices?.[0]?.message?.content) {
          aiResponse = data.choices[0].message.content;
        } else {
          aiResponse = `Error: ${data.error?.message || "Request failed"}`;
        }
      } else if (provider === "Anthropic" && apiKeys.anthropic) {
        // Direct Anthropic API call
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKeys.anthropic,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: selectedModel,
            max_tokens: 2000,
            system: "You are a helpful AI assistant.",
            messages: [{ role: "user", content: userMessage.content }],
          }),
        });
        const data = await response.json();
        if (data.content?.[0]?.text) {
          aiResponse = data.content[0].text;
        } else {
          aiResponse = `Error: ${data.error?.message || "Request failed"}`;
        }
      } else {
        aiResponse = `Error: No API key configured for ${provider}. Please add your API key in the Providers panel.`;
      }

      const assistantMessage: Message = { role: "assistant", content: aiResponse };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: Failed to connect to AI service. Please check your connection and API keys." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md z-50 flex flex-col"
            style={{ backgroundColor: "hsl(var(--card))", borderLeft: "1px solid hsl(var(--border))" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">AI Assistant</h2>
                  <p className="text-[10px] text-muted-foreground">
                    {apiKeys.openai || apiKeys.anthropic || apiKeys.openrouter
                      ? "Connected to your providers"
                      : "Add API keys in Providers panel"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={clearChat}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                  title="Clear chat"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Model Selector */}
            <div className="p-3 border-b" style={{ borderColor: "hsl(var(--border))" }}>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-xs bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                style={{ borderColor: "hsl(var(--border))" }}
              >
                {allModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    [{model.provider}] {model.name} {model.free ? "(FREE)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <Bot className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm">Start a conversation with AI</p>
                  <p className="text-[10px] mt-1">
                    {Object.keys(apiKeys).length > 0
                      ? `${Object.keys(apiKeys).length} provider(s) configured`
                      : "Add API keys in Providers panel to get started"}
                  </p>
                </div>
              )}

              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${message.role === "user" ? "justify-end" : ""}`}
                >
                  {message.role === "assistant" && (
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-lg text-xs whitespace-pre-wrap ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted border"
                    }`}
                    style={{
                      borderColor: message.role === "assistant" ? "hsl(var(--border))" : undefined,
                    }}
                  >
                    {message.content}
                  </div>

                  {message.role === "user" && (
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}

              {loading && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-muted border text-xs flex items-center gap-1" style={{ borderColor: "hsl(var(--border))" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t" style={{ borderColor: "hsl(var(--border))" }}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask AI anything..."
                  className="flex-1 px-3 py-2 rounded-lg border text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  style={{ borderColor: "hsl(var(--border))" }}
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
