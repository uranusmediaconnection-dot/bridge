import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface ScrapeRequest {
  url: string;
  scraper?: "requests" | "beautifulsoup" | "selenium";
  timeout?: number;
}

export interface ScrapeResponse {
  success: boolean;
  data?: {
    url: string;
    title: string;
    content: string;
    html: string;
    links: string[];
    images: string[];
    metadata: Record<string, any>;
    status_code: number;
    error?: string;
    timestamp: string;
  };
  error?: string;
}

export interface SearchRequest {
  query: string;
  engine?: "google" | "bing" | "duckduckgo";
  num_results?: number;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  engine: string;
}

export interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  error?: string;
}

export interface SwarmRequest {
  industry: string;
  location: string;
  amount: number;
}

export interface SwarmLog {
  agent: string;
  status: string;
  message: string;
  icon: string;
}

export interface SwarmResult {
  company: string;
  location: string;
  industry: string;
  confidence: string;
  url: string;
}

export interface SwarmResponse {
  success: boolean;
  logs: SwarmLog[];
  results: SwarmResult[];
  error?: string;
}


export interface ProxyConfig {
  enabled: boolean;
  strategy: "round_robin" | "random" | "least_used";
  maxRetries: number;
  rotateOnFailure: boolean;
  respectRobotsTxt: boolean;
  delayBetweenRequests: number;
}

export interface ProxyStats {
  [pool: string]: {
    total: number;
    available: number;
    success_rate: number;
  };
}

export interface ProviderRoute {
  provider: string;
  model: string;
  baseUrl: string;
  apiKey?: string;
  proxyPool?: string;
}

export const proxyAPI = {
  async getStats(): Promise<ProxyStats> {
    const response = await api.get("/proxy/stats");
    return response.data;
  },

  async updateConfig(config: ProxyConfig): Promise<{ success: boolean }> {
    const response = await api.post("/proxy/config", config);
    return response.data;
  },

  async testProxy(url: string): Promise<{ success: boolean; latency: number }> {
    const response = await api.post("/proxy/test", { url });
    return response.data;
  },
};

export const scraperAPI = {
  async scrape(request: ScrapeRequest): Promise<ScrapeResponse> {
    const response = await api.post("/scrape", request);
    return response.data;
  },

  async search(request: SearchRequest): Promise<SearchResponse> {
    const response = await api.post("/search", request);
    return response.data;
  },

  async searchAll(query: string, num_results: number = 10) {
    const response = await api.get("/search/all", {
      params: { query, num_results },
    });
    return response.data;
  },

  async swarm(request: SwarmRequest): Promise<SwarmResponse> {
    const response = await api.post("/swarm", request);
    return response.data;
  },

  async healthCheck() {
    const response = await api.get("/health");
    return response.data;
  },
};

// ============================================================
// NEW: Validation & Enrichment API
// ============================================================

export interface EmailValidationResult {
  email: string;
  valid: boolean;
  confidence: number;
  is_disposable: boolean;
  is_free_provider: boolean;
  checks: Record<string, any>;
  flags: string[];
}

export interface PhoneValidationResult {
  raw: string;
  valid: boolean;
  possible: boolean;
  e164: string | null;
  national: string | null;
  international: string | null;
  country_code: number | null;
  region: string | null;
  carrier: string | null;
  line_type: string;
  timezone: string[];
  geocoded: string | null;
  error: string | null;
}

export interface LeadEmail {
  email: string;
  valid: boolean;
  confidence: number;
  is_disposable: boolean;
  is_free_provider: boolean;
}

export interface LeadPhone {
  number: string;
  valid: boolean;
  e164: string | null;
  national: string | null;
  carrier: string | null;
  line_type: string;
  location: string | null;
  timezone: string[];
}

export interface DomainEnrichmentResult {
  domain: string;
  enriched_at: string;
  emails: LeadEmail[];
  phones: LeadPhone[];
  social_profiles: Record<string, string[]>;
  tech_stack: Record<string, string | null>;
  company_info: Record<string, any>;
}

export interface EmailDiscoveryResult {
  domain: string;
  discovered_emails: string[];
  guessed_patterns: string[];
  generated_patterns?: string[];
  confidence: string;
}

export const validationAPI = {
  async validateEmails(emails: string[], doSmtp = false): Promise<{
    success: boolean;
    total: number;
    valid_count: number;
    invalid_count: number;
    results: EmailValidationResult[];
  }> {
    const response = await api.post("/validate/email", { emails, do_smtp: doSmtp });
    return response.data;
  },

  async validatePhones(numbers: string[], region = "US"): Promise<{
    success: boolean;
    total: number;
    valid_count: number;
    invalid_count: number;
    results: PhoneValidationResult[];
  }> {
    const response = await api.post("/validate/phone", { numbers, region });
    return response.data;
  },
};

export const enrichmentAPI = {
  async enrichDomain(domain: string): Promise<{
    success: boolean;
    result: DomainEnrichmentResult;
  }> {
    const response = await api.post("/enrich/domain", { domain });
    return response.data;
  },

  async enrichBatch(domains: string[]): Promise<{
    success: boolean;
    total: number;
    results: DomainEnrichmentResult[];
  }> {
    const response = await api.post("/enrich/batch", { domains });
    return response.data;
  },

  async discoverEmails(
    domain: string,
    knownNames?: { first: string; last: string }[]
  ): Promise<{
    success: boolean;
    result: EmailDiscoveryResult;
  }> {
    const response = await api.post("/discovery/emails", {
      domain,
      known_names: knownNames,
    });
    return response.data;
  },
};

export const proxyPoolAPI = {
  async refresh(): Promise<{
    success: boolean;
    new_proxies: number;
    total_proxies: number;
    stats: Record<string, any>;
  }> {
    const response = await api.post("/proxies/refresh");
    return response.data;
  },

  async getStats(): Promise<{
    success: boolean;
    stats: Record<string, any>;
  }> {
    const response = await api.get("/proxies/stats");
    return response.data;
  },
};