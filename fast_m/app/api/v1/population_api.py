# # app/api/v1/population_api.py
# from typing import List, Optional
# from fastapi import APIRouter, HTTPException
# from pydantic import BaseModel, Field

# from app.services.population_service import PopulationService

# router = APIRouter()


# class PopulationRequest(BaseModel):
#     csv_filename: str = Field(..., description="CSV file in media/temp/")
#     village_code: Optional[List[str]] = Field(None)
#     subdistrict_code: Optional[List[int]] = Field(None)
#     lpcd: Optional[float] = Field(60, description="Liters per capita per day")

#     @property
#     def has_village(self):
#         return self.village_code is not None

#     @property
#     def has_subdistrict(self):
#         return self.subdistrict_code is not None


# @router.post("/forecast-population")
# async def population_forecast(payload: PopulationRequest):
#     if not payload.has_village and not payload.has_subdistrict:
#         raise HTTPException(status_code=400, detail="Provide village_code or subdistrict_code")

#     service = PopulationService()
#     try:
#         result = service.forecast(
#             csv_filename=payload.csv_filename,
#             village_codes=payload.village_code,
#             subdistrict_codes=payload.subdistrict_code,
#             lpcd=payload.lpcd
#         )
#         return result
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))