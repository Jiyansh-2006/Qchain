# quantum/main.py
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from api.routes import router as quantum_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Quantum Cryptography API",
    description="Post-Quantum Cryptography for QToken Transactions & NFTs",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router
app.include_router(quantum_router)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"{request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

@app.get("/")
async def root():
    return {
        "message": "Quantum Cryptography API",
        "version": "1.0.0",
        "endpoints": {
            "generate_wallet": "/quantum/generate-wallet",
            "sign_transaction": "/quantum/sign-transaction",
            "verify_transaction": "/quantum/verify-transaction",
            "encrypt_data": "/quantum/encrypt-data",
            "decrypt_data": "/quantum/decrypt-data",
            "nft_hash": "/quantum/generate-nft-hash",
            "health": "/quantum/health",
            "docs": "/docs"
        }
    }

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
        reload=True
    )