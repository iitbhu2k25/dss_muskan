# app/api/router.py
from fastapi import APIRouter

# Import the actual router objects (not modules)
from app.api.v1.well_api import router as well_router
from app.api.v1.upload_temp import router as upload_router
from app.api.v1.trend_api import router as trend_router
from app.api.v1.recharge_api import router as recharge_router

router = APIRouter()

# Include all versioned routes under /gwa
router.include_router(well_router, prefix="/gwa", tags=["Wells"])
router.include_router(upload_router, prefix="/gwa", tags=["Upload CSV"])
router.include_router(trend_router, prefix="/gwa", tags=["Trends"])
router.include_router(recharge_router, prefix="/gwa", tags=["Recharge"])