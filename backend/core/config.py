"""Application configuration."""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings."""

    # Application
    APP_NAME: str = "Web Scraper Tool"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Server
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # Scraping
    DEFAULT_TIMEOUT: int = 30
    MAX_CONCURRENT_REQUESTS: int = 5
    USER_AGENT: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

    # Selenium
    SELENIUM_HEADLESS: bool = True
    SELENIUM_TIMEOUT: int = 30

    # Rate limiting
    REQUEST_DELAY: float = 1.0  # seconds between requests

    # Output
    OUTPUT_DIR: str = "output"

    # OpenCode Zen API
    OPENAI_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()