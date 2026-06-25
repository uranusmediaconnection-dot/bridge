---
title: Bridgenton Web Scraper
emoji: 🌐
colorFrom: purple
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
license: mit
short_description: Professional web scraping tool with AI-powered features, lead enrichment, and swarm intelligence.
---

# Bridgenton - The Web Scraper App of the Year 🌐

A professional web scraping application with a modern **Hero UI PRO Dark theme** frontend, built with Python and Next.js.

![Web Scraper Tool](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/python-3.8+-green)
![License](https://img.shields.io/badge/license-MIT-blue)

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
