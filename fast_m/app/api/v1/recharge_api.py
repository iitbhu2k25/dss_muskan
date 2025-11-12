# app/api/v1/recharge_api.py
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

from app.services.recharge_service import RechargeService

router = APIRouter()


class RechargeRequest(BaseModel):
    csvFilename: str = Field(..., description="CSV in media/temp/")
    selectedVillages: Optional[List[str]] = Field(None)
    selectedSubDistricts: Optional[List[int]] = Field(None)

    @field_validator("selectedVillages", "selectedSubDistricts", mode="before")
    def check_at_least_one(cls, v, info):
        values = info.data
        if info.field_name == "selectedVillages":
            if v is None and values.get("selectedSubDistricts") is None:
                raise ValueError("Either selectedVillages or selectedSubDistricts must be provided")
        elif info.field_name == "selectedSubDistricts":
            if v is None and values.get("selectedVillages") is None:
                raise ValueError("Either selectedVillages or selectedSubDistricts must be provided")
        return v


# ==============================
# POST /recharge
# ==============================
@router.post("/recharge2")
async def groundwater_recharge_analysis(payload: RechargeRequest):
    service = RechargeService(media_root="media")
    try:
        result = service.analyze(
            csv_filename=payload.csvFilename,
            selected_villages=payload.selectedVillages,
            selected_subdistricts=payload.selectedSubDistricts
        )
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))