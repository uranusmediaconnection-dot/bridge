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