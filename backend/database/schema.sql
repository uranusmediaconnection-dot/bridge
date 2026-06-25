-- ============================================================
-- Bridgenton Supabase Schema
-- Run this in the Supabase SQL Editor after creating the project.
-- ============================================================

-- 1. Scrape Jobs
CREATE TABLE IF NOT EXISTS scrape_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  scraper_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Search Queries
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  engine TEXT NOT NULL,
  results JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Swarm Sessions (multi-agent scraping runs)
CREATE TABLE IF NOT EXISTS swarm_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  industry TEXT,
  location TEXT,
  amount INTEGER,
  logs JSONB,
  results JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enrichment Cache (avoid re-fetching the same domain)
CREATE TABLE IF NOT EXISTS enrichment_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT UNIQUE NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. API Keys (optional — for future rate-limiting)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  last_used TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_created ON scrape_jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_queries_created ON search_queries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_swarm_sessions_created ON swarm_sessions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enrichment_cache_domain ON enrichment_cache (domain);

-- Row Level Security
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE swarm_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access (used by backend)
CREATE POLICY "service_role_all_scrape_jobs" ON scrape_jobs
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_search_queries" ON search_queries
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_swarm_sessions" ON swarm_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_enrichment_cache" ON enrichment_cache
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_api_keys" ON api_keys
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow anon read-only on non-sensitive tables
CREATE POLICY "anon_read_scrape_jobs" ON scrape_jobs
  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_search_queries" ON search_queries
  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_swarm_sessions" ON swarm_sessions
  FOR SELECT TO anon USING (true);
