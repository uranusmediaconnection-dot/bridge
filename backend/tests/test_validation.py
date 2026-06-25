"""Unit tests for email and phone validation modules."""

import pytest
from backend.validation.email_validator import EmailValidator
from backend.validation.phone_validator import PhoneNumberValidator
from backend.validation.email_finder import (
    EmailFinder,
    generate_email_patterns,
    COMMON_PATTERNS,
)


# ============================================================
# Email Validator Tests
# ============================================================

class TestEmailValidator:
    """Tests for the 3-layer email validation pipeline."""

    def setup_method(self):
        self.validator = EmailValidator(do_smtp=False)

    # --- Layer 1: Format Validation ---

    def test_valid_email_format(self):
        result = self.validator.validate("john@example.com")
        assert result["valid"] is True
        assert result["confidence"] >= 60
        assert result["checks"]["format"]["pass"] is True

    def test_valid_email_with_subdomain(self):
        result = self.validator.validate("user@mail.example.co.uk")
        # Format check passes even if DNS doesn't resolve
        assert result["checks"]["format"]["pass"] is True
        assert result["email"] == "user@mail.example.co.uk"

    def test_invalid_email_no_at(self):
        result = self.validator.validate("johnexample.com")
        assert result["valid"] is False
        assert result["confidence"] == 0
        assert result["checks"]["format"]["pass"] is False

    def test_invalid_email_no_domain(self):
        result = self.validator.validate("john@")
        assert result["valid"] is False
        assert result["confidence"] == 0

    def test_invalid_email_empty(self):
        result = self.validator.validate("")
        assert result["valid"] is False
        assert result["confidence"] == 0

    def test_invalid_email_spaces(self):
        result = self.validator.validate("john doe@example.com")
        assert result["valid"] is False

    def test_email_case_insensitive(self):
        result = self.validator.validate("JOHN@EXAMPLE.COM")
        assert result["email"] == "john@example.com"
        assert result["checks"]["format"]["pass"] is True

    # --- Disposable Email Detection ---

    def test_disposable_email_detected(self):
        result = self.validator.validate("test@mailinator.com")
        assert result["valid"] is False
        assert result["is_disposable"] is True
        assert "disposable_email" in result["flags"]
        assert result["confidence"] <= 10

    def test_disposable_guerrillamail(self):
        result = self.validator.validate("user@guerrillamail.com")
        assert result["is_disposable"] is True

    def test_disposable_yopmail(self):
        result = self.validator.validate("test@yopmail.com")
        assert result["is_disposable"] is True

    def test_disposable_10minutemail(self):
        result = self.validator.validate("temp@10minutemail.com")
        assert result["is_disposable"] is True

    # --- Free Provider Detection ---

    def test_free_provider_gmail(self):
        result = self.validator.validate("john@gmail.com")
        assert result["valid"] is True
        assert result["is_free_provider"] is True
        assert "free_email_provider" in result["flags"]

    def test_free_provider_yahoo(self):
        result = self.validator.validate("user@yahoo.com")
        assert result["is_free_provider"] is True

    def test_free_provider_outlook(self):
        result = self.validator.validate("user@outlook.com")
        assert result["is_free_provider"] is True

    def test_corporate_email_bonus(self):
        result = self.validator.validate("john@acme-corp.com")
        assert result["valid"] is True
        assert result["is_free_provider"] is False
        assert result["is_disposable"] is False
        # Corporate email gets confidence bonus
        assert result["confidence"] >= 60

    # --- Batch Validation ---

    def test_batch_validation(self):
        emails = [
            "valid@example.com",
            "test@mailinator.com",
            "user@gmail.com",
            "invalid-email",
        ]
        results = self.validator.validate_batch(emails)
        assert len(results) == 4
        valid_count = sum(1 for r in results if r["valid"])
        assert valid_count >= 1  # At least valid@example.com should pass format

    def test_batch_deduplication(self):
        emails = ["test@example.com", "TEST@example.com", "test@example.com"]
        results = self.validator.validate_batch(emails, dedup=True)
        assert len(results) == 1  # Deduped to 1

    def test_batch_no_dedup(self):
        emails = ["test@example.com", "TEST@example.com"]
        results = self.validator.validate_batch(emails, dedup=False)
        assert len(results) == 2


