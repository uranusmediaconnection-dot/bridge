from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
import os
import httpx
from typing import Optional

router = APIRouter(prefix="/api/chat", tags=["AI Chat"])


class ChatRequest(BaseModel):
    message: str
    model: str = "meta-llama/llama-3.1-8b-instruct"
    # Optional: user-provided API key for direct provider access
    api_key: Optional[str] = None
    provider: Optional[str] = "openrouter"


class ChatResponse(BaseModel):
    success: bool
    response: str
    model: str
    provider: str
    error: str = None


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    provider = request.provider or "openrouter"
    
    # Determine which API key to use
    api_key = request.api_key
    
    # If no user-provided key, fall back to server config for OpenRouter
    if not api_key and provider == "openrouter":
        api_key = os.getenv("OPENROUTER_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail=f"No API key configured for {provider}. Please add your API key in the Providers panel."
        )

    try:
        if provider == "openrouter":
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Bridgenton AI Chat",
            }
            payload = {
                "model": request.model,
                "messages": [
                    {"role": "system", "content": "You are a helpful AI assistant for web intelligence and data extraction."},
                    {"role": "user", "content": request.message}
                ],
                "temperature": 0.7,
                "max_tokens": 2000,
            }
            
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json=payload
                )

                if response.status_code != 200:
                    error_detail = response.json() if response.content else response.text
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"OpenRouter error: {error_detail}"
                    )

                data = response.json()
                ai_response = data["choices"][0]["message"]["content"]

            return ChatResponse(
                success=True,
                response=ai_response,
                model=request.model,
                provider="openrouter"
            )

        elif provider == "openai":
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": request.model,
                "messages": [
                    {"role": "system", "content": "You are a helpful AI assistant for web intelligence and data extraction."},
                    {"role": "user", "content": request.message}
                ],
                "temperature": 0.7,
                "max_tokens": 2000,
            }
            
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers=headers,
                    json=payload
                )

                if response.status_code != 200:
                    error_detail = response.json() if response.content else response.text
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"OpenAI error: {error_detail}"
                    )

                data = response.json()
                ai_response = data["choices"][0]["message"]["content"]

            return ChatResponse(
                success=True,
                response=ai_response,
                model=request.model,
                provider="openai"
            )

        elif provider == "anthropic":
            headers = {
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            }
            payload = {
                "model": request.model,
                "max_tokens": 2000,
                "system": "You are a helpful AI assistant for web intelligence and data extraction.",
                "messages": [
                    {"role": "user", "content": request.message}
                ],
            }
            
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers=headers,
                    json=payload
                )

                if response.status_code != 200:
                    error_detail = response.json() if response.content else response.text
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Anthropic error: {error_detail}"
                    )

                data = response.json()
                ai_response = data["content"][0]["text"]

            return ChatResponse(
                success=True,
                response=ai_response,
                model=request.model,
                provider="anthropic"
            )

        else:
            raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Request timed out. The AI model is taking longer than expected.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models", tags=["AI Models"])
async def list_models():
    """List available free models from providers."""
    models = [
        {"id": "meta-llama/llama-3.1-8b-instruct", "name": "Llama 3.1 8B", "provider": "OpenRouter", "free": True},
        {"id": "mistralai/mistral-7b-instruct", "name": "Mistral 7B", "provider": "OpenRouter", "free": True},
        {"id": "google/gemma-2-9b-it", "name": "Gemma 2 9B", "provider": "OpenRouter", "free": True},
        {"id": "microsoft/phi-3-mini-128k-instruct", "name": "Phi-3 Mini", "provider": "OpenRouter", "free": True},
    ]
    return {"success": True, "models": models}
