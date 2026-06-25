-- ============================================================
-- Bridgenton Web Scraper — Supabase Schema Migration
-- Run this in the Supabase SQL Editor (Project → SQL Editor)
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

-- Index for fast history queries
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_created_at ON scrape_jobs(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_scrape_jobs_updated_at
  BEFORE UPDATE ON scrape_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- 2. Search Queries
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  engine TEXT NOT NULL,
  results JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON search_queries(created_at DESC);


-- 3. Enrichment Cache
CREATE TABLE IF NOT EXISTS enrichment_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT UNIQUE NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enrichment_cache_domain ON enrichment_cache(domain);

CREATE TRIGGER set_enrichment_cache_updated_at
  BEFORE UPDATE ON enrichment_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- 4. Swarm Sessions
CREATE TABLE IF NOT EXISTS swarm_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  industry TEXT,
  location TEXT,
  amount INTEGER,
  logs JSONB,
  results JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_swarm_sessions_created_at ON swarm_sessions(created_at DESC);


-- 5. API Keys (for future auth)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  last_used TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE swarm_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Backend service role: full access (via secret key)
-- These policies allow the service_role to do everything
CREATE POLICY "service_role_all_scrape_jobs"
  ON scrape_jobs FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_all_search_queries"
  ON search_queries FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_all_enrichment_cache"
  ON enrichment_cache FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_all_swarm_sessions"
  ON swarm_sessions FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_all_api_keys"
  ON api_keys FOR ALL
  USING (true)
  WITH CHECK (true);

-- Note: For production, restrict anon/public access.
-- Currently, the secret key is used server-side only.
