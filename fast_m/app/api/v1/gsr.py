# app/api/v1/gsr.py
from fastapi import APIRouter, HTTPException, Request, Form
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union
import json
import base64
import os

from app.services.gsr_service import (
    match_village_data,
    merge_gsr_with_shapefile,
    generate_gsr_map_image,
    calculate_gsr_summary,
    load_village_shapefile,
)

router = APIRouter()


@router.post("/gsr")
async def compute_gsr(request: Request):
    """
    Compute GSR (Groundwater Supply-Requirement) analysis with geospatial data
    Matches Django API response structure exactly
    """
    try:
        # Handle different content types
        content_type = request.headers.get("content-type", "")
        
        if "application/json" in content_type:
            data = await request.json()
        elif "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
            form_data = await request.form()
            data = dict(form_data)
        else:
            # Try to parse as JSON anyway
            data = await request.json()
        
        # Log received data for debugging
        print(f"📥 Received data type: {type(data)}")
        print(f"📥 Content-Type: {content_type}")
        print(f"📥 Data keys: {list(data.keys())}")
        
        # Parse JSON strings if needed (like Django does)
        for key in ["rechargeData", "domesticData", "agriculturalData", "selectedSubDistricts"]:
            if key in data and isinstance(data.get(key), str):
                try:
                    data[key] = json.loads(data[key])
                except json.JSONDecodeError:
                    data[key] = []
        
        # Extract data arrays
        recharge_data = data.get('rechargeData', [])
        domestic_data = data.get('domesticData', [])
        agricultural_data = data.get('agriculturalData', [])
        selected_subdistricts = data.get('selectedSubDistricts', [])
        trend_csv_filename = data.get('trendCsvFilename')
        
        # Log trend CSV filename
        if trend_csv_filename:
            print(f"🎯 Received trend CSV filename: {trend_csv_filename}")
        else:
            print("⚠️ No trend CSV filename provided")
        
        # Validation
        if not recharge_data:
            return {
                "success": False,
                "error": "Recharge data is required for GSR analysis"
            }
        
        if not domestic_data and not agricultural_data:
            return {
                "success": False,
                "error": "At least one demand dataset (domestic or agricultural) is required"
            }
        
        # Match village data across all datasets including trend data
        matched_results = match_village_data(
            recharge_data, 
            domestic_data, 
            agricultural_data, 
            trend_csv_filename
        )
        
        if not matched_results:
            return {
                "success": False,
                "error": "No villages could be matched across the provided datasets"
            }
        
        # Sort results by classification priority
        classification_priority = {
            "Over Exploited": 1,
            "Critical": 2,
            "Very Semi-Critical": 3,
            "Safe": 4,
            "Very Safe": 5,
            "Unknown Status": 6,
            "No Data": 7
        }
        
        matched_results.sort(key=lambda x: (
            classification_priority.get(x['gsr_classification'], 999),
            -(x['gsr'] or 0)
        ))
        
        # Calculate summary statistics
        summary = calculate_gsr_summary(matched_results)
        
        # Load village shapefile and merge with GSR data
        village_gdf = load_village_shapefile()
        geospatial_result = None
        map_image_filename = None
        map_image_base64 = None
        
        if village_gdf is not None:
            print("🗺️ Merging GSR data with village shapefile...")
            geospatial_result = merge_gsr_with_shapefile(matched_results, village_gdf)
            
            # Generate map image if merge was successful
            if geospatial_result.get('merged_gdf') is not None:
                print("🎨 Generating GSR map image...")
                map_image_filename = generate_gsr_map_image(geospatial_result['merged_gdf'])
                
                if map_image_filename:
                    map_image_path = os.path.join("media", "temp", map_image_filename)
                    try:
                        with open(map_image_path, "rb") as img_file:
                            map_image_base64 = base64.b64encode(img_file.read()).decode("utf-8")
                    except Exception as e:
                        print(f"❌ Error encoding map image to base64: {str(e)}")
        else:
            print("⚠️ Could not load village shapefile - proceeding without geospatial data")
            geospatial_result = {
                'geojson': None,
                'merge_statistics': {
                    'error': 'Village shapefile not found or could not be loaded',
                    'total_shapefile_villages': 0,
                    'total_gsr_villages': len(matched_results),
                    'villages_with_geospatial_data': 0,
                    'villages_without_geospatial_data': len(matched_results),
                    'match_success_rate': 0
                }
            }
        
        # Debug logging
        if matched_results:
            sample_result = matched_results[0]
            print(f"📊 Sample result with classification:")
            print(f"  - Village: {sample_result.get('village_name', 'N/A')}")
            print(f"  - GSR: {sample_result['gsr']}")
            print(f"  - Trend: {sample_result['trend_status']}")
            print(f"  - Classification: {sample_result['gsr_classification']}")
            print(f"  - Color: {sample_result['classification_color']}")
        
        # Additional metadata
        import pandas as pd
        metadata = {
            'computation_timestamp': pd.Timestamp.now().isoformat(),
            'input_datasets': {
                'recharge_villages': len(recharge_data),
                'domestic_villages': len(domestic_data),
                'agricultural_villages': len(agricultural_data)
            },
            'selected_subdistricts': selected_subdistricts,
            'trend_csv_filename': trend_csv_filename,
            'map_image_filename': map_image_filename,
            'flags': {
                'has_domestic_demand': data.get('hasDomesticDemand', False),
                'has_agricultural_demand': data.get('hasAgriculturalDemand', False),
                'has_recharge_data': data.get('hasRechargeData', False),
                'has_trend_data': trend_csv_filename is not None,
                'has_geospatial_data': geospatial_result['geojson'] is not None,
                'has_map_image': map_image_filename is not None
            }
        }
        
        # Response matching Django structure exactly
        response_data = {
            "success": True,
            "message": f"GSR analysis completed successfully for {len(matched_results)} villages",
            "data": matched_results,  # Original JSON GSR results
            "summary": summary,
            "metadata": metadata,
            "villages_count": len(matched_results),
            "geospatial_data": geospatial_result['geojson'],
            "merge_statistics": geospatial_result['merge_statistics'],
            "map_image_filename": map_image_filename,
            "map_image_base64": f"data:image/png;base64,{map_image_base64}" if map_image_base64 else None
        }
        
        return response_data
        
    except Exception as e:
        print(f"❌ Error in compute_gsr: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            "success": False,
            "error": f"Internal server error during GSR computation: {str(e)}"
        }


