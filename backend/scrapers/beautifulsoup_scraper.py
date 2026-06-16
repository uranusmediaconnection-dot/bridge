"""Advanced scraper using BeautifulSoup for detailed HTML parsing."""

import requests
from typing import List, Optional, Dict, Any
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup, Tag
import re

from .base import BaseScraper, ScrapedResult


class BeautifulSoupScraper(BaseScraper):
    """Advanced scraper with BeautifulSoup for detailed parsing."""

    def __init__(self, timeout: int = 30, headers: Optional[dict] = None, parser: str = "html.parser"):
        super().__init__(timeout, headers)
        self.parser = parser
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        })
        if headers:
            self.session.headers.update(headers)

    def scrape(self, url: str) -> ScrapedResult:
        """Scrape a single URL with detailed parsing."""
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

            soup = BeautifulSoup(html, self.parser)

            # Extract title
            title = self._extract_title(soup)

            # Extract structured content
            content = self._extract_content(soup)

            # Extract links with context
            links = self._extract_links(soup, url)

            # Extract images with alt text
            images = self._extract_images(soup, url)

            # Extract metadata
            metadata = self._extract_metadata(soup)

            # Extract tables
            tables = self._extract_tables(soup)
            if tables:
                metadata["tables"] = tables

            # Extract headings structure
            headings = self._extract_headings(soup)
            if headings:
                metadata["headings"] = headings

            return ScrapedResult(
                url=url,
                title=title,
                content=content,
                html=html,
                links=links,
                images=images,
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

    def _extract_title(self, soup: BeautifulSoup) -> str:
        """Extract page title."""
        # Try various title locations
        if soup.title and soup.title.string:
            return soup.title.string.strip()

        # Try h1
        h1 = soup.find("h1")
        if h1:
            return h1.get_text(strip=True)

        # Try og:title
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            return og_title["content"]

        return ""

    def _extract_content(self, soup: BeautifulSoup) -> str:
        """Extract main text content."""
        # Remove script and style tags
        for tag in soup(["script", "style", "noscript", "iframe"]):
            tag.decompose()

        # Try to find main content area
        main = soup.find("main") or soup.find("article") or soup.find("div", class_=re.compile(r"content|main|article", re.I))

        if main:
            text = main.get_text(separator="\n", strip=True)
        else:
            # Get all text
            text = soup.get_text(separator="\n", strip=True)

        # Clean up whitespace
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        return "\n".join(lines)[:15000]

    def _extract_links(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Extract links with context."""
        links = []
        base_domain = urlparse(base_url).netloc

        for a in soup.find_all("a", href=True):
            href = urljoin(base_url, a["href"])
            # Keep internal and relevant external links
            if urlparse(href).netloc == base_domain or href.startswith("/"):
                links.append(href)

        return list(set(links))[:100]

    def _extract_images(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Extract images with sources."""
        images = []

        for img in soup.find_all("img"):
            src = img.get("src") or img.get("data-src")
            if src:
                images.append(urljoin(base_url, src))

        return list(set(images))[:50]

    def _extract_metadata(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract metadata."""
        metadata = {}

        for meta in soup.find_all("meta"):
            name = meta.get("name") or meta.get("property")
            content = meta.get("content")
            if name and content:
                metadata[name] = content

        # Extract author
        author = soup.find("meta", attrs={"name": "author"})
        if author and author.get("content"):
            metadata["author"] = author["content"]

        # Extract description
        desc = soup.find("meta", attrs={"name": "description"})
        if desc and desc.get("content"):
            metadata["description"] = desc["content"]

        return metadata

    def _extract_tables(self, soup: BeautifulSoup) -> List[List[List[str]]]:
        """Extract all tables."""
        tables = []
        for table in soup.find_all("table"):
            table_data = []
            for row in table.find_all("tr"):
                row_data = []
                for cell in row.find_all(["td", "th"]):
                    row_data.append(cell.get_text(strip=True))
                if row_data:
                    table_data.append(row_data)
            if table_data:
                tables.append(table_data)
        return tables

    def _extract_headings(self, soup: BeautifulSoup) -> List[Dict[str, str]]:
        """Extract heading structure."""
        headings = []
        for i in range(1, 7):
            for h in soup.find_all(f"h{i}"):
                headings.append({
                    "level": i,
                    "text": h.get_text(strip=True),
                    "id": h.get("id", ""),
                })
        return headings

    def scrape_multiple(self, urls: List[str]) -> List[ScrapedResult]:
        """Scrape multiple URLs."""
        return [self.scrape(url) for url in urls]

    def search_content(self, html: str, pattern: str) -> List[str]:
        """Search for pattern in HTML content."""
        soup = BeautifulSoup(html, self.parser)
        text = soup.get_text()
        matches = re.findall(pattern, text, re.IGNORECASE)
        return matches

    def extract_data_attribute(self, html: str, attr_name: str) -> List[str]:
        """Extract data attributes."""
        soup = BeautifulSoup(html, self.parser)
        results = []
        for tag in soup.find_all(attrs={attr_name: True}):
            results.append(tag[attr_name])
        return results