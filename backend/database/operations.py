"""
Database CRUD operations.

Every function checkpoints `supabase_available()` first and raises
RuntimeError if the database isn't wired.  Callers should catch this
and fall back gracefully (e.g. return a static response).
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from .supabase_client import get_supabase, supabase_available

# ── helpers ─────────────────────────────────────────────────────────

def _db():
    if not supabase_available():
        raise RuntimeError("Supabase not configured")
    return get_supabase()


def _now():
    return datetime.now(timezone.utc).isoformat()

# ── scrape jobs ─────────────────────────────────────────────────────

def save_scrape_job(
    url: str,
    scraper_type: str,
    status: str = "pending",
    result: Optional[Dict[str, Any]] = None,
    error: Optional[str] = None,
) -> Dict[str, Any]:
    row = {
        "url": url,
        "scraper_type": scraper_type,
        "status": status,
        "result": result,
        "error": error,
    }
    resp = _db().table("scrape_jobs").insert(row).execute()
    return resp.data[0] if resp.data else {}


def get_scrape_history(limit: int = 20) -> List[Dict[str, Any]]:
    resp = (
        _db()
        .table("scrape_jobs")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return resp.data or []

# ── search queries ──────────────────────────────────────────────────

def save_search_query(
    query: str,
    engine: str,
    results: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    row = {
        "query": query,
        "engine": engine,
        "results": results,
    }
    resp = _db().table("search_queries").insert(row).execute()
    return resp.data[0] if resp.data else {}

# ── swarm sessions ──────────────────────────────────────────────────

def save_swarm_session(
    industry: str,
    location: str,
    amount: int,
    logs: Optional[List[Dict[str, Any]]] = None,
    results: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    row = {
        "industry": industry,
        "location": location,
        "amount": amount,
        "logs": logs,
        "results": results,
    }
    resp = _db().table("swarm_sessions").insert(row).execute()
    return resp.data[0] if resp.data else {}


def get_swarm_history(limit: int = 10) -> List[Dict[str, Any]]:
    resp = (
        _db()
        .table("swarm_sessions")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return resp.data or []

# ── enrichment cache ────────────────────────────────────────────────

def cache_enrichment(domain: str, data: Dict[str, Any]) -> Dict[str, Any]:
    resp = (
        _db()
        .table("enrichment_cache")
        .upsert({"domain": domain, "data": data}, on_conflict="domain")
        .execute()
    )
    return resp.data[0] if resp.data else {}


def get_cached_enrichment(domain: str) -> Optional[Dict[str, Any]]:
    resp = (
        _db()
        .table("enrichment_cache")
        .select("*")
        .eq("domain", domain)
        .limit(1)
        .execute()
    )
    return resp.data[0] if resp.data else None
