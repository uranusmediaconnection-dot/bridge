# HuggingFace Space Deployment Guide

## Supabase Connection

This app is configured to connect to the Supabase project:
**https://supabase.com/dashboard/project/zxsaapxgoyugvicrdhja**

### Required Environment Variables

Set these as **HuggingFace Space Secrets** (Settings → Secrets in your Space):

| Variable | Where to Find It | Description |
|----------|------------------|-------------|
| `SUPABASE_URL` | Supabase Dashboard → Project Settings → API | Your project URL (e.g., `https://zxsaapxgoyugvicrdhja.supabase.co`) |
| `SUPABASE_SECRET_KEY` | Supabase Dashboard → Project Settings → API → `service_role` key | Backend admin key (bypasses RLS) |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard → Project Settings → API → `anon` key | Frontend public key (respects RLS) |
| `OPENROUTER_API_KEY` | https://openrouter.ai/keys | Fallback AI chat API key |

### How to Set HF Secrets

1. Go to your HuggingFace Space
2. Click **Settings** tab
3. Scroll to **Repository secrets**
4. Click **New secret**
5. Add each variable above

### Verify Connection

After deployment, check the `/health` endpoint:
```
curl https://<your-space>.hf.space/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "database": "connected"
}
```

If `"database": "disconnected"`, check your Supabase secrets.

## Database Schema

Run this SQL in the Supabase SQL Editor to set up tables:

```sql
-- See supabase-schema.sql in the repo root
```

## Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Supabase not configured` | Check secrets are set in HF Space Settings |
| `401 from Supabase` | Use `service_role` key, not `anon` key for `SUPABASE_SECRET_KEY` |
| `Port already in use` | HF expects port 8000 (configured in Dockerfile) |
| AI chat not working | Set `OPENROUTER_API_KEY` or add user API keys via Providers panel |
