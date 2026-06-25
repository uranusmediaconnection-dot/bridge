"""Tests for search engines."""

import pytest
from unittest.mock import patch, MagicMock
from search.search_engines import (
    GoogleScraper,
    BingScraper,
    DuckDuckGoScraper,
    SearchService,
)


class TestGoogleScraper:
    """Tests for GoogleScraper."""

    def test_init(self):
        """Test initialization."""
        scraper = GoogleScraper(timeout=30)
        assert scraper.timeout == 30
        assert scraper.BASE_URL == "https://www.google.com/search"

    @patch("search.search_engines.requests.Session.get")
    def test_search_success(self, mock_get):
        """Test successful search."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = """
        <html>
        <body>
            <div class="g">
                <h3>Result 1</h3>
                <a href="https://example.com/1">Link</a>
                <div class="-snippet">Snippet 1</div>
            </div>
            <div class="g">
                <h3>Result 2</h3>
                <a href="https://example.com/2">Link</a>
                <div class="-snippet">Snippet 2</div>
            </div>
        </body>
        </html>
        """
        mock_get.return_value = mock_response

        scraper = GoogleScraper()
        results = scraper.search("test query", num_results=2)

        assert len(results) == 2
        assert results[0]["title"] == "Result 1"
        assert results[0]["engine"] == "google"

    @patch("search.search_engines.requests.Session.get")
    def test_search_error(self, mock_get):
        """Test search with error."""
        mock_get.side_effect = Exception("Network error")

        scraper = GoogleScraper()
        results = scraper.search("test")
        assert len(results) == 1
        assert "error" in results[0]
        assert results[0]["engine"] == "google"


class TestBingScraper:
    """Tests for BingScraper."""

    def test_init(self):
        """Test initialization."""
        scraper = BingScraper()
        assert scraper.BASE_URL == "https://www.bing.com/search"

    @patch("search.search_engines.requests.Session.get")
    def test_search_success(self, mock_get):
        """Test successful search."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = """
        <html>
        <body>
            <li class="b_algo">
                <h2>Bing Result</h2>
                <a href="https://example.com/bing">Link</a>
                <p>Bing snippet</p>
            </li>
        </body>
        </html>
        """
        mock_get.return_value = mock_response

        scraper = BingScraper()
        results = scraper.search("test")
        assert len(results) == 1
        assert results[0]["title"] == "Bing Result"
        assert results[0]["engine"] == "bing"


class TestDuckDuckGoScraper:
    """Tests for DuckDuckGoScraper."""

    def test_init(self):
        """Test initialization."""
        scraper = DuckDuckGoScraper()
        assert scraper.BASE_URL == "https://html.duckduckgo.com/html"

    @patch("search.search_engines.requests.Session.post")
    def test_search_success(self, mock_post):
        """Test successful search."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = """
        <html>
        <body>
            <div class="result">
                <a class="result__title" href="https://example.com/ddg">DDG Result</a>
                <a class="result__snippet">DDG snippet</a>
            </div>
        </body>
        </html>
        """
        mock_post.return_value = mock_response

        scraper = DuckDuckGoScraper()
        results = scraper.search("test")
        assert len(results) == 1
        assert results[0]["title"] == "DDG Result"
        assert results[0]["engine"] == "duckduckgo"


class TestSearchService:
    """Tests for SearchService."""

    def test_init(self):
        """Test initialization."""
        service = SearchService()
        assert "google" in service.engines
        assert "bing" in service.engines
        assert "duckduckgo" in service.engines

    @patch.object(GoogleScraper, "search")
    def test_search_specific_engine(self, mock_search):
        """Test searching with specific engine."""
        mock_search.return_value = [{"title": "Test", "url": "https://example.com"}]

        service = SearchService()
        results = service.search("test", engine="google")
        mock_search.assert_called_once()
        assert len(results) == 1

    def test_search_unknown_engine(self):
        """Test searching with unknown engine."""
        service = SearchService()
        results = service.search("test", engine="unknown")
        assert len(results) == 1
        assert "error" in results[0]

    @patch.object(GoogleScraper, "search")
    @patch.object(BingScraper, "search")
    @patch.object(DuckDuckGoScraper, "search")
    def test_search_all(self, mock_ddg, mock_bing, mock_google):
        """Test searching all engines."""
        mock_google.return_value = [{"title": "Google"}]
        mock_bing.return_value = [{"title": "Bing"}]
        mock_ddg.return_value = [{"title": "DDG"}]

        service = SearchService()
        results = service.search_all("test")

        assert "google" in results
        assert "bing" in results
        assert "duckduckgo" in results
