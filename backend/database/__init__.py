"""Database package for Bridgenton Web Scraper.
Replaces local SQLite with Supabase (Postgres).
"""
from .supabase_client import supabase, get_service_client, supabase_available, check_connection
