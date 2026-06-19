"""Anti-detection module: rotating User-Agents, realistic headers, stealth configs."""

import random
from typing import Dict, List, Optional


# Realistic User-Agent strings (latest 2026 versions)
USER_AGENTS = [
    # Chrome (Windows)
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    # Chrome (macOS)
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    # Edge
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0",
    # Firefox
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:132.0) Gecko/20100101 Firefox/132.0",
    # Safari
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
]

# Language preferences by region
LANGUAGE_PROFILES = [
    ["en-US", "en"],
    ["en-GB", "en"],
    ["en-US", "en", "es"],
    ["en-US", "en", "fr"],
    ["en-GB", "en", "de"],
]


def get_random_ua() -> str:
    """Return a random User-Agent string."""
    return random.choice(USER_AGENTS)


def get_random_headers(referer: Optional[str] = None) -> Dict[str, str]:
    """Generate realistic, rotating browser headers."""
    headers = {
        "User-Agent": get_random_ua(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": ",".join(random.choice(LANGUAGE_PROFILES)) + ";q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": random.choice(["none", "cross-site"]),
        "Sec-Fetch-User": "?1",
        "Cache-Control": random.choice(["max-age=0", "no-cache"]),
    }

    if referer:
        headers["Referer"] = referer

    return headers


def get_search_headers(engine: str = "google") -> Dict[str, str]:
    """Generate headers optimized for search engine scraping."""
    base = get_random_headers()

    if engine == "google":
        base["Referer"] = "https://www.google.com/"
        base["Sec-Fetch-Site"] = "same-origin"
    elif engine == "bing":
        base["Referer"] = "https://www.bing.com/"
    elif engine == "duckduckgo":
        base["Referer"] = "https://html.duckduckgo.com/"

    return base


# Browser profile configurations for Playwright/CDP
BROWSER_PROFILES = [
    {
        "name": "chrome_win10",
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "viewport": {"width": 1920, "height": 1080},
        "screen": {"width": 1920, "height": 1080},
        "timezone": "America/New_York",
        "locale": "en-US",
        "webgl_vendor": "Intel Inc.",
        "webgl_renderer": "Intel(R) UHD Graphics 630",
    },
    {
        "name": "chrome_macos",
        "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "viewport": {"width": 1440, "height": 900},
        "screen": {"width": 2560, "height": 1600},
        "timezone": "America/Los_Angeles",
        "locale": "en-US",
        "webgl_vendor": "Apple",
        "webgl_renderer": "Apple M1 Pro",
    },
    {
        "name": "firefox_win11",
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
        "viewport": {"width": 1366, "height": 768},
        "screen": {"width": 1366, "height": 768},
        "timezone": "America/Chicago",
        "locale": "en-US",
        "webgl_vendor": "Google Inc. (NVIDIA)",
        "webgl_renderer": "ANGLE (NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0)",
    },
]


def get_random_profile() -> Dict:
    """Return a random browser profile for stealth browsing."""
    return random.choice(BROWSER_PROFILES)
