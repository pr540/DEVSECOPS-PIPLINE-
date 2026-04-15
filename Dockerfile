# Multistage build for security and size
# --- Build Frontend ---
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend .
RUN npm run build

# --- Final Image ---
FROM python:3.10-slim
WORKDIR /app

# Security: Don't run as root
RUN useradd -m appuser
USER appuser

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend ./backend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8000

# Security: Use Gunicorn/Uvicorn with proper workers
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
