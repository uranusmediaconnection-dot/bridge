"""Public data aggregation: WHOIS, DNS enumeration, tech stack detection."""

import re
from typing import Dict, List, Optional
from ..core.anti_detection import get_random_headers

try:
    import dns.resolver
except ImportError:
    dns = None

try:
    import httpx
except ImportError:
    import requests as httpx


class PublicDataAggregator:
    """Aggregate lead data from free public sources."""

    def enrich_by_domain(self, domain: str) -> Dict:
        """Full enrichment of a domain using public data sources."""
        return {
            "domain": domain,
            "whois": self._whois_lookup(domain),
            "dns": self._dns_enumeration(domain),
            "tech_stack": self._detect_tech_stack(domain),
            "social_profiles": self._find_social_profiles(domain),
        }

    def _whois_lookup(self, domain: str) -> Dict:
        """WHOIS lookup for domain intelligence."""
        try:
            import whois
            w = whois.whois(domain)
            return {
                "registrar": w.registrar,
                "creation_date": str(w.creation_date) if w.creation_date else None,
                "org": w.org if hasattr(w, "org") else None,
                "emails": w.emails if hasattr(w, "emails") else [],
            }
        except Exception:
            return {"registrar": None, "creation_date": None, "org": None, "emails": []}

    def _dns_enumeration(self, domain: str) -> Dict:
        """Enumerate DNS records for intelligence gathering."""
        if dns is None:
            return {"error": "dnspython not installed"}

        records = {}
        for rtype in ["A", "MX", "TXT", "NS", "CNAME"]:
            try:
                answers = dns.resolver.resolve(domain, rtype)
                records[rtype] = [str(r) for r in answers]
            except Exception:
                pass

        # Detect email provider from MX
        if "MX" in records:
            for mx in records["MX"]:
                mx_lower = mx.lower()
                if "google" in mx_lower:
                    records["email_provider"] = "Google Workspace"
                elif "outlook" in mx_lower or "microsoft" in mx_lower:
                    records["email_provider"] = "Microsoft 365"
                elif "protonmail" in mx_lower:
                    records["email_provider"] = "ProtonMail"
                elif "zoho" in mx_lower:
                    records["email_provider"] = "Zoho Mail"
                break

        return records

    def _detect_tech_stack(self, domain: str) -> Dict:
        """Detect technology stack from HTTP headers and page source."""
        stack = {"cms": None, "framework": None, "analytics": None, "language": None}

        try:
            headers = get_random_headers()
            response = _http_get(f"https://{domain}", headers=headers)
            if response is None:
                return stack

            # Check headers
            powered_by = response.get("headers", {}).get("x-powered-by", "").lower()
            server = response.get("headers", {}).get("server", "").lower()

            if "php" in powered_by:
                stack["language"] = "PHP"
            elif "express" in powered_by or "node" in powered_by:
                stack["language"] = "Node.js"

            # Check HTML for framework signatures
            body = response.get("body", "").lower()
            if "wp-content" in body or "wordpress" in body:
                stack["cms"] = "WordPress"
            elif "/sites/default/files" in body:
                stack["cms"] = "Drupal"
            elif "shopify" in body:
                stack["cms"] = "Shopify"
            elif "wix.com" in body:
                stack["cms"] = "Wix"
            elif "squarespace" in body:
                stack["cms"] = "Squarespace"
            elif "__next" in body or "_next/static" in body:
                stack["framework"] = "Next.js"
            elif "_nuxt" in body:
                stack["framework"] = "Nuxt.js"
            elif "react" in body:
                stack["framework"] = "React"
            elif "vue" in body:
                stack["framework"] = "Vue.js"
            elif "angular" in body:
                stack["framework"] = "Angular"

            if "google-analytics" in body or "googletagmanager" in body:
                stack["analytics"] = "Google Analytics"
            elif "plausible.io" in body:
                stack["analytics"] = "Plausible"
            elif "hotjar" in body:
                stack["analytics"] = "Hotjar"

            stack["server"] = server or None

        except Exception:
            pass

        return stack

    def _find_social_profiles(self, domain: str) -> Dict:
        """Find social media profiles linked from a domain."""
        social = {}
        social_patterns = {
            "linkedin": r"linkedin\.com/(?:company|in)/([a-zA-Z0-9_-]+)",
            "twitter": r"(?:twitter|x)\.com/([a-zA-Z0-9_]+)",
            "facebook": r"facebook\.com/([a-zA-Z0-9_.]+)",
            "instagram": r"instagram\.com/([a-zA-Z0-9_.]+)",
            "github": r"github\.com/([a-zA-Z0-9_-]+)",
            "youtube": r"youtube\.com/(?:@|channel/|c/)([a-zA-Z0-9_-]+)",
        }

        try:
            response = _http_get(f"https://{domain}", headers=get_random_headers())
            if response is None:
                return social

            body = response.get("body", "")
            for platform, pattern in social_patterns.items():
                matches = re.findall(pattern, body)
                if matches:
                    social[platform] = list(set(matches))

        except Exception:
            pass

        return social


def _http_get(url: str, headers: Optional[Dict] = None) -> Optional[Dict]:
    """Simple HTTP GET that works with either httpx or requests."""
    try:
        if httpx.__name__ == "httpx":
            resp = httpx.get(url, headers=headers or {}, timeout=10, follow_redirects=True)
            return {"body": resp.text, "headers": dict(resp.headers), "status": resp.status_code}
        else:
            resp = httpx.get(url, headers=headers or {}, timeout=10, allow_redirects=True)
            return {"body": resp.text, "headers": dict(resp.headers), "status": resp.status_code}
    except Exception:
        return None
