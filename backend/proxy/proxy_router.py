"""Proxy routing mechanism for web scraping with rotating proxies and fallback."""

import random
import time
import asyncio
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
from enum import Enum


class ProxyType(str, Enum):
    DATACENTER = "datacenter"
    RESIDENTIAL = "residential"
    ROTATING = "rotating"


@dataclass
class ProxyConfig:
    """Configuration for a single proxy."""
    url: str
    proxy_type: ProxyType = ProxyType.DATACENTER
    username: Optional[str] = None
    password: Optional[str] = None
    weight: float = 1.0
    max_failures: int = 3
    cooldown_seconds: int = 60
    region: Optional[str] = None

    def __post_init__(self):
        self.failures = 0
        self.last_used: float = 0
        self.cooldown_until: float = 0
        self.success_count: int = 0


@dataclass
class ProxyPool:
    """Pool of proxies with rotation strategy."""
    proxies: List[ProxyConfig] = field(default_factory=list)
    current_index: int = 0
    strategy: str = "round_robin"  # round_robin, random, least_used

    def get_next(self) -> Optional[ProxyConfig]:
        """Get next available proxy based on strategy."""
        now = time.time()
        available = [p for p in self.proxies if p.cooldown_until < now]

        if not available:
            return None

        if self.strategy == "random":
            return random.choice(available)
        elif self.strategy == "least_used":
            return min(available, key=lambda p: p.success_count)
        else:  # round_robin
            proxy = available[self.current_index % len(available)]
            self.current_index = (self.current_index + 1) % len(available)
            return proxy

    def report_failure(self, proxy: ProxyConfig):
        """Mark a proxy as failed."""
        proxy.failures += 1
        if proxy.failures >= proxy.max_failures:
            proxy.cooldown_until = time.time() + proxy.cooldown_seconds
            proxy.failures = 0

    def report_success(self, proxy: ProxyConfig):
        """Mark a proxy as successful."""
        proxy.success_count += 1
        proxy.failures = 0


class ProxyRouter:
    """Main proxy router with fallback and rotation."""

    def __init__(self):
        self.pools: Dict[str, ProxyPool] = {
            "default": ProxyPool(strategy="round_robin"),
            "datacenter": ProxyPool(strategy="random"),
            "residential": ProxyPool(strategy="least_used"),
        }
        self.user_agents: List[str] = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        ]
        self.default_headers: Dict[str, str] = {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        }

    def get_headers(self, custom_ua: Optional[str] = None) -> Dict[str, str]:
        """Generate request headers with random user agent."""
        headers = self.default_headers.copy()
        headers["User-Agent"] = custom_ua or random.choice(self.user_agents)
        return headers

    def get_proxy(self, pool_name: str = "default") -> Optional[ProxyConfig]:
        """Get a proxy from the specified pool."""
        pool = self.pools.get(pool_name, self.pools["default"])
        return pool.get_next()

    def report_result(self, proxy: ProxyConfig, success: bool):
        """Report proxy result to update its stats."""
        pool_name = None
        for name, pool in self.pools.items():
            if proxy in pool.proxies:
                pool_name = name
                break

        if success:
            proxy.success_count += 1
            proxy.failures = 0
        else:
            proxy.failures += 1
            if proxy.failures >= proxy.max_failures:
                proxy.cooldown_until = time.time() + proxy.cooldown_seconds
                proxy.failures = 0

    def add_proxy(self, proxy: ProxyConfig, pool_name: str = "default"):
        """Add a proxy to a pool."""
        if pool_name not in self.pools:
            self.pools[pool_name] = ProxyPool(strategy="round_robin")
        self.pools[pool_name].proxies.append(proxy)

    def get_stats(self) -> Dict[str, Any]:
        """Get proxy pool statistics."""
        stats = {}
        for name, pool in self.pools.items():
            proxies = pool.proxies
            if not proxies:
                stats[name] = {"total": 0, "available": 0, "success_rate": 0}
                continue
            total = len(proxies)
            now = time.time()
            available = sum(1 for p in proxies if p.cooldown_until < now)
            total_success = sum(p.success_count for p in proxies)
            total_requests = total_success + sum(p.failures for p in proxies)
            success_rate = (total_success / total_requests * 100) if total_requests > 0 else 0
            stats[name] = {
                "total": total,
                "available": available,
                "success_rate": round(success_rate, 1),
            }
        return stats


# Singleton instance
proxy_router = ProxyRouter()

# Pre-configure some default proxies
DEFAULT_PROXIES = [
    ProxyConfig(url="http://proxy1.example.com:8080", proxy_type=ProxyType.DATACENTER, region="us-east"),
    ProxyConfig(url="http://proxy2.example.com:8080", proxy_type=ProxyType.DATACENTER, region="us-west"),
    ProxyConfig(url="socks5://proxy3.example.com:1080", proxy_type=ProxyType.RESIDENTIAL, region="eu"),
]

for proxy in DEFAULT_PROXIES:
    proxy_router.add_proxy(proxy, "default")


async def fetch_with_retry(
    url: str,
    max_retries: int = 3,
    pool: str = "default",
    timeout: int = 30,
) -> Dict[str, Any]:
    """Fetch a URL with automatic proxy rotation and retry logic."""
    import aiohttp

    last_error = None

    for attempt in range(max_retries):
        proxy = proxy_router.get_proxy(pool)
        headers = proxy_router.get_headers()

        try:
            connector = aiohttp.TCPConnector(ssl=False)
            async with aiohttp.ClientSession(connector=connector) as session:
                proxy_url = proxy.url if proxy else None
                async with session.get(
                    url,
                    headers=headers,
                    proxy=proxy_url,
                    timeout=aiohttp.ClientTimeout(total=timeout),
                ) as response:
                    if response.status == 200:
                        if proxy:
                            proxy_router.report_result(proxy, True)
                        text = await response.text()
                        return {
                            "success": True,
                            "status": response.status,
                            "content": text,
                            "headers": dict(response.headers),
                            "attempt": attempt + 1,
                        }
                    elif response.status in (429, 503):
                        # Rate limited - rotate proxy
                        if proxy:
                            proxy_router.report_result(proxy, False)
                        wait = (attempt + 1) * 2
                        await asyncio.sleep(wait)
                        last_error = f"HTTP {response.status}"
                    else:
                        if proxy:
                            proxy_router.report_result(proxy, False)
                        last_error = f"HTTP {response.status}"

        except Exception as e:
            if proxy:
                proxy_router.report_result(proxy, False)
            last_error = str(e)
            await asyncio.sleep(1 * (attempt + 1))

    return {
        "success": False,
        "error": last_error or "All retries exhausted",
        "attempts": max_retries,
    }
