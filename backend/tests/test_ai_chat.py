"""Tests for AI chat endpoint."""

import sys
import os
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


class TestAIChatEndpoint:
    """Tests for AI chat endpoints."""

    def test_list_models(self, client):
        """Test listing available models."""
        response = client.get("/api/chat/models")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["models"]) > 0
        assert "provider" in data["models"][0]

    @patch("httpx.AsyncClient.post")
    @patch("os.getenv")
    def test_chat_with_server_key(self, mock_getenv, mock_post, client):
        """Test chat using server-configured OpenRouter key."""
        mock_getenv.return_value = "test-server-key"
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "Hello! How can I help you?"}}]
        }
        mock_post.return_value.__aenter__.return_value = mock_response

        response = client.post("/api/chat/chat", json={
            "message": "Hello",
            "model": "meta-llama/llama-3.1-8b-instruct",
            "provider": "openrouter",
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "Hello! How can I help you?" in data["response"]

    @patch("httpx.AsyncClient.post")
    def test_chat_with_user_key_openrouter(self, mock_post, client):
        """Test chat using user-provided OpenRouter API key."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "Response from OpenRouter"}}]
        }
        mock_post.return_value.__aenter__.return_value = mock_response

        response = client.post("/api/chat/chat", json={
            "message": "Test message",
            "model": "meta-llama/llama-3.1-8b-instruct",
            "provider": "openrouter",
            "api_key": "sk-or-v1-user-key",
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["provider"] == "openrouter"

    @patch("httpx.AsyncClient.post")
    def test_chat_with_user_key_openai(self, mock_post, client):
        """Test chat using user-provided OpenAI API key."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "Response from OpenAI"}}]
        }
        mock_post.return_value.__aenter__.return_value = mock_response

        response = client.post("/api/chat/chat", json={
            "message": "Test message",
            "model": "gpt-4o",
            "provider": "openai",
            "api_key": "sk-proj-user-key",
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["provider"] == "openai"

    @patch("httpx.AsyncClient.post")
    def test_chat_with_user_key_anthropic(self, mock_post, client):
        """Test chat using user-provided Anthropic API key."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "content": [{"text": "Response from Anthropic"}]
        }
        mock_post.return_value.__aenter__.return_value = mock_response

        response = client.post("/api/chat/chat", json={
            "message": "Test message",
            "model": "claude-3-5-sonnet-20241022",
            "provider": "anthropic",
            "api_key": "sk-ant-user-key",
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["provider"] == "anthropic"

    def test_chat_no_api_key(self, client):
        """Test chat fails when no API key is configured."""
        with patch("os.getenv", return_value=None):
            response = client.post("/api/chat/chat", json={
                "message": "Hello",
                "provider": "openrouter",
            })
            
            assert response.status_code == 500
            data = response.json()
            assert "No API key configured" in data["detail"]

    @patch("httpx.AsyncClient.post")
    def test_chat_timeout(self, mock_post, client):
        """Test chat handles timeout gracefully."""
        import httpx
        mock_post.side_effect = httpx.TimeoutException("Request timed out")

        with patch("os.getenv", return_value="test-key"):
            response = client.post("/api/chat/chat", json={
                "message": "Hello",
                "provider": "openrouter",
            })
            
            assert response.status_code == 504

    @patch("httpx.AsyncClient.post")
    def test_chat_provider_error(self, mock_post, client):
        """Test chat handles provider errors."""
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.content = b'{"error": {"message": "Invalid API key"}}'
        mock_response.json.return_value = {"error": {"message": "Invalid API key"}}
        mock_post.return_value.__aenter__.return_value = mock_response

        with patch("os.getenv", return_value="invalid-key"):
            response = client.post("/api/chat/chat", json={
                "message": "Hello",
                "provider": "openrouter",
            })
            
            assert response.status_code == 401

    def test_chat_unsupported_provider(self, client):
        """Test chat rejects unsupported provider."""
        with patch("os.getenv", return_value="test-key"):
            response = client.post("/api/chat/chat", json={
                "message": "Hello",
                "provider": "unsupported",
            })
            
            assert response.status_code == 400
            data = response.json()
            assert "Unsupported provider" in data["detail"]
