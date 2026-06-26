"""
Deployment Verification Script
Run this after deploying to verify all components are working.
"""

import os
import sys
import httpx
from typing import Dict, Any

def check_supabase_connection() -> Dict[str, Any]:
    """Check if Supabase is properly connected."""
    url = os.getenv("SUPABASE_URL")
    secret_key = os.getenv("SUPABASE_SECRET_KEY")
    publishable_key = os.getenv("SUPABASE_PUBLISHABLE_KEY")
    
    print("\n🔍 Supabase Configuration:")
    print(f"  SUPABASE_URL: {'✅ Set' if url else '❌ Missing'}")
    print(f"  SUPABASE_SECRET_KEY: {'✅ Set' if secret_key else '❌ Missing'}")
    print(f"  SUPABASE_PUBLISHABLE_KEY: {'✅ Set' if publishable_key else '❌ Missing'}")
    
    if not url or not secret_key:
        return {"connected": False, "error": "Missing required environment variables"}
    
    try:
        from supabase import create_client
        client = create_client(url, secret_key)
        # Test connection
        result = client.table("scrape_jobs").select("id").limit(1).execute()
        print(f"  Connection: ✅ Connected")
        return {"connected": True, "error": None}
    except Exception as e:
        print(f"  Connection: ❌ {str(e)}")
        return {"connected": False, "error": str(e)}

def check_health_endpoint(base_url: str = "http://localhost:8000") -> Dict[str, Any]:
    """Check the /health endpoint."""
    print(f"\n🏥 Health Check ({base_url}/health):")
    try:
        response = httpx.get(f"{base_url}/health", timeout=10)
        data = response.json()
        print(f"  Status: {data.get('status', 'unknown')}")
        print(f"  Database: {data.get('database', 'unknown')}")
        if data.get('database_error'):
            print(f"  DB Error: {data['database_error']}")
        return data
    except Exception as e:
        print(f"  ❌ Failed: {str(e)}")
        return {"error": str(e)}

def check_ai_chat(base_url: str = "http://localhost:8000") -> Dict[str, Any]:
    """Check AI chat endpoint."""
    print(f"\n🤖 AI Chat Check ({base_url}/api/chat/models):")
    try:
        response = httpx.get(f"{base_url}/api/chat/models", timeout=10)
        data = response.json()
        if data.get("success"):
            print(f"  ✅ Models available: {len(data.get('models', []))}")
            return data
        else:
            print(f"  ❌ Failed: {data.get('error')}")
            return data
    except Exception as e:
        print(f"  ❌ Failed: {str(e)}")
        return {"error": str(e)}

def main():
    print("=" * 60)
    print("Bridgenton Web Intelligence Suite - Deployment Verification")
    print("=" * 60)
    
    # Check Supabase
    supabase_status = check_supabase_connection()
    
    # Check health endpoint (if running)
    base_url = os.getenv("BASE_URL", "http://localhost:8000")
    health_status = check_health_endpoint(base_url)
    
    # Check AI chat
    ai_status = check_ai_chat(base_url)
    
    # Summary
    print("\n" + "=" * 60)
    print("Summary:")
    print(f"  Supabase: {'✅ Connected' if supabase_status.get('connected') else '❌ Not configured'}")
    print(f"  Health: {'✅ Healthy' if health_status.get('status') == 'healthy' else '⚠️  Check logs'}")
    print(f"  AI Chat: {'✅ Available' if ai_status.get('success') else '⚠️  Check API key'}")
    print("=" * 60)
    
    if not supabase_status.get('connected'):
        print("\n⚠️  Supabase not configured. Set these environment variables:")
        print("  SUPABASE_URL=https://zxsaapxgoyugvicrdhja.supabase.co")
        print("  SUPABASE_SECRET_KEY=<your-service-role-key>")
        print("  SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>")
        sys.exit(1)
    
    print("\n✅ All checks passed!")
    sys.exit(0)

if __name__ == "__main__":
    main()
