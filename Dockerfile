# Stage 1: Build Next.js frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install --legacy-peer-deps
COPY frontend/ .
RUN mkdir -p /app/frontend/public
RUN npm run build

# Stage 2: Python backend + Node.js runtime for Next.js
FROM python:3.11-slim AS backend
RUN apt-get update && apt-get install -y --no-install-recommends nodejs npm && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ backend/
COPY --from=frontend-build /app/frontend/.next/standalone /app
COPY --from=frontend-build /app/frontend/.next/static /app/.next/static
RUN mkdir -p /app/public

# Create startup script
RUN echo '#!/bin/bash\n\
cd /app/backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --no-access-log --forwarded-allow-ips="*" &\n\
BACKEND_PID=$!\n\
sleep 2\n\
cd /app && NODE_ENV=production node server.js &\n\
NEXT_PID=$!\n\
echo "Backend PID: $BACKEND_PID, Next.js PID: $NEXT_PID"\n\
wait -n $BACKEND_PID $NEXT_PID\n\
' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 7860
ENV PORT=7860
ENV HOSTNAME=0.0.0.0

CMD ["/app/start.sh"]
