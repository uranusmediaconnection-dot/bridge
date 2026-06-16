"""JavaScript-enabled scraper using Selenium."""

import time
from typing import List, Optional
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

from .base import BaseScraper, ScrapedResult


class SeleniumScraper(BaseScraper):
    """Scraper using Selenium for JavaScript-heavy sites."""

    def __init__(
        self,
        timeout: int = 30,
        headless: bool = True,
        wait_time: int = 5,
    ):
        super().__init__(timeout)
        self.headless = headless
        self.wait_time = wait_time
        self.driver = None

    def _create_driver(self) -> webdriver.Chrome:
        """Create Chrome WebDriver."""
        options = Options()

        if self.headless:
            options.add_argument("--headless=new")

        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument(
            "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )

        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option("useAutomationExtension", False)

        service = Service()
        driver = webdriver.Chrome(service=service, options=options)
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

        return driver

    def scrape(
        self,
        url: str,
        wait_selector: Optional[str] = None,
        scroll: bool = False,
    ) -> ScrapedResult:
        """Scrape a URL using Selenium."""
        if not self.validate_url(url):
            return ScrapedResult(
                url=url,
                title="",
                content="",
                html="",
                error="Invalid URL format",
                status_code=400,
            )

        driver = None
        try:
            driver = self._create_driver()
            driver.set_page_load_timeout(self.timeout)

            driver.get(url)

            # Wait for specific element if provided
            if wait_selector:
                try:
                    WebDriverWait(driver, self.wait_time).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, wait_selector))
                    )
                except TimeoutException:
                    pass  # Continue anyway

            # Scroll to load lazy content
            if scroll:
                self._scroll_page(driver)

            # Small delay for dynamic content
            time.sleep(2)

            # Get page source
            html = driver.page_source

            # Extract title
            title = driver.title

            # Extract text content
            content = driver.find_element(By.TAG_NAME, "body").text

            # Extract links
            links = []
            for a in driver.find_elements(By.TAG_NAME, "a"):
                href = a.get_attribute("href")
                if href:
                    links.append(href)

            # Extract images
            images = []
            for img in driver.find_elements(By.TAG_NAME, "img"):
                src = img.get_attribute("src")
                if src:
                    images.append(src)

            # Extract metadata
            metadata = {}
            for meta in driver.find_elements(By.TAG_NAME, "meta"):
                name = meta.get_attribute("name") or meta.get_attribute("property")
                content = meta.get_attribute("content")
                if name and content:
                    metadata[name] = content

            return ScrapedResult(
                url=url,
                title=title or "",
                content=content[:15000],
                html=html,
                links=list(set(links))[:100],
                images=list(set(images))[:50],
                metadata=metadata,
                status_code=200,
            )

        except TimeoutException:
            return ScrapedResult(
                url=url,
                title="",
                content="",
                html="",
                error="Page load timed out",
                status_code=408,
            )
        except Exception as e:
            return ScrapedResult(
                url=url,
                title="",
                content="",
                html="",
                error=str(e),
                status_code=500,
            )
        finally:
            if driver:
                driver.quit()

    def _scroll_page(self, driver: webdriver.Chrome) -> None:
        """Scroll to bottom of page to load lazy content."""
        last_height = driver.execute_script("return document.body.scrollHeight")
        while True:
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(2)
            new_height = driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height

    def scrape_with_interaction(
        self,
        url: str,
        click_selector: Optional[str] = None,
        fill_selectors: Optional[dict] = None,
    ) -> ScrapedResult:
        """Scrape with page interaction (click, fill forms)."""
        if not self.validate_url(url):
            return ScrapedResult(
                url=url,
                title="",
                content="",
                html="",
                error="Invalid URL format",
                status_code=400,
            )

        driver = None
        try:
            driver = self._create_driver()
            driver.set_page_load_timeout(self.timeout)
            driver.get(url)

            # Fill form fields
            if fill_selectors:
                for selector, value in fill_selectors.items():
                    try:
                        element = driver.find_element(By.CSS_SELECTOR, selector)
                        element.clear()
                        element.send_keys(value)
                    except Exception:
                        pass

            # Click element
            if click_selector:
                try:
                    element = driver.find_element(By.CSS_SELECTOR, click_selector)
                    element.click()
                    time.sleep(2)  # Wait for action to complete
                except Exception:
                    pass

            time.sleep(2)

            html = driver.page_source
            title = driver.title
            content = driver.find_element(By.TAG_NAME, "body").text

            return ScrapedResult(
                url=url,
                title=title or "",
                content=content[:15000],
                html=html,
                status_code=200,
            )

        except Exception as e:
            return ScrapedResult(
                url=url,
                title="",
                content="",
                html="",
                error=str(e),
                status_code=500,
            )
        finally:
            if driver:
                driver.quit()

    def scrape_multiple(self, urls: List[str]) -> List[ScrapedResult]:
        """Scrape multiple URLs."""
        return [self.scrape(url) for url in urls]