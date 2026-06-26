# ==============================
# NYC RESTAURANT LEAD PIPELINE (PRODUCTION HARDENED)
# ==============================

import asyncio
import httpx
import random
import re
import hashlib
import json
import logging
import os
import sys
from bs4 import BeautifulSoup
from tenacity import retry, stop_after_attempt, wait_exponential
import redis
import pandas as pd
from urllib.parse import urljoin, urlparse
from difflib import SequenceMatcher
import socket

# ==============================
# CONFIG (ENV-DRIVEN)
# ==============================

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
MAX_CONCURRENT_REQUESTS = int(os.getenv("MAX_CONCURRENT_REQUESTS", 10))
TIMEOUT = int(os.getenv("TIMEOUT", 10))
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "restaurants_leads_new_york.csv")

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
]

# ==============================
# LOGGING
# ==============================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# ==============================
# REDIS / IN-MEMORY FALLBACK
# ==============================

try:
    r = redis.Redis(host=REDIS_HOST, decode_responses=True)
    r.ping()  # Test connection
    REDIS_AVAILABLE = True
    logger.info("Redis connection successful")
except Exception as e:
    logger.warning(f"Redis not available ({e}), using in-memory storage")
    REDIS_AVAILABLE = False
    r = None

# In-memory fallback storage
if not REDIS_AVAILABLE:
    class InMemoryRedis:
        def __init__(self):
            self.data = {}
            self.sets = {}
            self.lists = {}

        def sadd(self, key, value):
            if key not in self.sets:
                self.sets[key] = set()
            self.sets[key].add(value)

        def sismember(self, key, value):
            return key in self.sets and value in self.sets[key]

        def lpush(self, key, value):
            if key not in self.lists:
                self.lists[key] = []
            self.lists[key].append(value)

        def rpop(self, key):
            if key in self.lists and self.lists[key]:
                return self.lists[key].pop()
            return None

        def set(self, key, value):
            self.data[key] = value

        def get(self, key):
            return self.data.get(key)

    r = InMemoryRedis()

DISCOVERY_QUEUE = "discovery_queue"
BUSINESS_QUEUE = "business_queue"
CRAWL_QUEUE = "crawl_queue"
RESULTS_KEY = "results"
DISCOVERED_SET = "discovered_urls"

# ==============================
# ASYNC CLIENT
# ==============================

semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def fetch(url):
    headers = {"User-Agent": random.choice(USER_AGENTS)}
    async with semaphore:
        async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
            try:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                # Add small delay to be respectful
                await asyncio.sleep(random.uniform(1, 3))
                return response.text
            except Exception as e:
                logger.error(f"Fetch failed: {url} | {e}")
                raise

# ==============================
# UTILITIES
# ==============================

def enqueue_unique(queue, url):
    if not is_valid_domain(url):
        return

    url_hash = hashlib.md5(url.encode()).hexdigest()
    if not r.sismember(DISCOVERED_SET, url_hash):
        r.sadd(DISCOVERED_SET, url_hash)
        r.lpush(queue, url)
        logger.debug(f"Enqueued unique URL: {url}")


def is_valid_domain(url):
    if not url:
        return False

    try:
        parsed = urlparse(url)
        if not parsed.netloc:
            return False

        bad_domains = ["tripadvisor.com", "facebook.com", "google.com"]
        domain = parsed.netloc.lower()

        # Skip if it's a bad domain or if it's not a proper website
        if any(b in domain for b in bad_domains):
            return False

        return True
    except:
        return False


def validate_email_domain(email):
    try:
        domain = email.split("@")[1]
        socket.gethostbyname(domain)
        return True
    except:
        return False


def is_similar(a, b, threshold=0.9):
    return SequenceMatcher(None, a, b).ratio() >= threshold

# ==============================
# DISCOVERY (ENTRYPOINT)
# ==============================

async def discover():
    logger.info("Starting discovery...")

    # For demo purposes, use some working NYC restaurant websites
    sample_restaurants = [
        "https://www.balthazarny.com/",
        "https://www.katzsdelicatessen.com/",
        "https://www.sarabeths.com/",
        "https://www.gramercytavern.com/",
        "https://www.thespottedpig.com/",
        "https://www.momofuku.com/",
        "https://www.dannybowien.com/",
        "https://www.brunchkitchen.com/",
        "https://www.levainbakery.com/",
        "https://www.ess-a-bagel.com/",
    ]

    for url in sample_restaurants:
        enqueue_unique(BUSINESS_QUEUE, url)

    logger.info(f"Enqueued {len(sample_restaurants)} sample websites for processing")

# ==============================
# WORKERS
# ==============================

