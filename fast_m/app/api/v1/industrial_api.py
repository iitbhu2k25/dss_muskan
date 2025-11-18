# # app/api/v1/industrial_api.py
# from fastapi import APIRouter, HTTPException
# from pydantic import BaseModel, Field
# from typing import List, Dict, Any

# from app.services.industrial_service import IndustrialService

# router = APIRouter()

# service = IndustrialService()


# class SubIndustryData(BaseModel):
#     """Model for sub-industry data with count and SWC"""
#     count: int = Field(..., ge=0, description="Number of sub-industry units")
#     swc: str = Field(..., description="Specific Water Consumption range (e.g., '2.3 - 3.9' or '237.1')")


# class IndustrialDemandRequest(BaseModel):
#     """Request model for industrial demand calculation"""
#     subdistrict_code: List[str] = Field(
#         ..., 
#         description="List of subdistrict codes",
#         min_items=1
#     )
#     industrial_data: Dict[str, Dict[str, SubIndustryData]] = Field(
#         ...,
#         description="Industrial data with industry types, sub-industries, and counts"
#     )

#     class Config:
#         schema_extra = {
#             "example": {
#                 "subdistrict_code": ["2801001", "2801002"],
#                 "industrial_data": {
#                     "Thermal Power Plants": {
#                         "Small (Up to 1000 MW)": {"count": 5, "swc": "2.3 - 3.9"},
#                         "Medium (Between 1000 to 2500 MW)": {"count": 3, "swc": "1.9 - 6.5"}
#                     },
#                     "Pulp & Paper": {
#                         "Integrated Mills": {"count": 2, "swc": "30.5 - 33.0"}
#                     },
#                     "Textiles": {
#                         "Integrated Industry (cotton)": {"count": 10, "swc": "104.1 - 343.5"}
#                     },
#                     "Iron & Steel": {
#                         "Iron & Steel": {"count": 4, "swc": "5.3 - 7.7"}
#                     }
#                 }
#             }
#         }


# @router.post("/industrial")
# def calculate_industrial_demand(payload: IndustrialDemandRequest):
#     """
#     Calculate industrial water demand based on industry types, sub-industries, counts, and SWC values.
    
#     This endpoint:
#     1. Accepts industry types with their sub-industries, counts, and SWC values
#     2. Calculates demand using mean of SWC range multiplied by count
#     3. Converts MW to MT where applicable
#     4. Returns total demand and detailed breakdown
    
#     Args:
#         payload: IndustrialDemandRequest containing subdistrict codes and industrial data
        
#     Returns:
#         Dictionary with calculation results including:
#         - summary: Overall statistics and total demand
#         - detailed_results: Individual sub-industry calculations
#         - grouped_by_industry: Results grouped by industry type
#     """
#     try:
#         # Validate subdistrict codes
#         if not payload.subdistrict_code:
#             raise HTTPException(
#                 status_code=400,
#                 detail="At least one subdistrict code is required"
#             )
        
#         # Convert Pydantic model to dict format expected by service
#         industrial_data_dict = {}
#         for industry_type, sub_industries in payload.industrial_data.items():
#             industrial_data_dict[industry_type] = {}
#             for sub_name, sub_data in sub_industries.items():
#                 industrial_data_dict[industry_type][sub_name] = {
#                     "count": sub_data.count,
#                     "swc": sub_data.swc 
#                 }
        
#         # Validate industrial data
#         validation_result = service.validate_industrial_data(industrial_data_dict)
        
#         if not validation_result["valid"]:
#             raise HTTPException(
#                 status_code=400,
#                 detail={
#                     "message": "Invalid industrial data",
#                     "errors": validation_result["errors"],
#                     "warnings": validation_result["warnings"]
#                 }
#             )
        
#         # Process industrial demand calculation
#         result = service.process_industrial_demand(
#             subdistrict_code=payload.subdistrict_code,
#             industrial_data=industrial_data_dict
#         )
        
#         if not result.get("success"):
#             raise HTTPException(
#                 status_code=400,
#                 detail=result.get("message", "Failed to calculate industrial demand")
#             )
        
#         # Include warnings if any
#         if validation_result["warnings"]:
#             result["warnings"] = validation_result["warnings"]
        
#         return result
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Internal server error: {str(e)}"
#         )


# @router.get("/industrial/metadata")
# def get_industrial_metadata():
#     """
#     Get metadata about available industry types and sub-industries.
    
#     Returns:
#         Dictionary containing all available industry types, their sub-industries,
#         units, and SWC ranges
#     """
#     try:
#         metadata = {
#             "industry_types": []
#         }
        
#         for industry_type, industry_info in service.INDUSTRIAL_DATA.items():
#             industry_metadata = {
#                 "name": industry_type,
#                 "unit": industry_info["unit"],
#                 "sub_industries": []
#             }
            
#             for sub_name, sub_info in industry_info["subIndustries"].items():
#                 swc_range = sub_info["swc_range"]
#                 industry_metadata["sub_industries"].append({
#                     "name": sub_name,
#                     "swc_range": {
#                         "min": swc_range[0],
#                         "max": swc_range[1],
#                         "mean": (swc_range[0] + swc_range[1]) / 2
#                     }
#                 })
            
#             metadata["industry_types"].append(industry_metadata)
        
#         return {
#             "success": True,
#             "data": metadata
#         }
        
#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Failed to retrieve metadata: {str(e)}"
#         )