# Deployment Instructions

## 1. Start the Backend Server
Open a terminal (PowerShell or CMD) and run:

```powershell
cd C:\Users\Sitcd3\Documents\Bridgenton_The_app_of_the_year\backend
.\venv\Scripts\activate
python main.py
```
*Backend running at:* `http://127.0.0.1:8000`

## 2. Start the Frontend Server
Open a second terminal and run:

```powershell
cd C:\Users\Sitcd3\Documents\Bridgenton_The_app_of_the_year\frontend
npm run dev
```
*Frontend running at:* `http://localhost:3000`

## 3. Test the Swarm Feature
1.  Go to **http://localhost:3000**.
2.  Click the **"AI Swarm"** tab (purple button).
3.  Select an **Industry**, enter a **Location**, and adjust the **Amount**.
4.  Click **"Activate Swarm"**.
5.  Watch the dashboard as the 4 agents (Architect, Coder, Debugger, Supervisor) update their status in real-time.
6.  Results will appear on the right side.

---

## Files Modified
- **`backend/main.py`**: Added `/swarm` endpoint and logic.
- **`frontend/src/lib/api.ts`**: Added Swarm types and API method.
- **`frontend/src/app/page.tsx`**: Added Swarm tab and results view.
- **`frontend/src/components/SwarmDashboard.tsx`**: **New** component with full UI and agent simulation.
