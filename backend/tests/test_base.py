"""Tests for base scraper module."""

import pytest
from datetime import datetime
from scrapers.base import BaseScraper, ScrapedResult


class TestScrapedResult:
    """Tests for ScrapedResult dataclass."""

    def test_scraped_result_creation(self):
        """Test creating a ScrapedResult instance."""
        result = ScrapedResult(
            url="https://example.com",
            title="Example",
            content="Hello world",
            html="<html><body>Hello world</body></html>",
        )
        assert result.url == "https://example.com"
        assert result.title == "Example"
        assert result.content == "Hello world"
        assert result.status_code == 200
        assert result.error is None
        assert isinstance(result.timestamp, str)

    def test_scraped_result_defaults(self):
        """Test default values for ScrapedResult."""
        result = ScrapedResult(
            url="https://example.com",
            title="Test",
            content="",
            html="",
        )
        assert result.links == []
        assert result.images == []
        assert result.metadata == {}
        assert result.status_code == 200
        assert result.error is None

    def test_scraped_result_to_dict(self):
        """Test converting ScrapedResult to dictionary."""
        result = ScrapedResult(
            url="https://example.com",
            title="Example",
            content="Content",
            html="<html></html>",
            links=["https://example.com/link1"],
            images=["https://example.com/img.png"],
            metadata={"author": "Test"},
            status_code=200,
        )
        d = result.to_dict()
        assert isinstance(d, dict)
        assert d["url"] == "https://example.com"
        assert d["title"] == "Example"
        assert d["links"] == ["https://example.com/link1"]
        assert d["images"] == ["https://example.com/img.png"]
        assert d["metadata"] == {"author": "Test"}
        assert "timestamp" in d

    def test_scraped_result_with_error(self):
        """Test ScrapedResult with error."""
        result = ScrapedResult(
            url="https://example.com",
            title="",
            content="",
            html="",
            error="Connection failed",
            status_code=500,
        )
        assert result.error == "Connection failed"
        assert result.status_code == 500

    def test_scraped_result_timestamp_is_iso(self):
        """Test that timestamp is in ISO format."""
        result = ScrapedResult(
            url="https://example.com",
            title="Test",
            content="",
            html="",
        )
        # Should not raise an exception
        datetime.fromisoformat(result.timestamp)


class TestBaseScraper:
    """Tests for BaseScraper abstract class."""

    def test_validate_url_valid(self):
        """Test URL validation with valid URLs."""
        class ConcreteScraper(BaseScraper):
            def scrape(self, url): pass
            def scrape_multiple(self, urls): pass

        scraper = ConcreteScraper()
        assert scraper.validate_url("https://example.com") is True
        assert scraper.validate_url("http://example.com") is True
        assert scraper.validate_url("https://example.com/path") is True
        assert scraper.validate_url("https://example.com/path?query=1") is True
        assert scraper.validate_url("https://sub.example.com") is True

    def test_validate_url_invalid(self):
        """Test URL validation with invalid URLs."""
        class ConcreteScraper(BaseScraper):
            def scrape(self, url): pass
            def scrape_multiple(self, urls): pass

        scraper = ConcreteScraper()
        assert scraper.validate_url("not-a-url") is False
        assert scraper.validate_url("ftp://example.com") is False
        assert scraper.validate_url("") is False
        assert scraper.validate_url("example.com") is False

    def test_base_scraper_defaults(self):
        """Test default values for BaseScraper."""
        class ConcreteScraper(BaseScraper):
            def scrape(self, url): pass
            def scrape_multiple(self, urls): pass

        scraper = ConcreteScraper()
        assert scraper.timeout == 30
        assert scraper.headers == {}

    def test_base_scraper_custom_init(self):
        """Test BaseScraper with custom initialization."""
        class ConcreteScraper(BaseScraper):
            def scrape(self, url): pass
            def scrape_multiple(self, urls): pass

        scraper = ConcreteScraper(timeout=60, headers={"X-Custom": "value"})
        assert scraper.timeout == 60
        assert scraper.headers == {"X-Custom": "value"}
