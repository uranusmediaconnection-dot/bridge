"""Tests for BeautifulSoup scraper."""

import pytest
from unittest.mock import patch, MagicMock
from scrapers.beautifulsoup_scraper import BeautifulSoupScraper


class TestBeautifulSoupScraper:
    """Tests for BeautifulSoupScraper."""

    def test_init_defaults(self):
        """Test default initialization."""
        scraper = BeautifulSoupScraper()
        assert scraper.timeout == 30
        assert scraper.parser == "html.parser"

    def test_init_custom(self):
        """Test custom initialization."""
        scraper = BeautifulSoupScraper(timeout=60, parser="lxml")
        assert scraper.timeout == 60
        assert scraper.parser == "lxml"

    def test_scrape_invalid_url(self):
        """Test scraping with invalid URL."""
        scraper = BeautifulSoupScraper()
        result = scraper.scrape("invalid-url")
        assert result.error == "Invalid URL format"
        assert result.status_code == 400

    @patch("scrapers.beautifulsoup_scraper.requests.Session.get")
    def test_scrape_success(self, mock_get):
        """Test successful scraping with detailed parsing."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = """
        <html>
        <head>
            <title>Test Page</title>
            <meta name="author" content="John Doe">
            <meta name="description" content="A test page">
            <meta property="og:title" content="OG Title">
        </head>
        <body>
            <main>
                <h1>Main Heading</h1>
                <p>Some content here.</p>
                <h2>Subheading</h2>
                <p>More content.</p>
            </main>
            <a href="/internal">Internal</a>
            <a href="https://example.com/external">External</a>
            <img src="/image1.png" alt="Image 1">
            <img src="https://example.com/image2.png">
            <table>
                <tr><th>Name</th><th>Value</th></tr>
                <tr><td>Test</td><td>123</td></tr>
            </table>
        </body>
        </html>
        """
        mock_get.return_value = mock_response

        scraper = BeautifulSoupScraper()
        result = scraper.scrape("https://example.com")

        assert result.url == "https://example.com"
        assert result.title == "Test Page"
        assert result.status_code == 200
        assert "Main Heading" in result.content
        assert len(result.links) >= 1
        assert len(result.images) >= 1
        assert result.metadata.get("author") == "John Doe"
        assert result.metadata.get("description") == "A test page"

    @patch("scrapers.beautifulsoup_scraper.requests.Session.get")
    def test_extract_title_fallbacks(self, mock_get):
        """Test title extraction fallbacks."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        # No <title> tag, but has <h1>
        mock_response.text = "<html><body><h1>H1 Title</h1></body></html>"
        mock_get.return_value = mock_response

        scraper = BeautifulSoupScraper()
        result = scraper.scrape("https://example.com")
        assert result.title == "H1 Title"

    @patch("scrapers.beautifulsoup_scraper.requests.Session.get")
    def test_extract_title_og(self, mock_get):
        """Test title extraction from og:title."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = """
        <html>
        <head><meta property="og:title" content="OG Title"></head>
        <body></body>
        </html>
        """
        mock_get.return_value = mock_response

        scraper = BeautifulSoupScraper()
        result = scraper.scrape("https://example.com")
        assert result.title == "OG Title"

    @patch("scrapers.beautifulsoup_scraper.requests.Session.get")
    def test_extract_tables(self, mock_get):
        """Test table extraction."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = """
        <html>
        <body>
            <table>
                <tr><th>A</th><th>B</th></tr>
                <tr><td>1</td><td>2</td></tr>
            </table>
        </body>
        </html>
        """
        mock_get.return_value = mock_response

        scraper = BeautifulSoupScraper()
        result = scraper.scrape("https://example.com")
        assert "tables" in result.metadata
        assert len(result.metadata["tables"]) == 1
        assert result.metadata["tables"][0] == [["A", "B"], ["1", "2"]]

    @patch("scrapers.beautifulsoup_scraper.requests.Session.get")
    def test_extract_headings(self, mock_get):
        """Test heading extraction."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = """
        <html>
        <body>
            <h1 id="main">Main</h1>
            <h2>Sub</h2>
            <h3>Subsub</h3>
        </body>
        </html>
        """
        mock_get.return_value = mock_response

        scraper = BeautifulSoupScraper()
        result = scraper.scrape("https://example.com")
        assert "headings" in result.metadata
        headings = result.metadata["headings"]
        assert len(headings) == 3
        assert headings[0]["level"] == 1
        assert headings[0]["text"] == "Main"
        assert headings[0]["id"] == "main"

    @patch("scrapers.beautifulsoup_scraper.requests.Session.get")
    def test_scrape_timeout(self, mock_get):
        """Test scraping with timeout."""
        import requests
        mock_get.side_effect = requests.exceptions.Timeout()

        scraper = BeautifulSoupScraper()
        result = scraper.scrape("https://example.com")
        assert result.error == "Request timed out"
        assert result.status_code == 408

    def test_search_content(self):
        """Test searching content with regex."""
        scraper = BeautifulSoupScraper()
        html = "<html><body>Hello World! Hello Python!</body></html>"
        matches = scraper.search_content(html, r"Hello \w+")
        assert "Hello World" in matches
        assert "Hello Python" in matches

    def test_extract_data_attribute(self):
        """Test extracting data attributes."""
        scraper = BeautifulSoupScraper()
        html = """
        <html>
        <body>
            <div data-id="1">One</div>
            <div data-id="2">Two</div>
        </body>
        </html>
        """
        results = scraper.extract_data_attribute(html, "data-id")
        assert results == ["1", "2"]
