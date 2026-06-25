# Bridgenton Cloud Deployment Guide

## Architecture

```
User Browser
     │
     ▼
Next.js Frontend (port 7860)
     │  rewrites /api/* → backend
     ▼
FastAPI Backend (port 8000)
     │
     ├── Supabase (Postgres)
     ├── AI Providers (OpenRouter / etc.)
     ├── Proxy Pools
     └── External APIs (search engines)
```

## 1. Database Setup (Supabase)

### Create Project
1. Visit https://supabase.com/dashboard/new/{project-ref}
2. Choose a strong database password — save it
3. Wait ~2 minutes for provisioning
4. Go to **Project Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **`service_role` key** → `SUPABASE_SERVICE_KEY`

### Run Schema
1. Open **SQL Editor** in Supabase dashboard
2. Paste & run `backend/database/schema.sql`
3. Verify tables created: `scrape_jobs`, `search_queries`, `swarm_sessions`, `enrichment_cache`, `api_keys`

## 2. Deployment to Hugging Face Spaces

### Create Space
1. Visit https://huggingface.co/new-space
2. Space name: `bridgenton` (or choose one)
3. License: MIT
4. Space SDK: Docker
5. Visibility: Public

### Set Secrets
In the Space's **Settings → Repository Secrets**, add:
| Secret | Value |
|--------|-------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Your service_role key |
| `OPENROUTER_API_KEY` | (Optional) For AI chat |

### Deploy
```bash
# Add remote (first time only)
git remote add hf https://huggingface.co/spaces/<your-org>/bridgenton

# Push
git push hf main --force
```

### Verify
```bash
# Health endpoint — should show DB connected
curl https://<org>-bridgenton.hf.space/health

# Frontend
curl https://<org>-bridgenton.hf.space/

# Database stats
curl https://<org>-bridgenton.hf.space/api/stats
```

## 3. Wiring Supabase into the Backend

The backend auto-detects Supabase via env vars. No code changes needed after setup.

### How it works
- `backend/database/supabase_client.py` — initialises client from `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`
- `backend/database/operations.py` — CRUD functions (scrape_jobs, swarm_sessions, etc.)
- `backend/main.py` — calls `init_supabase()` on startup, graceful fallback if not configured
- `/health` endpoint returns `database: "connected"` or `"not_configured"`
- `/api/stats` — aggregate stats from DB
- `/api/jobs` — recent scrape jobs
- `/api/swarms` — recent swarm sessions

### Environment Variables
| Variable | Source | Where to set |
|----------|--------|-------------|
| `SUPABASE_URL` | Supabase → Project Settings → API | HF Secrets |
| `SUPABASE_SERVICE_KEY` | Supabase → Project Settings → API (service_role) | HF Secrets |
| `OPENROUTER_API_KEY` | OpenRouter dashboard | HF Secrets |

## 4. Verifying End-to-End

Once deployed:
1. Check `/health` — DB status should be `"connected"`
2. Run a swarm: `POST /swarm` with `{"industry":"Software","location":"Chicago","amount":100}`
3. Check `/api/swarms` — should show your run
4. Check `/api/stats` — should show non-zero counts

## 5. Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `/health` shows `not_configured` | Secrets not set or not loaded | Check HF Secrets are set and start.sh loads them |
| `401` from Supabase | Wrong key | Use `service_role` key, not `anon` key |
| Docker build fails | NPM peer deps | `--legacy-peer-deps` is already in Dockerfile |
| Blank page | SPA routing issue | Check Next.js rewrites in `next.config.js` |
