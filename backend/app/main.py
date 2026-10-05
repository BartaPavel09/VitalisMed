from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)) -> dict:
    """
    Verify application health status and database connectivity.

    @param db: Database session dependency injected by FastAPI.
    @return: Dictionary containing service status and database state.
    """
    db.execute(text("SELECT 1"))
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "database": "connected"
    }
