# Web Scraper Tool 🌐

A professional web scraping application with a modern **Hero UI PRO Dark theme** frontend, built with Python and Next.js.

![Web Scraper Tool](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/python-3.8+-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

### 🔍 Web Scraping
- **Requests Scraper** - Fast HTTP scraping for static pages
- **BeautifulSoup Scraper** - Advanced HTML parsing with metadata extraction
- **Selenium Scraper** - JavaScript-enabled scraping for dynamic websites

### 🔎 Web Search
- **Google Search** - Comprehensive search results
- **Bing Search** - Microsoft search engine
- **DuckDuckGo Search** - Privacy-focused search

### 🎨 Beautiful UI
- **Hero UI PRO** - Modern dark theme components
- **Responsive Design** - Works on all screen sizes
- **Real-time Results** - Live scraping results display

---

## Project Structure

```
Bridgenton_The_app_of_the_year/
├── backend/                 # Python FastAPI backend
│   ├── core/               # Configuration and utilities
│   ├── scrapers/           # Scraper implementations
│   │   ├── base.py                    # Base scraper interface
│   │   ├── requests_scraper.py        # HTTP scraper
│   │   ├── beautifulsoup_scraper.py   # Advanced parser
│   │   └── selenium_scraper.py        # Browser automation
│   ├── search/             # Search engine scrapers
│   │   └── search_engines.py          # Google, Bing, DuckDuckGo
│   ├── main.py             # FastAPI application
│   └── requirements.txt    # Python dependencies
│
├── frontend/               # Next.js React frontend
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   ├── components/    # React components
│   │   │   ├── ScraperPanel.tsx      # Scraper controls
│   │   │   ├── SearchPanel.tsx       # Search controls
│   │   │   └── ResultsDisplay.tsx    # Results display
│   │   └── lib/           # Utilities and API client
│   ├── package.json       # Node.js dependencies
│   └── tailwind.config.ts # Tailwind configuration
│
├── .gitignore
└── README.md
```

---

## Installation

### 1. Clone or Download

```bash
cd C:\Users\Sitcd3\Documents\Bridgenton_The_app_of_the_year
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env   # Windows
cp .env.example .env     # Linux/Mac
```

### 3. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install Node.js dependencies
npm install
```

---

## Running the Application

### Start Backend Server

```bash
# From backend directory
cd backend
venv\Scripts\activate  # Windows
python main.py
```

The API server will start at: **http://127.0.0.1:8000**

- API Docs: http://127.0.0.1:8000/docs
- Health Check: http://127.0.0.1:8000/health

### Start Frontend Server

```bash
# From frontend directory (new terminal)
cd frontend
npm run dev
```

The frontend will start at: **http://localhost:3000**

---

## API Reference

### Endpoints

#### `POST /scrape`
Scrape a URL using specified scraper.

**Request:**
```json
{
  "url": "https://example.com",
  "scraper": "requests",
  "timeout": 30
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://example.com",
    "title": "Example Domain",
    "content": "Page text content...",
    "html": "<html>...",
    "links": ["https://..."],
    "images": ["https://..."],
    "metadata": {},
    "status_code": 200,
    "timestamp": "2026-06-13T10:00:00"
  }
}
```

#### `POST /search`
Search the web using specified engine.

**Request:**
```json
{
  "query": "web scraping",
  "engine": "google",
  "num_results": 10
}
```

#### `GET /search/all`
Search all engines at once.

**Request:**
```
GET /search/all?query=web+scraping&num_results=10
```

---

## Scraper Types

### Requests Scraper
- **Best for:** Static HTML pages
- **Speed:** Very fast
- **Features:** Basic HTML parsing, link extraction, metadata

### BeautifulSoup Scraper
- **Best for:** Detailed content extraction
- **Speed:** Fast
- **Features:** Advanced parsing, tables, headings, structured data

### Selenium Scraper
- **Best for:** JavaScript-heavy websites
- **Speed:** Slower (full browser)
- **Features:** Full browser automation, dynamic content, interactions

---

## Search Engines

| Engine | Description | Best For |
|--------|-------------|----------|
| Google | Most comprehensive | General searches |
| Bing | Microsoft engine | Alternative results |
| DuckDuckGo | Privacy-focused | Private searches |

---

## Configuration

### Backend (.env)

```bash
# Server
HOST=127.0.0.1
PORT=8000

# Scraping
DEFAULT_TIMEOUT=30
MAX_CONCURRENT_REQUESTS=5

# Selenium
SELENIUM_HEADLESS=True
SELENIUM_TIMEOUT=30
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

---

## Development

### Adding New Scrapers

1. Create new scraper class in `backend/scrapers/`
2. Implement `BaseScraper` interface
3. Add to API in `main.py`
4. Update frontend scraper options

### Adding New Search Engines

1. Create scraper class in `backend/search/`
2. Add to `SearchService.engines`
3. Update frontend engine selector

---

## Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Selenium ChromeDriver issues:**
```bash
# Install webdriver-manager handles this automatically
pip install webdriver-manager
```

### Frontend Issues

**API connection failed:**
- Ensure backend is running
- Check `NEXT_PUBLIC_API_URL` in `.env.local`

**Module not found:**
```bash
npm install
```

---

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Requests** - HTTP library
- **BeautifulSoup4** - HTML parsing
- **Selenium** - Browser automation
- **Pydantic** - Data validation

### Frontend
- **Next.js 14** - React framework
- **Hero UI PRO** - UI component library
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety
- **Axios** - HTTP client

---

## License

MIT License - See LICENSE file for details.

---

## Support

For issues and questions, please check the documentation or review the code comments.

**Built with ❤️ using Hero UI PRO Dark Theme**