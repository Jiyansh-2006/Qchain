@echo off
echo Installing dependencies...
pip install fastapi uvicorn pydantic

echo.
echo ========================================
echo 🚀 STARTING QUANTUM CRYPTO API
echo 📡 Port: 8002
echo 📚 Docs: http://localhost:8002/docs
echo 🏥 Health: http://localhost:8002/health
echo ========================================
echo.

python main.py