@router.get("/gsr")
async def gsr_health_check():
    """
    GET endpoint for API documentation/health check
    """
    return {
        "service": "GSR Computation API with Geospatial Integration and Map Image Generation",
        "version": "2.1",
        "description": "Computes GSR analysis with comprehensive classification and returns both JSON and GeoJSON data along with map image",
        "expected_payload": {
            "rechargeData": "Array of recharge data with 'village_co' and 'recharge' fields",
            "domesticData": "Array of domestic demand data with 'village_code' and 'demand_mld' fields", 
            "agriculturalData": "Array of agricultural demand data with 'village_code' and 'village_demand' fields",
            "selectedSubDistricts": "Array of selected subdistrict codes",
            "trendCsvFilename": "Optional filename of trend CSV (stored in media/temp/) with Village_ID field",
            "hasDomesticDemand": "Boolean flag",
            "hasAgriculturalDemand": "Boolean flag", 
            "hasRechargeData": "Boolean flag"
        },
        "response_format": {
            "success": "Boolean",
            "data": "Array of village GSR results with trend_status, gsr_classification and classification_color fields",
            "summary": "Summary statistics including trend and classification distribution",
            "metadata": "Additional computation metadata including map_image_filename",
            "geospatial_data": "GeoJSON FeatureCollection with village polygons and GSR data merged",
            "merge_statistics": "Statistics about shapefile-GSR data merge success",
            "map_image_filename": "Filename of generated map image saved in media/temp/",
            "map_image_base64": "Base64 encoded map image string"
        },
        "shapefile_integration": {
            "shapefile_path": "media/gwa_data/gwa_shp/Final_Village/Village.shp",
            "matching_fields": {
                "shapefile": "village_co",
                "gsr_data": "village_code (from Village_ID)"
            },
            "merge_type": "inner join (keeps only villages with GSR data)",
            "output_format": "GeoJSON with WGS84 (EPSG:4326) coordinate system"
        },
        "map_image_generation": {
            "description": "Automatically generates a choropleth map image of GSR classifications",
            "output_format": "PNG image at 150 DPI",
            "save_location": "media/temp/",
            "filename_pattern": "gsr_map_YYYYMMDD_HHMMSS_<8-char-uuid>.png",
            "features": [
                "Color-coded villages by GSR classification",
                "Legend showing classification meanings and village counts",
                "Grid lines and coordinate labels",
                "High-resolution output suitable for reports"
            ]
        },
        "classifications": {
            "Critical": {
                "description": "GSR < 0.95 with Increasing trend OR GSR 0.95-1.05 with Decreasing trend",
                "color": "red"
            },
            "Safe": {
                "description": "GSR 0.95-1.05 with Increasing/No trend",
                "color": "green"
            },
            "Very Safe": {
                "description": "GSR > 1.05 with Increasing/No trend",
                "color": "teal"
            },
            "Over Exploited": {
                "description": "GSR < 0.95 with Decreasing/No trend",
                "color": "darkred"
            },
            "Very Semi-Critical": {
                "description": "GSR > 1.05 with Decreasing trend",
                "color": "orange"
            },
            "Unknown Status": {
                "description": "Unknown trend status",
                "color": "gray"
            },
            "No Data": {
                "description": "Missing GSR data",
                "color": "gold"
            }
        }
    }