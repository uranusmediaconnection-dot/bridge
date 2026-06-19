"""Stealth scraper using curl-cffi with TLS fingerprint impersonation."""

import random
from typing import Optional, Dict, List
from .base import BaseScraper, ScrapedResult
from ..core.anti_detection import get_random_headers

try:
    from curl_cffi import requests as cffi_requests
    HAS_CURL_CFFI = True
except ImportError:
    HAS_CURL_CFFI = False

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

from bs4 import BeautifulSoup


class StealthScraper(BaseScraper):
    """Production-grade scraper using curl-cffi for TLS fingerprint impersonation.

    This is the most important anti-detection technique in 2026.
    curl-cffi impersonates real browser TLS/JA3/JA4 fingerprints,
    making requests appear to come from a real browser at the protocol level.
    """

    # Supported browser impersonations
    BROWSER_IMPERSONATIONS = [
        "chrome131", "chrome130", "chrome124", "chrome120",
        "safari17_0", "safari15_5",
        "firefox133",
    ]

    def __init__(self, timeout: int = 30, use_proxy: bool = False):
        super().__init__(timeout)
        self.use_proxy = use_proxy
        self._session = None

    def _get_session(self):
        """Get or create a curl-cffi session with random impersonation."""
        if not HAS_CURL_CFFI:
            if HAS_REQUESTS:
                return requests.Session()
            raise RuntimeError("Neither curl-cffi nor requests is installed")

        impersonation = random.choice(self.BROWSER_IMPERSONATIONS)
        session = cffi_requests.Session(impersonate=impersonation)
        return session

    def scrape(self, url: str, proxy: Optional[str] = None) -> ScrapedResult:
        """Scrape a URL with TLS fingerprint impersonation."""
        if not self.validate_url(url):
            return ScrapedResult(
                url=url, title="", content="", html="",
                error="Invalid URL format", status_code=400,
            )

        session = self._get_session()
        try:
            headers = get_random_headers()
            proxies = {"https": proxy, "http": proxy} if proxy else None

            response = session.get(
                url,
                headers=headers,
                timeout=self.timeout,
                proxies=proxies,
                allow_redirects=True,
            )

            if response.status_code == 200:
                html = response.text
                soup = BeautifulSoup(html, "html.parser")

                title = self._extract_title(soup)
                content = self._extract_content(soup)
                links = self._extract_links(soup, url)
                images = self._extract_images(soup, url)
                metadata = self._extract_metadata(soup)

                return ScrapedResult(
                    url=url,
                    title=title,
                    content=content,
                    html=html,
                    links=links,
                    images=images,
                    metadata=metadata,
                    status_code=200,
                )
            else:
                return ScrapedResult(
                    url=url, title="", content="", html="",
                    error=f"HTTP {response.status_code}",
                    status_code=response.status_code,
                )

        except Exception as e:
            return ScrapedResult(
                url=url, title="", content="", html="",
                error=str(e), status_code=500,
            )

    def scrape_with_retry(self, url: str, proxy: Optional[str] = None, max_retries: int = 3) -> ScrapedResult:
        """Scrape with exponential backoff retry."""
        import time

        for attempt in range(max_retries):
            result = self.scrape(url, proxy=proxy)

            if result.error is None:
                return result

            if result.status_code in (403, 429, 503):
                wait = (2 ** attempt) * 2 + random.uniform(0, 1)
                time.sleep(wait)
                # Create new session with different fingerprint
                self._session = None
                continue

            return result

        return result

    def scrape_multiple(self, urls: List[str], proxy: Optional[str] = None) -> List[ScrapedResult]:
        """Scrape multiple URLs with stealth."""
        import time
        results = []
        for url in urls:
            result = self.scrape(url, proxy=proxy)
            results.append(result)
            # Polite delay between requests
            time.sleep(random.uniform(0.5, 2.0))
        return results

    @staticmethod
    def _extract_title(soup: BeautifulSoup) -> str:
        if soup.title and soup.title.string:
            return soup.title.string.strip()
        h1 = soup.find("h1")
        if h1:
            return h1.get_text(strip=True)
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            return og_title["content"]
        return ""

    @staticmethod
    def _extract_content(soup: BeautifulSoup) -> str:
        for tag in soup(["script", "style", "noscript", "iframe"]):
            tag.decompose()
        main = soup.find("main") or soup.find("article")
        text = main.get_text(separator="\n", strip=True) if main else soup.get_text(separator="\n", strip=True)
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        return "\n".join(lines)[:15000]

    @staticmethod
    def _extract_links(soup: BeautifulSoup, base_url: str) -> List[str]:
        from urllib.parse import urljoin, urlparse
        links = []
        base_domain = urlparse(base_url).netloc
        for a in soup.find_all("a", href=True):
            href = urljoin(base_url, a["href"])
            if urlparse(href).netloc == base_domain:
                links.append(href)
        return list(set(links))[:100]

    @staticmethod
    def _extract_images(soup: BeautifulSoup, base_url: str) -> List[str]:
        from urllib.parse import urljoin
        images = []
        for img in soup.find_all("img"):
            src = img.get("src") or img.get("data-src")
            if src:
                images.append(urljoin(base_url, src))
        return list(set(images))[:50]

    @staticmethod
    def _extract_metadata(soup: BeautifulSoup) -> Dict:
        metadata = {}
        for meta in soup.find_all("meta"):
            name = meta.get("name") or meta.get("property")
            content = meta.get("content")
            if name and content:
                metadata[name] = content
        return metadata
