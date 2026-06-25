"""Tests for FastAPI main application."""

import sys
import os
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app
from backend.scrapers.base import ScrapedResult


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


class TestRootEndpoint:
    """Tests for root endpoint."""

    def test_root(self, client):
        """Test root endpoint returns API info."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Web Scraper API"
        assert data["version"] == "2.0.0"
        assert "endpoints" in data


class TestHealthEndpoint:
    """Tests for health endpoint."""

    def test_health(self, client):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestScrapeEndpoint:
    """Tests for scrape endpoint."""

    @patch("backend.main.requests_scraper.scrape")
    def test_scrape_requests(self, mock_scrape, client):
        """Test scraping with requests scraper."""
        mock_result = ScrapedResult(
            url="https://example.com",
            title="Test",
            content="Content",
            html="<html></html>",
            status_code=200,
        )
        mock_scrape.return_value = mock_result

        response = client.post("/scrape", json={
            "url": "https://example.com",
            "scraper": "requests",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["title"] == "Test"

    @patch("backend.main.beautifulsoup_scraper.scrape")
    def test_scrape_beautifulsoup(self, mock_scrape, client):
        """Test scraping with beautifulsoup scraper."""
        mock_result = ScrapedResult(
            url="https://example.com",
            title="BS4 Test",
            content="Content",
            html="<html></html>",
            status_code=200,
        )
        mock_scrape.return_value = mock_result

        response = client.post("/scrape", json={
            "url": "https://example.com",
            "scraper": "beautifulsoup",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    @patch("backend.main.selenium_scraper.scrape")
    def test_scrape_selenium(self, mock_scrape, client):
        """Test scraping with selenium scraper."""
        mock_result = ScrapedResult(
            url="https://example.com",
            title="Selenium Test",
            content="Content",
            html="<html></html>",
            status_code=200,
        )
        mock_scrape.return_value = mock_result

        response = client.post("/scrape", json={
            "url": "https://example.com",
            "scraper": "selenium",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_scrape_unknown_scraper(self, client):
        """Test scraping with unknown scraper type."""
        response = client.post("/scrape", json={
            "url": "https://example.com",
            "scraper": "unknown",
        })
        assert response.status_code == 400

    @patch("backend.main.requests_scraper.scrape")
    def test_scrape_with_error(self, mock_scrape, client):
        """Test scraping that returns an error."""
        mock_result = ScrapedResult(
            url="https://example.com",
            title="",
            content="",
            html="",
            error="Connection failed",
            status_code=500,
        )
        mock_scrape.return_value = mock_result

        response = client.post("/scrape", json={
            "url": "https://example.com",
            "scraper": "requests",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert data["error"] == "Connection failed"

    @patch("backend.main.requests_scraper.scrape")
    def test_scrape_with_timeout(self, mock_scrape, client):
        """Test scraping with custom timeout."""
        mock_result = ScrapedResult(
            url="https://example.com",
            title="Test",
            content="Content",
            html="<html></html>",
        )
        mock_scrape.return_value = mock_result

        response = client.post("/scrape", json={
            "url": "https://example.com",
            "scraper": "requests",
            "timeout": 60,
        })
        assert response.status_code == 200
        mock_scrape.assert_called_once_with("https://example.com")

    @patch("backend.main.requests_scraper.scrape")
    def test_scrape_exception(self, mock_scrape, client):
        """Test scrape endpoint handling exceptions."""
        mock_scrape.side_effect = Exception("Unexpected error")

        response = client.post("/scrape", json={
            "url": "https://example.com",
            "scraper": "requests",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "Unexpected error" in data["error"]


class TestSearchEndpoint:
    """Tests for search endpoint."""

    @patch("backend.main.search_service.search")
    def test_search_success(self, mock_search, client):
        """Test successful search."""
        mock_search.return_value = [
            {"title": "Result 1", "url": "https://example.com/1", "snippet": "Snippet", "engine": "google"}
        ]

        response = client.post("/search", json={
            "query": "test query",
            "engine": "google",
            "num_results": 10,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["results"]) == 1

    @patch("backend.main.search_service.search")
    def test_search_with_error(self, mock_search, client):
        """Test search with error."""
        mock_search.side_effect = Exception("Search failed")

        response = client.post("/search", json={
            "query": "test",
            "engine": "google",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "Search failed" in data["error"]

    @patch("backend.main.search_service.search_all")
    def test_search_all(self, mock_search_all, client):
        """Test search all engines."""
        mock_search_all.return_value = {
            "google": [{"title": "G"}],
            "bing": [{"title": "B"}],
            "duckduckgo": [{"title": "D"}],
        }

        response = client.get("/search/all", params={"query": "test", "num_results": 10})
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "google" in data["results"]

    @patch("backend.main.search_service.search_all")
    def test_search_all_error(self, mock_search_all, client):
        """Test search all with error."""
        mock_search_all.side_effect = Exception("All failed")

        response = client.get("/search/all", params={"query": "test"})
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False