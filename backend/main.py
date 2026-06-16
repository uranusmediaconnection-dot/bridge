"""FastAPI application for the Web Scraper Tool."""

import sys
import os
import time
import random
import asyncio
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
from backend.search.search_engines import SearchService
from backend.proxy.proxy_router import proxy_router, ProxyConfig as BackendProxyConfig, ProxyType

app = FastAPI(
    title="Web Scraper API",
    description="Comprehensive web scraping API with multiple scraper backends",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response models
class ScrapeRequest(BaseModel):
    url: str = Field(..., description="URL to scrape")
    scraper: str = Field(default="requests", description="Scraper type: requests, beautifulsoup, selenium")
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


# Initialize scrapers
requests_scraper = RequestsScraper()
beautifulsoup_scraper = BeautifulSoupScraper()
selenium_scraper = SeleniumScraper()
search_service = SearchService()


@app.get("/")
async def root():
    """API root."""
    return {
        "name": "Web Scraper API",
        "version": "1.0.0",
        "endpoints": [
            "/scrape",
            "/search",
            "/health",
        ],
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.post("/scrape", response_model=ScrapeResponse)
async def scrape(request: ScrapeRequest):
    """Scrape a URL using specified scraper."""
    try:
        if request.scraper == "requests":
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
        # Preserve HTTP status codes (e.g., 400 for unknown scraper)
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
    # In a real app, this would trigger actual AI agents.
    # For now, we simulate the workflow steps.
    
    logs = [
        {"agent": "Architect", "status": "completed", "message": "DOM mapping complete", "icon": "Blueprint"},
        {"agent": "Coder", "status": "completed", "message": "Script generated (JavaScript)", "icon": "Code2"},
        {"agent": "Debugger", "status": "completed", "message": "Tests passed (0 errors, 1 retry)", "icon": "ShieldCheck"},
        {"agent": "Supervisor", "status": "completed", "message": f"Consolidation complete. Found {request.amount} records.", "icon": "UserCheck"},
    ]
    
    # Simulate processing time with non-blocking sleep
    await asyncio.sleep(1.5)
    
    # Generate mock results based on request
    results = []
    for i in range(min(request.amount, 5)): # Return max 5 for preview
        results.append({
            "company": f"{request.industry} Corp {i+1}",
            "location": request.location,
            "industry": request.industry,
            "confidence": f"{random.uniform(0.85, 0.99):.2%}",
            "url": f"https://example.com/{i+1}"
        })

    return SwarmResponse(success=True, logs=logs, results=results)




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
    # In production, persist this config
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

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)