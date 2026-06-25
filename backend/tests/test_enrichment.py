"""Unit tests for the lead enrichment system."""

import pytest
from unittest.mock import patch, MagicMock
from backend.enrichment.public_data import PublicDataAggregator


class TestPublicDataAggregator:
    """Tests for the public data aggregation module."""

    def test_enrich_by_domain_returns_dict(self):
        agg = PublicDataAggregator()
        result = agg.enrich_by_domain("example.com")
        assert isinstance(result, dict)
        assert result["domain"] == "example.com"
        assert "whois" in result
        assert "dns" in result
        assert "tech_stack" in result
        assert "social_profiles" in result

    def test_dns_enumeration_returns_dict(self):
        agg = PublicDataAggregator()
        result = agg._dns_enumeration("example.com")
        assert isinstance(result, dict)

    def test_tech_stack_returns_dict(self):
        agg = PublicDataAggregator()
        result = agg._detect_tech_stack("example.com")
        assert isinstance(result, dict)
        assert "cms" in result
        assert "framework" in result
        assert "analytics" in result

    def test_social_profiles_returns_dict(self):
        agg = PublicDataAggregator()
        result = agg._find_social_profiles("example.com")
        assert isinstance(result, dict)


class TestEmailFinderService:
    """Tests for the email discovery service."""

    def test_discover_returns_dict(self):
        from backend.enrichment.email_finder import EmailDiscoveryService
        service = EmailDiscoveryService()
        result = service.discover("example.com")
        assert isinstance(result, dict)
        assert result["domain"] == "example.com"
        assert "discovered_emails" in result
        assert "confidence" in result

    def test_generate_for_person(self):
        from backend.enrichment.email_finder import EmailDiscoveryService
        service = EmailDiscoveryService()
        patterns = service.generate_for_person("John", "Smith", "example.com")
        assert isinstance(patterns, list)
        assert "john.smith@example.com" in patterns
        assert "jsmith@example.com" in patterns


class TestLeadEnricher:
    """Tests for the lead enrichment pipeline."""

    def test_enrich_domain_returns_dict(self):
        from backend.enrichment.lead_enricher import LeadEnricher
        enricher = LeadEnricher()
        result = enricher.enrich_domain("example.com")
        assert isinstance(result, dict)
        assert result["domain"] == "example.com"
        assert "emails" in result
        assert "phones" in result
        assert "social_profiles" in result
        assert "tech_stack" in result
        assert "company_info" in result
        assert "enriched_at" in result

    def test_enrich_batch_returns_list(self):
        from backend.enrichment.lead_enricher import LeadEnricher
        enricher = LeadEnricher()
        results = enricher.enrich_batch(["example.com", "example.org"])
        assert isinstance(results, list)
        assert len(results) == 2
        assert results[0]["domain"] == "example.com"
        assert results[1]["domain"] == "example.org"

    def test_enrich_batch_handles_error(self):
        from backend.enrichment.lead_enricher import LeadEnricher
        enricher = LeadEnricher()
        # Even with an invalid domain, the pipeline should return a result with error info
        results = enricher.enrich_batch(["nonexistent-domain-xyz123.com"])
        assert len(results) == 1
        assert "emails" in results[0]
        assert "phones" in results[0]
