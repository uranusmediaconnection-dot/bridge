"""Unit tests for the stealth scraper and anti-detection module."""

import pytest
from unittest.mock import patch, MagicMock
from backend.core.anti_detection import (
    get_random_ua,
    get_random_headers,
    get_search_headers,
    get_random_profile,
    USER_AGENTS,
    BROWSER_PROFILES,
)


# ============================================================
# Anti-Detection Tests
# ============================================================

class TestAntiDetection:
    """Tests for the anti-detection module."""

    def test_get_random_ua_returns_string(self):
        ua = get_random_ua()
        assert isinstance(ua, str)
        assert len(ua) > 50

    def test_get_random_ua_from_known_list(self):
        # Run multiple times to increase chance of hitting different values
        uas = {get_random_ua() for _ in range(20)}
        # At least some should be from our known list
        assert any(ua in USER_AGENTS for ua in uas)

    def test_get_random_headers_has_required_fields(self):
        headers = get_random_headers()
        assert "User-Agent" in headers
        assert "Accept" in headers
        assert "Accept-Language" in headers
        assert "Accept-Encoding" in headers
        assert "Sec-Fetch-Dest" in headers
        assert "Sec-Fetch-Mode" in headers

    def test_get_random_headers_has_referer(self):
        headers = get_random_headers(referer="https://www.google.com/")
        assert headers["Referer"] == "https://www.google.com/"

    def test_get_search_headers_google(self):
        headers = get_search_headers("google")
        assert headers["Referer"] == "https://www.google.com/"

    def test_get_search_headers_bing(self):
        headers = get_search_headers("bing")
        assert headers["Referer"] == "https://www.bing.com/"

    def test_get_search_headers_duckduckgo(self):
        headers = get_search_headers("duckduckgo")
        assert headers["Referer"] == "https://html.duckduckgo.com/"

    def test_get_random_profile_returns_dict(self):
        profile = get_random_profile()
        assert isinstance(profile, dict)
        assert "name" in profile
        assert "user_agent" in profile
        assert "viewport" in profile
        assert "webgl_vendor" in profile

    def test_get_random_profile_from_known_list(self):
        profiles = {get_random_profile()["name"] for _ in range(20)}
        known_names = {p["name"] for p in BROWSER_PROFILES}
        assert profiles.issubset(known_names)

    def test_headers_rotate(self):
        """Verify headers actually rotate between calls."""
        uas = set()
        for _ in range(50):
            headers = get_random_headers()
            uas.add(headers["User-Agent"])
        assert len(uas) > 1  # Should have at least 2 different UAs


# ============================================================
# Stealth Scraper Tests (Unit - no network)
# ============================================================

class TestStealthScraper:
    """Unit tests for StealthScraper without network calls."""

    def test_invalid_url_returns_error(self):
        from backend.scrapers.stealth_scraper import StealthScraper
        scraper = StealthScraper()
        result = scraper.scrape("not-a-valid-url")
        assert result.error == "Invalid URL format"
        assert result.status_code == 400

    def test_empty_url_returns_error(self):
        from backend.scrapers.stealth_scraper import StealthScraper
        scraper = StealthScraper()
        result = scraper.scrape("")
        assert result.error == "Invalid URL format"

    def test_browser_impersonations_list(self):
        from backend.scrapers.stealth_scraper import StealthScraper
        assert len(StealthScraper.BROWSER_IMPERSONATIONS) > 0
        for imp in StealthScraper.BROWSER_IMPERSONATIONS:
            assert isinstance(imp, str)

    def test_scraper_has_required_methods(self):
        from backend.scrapers.stealth_scraper import StealthScraper
        scraper = StealthScraper()
        assert hasattr(scraper, "scrape")
        assert hasattr(scraper, "scrape_with_retry")
        assert hasattr(scraper, "scrape_multiple")


# ============================================================
# Proxy Pool Tests (Unit - no network)
# ============================================================

class TestProxyPool:
    """Unit tests for the free proxy pool."""

    def test_empty_pool(self):
        from backend.proxy.free_proxies import FreeProxyPool
        pool = FreeProxyPool()
        assert pool.get_proxy() is None

    def test_pool_stats_empty(self):
        from backend.proxy.free_proxies import FreeProxyPool
        pool = FreeProxyPool()
        stats = pool.stats
        assert stats["total"] == 0
        assert stats["active"] == 0

    def test_add_manual_proxy(self):
        from backend.proxy.free_proxies import FreeProxyPool, ProxyInfo
        pool = FreeProxyPool()
        pool.proxies.append(ProxyInfo(host="127.0.0.1", port=8080))
        assert pool.stats["total"] == 1
        proxy = pool.get_proxy(protocol="http")
        assert proxy is not None
        assert proxy.host == "127.0.0.1"

    def test_proxy_url_format(self):
        from backend.proxy.free_proxies import ProxyInfo
        proxy = ProxyInfo(host="127.0.0.1", port=8080)
        assert proxy.url == "http://127.0.0.1:8080"

    def test_proxy_url_with_auth(self):
        from backend.proxy.free_proxies import ProxyInfo
        proxy = ProxyInfo(host="127.0.0.1", port=8080, username="user", password="pass")
        assert proxy.url == "http://user:pass@127.0.0.1:8080"

    def test_success_rate_empty(self):
        from backend.proxy.free_proxies import ProxyInfo
        proxy = ProxyInfo(host="127.0.0.1", port=8080)
        assert proxy.success_rate == 1.0

    def test_success_rate_calculation(self):
        from backend.proxy.free_proxies import ProxyInfo
        proxy = ProxyInfo(host="127.0.0.1", port=8080)
        proxy.success_count = 8
        proxy.fail_count = 2
        assert proxy.success_rate == 0.8

    def test_report_success_failure(self):
        from backend.proxy.free_proxies import FreeProxyPool, ProxyInfo
        pool = FreeProxyPool()
        proxy = ProxyInfo(host="127.0.0.1", port=8080)
        pool.proxies.append(proxy)

        pool.report_success(proxy)
        assert proxy.success_count == 1

        pool.report_failure(proxy)
        assert proxy.fail_count == 1

    def test_blacklisted_proxy_recovery(self):
        from backend.proxy.free_proxies import FreeProxyPool, ProxyInfo
        pool = FreeProxyPool()
        proxy = ProxyInfo(host="127.0.0.1", port=8080)
        pool.proxies.append(proxy)

        # Fail 5 times to blacklist
        for _ in range(5):
            pool.report_failure(proxy)

        # After some time, should reset and be available again
        # Manually reset for testing
        proxy.fail_count = 0
        result = pool.get_proxy()
        assert result is not None
