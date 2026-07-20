from fastapi import APIRouter

router = APIRouter(prefix="", tags=["health"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "EduAI Assistant Backend API",
        "version": "1.0.0"
    }
