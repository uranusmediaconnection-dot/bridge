"""
Supabase client singleton.

Loads credentials from environment variables:
  SUPABASE_URL
  SUPABASE_SERVICE_KEY  (service_role key — used by backend)

Gracefully degrades when no Supabase is configured (returns None from get_supabase()).
"""
import os
import logging

logger = logging.getLogger(__name__)

_supabase = None
_available = False


def init_supabase():
    """Initialise the Supabase client from environment variables.

    Called once at application startup.  Silently returns None if the
    environment variables are not set (development / pre-Supabase mode).
    """
    global _supabase, _available

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")

    if not url or not key:
        logger.info("Supabase not configured — running without database persistence")
        _available = False
        _supabase = None
        return

    try:
        from supabase import create_client
        _supabase = create_client(url, key)
        _available = True
        logger.info("Supabase client initialised")
    except Exception as exc:
        logger.warning("Failed to initialise Supabase client: %s", exc)
        _available = False
        _supabase = None


def get_supabase():
    """Return the Supabase client or None."""
    return _supabase


def supabase_available():
    """True if Supabase was successfully initialised."""
    return _available