# ============================================================
# Phone Validator Tests
# ============================================================

class TestPhoneNumberValidator:
    """Tests for phone number validation using libphonenumber."""

    def setup_method(self):
        self.validator = PhoneNumberValidator(default_region="US")

    def test_valid_us_number(self):
        result = self.validator.validate("+1 202 555 0142")
        assert result["e164"] is not None
        assert result["country_code"] == 1

    def test_valid_uk_number(self):
        result = self.validator.validate("+44 7911 123456", region="GB")
        assert result["e164"] is not None
        assert result["country_code"] == 44

    def test_valid_e164_format(self):
        result = self.validator.validate("+12025550142")
        assert result["e164"] is not None
        assert result["e164"].startswith("+1")

    def test_invalid_number(self):
        result = self.validator.validate("123")
        assert result["valid"] is False
        assert result["error"] is not None

    def test_empty_number(self):
        result = self.validator.validate("")
        assert result["valid"] is False

    def test_national_format(self):
        result = self.validator.validate("+1 202 555 0142")
        assert result["national"] is not None
        assert result["international"] is not None

    def test_geocoded_location(self):
        result = self.validator.validate("+12025550142")
        if result["valid"]:
            assert result["geocoded"] is not None

    def test_timezone(self):
        result = self.validator.validate("+12025550142")
        if result["valid"]:
            assert len(result["timezone"]) > 0

    def test_carrier_detection(self):
        result = self.validator.validate("+12025550142")
        # Carrier may or may not be detected for test numbers
        assert "carrier" in result

    def test_line_type_field(self):
        result = self.validator.validate("+12025550142")
        assert result["line_type"] in ("mobile", "landline", "voip", "unknown", "likely_mobile")

    def test_batch_validation(self):
        numbers = ["+12025550142", "+447911123456", "invalid", "+12025550142"]
        results = self.validator.validate_batch(numbers)
        assert len(results) == 4
        valid_count = sum(1 for r in results if r["valid"])
        assert valid_count >= 2

    def test_format_e164(self):
        e164 = PhoneNumberValidator.format_e164("+1 202 555 0142")
        assert e164 is not None
        assert e164.startswith("+1")

    def test_format_e164_invalid(self):
        e164 = PhoneNumberValidator.format_e164("not-a-number")
        assert e164 is None


# ============================================================
# Email Finder Tests
# ============================================================

class TestEmailFinder:
    """Tests for pattern-based email discovery."""

    def setup_method(self):
        self.finder = EmailFinder()

    def test_generate_patterns_john_smith(self):
        patterns = generate_email_patterns("John", "Smith", "example.com")
        assert "john.smith@example.com" in patterns
        assert "johnsmith@example.com" in patterns
        assert "jsmith@example.com" in patterns
        assert "johns@example.com" in patterns
        assert len(patterns) >= 8

    def test_generate_patterns_short_names(self):
        patterns = generate_email_patterns("A", "B", "test.com")
        assert "a.b@test.com" in patterns
        assert "ab@test.com" in patterns

    def test_extract_emails_from_html(self):
        html = '<p>Contact us at info@example.com or support@example.com</p>'
        results = self.finder.find_from_webpage(html, target_domain="example.com")
        emails = [r["email"] for r in results]
        assert "info@example.com" in emails
        assert "support@example.com" in emails

    def test_extract_emails_filters_target_domain(self):
        html = '<a href="mailto:internal@other.com">Other</a>'
        results = self.finder.find_from_webpage(html, target_domain="example.com")
        assert len([r for r in results if r.get("is_target_domain")]) == 0

    def test_find_common_pages(self):
        pages = self.finder.find_common_pages("example.com")
        assert "https://example.com" in pages
        assert "https://example.com/contact" in pages
        assert "https://example.com/about" in pages
        assert "https://example.com/team" in pages

    def test_guess_format_first_last(self):
        emails = ["john.smith@example.com", "jane.doe@example.com"]
        pattern = self.finder.guess_format(emails)
        assert pattern == "first.last"

    def test_guess_format_empty(self):
        pattern = self.finder.guess_format([])
        assert pattern is None
