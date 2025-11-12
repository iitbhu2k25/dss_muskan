from fastapi import APIRouter
from app.api.v1 import well_api

router = APIRouter()
router.include_router(well_api.router, prefix="/gwa", tags=["Wells"])
