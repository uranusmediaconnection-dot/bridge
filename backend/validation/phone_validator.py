"""Phone number validation using Google's libphonenumber (phonenumbers library)."""

from typing import Dict, List, Optional

try:
    import phonenumbers
    from phonenumbers import carrier, geocoder, timezone as pn_tz
except ImportError:
    phonenumbers = None


class PhoneNumberValidator:
    """Comprehensive phone validation using libphonenumber.

    No API keys required - all local computation.
    """

    def __init__(self, default_region: str = "US"):
        self.default_region = default_region

    def validate(self, raw_number: str, region: Optional[str] = None) -> Dict:
        """Parse, validate, and enrich a phone number."""
        region = region or self.default_region

        result = {
            "raw": raw_number,
            "valid": False,
            "possible": False,
            "e164": None,
            "national": None,
            "international": None,
            "country_code": None,
            "region": None,
            "carrier": None,
            "line_type": "unknown",
            "timezone": [],
            "geocoded": None,
            "error": None,
        }

        if phonenumbers is None:
            result["error"] = "phonenumbers module not installed"
            return result

        try:
            parsed = phonenumbers.parse(raw_number, region)

            is_valid = phonenumbers.is_valid_number(parsed)
            is_possible = phonenumbers.is_possible_number(parsed)

            result["valid"] = is_valid
            result["possible"] = is_possible

            if not is_possible:
                result["error"] = "not_possible_number"
                return result

            # Format in multiple formats
            result["e164"] = phonenumbers.format_number(
                parsed, phonenumbers.PhoneNumberFormat.E164
            )
            result["national"] = phonenumbers.format_number(
                parsed, phonenumbers.PhoneNumberFormat.NATIONAL
            )
            result["international"] = phonenumbers.format_number(
                parsed, phonenumbers.PhoneNumberFormat.INTERNATIONAL
            )

            # Metadata
            result["country_code"] = parsed.country_code
            result["region"] = phonenumbers.region_code_for_number(parsed)

            # Carrier identification
            carrier_name = carrier.name_for_number(parsed, "en")
            result["carrier"] = carrier_name if carrier_name else None

            # Line type detection
            result["line_type"] = self._detect_line_type(parsed, carrier_name)

            # Timezone
            tz_list = list(pn_tz.time_zones_for_number(parsed))
            result["timezone"] = tz_list

            # Geographic location
            geo = geocoder.description_for_number(parsed, "en")
            result["geocoded"] = geo if geo else None

        except phonenumbers.NumberParseException as e:
            result["error"] = str(e)

        return result

    def validate_batch(self, numbers: List[str], region: Optional[str] = None) -> List[Dict]:
        """Validate a batch of phone numbers."""
        region = region or self.default_region
        return [self.validate(n, region) for n in numbers]

    @staticmethod
    def _detect_line_type(parsed, carrier_name: Optional[str]) -> str:
        """Heuristic line type detection."""
        if not carrier_name:
            return "unknown"

        voip_carriers = ["google fi", "google voice", "skype", "viber", "vonage"]
        if any(v in carrier_name.lower() for v in voip_carriers):
            return "voip"

        mobile_keywords = ["mobile", "wireless", "cell", "telecom", "t-mobile", "verizon"]
        if any(m in carrier_name.lower() for m in mobile_keywords):
            return "mobile"

        landline_keywords = ["telco", "telephone", "landline", "at&t"]
        if any(l in carrier_name.lower() for l in landline_keywords):
            return "landline"

        return "likely_mobile"

    @staticmethod
    def format_e164(raw_number: str, region: str = "US") -> Optional[str]:
        """Quick E.164 formatting (returns None on failure)."""
        if phonenumbers is None:
            return None
        try:
            parsed = phonenumbers.parse(raw_number, region)
            if phonenumbers.is_valid_number(parsed):
                return phonenumbers.format_number(
                    parsed, phonenumbers.PhoneNumberFormat.E164
                )
        except Exception:
            pass
        return None
