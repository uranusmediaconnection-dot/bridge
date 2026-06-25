"""Base scraper interface."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional, Dict, List, Any
from datetime import datetime


@dataclass
class ScrapedResult:
    """Result from a scraping operation."""
    url: str
    title: str
    content: str
    html: str
    links: List[str] = field(default_factory=list)
    images: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    status_code: int = 200
    error: Optional[str] = None
    success: bool = True

    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "url": self.url,
            "title": self.title,
            "content": self.content,
            "html": self.html,
            "links": self.links,
            "images": self.images,
            "metadata": self.metadata,
            "status_code": self.status_code,
            "error": self.error,
            "timestamp": self.timestamp,
        }


class BaseScraper(ABC):
    """Abstract base class for all scrapers."""

    def __init__(self, timeout: int = 30, headers: Optional[Dict[str, str]] = None):
        self.timeout = timeout
        self.headers = headers or {}

    @abstractmethod
    def scrape(self, url: str) -> ScrapedResult:
        """Scrape a URL and return results."""
        pass

    @abstractmethod
    def scrape_multiple(self, urls: List[str]) -> List[ScrapedResult]:
        """Scrape multiple URLs."""
        pass

    def validate_url(self, url: str) -> bool:
        """Validate a URL."""
        import re
        pattern = r'^https?://[^\s/$.?#].[^\s]*$'
        return bool(re.match(pattern, url))