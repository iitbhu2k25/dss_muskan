from fastapi import APIRouter
from app.api.v1 import well_api, upload_temp

router = APIRouter()

# Include all versioned routes
router.include_router(well_api.router, prefix="/gwa", tags=["Wells"])
router.include_router(upload_temp.router, prefix="/gwa", tags=["Upload CSV"])
