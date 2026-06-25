"""Pytest configuration and shared fixtures."""

import sys
import os

# Add parent directory to path for imports so backend.main can be found
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient
from backend.main import app


@pytest.fixture
def client():
    """Create a test client for FastAPI app."""
    return TestClient(app)


@pytest.fixture
def sample_html():
    """Sample HTML for testing."""
    return """
    <html>
    <head>
        <title>Test Page</title>
        <meta name="description" content="Test description">
    </head>
    <body>
        <h1>Hello World</h1>
        <p>Test content</p>
        <a href="/link">Link</a>
        <img src="/image.png">
    </body>
    </html>
    """