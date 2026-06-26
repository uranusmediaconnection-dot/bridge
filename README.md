---
title: Bridgenton Web Intelligence Suite
emoji: 🐙
colorFrom: purple
colorTo: cyan
sdk: docker
app_port: 7860
pinned: false
license: mit
short_description: AI-powered web intelligence suite with swarm scraping, lead enrichment, and multi-provider AI chat
tags:
  - web-scraping
  - ai
  - lead-generation
  - data-extraction
  - supabase
  - openrouter
---

# Bridgenton - The Web Scraper App of the Year 🐙

A professional web intelligence application with a modern **dark theme** frontend, built with Python (FastAPI) and Next.js. Connected to **Supabase** (Postgres) for data persistence.

![Web Scraper Tool](https://img.shields.io/badge/version-2.0.0-blue)
![Python](https://img.shields.io/badge/python-3.11+-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## Quick Deploy

### HuggingFace Spaces
1. Fork this repo
2. Create new Space at https://huggingface.co/new-space
3. Select **Docker** SDK, link your fork
4. Add repository secrets (see below)
5. Deploy!

### GitHub Secrets Required
| Secret | Source | Description |
|--------|--------|-------------|
| `SUPABASE_URL` | [Supabase Dashboard](https://supabase.com/dashboard/project/zxsaapxgoyugvicrdhja/settings/api) | Project URL |
| `SUPABASE_SECRET_KEY` | Supabase Dashboard → API | service_role key |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard → API | publishable/anon key |
| `OPENROUTER_API_KEY` | [OpenRouter](https://openrouter.ai/keys) | AI chat fallback key |

## Features

### 🔍 Web Scraping
- **Stealth Scraper** - TLS fingerprint impersonation for anti-detection
- **Requests Scraper** - Fast HTTP scraping for static pages
- **BeautifulSoup Scraper** - Advanced HTML parsing with metadata extraction
- **Selenium Scraper** - JavaScript-enabled scraping for dynamic websites

### 🔎 Web Search
- **Google Search** - Comprehensive search results
- **Bing Search** - Microsoft search engine
- **DuckDuckGo Search** - Privacy-focused search

### ✨ AI-Powered Features
- **AI Chat** - Built-in AI assistant for data analysis
- **Lead Enrichment** - Auto-discover emails, phones, social profiles, tech stack
- **Email & Phone Validation** - Multi-layer verification
- **Swarm Intelligence** - 4-agent scraping workflow (Architect, Coder, Debugger, Supervisor)

### 🎨 Beautiful UI
- **Hero UI PRO** - Modern dark theme components
- **Responsive Design** - Works on all screen sizes
- **Real-time Results** - Live scraping results display

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Requests** - HTTP library
- **BeautifulSoup4** - HTML parsing
- **Selenium** - Browser automation
- **curl-cffi** - Stealth TLS fingerprinting
- **Pydantic** - Data validation
- **phonenumbers** - Phone validation (Google libphonenumber)

### Frontend
- **Next.js 14** - React framework
- **Hero UI PRO** - UI component library
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety
- **Axios** - HTTP client
- **Framer Motion** - Animations

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/scrape` | POST | Scrape a URL |
| `/api/search` | POST | Search the web |
| `/api/search/all` | GET | Search all engines |
| `/api/swarm` | POST | AI swarm scraping |
| `/api/validate/email` | POST | Validate emails |
| `/api/validate/phone` | POST | Validate phones |
| `/api/enrich/domain` | POST | Enrich a domain |
| `/api/enrich/batch` | POST | Batch enrichment |
| `/api/discovery/emails` | POST | Email discovery |
| `/api/providers` | GET | List AI providers |

## License

MIT License
