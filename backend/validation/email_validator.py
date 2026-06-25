"""Three-layer email validation: format, DNS MX, SMTP verification."""

import re
import socket
import smtplib
from typing import Optional, Tuple, Dict, List

try:
    import dns.resolver
except ImportError:
    dns = None

try:
    from email_validator import validate_email as ev_validate
except ImportError:
    ev_validate = None


# RFC-compliant but practical email regex
EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@"
    r"[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?"
    r"(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$"
)

# Large list of disposable email domains (production: maintain 10,000+)
DISPOSABLE_DOMAINS = frozenset({
    "tempmail.com", "throwaway.email", "guerrillamail.com", "mailinator.com",
    "yopmail.com", "temp-mail.org", "10minutemail.com", "guerrillamailblock.com",
    "grr.la", "sharklasers.com", "guerrillamail.info", "dispostable.com",
    "tempail.com", "temp-mail.io", "discard.email", "trashmail.com",
    "trashmail.net", "trashmail.me", "fakeinbox.com", "tempinbox.com",
    "tmpmail.net", "getairmail.com", "mohmal.com", "harakirimail.com",
    "tmail.ws", "burnermail.io", "emailondeck.com", "tempmailer.com",
    "throwam.com", "maildrop.cc", "discardmail.com", "mailexpire.com",
    "mailforspam.com", "spamgourmet.com", "spamfree24.org", "jetable.org",
    "nospam.ze.tc", "nomail.xl.cx", "mytemp.email", "tempmailo.com",
})

# Free email providers (flagged but not invalid)
FREE_EMAIL_PROVIDERS = frozenset({
    "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "aol.com",
    "icloud.com", "mail.com", "protonmail.com", "zoho.com", "yandex.com",
    "gmx.com", "live.com", "fastmail.com", "tutanota.com", "hey.com",
    "pm.me", "proton.me", "mail.ru", "inbox.com", "lycos.com",
})


class EmailValidator:
    """Three-layer email validation system.

    Layer 1: Format validation + disposable email check
    Layer 2: DNS MX record verification
    Layer 3: SMTP mailbox verification (optional, slower)
    """

    def __init__(self, do_smtp: bool = False, smtp_timeout: int = 10):
        self.do_smtp = do_smtp
        self.smtp_timeout = smtp_timeout

    def validate(self, email: str) -> Dict:
        """Run full validation pipeline on a single email."""
        result = {
            "email": email.strip().lower(),
            "valid": False,
            "confidence": 0,
            "is_disposable": False,
            "is_free_provider": False,
            "checks": {},
            "flags": [],
        }

        email = email.strip().lower()

        # Layer 1: Format
        fmt_ok, fmt_reason = self._check_format(email)
        result["checks"]["format"] = {"pass": fmt_ok, "reason": fmt_reason}

        if not fmt_ok:
            result["confidence"] = 0
            return result

        result["confidence"] = 30

        domain = email.split("@")[1]

        # Disposable check
        if domain in DISPOSABLE_DOMAINS:
            result["is_disposable"] = True
            result["flags"].append("disposable_email")
            result["confidence"] = 10
            result["checks"]["disposable"] = {"pass": False}
            return result

        result["checks"]["disposable"] = {"pass": True}

        # Free provider check
        if domain in FREE_EMAIL_PROVIDERS:
            result["is_free_provider"] = True
            result["flags"].append("free_email_provider")
        else:
            result["confidence"] += 10  # bonus for corporate email

        # Layer 2: DNS MX
        mx_ok, mx_reason, mx_hosts = self._check_mx(domain)
        result["checks"]["dns_mx"] = {"pass": mx_ok, "reason": mx_reason, "mx_hosts": mx_hosts}

        if not mx_ok:
            result["confidence"] = 10
            return result

        result["confidence"] = 60

        # Layer 3: SMTP (optional)
        if self.do_smtp:
            smtp_ok, smtp_reason = self._smtp_verify(email, mx_hosts)
            result["checks"]["smtp"] = {"pass": smtp_ok, "reason": smtp_reason}

            if smtp_ok:
                result["confidence"] = 95
                result["valid"] = True
            elif smtp_ok is None:
                result["confidence"] = 70
                result["valid"] = True
            else:
                result["confidence"] = 40
                result["valid"] = False
        else:
            result["confidence"] = 65
            result["valid"] = True

        return result

    def validate_batch(self, emails: List[str], dedup: bool = True) -> List[Dict]:
        """Validate a batch of emails."""
        if dedup:
            seen = set()
            unique = []
            for e in emails:
                e_lower = e.strip().lower()
                if e_lower not in seen:
                    seen.add(e_lower)
                    unique.append(e_lower)
            emails = unique

        return [self.validate(email) for email in emails]

    @staticmethod
    def _check_format(email: str) -> Tuple[bool, str]:
        """Layer 1: Format + disposable check."""
        if not EMAIL_REGEX.match(email):
            return False, "invalid_format"
        return True, "format_valid"

    @staticmethod
    def _check_mx(domain: str) -> Tuple[bool, str, List[str]]:
        """Layer 2: Verify domain has MX records."""
        if dns is None:
            return True, "dns_module_missing", [domain]

        try:
            mx_records = dns.resolver.resolve(domain, "MX")
            mx_hosts = [str(r.exchange).rstrip(".") for r in mx_records]
            return True, "mx_found", mx_hosts
        except dns.resolver.NXDOMAIN:
            return False, "domain_not_found", []
        except dns.resolver.NoAnswer:
            # Try A record fallback
            try:
                dns.resolver.resolve(domain, "A")
                return True, "has_a_record_no_mx", [domain]
            except Exception:
                return False, "no_mx_or_a", []
        except dns.resolver.NoNameservers:
            return False, "nameserver_error", []
        except Exception as e:
            return False, f"dns_error: {str(e)}", []

    def _smtp_verify(self, email: str, mx_hosts: List[str]) -> Tuple[Optional[bool], str]:
        """Layer 3: SMTP handshake to verify mailbox exists.

        WARNING: Some servers accept all RCPT TO then bounce later.
        Not 100% reliable.
        """
        for mx_host in mx_hosts:
            try:
                server = smtplib.SMTP(timeout=self.smtp_timeout)
                server.set_debuglevel(0)
                server.connect(mx_host, 25)
                server.helo("verify.example.com")
                server.mail("verify@example.com")

                code, message = server.rcpt(email)
                server.quit()

                if code == 250:
                    return True, "mailbox_exists"
                elif code in (550, 551):
                    return False, "mailbox_not_found"
                elif code == 552:
                    return False, "mailbox_full"
                else:
                    return None, f"smtp_code_{code}"

            except (smtplib.SMTPServerDisconnected, smtplib.SMTPConnectError,
                    socket.timeout, OSError):
                continue

        return None, "smtp_unreachable"
