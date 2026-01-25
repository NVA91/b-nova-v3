#!/usr/bin/env python3
"""
b-nova-v3 AI Service - Main Application
Supports: NVIDIA RTX 5060 Ti eGPU + AMD Ryzen NPU
"""

import os
import logging
from typing import Optional
from contextlib import asynccontextmanager

import torch
import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from prometheus_client import Counter, Histogram, generate_latest
from prometheus_client import CONTENT_TYPE_LATEST

from models.image_classifier import ImageClassifier
from utils.device_manager import DeviceManager

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# PROMETHEUS METRICS
# ============================================================================

REQUEST_COUNT = Counter(
    'ai_service_requests_total',
    'Total number of requests',
    ['endpoint', 'method']
)

REQUEST_DURATION = Histogram(
    'ai_service_request_duration_seconds',
    'Request duration in seconds',
    ['endpoint']
)

INFERENCE_COUNT = Counter(
    'ai_service_inference_total',
    'Total number of inferences',
    ['model', 'device']
)

# ============================================================================
# GLOBAL STATE
# ============================================================================

device_manager: Optional[DeviceManager] = None
classifier: Optional[ImageClassifier] = None

# ============================================================================
# LIFECYCLE MANAGEMENT
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    global device_manager, classifier
    
    logger.info("🚀 Starting b-nova-v3 AI Service...")
    
    # Initialize device manager
    device_manager = DeviceManager()
    device_manager.detect_devices()
    
    # Initialize model
    device = device_manager.get_best_device()
    logger.info(f"📦 Loading model on device: {device}")
    classifier = ImageClassifier(device=device)
    
    logger.info("✅ AI Service ready!")
    
    yield
    
    logger.info("🛑 Shutting down AI Service...")
    del classifier
    del device_manager

# ============================================================================
# FASTAPI APPLICATION
# ============================================================================

app = FastAPI(
    title="b-nova-v3 AI Service",
    description="AI Service with GPU/NPU Support",
    version="1.0.0",
    lifespan=lifespan
)

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class HealthResponse(BaseModel):
    status: str
    version: str
    device: str
    cuda_available: bool
    rocm_available: bool

class PredictionResponse(BaseModel):
    predictions: list[dict]
    device_used: str
    inference_time_ms: float

# ============================================================================
# ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint"""
    REQUEST_COUNT.labels(endpoint='/', method='GET').inc()
    return {
        "service": "b-nova-v3 AI Service",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint"""
    REQUEST_COUNT.labels(endpoint='/health', method='GET').inc()
    
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        device=str(device_manager.get_best_device()),
        cuda_available=torch.cuda.is_available(),
        rocm_available=device_manager.has_rocm()
    )

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return generate_latest()

@app.get("/devices")
async def list_devices():
    """List available compute devices"""
    REQUEST_COUNT.labels(endpoint='/devices', method='GET').inc()
    
    return {
        "devices": device_manager.list_devices(),
        "current": str(device_manager.get_best_device())
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)):
    """
    Perform image classification
    
    Args:
        file: Image file (JPEG, PNG)
    
    Returns:
        Predictions with confidence scores
    """
    REQUEST_COUNT.labels(endpoint='/predict', method='POST').inc()
    
    try:
        # Read image
        contents = await file.read()
        
        # Perform inference
        with REQUEST_DURATION.labels(endpoint='/predict').time():
            predictions, inference_time = classifier.predict(contents)
        
        # Update metrics
        INFERENCE_COUNT.labels(
            model='resnet50',
            device=str(classifier.device)
        ).inc()
        
        return PredictionResponse(
            predictions=predictions,
            device_used=str(classifier.device),
            inference_time_ms=inference_time * 1000
        )
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/batch")
async def predict_batch(files: list[UploadFile] = File(...)):
    """
    Perform batch image classification
    
    Args:
        files: List of image files
    
    Returns:
        List of predictions
    """
    REQUEST_COUNT.labels(endpoint='/predict/batch', method='POST').inc()
    
    try:
        results = []
        
        for file in files:
            contents = await file.read()
            predictions, inference_time = classifier.predict(contents)
            
            results.append({
                "filename": file.filename,
                "predictions": predictions,
                "inference_time_ms": inference_time * 1000
            })
            
            INFERENCE_COUNT.labels(
                model='resnet50',
                device=str(classifier.device)
            ).inc()
        
        return {
            "results": results,
            "device_used": str(classifier.device),
            "total_images": len(files)
        }
        
    except Exception as e:
        logger.error(f"Batch prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"🌐 Starting server on {host}:{port}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=False,
        log_level="info"
    )