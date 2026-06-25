"""
Repository layer for Bridgenton — Supabase CRUD operations.
Replaces all direct SQLite calls with Supabase API calls.
"""

from typing import Optional, List, Dict, Any
from .supabase_client import supabase


# ============================================================
# Scrape Jobs
# ============================================================

def save_scrape_job(url: str, scraper_type: str, status: str = "pending",
                    result: Optional[dict] = None, error: Optional[str] = None) -> Optional[dict]:
    """Insert a new scrape job record."""
    if supabase is None:
        return None
    data = {
        "url": url,
        "scraper_type": scraper_type,
        "status": status,
        "result": result,
        "error": error,
    }
    response = supabase.table("scrape_jobs").insert(data).execute()
    return response.data[0] if response.data else None


def get_scrape_history(limit: int = 20) -> List[dict]:
    """Get recent scrape jobs."""
    if supabase is None:
        return []
    response = supabase.table("scrape_jobs") \
        .select("*") \
        .order("created_at", desc=True) \
        .limit(limit) \
        .execute()
    return response.data if response.data else []


# ============================================================
# Search Queries
# ============================================================

def save_search_query(query: str, engine: str, results: list) -> Optional[dict]:
    """Log a search query and its results."""
    if supabase is None:
        return None
    data = {
        "query": query,
        "engine": engine,
        "results": results,
    }
    response = supabase.table("search_queries").insert(data).execute()
    return response.data[0] if response.data else None


def get_search_history(limit: int = 20) -> List[dict]:
    """Get recent search queries."""
    if supabase is None:
        return []
    response = supabase.table("search_queries") \
        .select("*") \
        .order("created_at", desc=True) \
        .limit(limit) \
        .execute()
    return response.data if response.data else []


# ============================================================
# Enrichment Cache
# ============================================================

def get_enrichment_cache(domain: str) -> Optional[dict]:
    """Check if a domain enrichment is cached."""
    if supabase is None:
        return None
    response = supabase.table("enrichment_cache") \
        .select("*") \
        .eq("domain", domain) \
        .execute()
    return response.data[0] if response.data else None


def set_enrichment_cache(domain: str, data: dict) -> Optional[dict]:
    """Cache a domain enrichment result."""
    if supabase is None:
        return None
    # Upsert: update if exists, insert if not
    response = supabase.table("enrichment_cache") \
        .upsert({"domain": domain, "data": data}) \
        .execute()
    return response.data[0] if response.data else None


# ============================================================
# Swarm Sessions
# ============================================================

def save_swarm_session(industry: str, location: str, amount: int,
                       logs: list, results: list) -> Optional[dict]:
    """Log a swarm intelligence session."""
    if supabase is None:
        return None
    data = {
        "industry": industry,
        "location": location,
        "amount": amount,
        "logs": logs,
        "results": results,
    }
    response = supabase.table("swarm_sessions").insert(data).execute()
    return response.data[0] if response.data else None


def get_swarm_sessions(limit: int = 10) -> List[dict]:
    """Get recent swarm sessions."""
    if supabase is None:
        return []
    response = supabase.table("swarm_sessions") \
        .select("*") \
        .order("created_at", desc=True) \
        .limit(limit) \
        .execute()
    return response.data if response.data else []
