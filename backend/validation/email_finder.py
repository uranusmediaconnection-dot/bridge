"""Pattern-based email discovery for domains."""

import re
from typing import List, Dict, Optional
from ..core.anti_detection import get_random_headers


# Common email patterns ranked by prevalence
COMMON_PATTERNS = [
    "{first}.{last}",
    "{first}{last}",
    "{f}{last}",
    "{first}{l}",
    "{f}.{last}",
    "{first}_{last}",
    "{last}.{first}",
    "{first}",
]


def generate_email_patterns(first_name: str, last_name: str, domain: str) -> List[str]:
    """Generate common email patterns from a name and domain."""
    first = first_name.lower().strip()
    last = last_name.lower().strip()
    f = first[0] if first else ""
    l = last[0] if last else ""

    patterns = set()
    for template in COMMON_PATTERNS:
        email = template.format(
            first=first, last=last, f=f, l=l
        ) + f"@{domain}"
        patterns.add(email)

    return sorted(patterns)


class EmailFinder:
    """Find emails for a domain using pattern-based discovery and web scraping."""

    def __init__(self):
        self.email_regex = re.compile(
            r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
        )

    def find_from_webpage(self, html: str, target_domain: Optional[str] = None) -> List[Dict]:
        """Extract email addresses from webpage HTML."""
        raw = self.email_regex.findall(html)
        results = []
        seen = set()

        for email in raw:
            email_lower = email.lower()
            if email_lower in seen:
                continue
            seen.add(email_lower)

            domain = email_lower.split("@")[1]
            results.append({
                "email": email_lower,
                "domain": domain,
                "is_target_domain": domain == target_domain if target_domain else None,
            })

        return results

    def find_from_domain(self, domain: str, html_content: str) -> List[str]:
        """Find all emails belonging to a specific domain."""
        emails = self.find_from_webpage(html_content, target_domain=domain)
        return [e["email"] for e in emails if e.get("is_target_domain")]

    def find_common_pages(self, domain: str) -> List[str]:
        """Return common pages to scrape for email discovery."""
        common_paths = [
            "", "/contact", "/about", "/about-us", "/team",
            "/people", "/staff", "/leadership", "/company",
            "/contact-us", "/get-in-touch",
        ]
        return [f"https://{domain}{path}" for path in common_paths]

    def guess_format(self, known_emails: List[str]) -> Optional[str]:
        """Analyze known emails to guess the company's email format."""
        if not known_emails:
            return None

        formats = {
            "first.last": 0,
            "firstlast": 0,
            "flast": 0,
            "firstl": 0,
            "first_last": 0,
            "last.first": 0,
            "f.last": 0,
        }

        for email in known_emails:
            local = email.split("@")[0]
            if "." in local and not local.startswith("."):
                parts = local.split(".")
                if len(parts) == 2 and len(parts[0]) > 1 and len(parts[1]) > 1:
                    formats["first.last"] += 1
                elif len(parts[0]) == 1 and len(parts[1]) > 1:
                    formats["f.last"] += 1
            elif "_" in local:
                formats["first_last"] += 1
            elif len(local) > 2:
                # Could be firstlast or flast or firstl
                formats["firstlast"] += 1

        if not any(formats.values()):
            return None

        best = max(formats, key=formats.get)
        return best if formats[best] > 0 else None
