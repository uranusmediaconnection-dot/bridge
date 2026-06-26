# Deployment Checklist

## ✅ Pre-Deployment Verification

### Supabase Connection
- [x] Supabase client configured in `backend/database/supabase_client.py`
- [x] Environment variables: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_PUBLISHABLE_KEY`
- [x] Schema file ready: `supabase-schema.sql`
- [x] Connection check endpoint: `/health`
- [ ] **ACTION**: Run schema SQL in Supabase dashboard: https://supabase.com/dashboard/project/zxsaapxgoyugvicrdhja/sql

### API Keys
- [x] OpenRouter integration in `backend/routes/ai_chat.py`
- [x] User-provided API keys support (OpenRouter, OpenAI, Anthropic)
- [x] Keys stored in localStorage (frontend)
- [ ] **ACTION**: Set `OPENROUTER_API_KEY` as fallback in deployment secrets

### Backend
- [x] FastAPI app in `backend/main.py`
- [x] All endpoints functional
- [x] Swarm engine implemented: `backend/engine/swarm_engine.py`
- [x] Tests pass: `backend/tests/`

### Frontend
- [x] Next.js app builds successfully
- [x] Tests pass: 98/98
- [x] Providers panel with API key input
- [x] AI Chat with multi-provider support
- [x] Search panel with debug console
- [x] Macedonian Cyrillic letters in animation

### Deployment Config
- [x] Dockerfile configured for HuggingFace
- [x] `.env.example` created
- [x] `.gitignore` excludes secrets
- [x] GitHub Actions CI/CD workflow
- [x] README.md with HF Space metadata
- [x] Issue templates

## 🚀 Deployment Steps

### GitHub
1. `git add .`
2. `git commit -m "feat: prepare for deployment with Supabase, AI providers, and CI/CD"`
3. `git push origin main`
4. Verify GitHub Actions pass

### HuggingFace Spaces
1. Go to https://huggingface.co/new-space
2. Create space with:
   - Name: `bridgenton-web-intelligence`
   - SDK: **Docker**
   - Visibility: Public or Private
3. Link GitHub repository
4. Set repository secrets in HF Space Settings:
   - `SUPABASE_URL` = `https://zxsaapxgoyugvicrdhja.supabase.co`
   - `SUPABASE_SECRET_KEY` = (from Supabase dashboard)
   - `SUPABASE_PUBLISHABLE_KEY` = (from Supabase dashboard)
   - `OPENROUTER_API_KEY` = (from openrouter.ai)
5. Deploy and verify at `https://huggingface.co/spaces/<username>/bridgenton-web-intelligence`

### Verify Deployment
- [ ] Health check: `curl https://<space>.hf.space/health` returns `"database": "connected"`
- [ ] Frontend loads at `https://<space>.hf.space/`
- [ ] AI Chat works with user-provided API keys
- [ ] Search panel debug console shows logs
- [ ] Swarm dashboard executes successfully