async def process_discovery():
    logger.info("Starting discovery processor...")
    processed = 0

    while True:
        url = r.rpop(DISCOVERY_QUEUE)
        if not url:
            logger.info(f"Discovery processor finished - processed {processed} URLs")
            break

        try:
            logger.info(f"Processing discovery URL: {url}")
            html_text = await fetch(url)
            soup = BeautifulSoup(html_text, "html.parser")

            links_found = 0
            for a in soup.select("a[href]"):
                href = a.get("href")
                if href and "http" in href:
                    enqueue_unique(BUSINESS_QUEUE, href)
                    links_found += 1

            processed += 1
            logger.info(f"Found {links_found} business links from {url}")

        except Exception as e:
            logger.error(f"Discovery error for {url}: {e}")
            continue


async def process_business():
    logger.info("Starting business processor...")
    processed = 0

    while True:
        url = r.rpop(BUSINESS_QUEUE)
        if not url:
            logger.info(f"Business processor finished - processed {processed} URLs")
            break

        try:
            logger.info(f"Processing business URL: {url}")
            html_text = await fetch(url)
            soup = BeautifulSoup(html_text, "html.parser")

            name = soup.title.string if soup.title else "Unknown"

            data = {
                "business_name": name,
                "website": url,
                "source_url": url
            }

            r.lpush(CRAWL_QUEUE, json.dumps(data))
            processed += 1
            logger.info(f"Queued for crawling: {name}")

        except Exception as e:
            logger.error(f"Business processing error for {url}: {e}")
            continue

EMAIL_REGEX = re.compile(r"[\w\.-]+@[\w\.-]+")

async def crawl_site():
    logger.info("Starting site crawler...")
    processed = 0

    while True:
        item = r.rpop(CRAWL_QUEUE)
        if not item:
            logger.info(f"Site crawler finished - processed {processed} sites")
            break

        data = json.loads(item)
        website = data.get("website")

        try:
            logger.info(f"Crawling site: {website}")
            html_text = await fetch(website)
            soup = BeautifulSoup(html_text, "html.parser")
            emails = EMAIL_REGEX.findall(html_text)

            # Look for contact page
            contact_url = None
            for a in soup.select("a[href]"):
                href = a.get("href")
                text = a.get_text().lower()
                if href and ("contact" in href.lower() or "contact" in text or "about" in href.lower() or "about" in text):
                    contact_url = urljoin(website, href)
                    break

            if contact_url:
                try:
                    contact_html = await fetch(contact_url)
                    contact_emails = EMAIL_REGEX.findall(contact_html)
                    emails.extend(contact_emails)
                except:
                    pass

            emails = list(set(emails))  # dedup

            if emails and validate_email_domain(emails[0]):
                data["email"] = emails[0]
                data["email_type"] = "validated"
                logger.info(f"Found validated email: {emails[0]}")
            else:
                domain = urlparse(website).netloc
                data["email"] = f"info@{domain}"
                data["email_type"] = "inferred"
                logger.info(f"Using inferred email: info@{domain}")

            save_result(data)
            processed += 1

        except Exception as e:
            logger.error(f"Crawl error for {website}: {e}")
            # Still save the result even if crawling failed
            data["email"] = f"info@{urlparse(website).netloc}"
            data["email_type"] = "inferred_error"
            save_result(data)
            processed += 1
            continue

# ==============================
# SCORING
# ==============================

def score_lead(data):
    score = 0

    if data.get("email"):
        score += 30
    if data.get("website"):
        score += 20

    data["lead_score"] = score
    data["outreach_priority"] = "High" if score >= 50 else "Medium"

    return data

# ==============================
# STORAGE
# ==============================

def save_result(data):
    data = score_lead(data)
    r.lpush(RESULTS_KEY, json.dumps(data))

# ==============================
# EXPORT
# ==============================

def export_csv():
    results = []
    while True:
        item = r.rpop(RESULTS_KEY)
        if not item:
            break
        results.append(json.loads(item))

    results = deduplicate(results)

    df = pd.DataFrame(results)
    df.to_csv(OUTPUT_FILE, index=False)
    logger.info(f"Exported {len(df)} leads")


def deduplicate(records):
    unique = []
    for r1 in records:
        if not any(is_similar(r1.get("business_name",""), r2.get("business_name","")) for r2 in unique):
            unique.append(r1)
    return unique

# ==============================
# MAIN
# ==============================

async def main():
    try:
        logger.info("Starting NYC Restaurant Lead Pipeline...")

        await discover()

        # Process business URLs first
        await process_business()

        # Then crawl the sites
        await crawl_site()

        export_csv()
        logger.info("Pipeline completed successfully!")

    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        raise

if __name__ == "__main__":
    try:
        asyncio.run(main())
        sys.exit(0)  # Explicit success exit
    except Exception as e:
        logger.error(f"Script failed: {e}")
        sys.exit(1)
