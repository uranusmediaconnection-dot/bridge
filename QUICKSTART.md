# Web Scraper Tool - Quick Start Guide

## Quick Installation (Windows)

Open PowerShell and run:

```powershell
# Navigate to project
cd C:\Users\Sitcd3\Documents\Bridgenton_The_app_of_the_year

# Setup Backend
cd backend
python -m venv venv
.\venv\Scripts\Activate
pip install -r requirements.txt
Copy-Item .env.example .env

# Setup Frontend (new terminal)
cd ..\frontend
npm install

# Start Backend
cd ..\backend
.\venv\Scripts\Activate
python main.py

# Start Frontend (new terminal)
cd ..\frontend
npm run dev
```

## Access the Application

- **Frontend UI:** http://localhost:3000
- **API Docs:** http://127.0.0.1:8000/docs

## Quick Test

1. Open http://localhost:3000
2. Enter URL: `https://example.com`
3. Select scraper: `Requests (Fast)`
4. Click "Start Scraping"
5. View results in the right panel

## Search Test

1. Click "Web Search" tab
2. Enter query: `web scraping`
3. Select engine: `Google`
4. Click "Search"
5. View search results