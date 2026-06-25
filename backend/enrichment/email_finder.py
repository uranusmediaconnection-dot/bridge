"""Email finder: discover emails from web pages and common patterns."""

from typing import Dict, List, Optional
from ..validation.email_finder import EmailFinder as BaseEmailFinder, generate_email_patterns


class EmailDiscoveryService:
    """High-level email discovery service for domains."""

    def __init__(self):
        self.finder = BaseEmailFinder()

    def discover(self, domain: str, known_names: Optional[List[Dict]] = None) -> Dict:
        """Discover emails for a domain.

        Args:
            domain: Target domain (e.g., "example.com")
            known_names: Optional list of {"first": str, "last": str} dicts

        Returns:
            Dict with discovered emails, patterns, and confidence
        """
        result = {
            "domain": domain,
            "discovered_emails": [],
            "guessed_patterns": [],
            "confidence": "low",
        }

        # 1. Scrape common pages
        pages = self.finder.find_common_pages(domain)
        all_emails = set()

        for url in pages:
            try:
                html = _fetch(url)
                if html:
                    emails = self.finder.find_from_webpage(html, target_domain=domain)
                    for e in emails:
                        all_emails.add(e["email"])
            except Exception:
                continue

        result["discovered_emails"] = sorted(all_emails)

        # 2. If we found emails, try to guess the format
        if all_emails:
            pattern = self.finder.guess_format(list(all_emails))
            if pattern:
                result["guessed_patterns"].append(pattern)
                result["confidence"] = "medium"

        # 3. If we have known names, generate patterns
        if known_names:
            all_generated = set()
            for name in known_names:
                patterns = generate_email_patterns(
                    name.get("first", ""),
                    name.get("last", ""),
                    domain,
                )
                all_generated.update(patterns)

            result["generated_patterns"] = sorted(all_generated)

            if result["discovered_emails"]:
                result["confidence"] = "high"

        return result

    def generate_for_person(self, first_name: str, last_name: str, domain: str) -> List[str]:
        """Generate possible email patterns for a person."""
        return generate_email_patterns(first_name, last_name, domain)


def _fetch(url: str) -> Optional[str]:
    """Quick page fetch."""
    try:
        import httpx
        from ..core.anti_detection import get_random_headers
        resp = httpx.get(url, headers=get_random_headers(), timeout=10, follow_redirects=True)
        return resp.text if resp.status_code == 200 else None
    except Exception:
        return None
