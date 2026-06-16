"""Web search engine scrapers."""

import requests
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup
from urllib.parse import quote_plus, urlencode


class SearchEngineScraper:
    """Base class for search engine scraping."""

    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        })


class GoogleScraper(SearchEngineScraper):
    """Google search results scraper."""

    BASE_URL = "https://www.google.com/search"

    def search(
        self,
        query: str,
        num_results: int = 10,
        lang: str = "en",
    ) -> List[Dict[str, Any]]:
        """Search Google and return results."""
        params = {
            "q": query,
            "num": num_results,
            "hl": lang,
        }

        try:
            response = self.session.get(
                self.BASE_URL,
                params=params,
                timeout=self.timeout,
            )
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")
            results = []

            # Find search result containers
            for g in soup.find_all("div", class_="g")[:num_results]:
                title_elem = g.find("h3")
                url_elem = g.find("a", href=True)
                snippet_elem = g.find("div", class_=lambda x: x and "-snippet" in x)

                if title_elem and url_elem:
                    results.append({
                        "title": title_elem.get_text(strip=True),
                        "url": url_elem["href"],
                        "snippet": snippet_elem.get_text(strip=True) if snippet_elem else "",
                        "engine": "google",
                    })

            return results

        except Exception as e:
            return [{"error": str(e), "engine": "google"}]


class BingScraper(SearchEngineScraper):
    """Bing search results scraper."""

    BASE_URL = "https://www.bing.com/search"

    def search(
        self,
        query: str,
        num_results: int = 10,
    ) -> List[Dict[str, Any]]:
        """Search Bing and return results."""
        params = {"q": query, "count": num_results}

        try:
            response = self.session.get(
                self.BASE_URL,
                params=params,
                timeout=self.timeout,
            )
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")
            results = []

            for li in soup.find_all("li", class_="b_algo")[:num_results]:
                title_elem = li.find("h2")
                url_elem = li.find("a", href=True)
                snippet_elem = li.find("p")

                if title_elem and url_elem:
                    results.append({
                        "title": title_elem.get_text(strip=True),
                        "url": url_elem["href"],
                        "snippet": snippet_elem.get_text(strip=True) if snippet_elem else "",
                        "engine": "bing",
                    })

            return results

        except Exception as e:
            return [{"error": str(e), "engine": "bing"}]


class DuckDuckGoScraper(SearchEngineScraper):
    """DuckDuckGo search results scraper."""

    BASE_URL = "https://html.duckduckgo.com/html"

    def search(
        self,
        query: str,
        num_results: int = 10,
    ) -> List[Dict[str, Any]]:
        """Search DuckDuckGo and return results."""
        data = {"q": query}

        try:
            response = self.session.post(
                self.BASE_URL,
                data=data,
                timeout=self.timeout,
            )
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")
            results = []

            for result in soup.find_all("div", class_="result")[:num_results]:
                title_elem = result.find("a", class_="result__title")
                snippet_elem = result.find("a", class_="result__snippet")

                if title_elem:
                    results.append({
                        "title": title_elem.get_text(strip=True),
                        "url": title_elem.get("href"),
                        "snippet": snippet_elem.get_text(strip=True) if snippet_elem else "",
                        "engine": "duckduckgo",
                    })

            return results

        except Exception as e:
            return [{"error": str(e), "engine": "duckduckgo"}]


class SearchService:
    """Unified search service across multiple engines."""

    def __init__(self):
        self.engines = {
            "google": GoogleScraper(),
            "bing": BingScraper(),
            "duckduckgo": DuckDuckGoScraper(),
        }

    def search(
        self,
        query: str,
        engine: str = "google",
        num_results: int = 10,
    ) -> List[Dict[str, Any]]:
        """Search using specified engine."""
        if engine not in self.engines:
            return [{"error": f"Unknown engine: {engine}"}]

        return self.engines[engine].search(query, num_results)

    def search_all(
        self,
        query: str,
        num_results: int = 10,
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Search all engines and return combined results."""
        results = {}
        for engine_name, engine in self.engines.items():
            results[engine_name] = engine.search(query, num_results)
        return results