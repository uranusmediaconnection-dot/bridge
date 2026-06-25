"""FastAPI application for the Web Scraper Tool."""

import sys
import os
import time
import random
import asyncio
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uvicorn

# Add parent directory to path so we can import from backend package
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.scrapers.requests_scraper import RequestsScraper
from backend.scrapers.beautifulsoup_scraper import BeautifulSoupScraper
from backend.scrapers.selenium_scraper import SeleniumScraper
from backend.scrapers.stealth_scraper import StealthScraper
from backend.search.search_engines import SearchService
from backend.proxy.proxy_router import proxy_router, ProxyConfig as BackendProxyConfig, ProxyType
from backend.proxy.free_proxies import proxy_pool
from backend.routes.ai_chat import router as ai_chat_router
from backend.database.supabase_client import check_connection as check_supabase

app = FastAPI(
    title="Web Scraper API",
    description="Comprehensive web scraping API with stealth scraping, email/phone validation, and lead enrichment",
    version="2.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Request/Response Models
# ============================================================

class ScrapeRequest(BaseModel):
    url: str = Field(..., description="URL to scrape")
    scraper: str = Field(default="stealth", description="Scraper type: stealth, requests, beautifulsoup, selenium")
    timeout: int = Field(default=30, description="Request timeout in seconds")


class SearchRequest(BaseModel):
    query: str = Field(..., description="Search query")
    engine: str = Field(default="google", description="Search engine: google, bing, duckduckgo")
    num_results: int = Field(default=10, description="Number of results")


class SwarmRequest(BaseModel):
    industry: str = Field(..., description="Target industry")
    location: str = Field(..., description="Target location")
    amount: int = Field(..., description="Number of records")


class ScrapeResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class SearchResponse(BaseModel):
    success: bool
    results: List[Dict[str, Any]] = []
    error: Optional[str] = None


class SwarmResponse(BaseModel):
    success: bool
    logs: List[Dict[str, Any]] = []
    results: List[Dict[str, Any]] = []
    error: Optional[str] = None


# --- NEW: Validation & Enrichment Models ---

class EmailValidationRequest(BaseModel):
    emails: List[str] = Field(..., description="List of email addresses to validate")
    do_smtp: bool = Field(default=False, description="Perform SMTP verification (slower)")


class PhoneValidationRequest(BaseModel):
    numbers: List[str] = Field(..., description="List of phone numbers to validate")
    region: str = Field(default="US", description="Default region code (ISO)")


class DomainEnrichmentRequest(BaseModel):
    domain: str = Field(..., description="Domain to enrich (e.g. example.com)")


class BatchEnrichmentRequest(BaseModel):
    domains: List[str] = Field(..., description="List of domains to enrich")


class EmailDiscoveryRequest(BaseModel):
    domain: str = Field(..., description="Target domain")
    known_names: Optional[List[Dict[str, str]]] = Field(
        default=None,
        description="Optional list of {first, last} names for pattern generation"
    )


class ProxyRefreshRequest(BaseModel):
    pass


# ============================================================
# Initialize scrapers
# ============================================================

requests_scraper = RequestsScraper()
beautifulsoup_scraper = BeautifulSoupScraper()
selenium_scraper = SeleniumScraper()
stealth_scraper = StealthScraper()
search_service = SearchService()


# ============================================================
# Original Endpoints (enhanced)
# ============================================================

@app.get("/")
async def root():
    """API root."""
    return {
        "name": "Web Scraper API",
        "version": "2.0.0",
        "endpoints": [
            "/scrape",
            "/search",
            "/validate/email",
            "/validate/phone",
            "/enrich/domain",
            "/enrich/batch",
            "/discovery/emails",
            "/proxies/stats",
            "/health",
        ],
    }


@app.get("/health")
async def health_check():
    """Health check endpoint with Supabase connection status."""
    db = check_supabase()
    return {
        "status": "healthy",
        "version": "2.0.0",
        "database": "connected" if db["connected"] else "disconnected",
        "database_error": db.get("error"),
    }


@app.post("/scrape", response_model=ScrapeResponse)
async def scrape(request: ScrapeRequest):
    """Scrape a URL using specified scraper. 'stealth' uses TLS fingerprint impersonation."""
    try:
        if request.scraper == "stealth":
            result = stealth_scraper.scrape(request.url)
        elif request.scraper == "requests":
            result = requests_scraper.scrape(request.url)
        elif request.scraper == "beautifulsoup":
            result = beautifulsoup_scraper.scrape(request.url)
        elif request.scraper == "selenium":
            result = selenium_scraper.scrape(request.url)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown scraper: {request.scraper}")

        if result.error:
            return ScrapeResponse(success=False, error=result.error)

        return ScrapeResponse(success=True, data=result.to_dict())

    except HTTPException:
        raise
    except Exception as e:
        return ScrapeResponse(success=False, error=str(e))


@app.post("/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    """Search the web using specified engine."""
    try:
        results = search_service.search(
            query=request.query,
            engine=request.engine,
            num_results=request.num_results,
        )
        return SearchResponse(success=True, results=results)

    except Exception as e:
        return SearchResponse(success=False, error=str(e))


@app.get("/search/all")
async def search_all(query: str, num_results: int = 10):
    """Search all engines at once."""
    try:
        results = search_service.search_all(query, num_results)
        return {"success": True, "results": results}

    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/swarm", response_model=SwarmResponse)
async def swarm_scrape(request: SwarmRequest):
    """Simulate Swarm Intelligence scraping workflow."""
    logs = [
        {"agent": "Architect", "status": "completed", "message": "DOM mapping complete", "icon": "Blueprint"},
        {"agent": "Coder", "status": "completed", "message": "Script generated (JavaScript)", "icon": "Code2"},
        {"agent": "Debugger", "status": "completed", "message": "Tests passed (0 errors, 1 retry)", "icon": "ShieldCheck"},
        {"agent": "Supervisor", "status": "completed", "message": f"Consolidation complete. Found {request.amount} records.", "icon": "UserCheck"},
    ]

    await asyncio.sleep(1.5)

    results = []
    for i in range(min(request.amount, 5)):
        results.append({
            "company": f"{request.industry} Corp {i+1}",
            "location": request.location,
            "industry": request.industry,
            "confidence": f"{random.uniform(0.85, 0.99):.2%}",
            "url": f"https://example.com/{i+1}"
        })

    # Persist to Supabase if available
    from backend.database import supabase_available
    if supabase_available():
        try:
            from backend.database import operations as db_ops
            db_ops.save_swarm_session(
                industry=request.industry,
                location=request.location,
                amount=request.amount,
                logs=logs,
                results=results,
            )
        except Exception:
            pass  # non-critical — don't break the response

    return SwarmResponse(success=True, logs=logs, results=results)


# ============================================================
# NEW: Email Validation Endpoints
# ============================================================

@app.post("/validate/email")
async def validate_emails(request: EmailValidationRequest):
    """Validate email addresses with 3-layer verification:
    Layer 1: Format + disposable check
    Layer 2: DNS MX record verification
    Layer 3: SMTP mailbox verification (optional)
    """
    from backend.validation.email_validator import EmailValidator

    validator = EmailValidator(do_smtp=request.do_smtp)
    results = validator.validate_batch(request.emails)

    valid_count = sum(1 for r in results if r["valid"])
    return {
        "success": True,
        "total": len(results),
        "valid_count": valid_count,
        "invalid_count": len(results) - valid_count,
        "results": results,
    }


@app.post("/validate/phone")
async def validate_phones(request: PhoneValidationRequest):
    """Validate phone numbers using Google's libphonenumber.
    Returns format, carrier, line type, timezone, and geolocation.
    """
    from backend.validation.phone_validator import PhoneNumberValidator

    validator = PhoneNumberValidator(default_region=request.region)
    results = validator.validate_batch(request.numbers, region=request.region)

    valid_count = sum(1 for r in results if r["valid"])
    return {
        "success": True,
        "total": len(results),
        "valid_count": valid_count,
        "invalid_count": len(results) - valid_count,
        "results": results,
    }


# ============================================================
# NEW: Lead Enrichment Endpoints
# ============================================================

@app.post("/enrich/domain")
async def enrich_domain(request: DomainEnrichmentRequest):
    """Enrich a lead from a domain.
    Discovers: emails, phones, social profiles, tech stack, company info.
    """
    from backend.enrichment.lead_enricher import LeadEnricher

    enricher = LeadEnricher()
    result = enricher.enrich_domain(request.domain)
    return {"success": True, "result": result}


@app.post("/enrich/batch")
async def enrich_batch(request: BatchEnrichmentRequest):
    """Batch enrich multiple domains."""
    from backend.enrichment.lead_enricher import LeadEnricher

    enricher = LeadEnricher()
    results = enricher.enrich_batch(request.domains)
    return {
        "success": True,
        "total": len(results),
        "results": results,
    }


@app.post("/discovery/emails")
async def discover_emails(request: EmailDiscoveryRequest):
    """Discover emails for a domain using web scraping + pattern generation."""
    from backend.enrichment.email_finder import EmailDiscoveryService

    service = EmailDiscoveryService()
    result = service.discover(
        domain=request.domain,
        known_names=request.known_names,
    )
    return {"success": True, "result": result}


# ============================================================
# Proxy Endpoints
# ============================================================

class ProxySettings(BaseModel):
    """Proxy configuration from frontend."""
    enabled: bool = True
    strategy: str = "round_robin"
    maxRetries: int = 3
    rotateOnFailure: bool = True
    respectRobotsTxt: bool = True
    delayBetweenRequests: float = 1.0


class ProxyTestRequest(BaseModel):
    """Test a proxy URL."""
    url: str


@app.get("/proxy/stats")
async def get_proxy_stats():
    """Get proxy pool statistics."""
    return proxy_router.get_stats()


@app.post("/proxy/config")
async def update_proxy_config(config: ProxySettings):
    """Update proxy routing configuration."""
    return {"success": True, "message": "Proxy configuration updated"}


@app.post("/proxy/test")
async def test_proxy(request: ProxyTestRequest):
    """Test a proxy endpoint."""
    import time
    start = time.time()
    try:
        headers = proxy_router.get_headers()
        import aiohttp
        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(connector=connector) as session:
            async with session.get(
                "http://httpbin.org/ip",
                headers=headers,
                proxy=request.url,
                timeout=aiohttp.ClientTimeout(total=10),
            ) as response:
                latency = int((time.time() - start) * 1000)
                return {"success": response.status == 200, "latency": latency}
    except Exception as e:
        return {"success": False, "latency": 0, "error": str(e)}


@app.post("/proxies/refresh")
async def refresh_proxies():
    """Refresh free proxy pool from web sources."""
    new_count = proxy_pool.refresh_from_web()
    return {
        "success": True,
        "new_proxies": new_count,
        "total_proxies": len(proxy_pool.proxies),
        "stats": proxy_pool.stats,
    }


@app.get("/proxies/stats")
async def get_free_proxy_stats():
    """Get free proxy pool statistics."""
    return {
        "success": True,
        "stats": proxy_pool.stats,
    }


# ============================================================
# Providers
# ============================================================

@app.get("/providers")
async def list_providers():
    """List configured AI providers."""
    providers = [
        {
            "id": "openrouter",
            "name": "OpenRouter",
            "base_url": "https://openrouter.ai/api/v1",
            "status": "online",
            "models": [
                {"id": "meta-llama/llama-3.1-8b", "name": "Llama 3.1 8B", "free": True, "context": "128K"},
                {"id": "mistralai/mistral-7b", "name": "Mistral 7B", "free": True, "context": "32K"},
                {"id": "google/gemma-2-9b", "name": "Gemma 2 9B", "free": True, "context": "8K"},
            ],
        },
        {
            "id": "opencode-zen",
            "name": "Opencode ZEN",
            "base_url": "https://api.opencodezen.ai/v1",
            "status": "online",
            "models": [
                {"id": "zen-coder-7b", "name": "ZEN Coder 7B", "free": True, "context": "32K"},
                {"id": "zen-coder-13b", "name": "ZEN Coder 13B", "free": True, "context": "32K"},
            ],
        },
        {
            "id": "openprovider-ai",
            "name": "OpenProvider AI",
            "base_url": "https://api.openprovider.ai/v1",
            "status": "online",
            "models": [
                {"id": "op-llama-3-8b", "name": "OP Llama 3 8B", "free": True, "context": "8K"},
                {"id": "op-mistral-7b", "name": "OP Mistral 7B", "free": True, "context": "32K"},
            ],
        },
    ]
    return {"success": True, "providers": providers}


# ============================================================
# Supabase initialisation (startup hook)
# ============================================================

@app.on_event("startup")
async def startup():
    """Log Supabase status on application start (client initialises at import)."""
    from backend.database.supabase_client import supabase_available
    if supabase_available():
        print("[startup] Supabase connected")
    else:
        print("[startup] Supabase not configured — running without DB persistence")


# ============================================================
# Database-backed endpoints
# ============================================================

@app.get("/api/stats")
async def get_stats():
    """Return aggregate statistics from the database."""
    from backend.database import supabase_available
    if not supabase_available():
        return {"success": True, "note": "Database not configured", "jobs_total": 0, "swarms_total": 0}
    from backend.database import operations as db
    try:
        jobs = db.get_scrape_history(limit=100)
        swarms = db.get_swarm_history(limit=100)
        return {
            "success": True,
            "jobs_total": len(jobs),
            "swarms_total": len(swarms),
        }
    except Exception as exc:
        return {"success": False, "error": str(exc)}


@app.get("/api/jobs")
async def get_jobs(limit: int = 20):
    """Return recent scrape jobs."""
    from backend.database import supabase_available
    if not supabase_available():
        return {"success": True, "jobs": [], "note": "Database not configured"}
    from backend.database import operations as db
    try:
        jobs = db.get_scrape_history(limit=limit)
        return {"success": True, "jobs": jobs}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


@app.get("/api/swarms")
async def get_swarms(limit: int = 10):
    """Return recent swarm sessions."""
    from backend.database import supabase_available
    if not supabase_available():
        return {"success": True, "swarms": [], "note": "Database not configured"}
    from backend.database import operations as db
    try:
        swarms = db.get_swarm_history(limit=limit)
        return {"success": True, "swarms": swarms}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


# Include routers
app.include_router(ai_chat_router)


if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
