"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Mail,
  Phone,
  Globe,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Copy,
  ExternalLink,
  Building2,
  MapPin,
  Wifi,
  RefreshCw,
  Download,
  Sparkles,
  Users,
  ArrowRight,
} from "lucide-react";
import { validationAPI, enrichmentAPI } from "../lib/api";
import type { EmailValidationResult, PhoneValidationResult, DomainEnrichmentResult } from "../lib/api";

type ActiveMode = "email" | "phone" | "enrich";

export function LeadIntelPanel() {
  const [activeMode, setActiveMode] = useState<ActiveMode>("email");
  const [loading, setLoading] = useState(false);

  // Email validation state
  const [emailInput, setEmailInput] = useState("");
  const [emailResults, setEmailResults] = useState<EmailValidationResult[]>([]);
  const [emailStats, setEmailStats] = useState<{ total: number; valid: number; invalid: number } | null>(null);

  // Phone validation state
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneResults, setPhoneResults] = useState<PhoneValidationResult[]>([]);
  const [phoneStats, setPhoneStats] = useState<{ total: number; valid: number; invalid: number } | null>(null);

  // Domain enrichment state
  const [domainInput, setDomainInput] = useState("");
  const [enrichResult, setEnrichResult] = useState<DomainEnrichmentResult | null>(null);

  const handleEmailValidate = useCallback(async () => {
    const emails = emailInput.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);
    if (emails.length === 0) return;

    setLoading(true);
    setEmailResults([]);
    setEmailStats(null);

    try {
      const response = await validationAPI.validateEmails(emails);
      setEmailResults(response.results);
      setEmailStats({
        total: response.total,
        valid: response.valid_count,
        invalid: response.invalid_count,
      });
    } catch (error) {
      console.error("Email validation failed:", error);
    } finally {
      setLoading(false);
    }
  }, [emailInput]);

  const handlePhoneValidate = useCallback(async () => {
    const numbers = phoneInput.split(/[\n,;]+/).map(n => n.trim()).filter(Boolean);
    if (numbers.length === 0) return;

    setLoading(true);
    setPhoneResults([]);
    setPhoneStats(null);

    try {
      const response = await validationAPI.validatePhones(numbers);
      setPhoneResults(response.results);
      setPhoneStats({
        total: response.total,
        valid: response.valid_count,
        invalid: response.invalid_count,
      });
    } catch (error) {
      console.error("Phone validation failed:", error);
    } finally {
      setLoading(false);
    }
  }, [phoneInput]);

  const handleDomainEnrich = useCallback(async () => {
    const domain = domainInput.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!domain) return;

    setLoading(true);
    setEnrichResult(null);

    try {
      const response = await enrichmentAPI.enrichDomain(domain);
      setEnrichResult(response.result);
    } catch (error) {
      console.error("Domain enrichment failed:", error);
    } finally {
      setLoading(false);
    }
  }, [domainInput]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportResults = () => {
    let data: any;
    let filename: string;

    if (activeMode === "email" && emailResults.length > 0) {
      data = emailResults;
      filename = "email-validation-results.json";
    } else if (activeMode === "phone" && phoneResults.length > 0) {
      data = phoneResults;
      filename = "phone-validation-results.json";
    } else if (activeMode === "enrich" && enrichResult) {
      data = enrichResult;
      filename = `enrichment-${enrichResult.domain}.json`;
    } else {
      return;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Lead Intelligence
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Validate emails, phone numbers, and enrich domain data
          </p>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.05]">
        {[
          { key: "email" as const, label: "Email Validation", icon: Mail },
          { key: "phone" as const, label: "Phone Validation", icon: Phone },
          { key: "enrich" as const, label: "Domain Intel", icon: Globe },
        ].map((tab) => {
          const isActive = activeMode === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveMode(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                transition-all duration-150 ease-out
                ${isActive
                  ? "text-white bg-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* Email Validation Mode */}
        {activeMode === "email" && (
          <motion.div
            key="email"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="section-card">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Enter email addresses (one per line or comma-separated)
              </label>
              <textarea
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder={"john@example.com\njane.doe@company.org\ntest@mailinator.com"}
                className="input-modern w-full h-32 resize-none font-mono text-xs"
              />
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={handleEmailValidate}
                  disabled={loading || !emailInput.trim()}
                  className="btn-gradient-primary flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Shield className="w-3.5 h-3.5" />
                  )}
                  {loading ? "Validating..." : "Validate Emails"}
                </button>
                {emailResults.length > 0 && (
                  <button onClick={exportResults} className="btn-outline flex items-center gap-2 text-xs">
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </button>
                )}
              </div>
            </div>

            {/* Stats Bar */}
            {emailStats && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-3 gap-3"
              >
                <div className="stat-card text-center">
                  <div className="text-2xl font-bold text-foreground">{emailStats.total}</div>
                  <div className="text-xs text-muted-foreground mt-1">Total</div>
                </div>
                <div className="stat-card text-center">
                  <div className="text-2xl font-bold text-emerald-400">{emailStats.valid}</div>
                  <div className="text-xs text-muted-foreground mt-1">Valid</div>
                </div>
                <div className="stat-card text-center">
                  <div className="text-2xl font-bold text-red-400">{emailStats.invalid}</div>
                  <div className="text-xs text-muted-foreground mt-1">Invalid</div>
                </div>
              </motion.div>
            )}

            {/* Results */}
            <div className="space-y-2">
              {emailResults.map((result, i) => (
                <motion.div
                  key={result.email}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="section-card flex items-center gap-3"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    result.valid
                      ? "bg-emerald-500/15 text-emerald-400"
                      : result.is_disposable
                      ? "bg-amber-500/15 text-amber-400"
                      : "bg-red-500/15 text-red-400"
                  }`}>
                    {result.valid ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{result.email}</span>
                      <button onClick={() => copyToClipboard(result.email)} className="text-muted-foreground hover:text-foreground transition-colors">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        result.valid ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      }`}>
                        {result.valid ? "Valid" : "Invalid"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Confidence: {result.confidence}%
                      </span>
                      {result.is_disposable && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Disposable
                        </span>
                      )}
                      {result.is_free_provider && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                          Free Provider
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Phone Validation Mode */}
        {activeMode === "phone" && (
          <motion.div
            key="phone"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="section-card">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Enter phone numbers (one per line or comma-separated)
              </label>
              <textarea
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder={"+1 (555) 123-4567\n+44 7911 123456\n202-555-0142"}
                className="input-modern w-full h-32 resize-none font-mono text-xs"
              />
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={handlePhoneValidate}
                  disabled={loading || !phoneInput.trim()}
                  className="btn-gradient-primary flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Phone className="w-3.5 h-3.5" />
                  )}
                  {loading ? "Validating..." : "Validate Numbers"}
                </button>
                {phoneResults.length > 0 && (
                  <button onClick={exportResults} className="btn-outline flex items-center gap-2 text-xs">
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            {phoneStats && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-3 gap-3"
              >
                <div className="stat-card text-center">
                  <div className="text-2xl font-bold text-foreground">{phoneStats.total}</div>
                  <div className="text-xs text-muted-foreground mt-1">Total</div>
                </div>
                <div className="stat-card text-center">
                  <div className="text-2xl font-bold text-emerald-400">{phoneStats.valid}</div>
                  <div className="text-xs text-muted-foreground mt-1">Valid</div>
                </div>
                <div className="stat-card text-center">
                  <div className="text-2xl font-bold text-red-400">{phoneStats.invalid}</div>
                  <div className="text-xs text-muted-foreground mt-1">Invalid</div>
                </div>
              </motion.div>
            )}

            {/* Results */}
            <div className="space-y-2">
              {phoneResults.map((result, i) => (
                <motion.div
                  key={result.raw}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="section-card"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      result.valid ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                    }`}>
                      {result.valid ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{result.raw}</span>
                        {result.e164 && (
                          <button onClick={() => copyToClipboard(result.e164!)} className="text-muted-foreground hover:text-foreground transition-colors">
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          result.valid ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        }`}>
                          {result.valid ? "Valid" : result.error || "Invalid"}
                        </span>
                        {result.e164 && (
                          <span className="text-[10px] text-muted-foreground font-mono">{result.e164}</span>
                        )}
                        {result.carrier && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                            {result.carrier}
                          </span>
                        )}
                        {result.line_type && result.line_type !== "unknown" && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">
                            {result.line_type}
                          </span>
                        )}
                        {result.geocoded && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            {result.geocoded}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Domain Intel Mode */}
        {activeMode === "enrich" && (
          <motion.div
            key="enrich"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="section-card">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Enter a domain to enrich (discovers emails, phones, social profiles, tech stack)
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    placeholder="example.com"
                    className="input-modern w-full pl-10 font-mono text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleDomainEnrich()}
                  />
                </div>
                <button
                  onClick={handleDomainEnrich}
                  disabled={loading || !domainInput.trim()}
                  className="btn-gradient-primary flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {loading ? "Enriching..." : "Enrich"}
                </button>
              </div>
            </div>

            {/* Enrichment Results */}
            {enrichResult && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Domain Header */}
                <div className="section-card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{enrichResult.domain}</h3>
                      <p className="text-[10px] text-muted-foreground">Enriched at {new Date(enrichResult.enriched_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <button onClick={exportResults} className="btn-outline flex items-center gap-2 text-xs">
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="stat-card text-center">
                    <Mail className="w-4 h-4 text-primary mx-auto mb-1" />
                    <div className="text-lg font-bold text-foreground">{enrichResult.emails.length}</div>
                    <div className="text-[10px] text-muted-foreground">Emails</div>
                  </div>
                  <div className="stat-card text-center">
                    <Phone className="w-4 h-4 text-secondary mx-auto mb-1" />
                    <div className="text-lg font-bold text-foreground">{enrichResult.phones.length}</div>
                    <div className="text-[10px] text-muted-foreground">Phones</div>
                  </div>
                  <div className="stat-card text-center">
                    <Users className="w-4 h-4 text-accent mx-auto mb-1" />
                    <div className="text-lg font-bold text-foreground">{Object.keys(enrichResult.social_profiles).length}</div>
                    <div className="text-[10px] text-muted-foreground">Social</div>
                  </div>
                  <div className="stat-card text-center">
                    <Wifi className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                    <div className="text-lg font-bold text-foreground">{Object.values(enrichResult.tech_stack).filter(Boolean).length}</div>
                    <div className="text-[10px] text-muted-foreground">Tech Stack</div>
                  </div>
                </div>

                {/* Emails Found */}
                {enrichResult.emails.length > 0 && (
                  <div className="section-card">
                    <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-primary" />
                      Emails Found ({enrichResult.emails.length})
                    </h4>
                    <div className="space-y-1.5">
                      {enrichResult.emails.map((email) => (
                        <div key={email.email} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
                          {email.valid ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                          )}
                          <span className="text-xs font-mono text-foreground flex-1">{email.email}</span>
                          <span className="text-[10px] text-muted-foreground">{email.confidence}%</span>
                          <button onClick={() => copyToClipboard(email.email)} className="text-muted-foreground hover:text-foreground">
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Phones Found */}
                {enrichResult.phones.length > 0 && (
                  <div className="section-card">
                    <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-secondary" />
                      Phones Found ({enrichResult.phones.length})
                    </h4>
                    <div className="space-y-1.5">
                      {enrichResult.phones.map((phone) => (
                        <div key={phone.number} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span className="text-xs font-mono text-foreground flex-1">{phone.e164 || phone.number}</span>
                          {phone.carrier && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">{phone.carrier}</span>
                          )}
                          {phone.line_type !== "unknown" && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">{phone.line_type}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Profiles */}
                {Object.keys(enrichResult.social_profiles).length > 0 && (
                  <div className="section-card">
                    <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-accent" />
                      Social Profiles
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(enrichResult.social_profiles).map(([platform, handles]) =>
                        handles.map((handle) => (
                          <a
                            key={`${platform}-${handle}`}
                            href={`https://${platform}.com/${handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] text-xs text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all"
                          >
                            {platform}
                            <span className="font-mono text-foreground">@{handle}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Tech Stack */}
                {Object.values(enrichResult.tech_stack).some(Boolean) && (
                  <div className="section-card">
                    <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                      Tech Stack
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(enrichResult.tech_stack)
                        .filter(([, v]) => v)
                        .map(([key, value]) => (
                          <span
                            key={key}
                            className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] text-xs"
                          >
                            <span className="text-muted-foreground">{key}:</span>{" "}
                            <span className="text-foreground font-medium">{value}</span>
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Company Info */}
                {enrichResult.company_info && Object.keys(enrichResult.company_info).length > 0 && (
                  <div className="section-card">
                    <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" />
                      Company Info
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(enrichResult.company_info)
                        .filter(([, v]) => v)
                        .map(([key, value]) => (
                          <div key={key} className="p-2 rounded-lg bg-white/[0.02]">
                            <div className="text-[10px] text-muted-foreground capitalize">{key.replace(/_/g, " ")}</div>
                            <div className="text-xs text-foreground font-mono mt-0.5 truncate">
                              {typeof value === "string" ? value : JSON.stringify(value)}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
