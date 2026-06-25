"""Basic HTTP scraper using requests library."""

import requests
from typing import List, Optional
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup

from .base import BaseScraper, ScrapedResult


class RequestsScraper(BaseScraper):
    """Basic scraper using requests library for simple HTML pages."""

    def __init__(self, timeout: int = 30, headers: Optional[dict] = None):
        super().__init__(timeout, headers)
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate",
            "Connection": "keep-alive",
        })
        if headers:
            self.session.headers.update(headers)

    def scrape(self, url: str) -> ScrapedResult:
        """Scrape a single URL."""
        if not self.validate_url(url):
            return ScrapedResult(
                url=url,
                title="",
                content="",
                html="",
                error="Invalid URL format",
                status_code=400,
            )

        try:
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            html = response.text

            # Parse with BeautifulSoup
            soup = BeautifulSoup(html, "html.parser")

            # Extract title
            title = soup.title.string if soup.title else ""

            # Extract text content
            content = soup.get_text(separator="\n", strip=True)

            # Extract links
            base_domain = urlparse(url).netloc
            links = []
            for a in soup.find_all("a", href=True):
                href = urljoin(url, a["href"])
                if base_domain in href or href.startswith("/"):
                    links.append(href)

            # Extract images
            images = []
            for img in soup.find_all("img", src=True):
                img_src = urljoin(url, img["src"])
                images.append(img_src)

            # Extract metadata
            metadata = {}
            meta_tags = soup.find_all("meta")
            for meta in meta_tags:
                if meta.get("name") and meta.get("content"):
                    metadata[meta["name"]] = meta["content"]
                elif meta.get("property") and meta.get("content"):
                    metadata[meta["property"]] = meta["content"]

            return ScrapedResult(
                url=url,
                title=title or "",
                content=content[:10000],  # Limit content size
                html=html,
                links=list(set(links))[:100],  # Dedupe and limit
                images=list(set(images))[:50],
                metadata=metadata,
                status_code=response.status_code,
            )

        except requests.exceptions.Timeout:
            return ScrapedResult(
                url=url,
                title="",
                content="",
                html="",
                error="Request timed out",
                status_code=408,
            )
        except requests.exceptions.RequestException as e:
            return ScrapedResult(
                url=url,
                title="",
                content="",
                html="",
                error=str(e),
                status_code=500,
            )

    def scrape_multiple(self, urls: List[str]) -> List[ScrapedResult]:
        """Scrape multiple URLs."""
        return [self.scrape(url) for url in urls]