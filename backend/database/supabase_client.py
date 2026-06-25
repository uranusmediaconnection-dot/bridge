"""
Supabase client for Bridgenton Web Scraper.

Uses the new Supabase API key system:
- SUPABASE_URL: Project URL from Supabase dashboard
- SUPABASE_SECRET_KEY: Secret key (replaces old service_role key) — backend only
- SUPABASE_PUBLISHABLE_KEY: Publishable key (replaces old anon key) — frontend only
"""

import os
from typing import Optional
from supabase import create_client, Client

# Environment variable names used by the HF Space
ENV_URL = "SUPABASE_URL"
ENV_SECRET_KEY = "SUPABASE_SECRET_KEY"
ENV_PUBLISHABLE_KEY = "SUPABASE_PUBLISHABLE_KEY"


def get_service_client() -> Optional[Client]:
    """Get the Supabase admin client using the secret key.
    
    This client has full access (bypasses RLS).
    Only use in backend/server code — NEVER expose to the client.
    """
    url = os.getenv(ENV_URL)
    key = os.getenv(ENV_SECRET_KEY)
    
    if not url or not key:
        return None
    
    try:
        return create_client(url, key)
    except Exception as e:
        print(f"[Supabase] Failed to create service client: {e}")
        return None


def get_public_client() -> Optional[Client]:
    """Get the Supabase public client using the publishable key.
    
    This client respects Row Level Security (RLS).
    Safe to use in frontend code.
    """
    url = os.getenv(ENV_URL)
    key = os.getenv(ENV_PUBLISHABLE_KEY)
    
    if not url or not key:
        return None
    
    try:
        return create_client(url, key)
    except Exception as e:
        print(f"[Supabase] Failed to create public client: {e}")
        return None


# Singleton for backend use
supabase = get_service_client()


def supabase_available() -> bool:
    """Check if Supabase is configured and available."""
    return supabase is not None


def get_supabase() -> Client:
    """Get the Supabase client instance. Raises RuntimeError if not configured."""
    if supabase is None:
        raise RuntimeError("Supabase not configured")
    return supabase


def check_connection() -> dict:
    """Verify Supabase connection by querying the health of the API."""
    if supabase is None:
        return {"connected": False, "error": "Supabase not configured (missing env vars)"}
    
    try:
        # Simple query to verify connection
        result = supabase.table("scrape_jobs").select("id").limit(1).execute()
        return {"connected": True, "error": None}
    except Exception as e:
        return {"connected": False, "error": str(e)}
