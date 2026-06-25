from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import httpx

router = APIRouter(prefix="/api/chat", tags=["AI Chat"])


class ChatRequest(BaseModel):
    message: str
    model: str = "meta-llama/llama-3.1-8b-instruct"


class ChatResponse(BaseModel):
    success: bool
    response: str
    model: str
    error: str = None


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    api_key = os.getenv("OPENROUTER_API_KEY")
    
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenRouter API key not configured")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "Bridgenton AI Chat",
    }
    
    payload = {
        "model": request.model,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": request.message}
        ],
        "temperature": 0.7,
        "max_tokens": 1000,
    }
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload
            )
            
            if response.status_code != 200:
                error_detail = response.json() if response.content else response.text
                raise HTTPException(status_code=response.status_code, detail=f"OpenRouter error: {error_detail}")
            
            data = response.json()
            ai_response = data["choices"][0]["message"]["content"]
            
            return ChatResponse(
                success=True,
                response=ai_response,
                model=request.model
            )
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Request timed out")
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
