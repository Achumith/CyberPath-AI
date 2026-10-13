@echo off
echo ===================================================
echo   Starting CyberPath AI System
echo   AI-Powered Cyber Attack Graph Prediction System
echo ===================================================

echo [1/2] Launching FastAPI Backend on http://localhost:8000 ...
start "CyberPath AI Backend" cmd /k "call .\venv\Scripts\activate.bat && uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Launching React Frontend on http://localhost:5173 ...
start "CyberPath AI Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo CyberPath AI is starting up!
echo Backend API Docs: http://localhost:8000/docs
echo Frontend SOC UI:  http://localhost:5173
echo ===================================================
