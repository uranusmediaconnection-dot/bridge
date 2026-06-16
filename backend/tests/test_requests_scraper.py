"""Tests for requests scraper."""

import pytest
from unittest.mock import patch, MagicMock
from scrapers.requests_scraper import RequestsScraper


class TestRequestsScraper:
    """Tests for RequestsScraper."""

    def test_init_defaults(self):
        """Test default initialization."""
        scraper = RequestsScraper()
        assert scraper.timeout == 30
        assert "User-Agent" in scraper.session.headers

    def test_init_custom(self):
        """Test custom initialization."""
        scraper = RequestsScraper(timeout=60, headers={"X-Custom": "value"})
        assert scraper.timeout == 60
        assert scraper.session.headers.get("X-Custom") == "value"

    def test_scrape_invalid_url(self):
        """Test scraping with invalid URL."""
        scraper = RequestsScraper()
        result = scraper.scrape("not-a-url")
        assert result.error == "Invalid URL format"
        assert result.status_code == 400

    @patch("scrapers.requests_scraper.requests.Session.get")
    def test_scrape_success(self, mock_get):
        """Test successful scraping."""
        # Mock response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = """
        <html>
        <head><title>Test Page</title></head>
        <body>
            <h1>Hello World</h1>
            <a href="/link1">Link 1</a>
            <a href="https://example.com/link2">Link 2</a>
            <img src="/image.png">
            <meta name="description" content="Test description">
        </body>
        </html>
        """
        mock_get.return_value = mock_response

        scraper = RequestsScraper()
        result = scraper.scrape("https://example.com")

        assert result.success is not None or result.error is None
        assert result.url == "https://example.com"
        assert result.title == "Test Page"
        assert result.status_code == 200
        assert "Hello World" in result.content
        assert len(result.links) >= 1
        assert len(result.images) >= 1
        assert result.metadata.get("description") == "Test description"

    @patch("scrapers.requests_scraper.requests.Session.get")
    def test_scrape_timeout(self, mock_get):
        """Test scraping with timeout."""
        import requests
        mock_get.side_effect = requests.exceptions.Timeout()

        scraper = RequestsScraper()
        result = scraper.scrape("https://example.com")

        assert result.error == "Request timed out"
        assert result.status_code == 408

    @patch("scrapers.requests_scraper.requests.Session.get")
    def test_scrape_request_exception(self, mock_get):
        """Test scraping with request exception."""
        import requests
        mock_get.side_effect = requests.exceptions.ConnectionError("Failed")

        scraper = RequestsScraper()
        result = scraper.scrape("https://example.com")

        assert result.error is not None
        assert result.status_code == 500

    @patch("scrapers.requests_scraper.requests.Session.get")
    def test_scrape_multiple(self, mock_get):
        """Test scraping multiple URLs."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = "<html><head><title>Test</title></head><body>Content</body></html>"
        mock_get.return_value = mock_response

        scraper = RequestsScraper()
        urls = ["https://example.com/1", "https://example.com/2"]
        results = scraper.scrape_multiple(urls)

        assert len(results) == 2
        for r in results:
            assert r.status_code == 200
