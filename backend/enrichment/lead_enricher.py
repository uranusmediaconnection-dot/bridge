"""Lead enrichment: domain → emails, phones, social, company data."""

import re
import asyncio
from typing import Dict, List, Optional
from datetime import datetime

from ..core.anti_detection import get_random_headers
from ..validation.email_validator import EmailValidator
from ..validation.phone_validator import PhoneNumberValidator
from ..validation.email_finder import EmailFinder
from .public_data import PublicDataAggregator


class LeadEnricher:
    """Full lead enrichment pipeline.

    Given a domain or company name, discovers:
    - Email addresses (found on website + pattern guessing)
    - Phone numbers (found on website pages)
    - Social media profiles
    - Tech stack
    - Company info (WHOIS, DNS)
    """

    def __init__(self):
        self.email_validator = EmailValidator(do_smtp=False)
        self.phone_validator = PhoneNumberValidator(default_region="US")
        self.email_finder = EmailFinder()
        self.public_data = PublicDataAggregator()
        self.email_regex = re.compile(
            r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
        )
        self.phone_regex = re.compile(
            r"(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}"
        )

    def enrich_domain(self, domain: str) -> Dict:
        """Full enrichment of a domain."""
        lead = {
            "domain": domain,
            "enriched_at": datetime.now().isoformat(),
            "emails": [],
            "phones": [],
            "social_profiles": {},
            "tech_stack": {},
            "company_info": {},
        }

        # 1. Public data (WHOIS, DNS, tech stack)
        try:
            public = self.public_data.enrich_by_domain(domain)
            lead["tech_stack"] = public.get("tech_stack", {})
            lead["company_info"] = public.get("whois", {})
            lead["company_info"]["dns_email_provider"] = public.get("dns", {}).get("email_provider")
            lead["social_profiles"] = public.get("social_profiles", {})
        except Exception as e:
            lead["company_info"] = {"error": str(e)}

        # 2. Scrape website pages for emails and phones
        pages = self.email_finder.find_common_pages(domain)
        found_emails = set()
        found_phones = set()

        for url in pages:
            try:
                html = _fetch_page(url)
                if not html:
                    continue

                # Extract emails
                raw_emails = self.email_regex.findall(html)
                for email in raw_emails:
                    email_lower = email.lower()
                    if email_lower not in found_emails:
                        found_emails.add(email_lower)

                # Extract phones
                raw_phones = self.phone_regex.findall(html)
                for phone in raw_phones:
                    cleaned = phone.strip()
                    if cleaned not in found_phones:
                        found_phones.add(cleaned)

            except Exception:
                continue

        # 3. Validate emails
        for email in found_emails:
            validation = self.email_validator.validate(email)
            lead["emails"].append({
                "email": email,
                "valid": validation["valid"],
                "confidence": validation["confidence"],
                "is_disposable": validation["is_disposable"],
                "is_free_provider": validation["is_free_provider"],
            })

        # 4. Validate phones
        for phone in found_phones:
            validation = self.phone_validator.validate(phone)
            if validation["possible"] or validation["valid"]:
                lead["phones"].append({
                    "number": phone,
                    "valid": validation["valid"],
                    "e164": validation["e164"],
                    "national": validation["national"],
                    "carrier": validation["carrier"],
                    "line_type": validation["line_type"],
                    "location": validation["geocoded"],
                    "timezone": validation["timezone"],
                })

        return lead

    def enrich_batch(self, domains: List[str]) -> List[Dict]:
        """Enrich multiple domains."""
        results = []
        for domain in domains:
            try:
                result = self.enrich_domain(domain)
                results.append(result)
            except Exception as e:
                results.append({
                    "domain": domain,
                    "error": str(e),
                    "emails": [],
                    "phones": [],
                })
        return results


def _fetch_page(url: str) -> Optional[str]:
    """Fetch a page with anti-detection headers."""
    try:
        import httpx
        headers = get_random_headers()
        resp = httpx.get(url, headers=headers, timeout=10, follow_redirects=True)
        if resp.status_code == 200:
            return resp.text
    except Exception:
        pass
    return None
