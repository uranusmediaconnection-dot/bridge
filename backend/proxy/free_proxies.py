"""Free proxy rotation: auto-fetch, validate, and rotate free proxy lists."""

import time
import random
from typing import List, Optional, Dict
from dataclasses import dataclass, field
from datetime import datetime, timedelta

try:
    import httpx
except ImportError:
    import requests as httpx


@dataclass
class ProxyInfo:
    """Proxy configuration with health tracking."""
    host: str
    port: int
    protocol: str = "http"
    username: Optional[str] = None
    password: Optional[str] = None
    country: str = "unknown"
    last_used: float = 0
    fail_count: int = 0
    success_count: int = 0

    @property
    def url(self) -> str:
        if self.username:
            return f"{self.protocol}://{self.username}:{self.password}@{self.host}:{self.port}"
        return f"{self.protocol}://{self.host}:{self.port}"

    @property
    def success_rate(self) -> float:
        total = self.success_count + self.fail_count
        return self.success_count / total if total > 0 else 1.0


class FreeProxyPool:
    """Auto-fetching, validating, and rotating free proxy pool.

    Sources:
    - GitHub maintained proxy lists (monosans, TheSpeedX)
    - ProxyScrape API
    """

    FREE_PROXY_SOURCES = [
        "https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt",
        "https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/socks5.txt",
        "https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/http.txt",
        "https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/socks5.txt",
    ]

    def __init__(self):
        self.proxies: List[ProxyInfo] = []
        self.blacklist_duration = timedelta(minutes=5)
        self.last_refresh: Optional[datetime] = None

    def add_proxies_from_file(self, filepath: str):
        """Load proxies from file (one per line: host:port or user:pass@host:port)."""
        try:
            with open(filepath) as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue

                    if "@" in line:
                        auth, host_port = line.rsplit("@", 1)
                        user, password = auth.split(":", 1)
                        host, port = host_port.split(":", 1)
                        self.proxies.append(ProxyInfo(
                            host=host, port=int(port),
                            username=user, password=password,
                        ))
                    elif ":" in line:
                        host, port = line.split(":", 1)
                        self.proxies.append(ProxyInfo(host=host, port=int(port)))
        except FileNotFoundError:
            pass

    def refresh_from_web(self) -> int:
        """Fetch fresh proxy lists from GitHub sources."""
        new_count = 0
        existing = {(p.host, p.port) for p in self.proxies}

        try:
            client = httpx.Client(timeout=15) if hasattr(httpx, "Client") else httpx.Session()
            for url in self.FREE_PROXY_SOURCES:
                try:
                    resp = client.get(url)
                    text = resp.text if hasattr(resp, "text") else resp.content.decode()

                    for line in text.strip().split("\n"):
                        line = line.strip()
                        if not line or line.startswith("#"):
                            continue
                        if ":" not in line:
                            continue

                        parts = line.split(":", 1)
                        if len(parts) != 2:
                            continue

                        host, port = parts
                        try:
                            port = int(port)
                        except ValueError:
                            continue

                        if (host, port) not in existing:
                            protocol = "socks5" if "socks" in url else "http"
                            self.proxies.append(ProxyInfo(
                                host=host, port=port, protocol=protocol
                            ))
                            existing.add((host, port))
                            new_count += 1
                except Exception:
                    continue

            self.last_refresh = datetime.now()
        except Exception:
            pass

        return new_count

    def get_proxy(self, protocol: str = "http") -> Optional[ProxyInfo]:
        """Get best available proxy (highest success rate, least recently used)."""
        now = time.time()

        # Filter to available proxies
        candidates = [
            p for p in self.proxies
            if p.protocol == protocol and (
                p.fail_count < 5 or
                (now - p.last_used) > self.blacklist_duration.total_seconds()
            )
        ]

        # Reset fail counts if all blacklisted
        if not candidates:
            for p in self.proxies:
                p.fail_count = 0
            candidates = [p for p in self.proxies if p.protocol == protocol]

        if not candidates:
            return None

        # Weighted selection: prefer higher success rate + less recently used
        def score(proxy: ProxyInfo) -> float:
            age = now - proxy.last_used
            return proxy.success_rate * 0.7 + min(age / 60, 1.0) * 0.3

        candidates.sort(key=score, reverse=True)
        selected = candidates[0]
        selected.last_used = now
        return selected

    def report_success(self, proxy: ProxyInfo):
        """Mark proxy as successful."""
        proxy.success_count += 1

    def report_failure(self, proxy: ProxyInfo):
        """Mark proxy as failed."""
        proxy.fail_count += 1

    def get_random_proxy(self) -> Optional[ProxyInfo]:
        """Get a random proxy (faster but less intelligent)."""
        if not self.proxies:
            return None
        return random.choice(self.proxies)

    @property
    def stats(self) -> Dict:
        """Get proxy pool statistics."""
        active = [p for p in self.proxies if p.fail_count < 5]
        return {
            "total": len(self.proxies),
            "active": len(active),
            "avg_success_rate": (
                sum(p.success_rate for p in self.proxies) / len(self.proxies)
                if self.proxies else 0
            ),
            "last_refresh": self.last_refresh.isoformat() if self.last_refresh else None,
        }


# Global proxy pool instance
proxy_pool = FreeProxyPool()
