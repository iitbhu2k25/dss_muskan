from fastapi import APIRouter, HTTPException, Request, Form
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union
import json
import base64
import os
import gzip
import io

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
    Includes domestic, agricultural, and industrial demand
    """
    try:
        # Handle different content types
        content_type = request.headers.get("content-type", "")
        
        if "application/json" in content_type:
            body = await request.json()
            
            # Check if data is zipped
            if "zipped_data" in body:
                # Decode base64 and decompress gzip
                compressed_bytes = base64.b64decode(body["zipped_data"])
                with gzip.GzipFile(fileobj=io.BytesIO(compressed_bytes)) as gz:
                    json_data = gz.read().decode('utf-8')
                    data = json.loads(json_data)
            else:
                data = body
                
        elif "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
            form_data = await request.form()
            data = dict(form_data)
        else:
            # Try to parse as JSON anyway
            data = await request.json()
        
        # Log received data for debugging
        print("\n" + "=" * 80)
        print("📥 GSR API - RECEIVED DATA")
        print("=" * 80)
        print(f"Content-Type: {content_type}")
        print(f"Data type: {type(data)}")
        print(f"Data keys: {list(data.keys())}")
        
        # Parse JSON strings if needed (like Django does)
        for key in ["rechargeData", "domesticData", "agriculturalData", "industrialData", "selectedSubDistricts"]:
            if key in data and isinstance(data.get(key), str):
                try:
                    data[key] = json.loads(data[key])
                except json.JSONDecodeError:
                    data[key] = []
        
        # Extract data arrays
        recharge_data = data.get('rechargeData', [])
        domestic_data = data.get('domesticData', [])
        agricultural_data = data.get('agriculturalData', [])
        industrial_data = data.get('industrialData', [])
        selected_subdistricts = data.get('selectedSubDistricts', [])
        trend_csv_filename = data.get('trendCsvFilename')
        
        # ========================================================================
        # ENHANCED LOGGING: Print received data tables
        # ========================================================================
        print("\n📊 RECHARGE DATA TABLE:")
        print(f"   Total records: {len(recharge_data)}")
        if recharge_data:
            print(f"   Sample (first 3 records):")
            for idx, item in enumerate(recharge_data[:3], 1):
                print(f"   {idx}. Village: {item.get('village_co', 'N/A')}, "
                      f"Recharge: {item.get('recharge', 0)} MCM")
        else:
            print("   ⚠️ No recharge data received")
        
        print("\n🏠 DOMESTIC DEMAND DATA TABLE:")
        print(f"   Total records: {len(domestic_data)}")
        if domestic_data:
            print(f"   Sample (first 3 records):")
            for idx, item in enumerate(domestic_data[:3], 1):
                print(f"   {idx}. Village: {item.get('village_code', 'N/A')}, "
                      f"Demand: {item.get('demand_mld', 0)} MLD")
        else:
            print("   ⚠️ No domestic demand data received")
        
        print("\n🌾 AGRICULTURAL DEMAND DATA TABLE:")
        print(f"   Total records: {len(agricultural_data)}")
        if agricultural_data:
            print(f"   Sample (first 3 records):")
            for idx, item in enumerate(agricultural_data[:3], 1):
                print(f"   {idx}. Village: {item.get('village_code', 'N/A')}, "
                      f"Demand: {item.get('village_demand', 0)} MCM")
        else:
            print("   ⚠️ No agricultural demand data received")
        
        print("\n🏭 INDUSTRIAL DEMAND DATA TABLE:")
        print(f"   Total records: {len(industrial_data)}")
        if industrial_data:
            print(f"   Sample (first 3 records):")
            for idx, item in enumerate(industrial_data[:3], 1):
                print(f"   {idx}. Village: {item.get('village_code', 'N/A')}, "
                      f"Demand: {item.get('demand_mld', 0)} MLD")
            print(f"   ✅ Industrial demand WILL BE INCLUDED in total demand calculation")
        else:
            print("   ℹ️ No industrial demand data received (optional)")
        
        print("\n📍 SELECTED SUBDISTRICTS:")
        print(f"   Total: {len(selected_subdistricts)}")
        print(f"   Codes: {selected_subdistricts}")
        
        print("\n📈 TREND DATA:")
        if trend_csv_filename:
            print(f"   CSV Filename: {trend_csv_filename}")
        else:
            print("   ⚠️ No trend CSV filename provided")
        
        print("\n🎯 DEMAND FLAGS:")
        print(f"   Has Domestic: {data.get('hasDomesticDemand', False)}")
        print(f"   Has Agricultural: {data.get('hasAgriculturalDemand', False)}")
        print(f"   Has Industrial: {data.get('hasIndustrialDemand', False)}")
        print(f"   Has Recharge: {data.get('hasRechargeData', False)}")
        print("=" * 80 + "\n")
        
        # Validation
        if not recharge_data:
            return {
                "success": False,
                "error": "Recharge data is required for GSR analysis"
            }
        
        if not domestic_data and not agricultural_data and not industrial_data:
            return {
                "success": False,
                "error": "At least one demand dataset (domestic, agricultural, or industrial) is required"
            }
        
        # Match village data across all datasets including trend data and industrial data
        print("🔄 Matching village data across all datasets...")
        matched_results = match_village_data(
            recharge_data, 
            domestic_data, 
            agricultural_data,
            industrial_data,
            trend_csv_filename
        )
        
        if not matched_results:
            return {
                "success": False,
                "error": "No villages could be matched across the provided datasets"
            }
        
        print(f"✅ Successfully matched {len(matched_results)} villages")
        
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
        
        # Print summary with demand breakdown
        print("\n📊 GSR CALCULATION SUMMARY:")
        print(f"   Total Recharge: {summary.get('total_recharge', 0)} MCM")
        print(f"   Total Domestic Demand: {summary.get('total_domestic_demand', 0)} MCM")
        print(f"   Total Agricultural Demand: {summary.get('total_agricultural_demand', 0)} MCM")
        print(f"   Total Industrial Demand: {summary.get('total_industrial_demand', 0)} MCM")
        print(f"   ─────────────────────────────────────────────")
        print(f"   TOTAL DEMAND (D+A+I): {summary.get('total_demand', 0)} MCM")
        print(f"   OVERALL GSR: {summary.get('overall_gsr', 0)}")
        print(f"   Average GSR: {summary.get('average_gsr', 0)}")
        print(f"   Sustainable Villages: {summary.get('sustainable_villages', 0)}")
        print(f"   Stressed Villages: {summary.get('stressed_villages', 0)}")
        
        # Load village shapefile and merge with GSR data
        village_gdf = load_village_shapefile()
        geospatial_result = None
        map_image_filename = None
        map_image_base64 = None
        
        if village_gdf is not None:
            print("\n🗺️ Merging GSR data with village shapefile...")
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
                        print(f"✅ Map image encoded to base64 successfully")
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
        
        # Debug logging - Show sample result with all demand components
        if matched_results:
            sample_result = matched_results[0]
            print(f"\n📋 SAMPLE RESULT (First Village):")
            print(f"   Village Code: {sample_result.get('village_code', 'N/A')}")
            print(f"   Village Name: {sample_result.get('village_name', 'N/A')}")
            print(f"   Recharge: {sample_result['recharge']} MCM")
            print(f"   Domestic Demand: {sample_result['domestic_demand']} MCM")
            print(f"   Agricultural Demand: {sample_result['agricultural_demand']} MCM")
            print(f"   Industrial Demand: {sample_result['industrial_demand']} MCM")
            print(f"   ─────────────────────────────────────────────")
            print(f"   TOTAL DEMAND: {sample_result['total_demand']} MCM")
            print(f"   GSR Ratio: {sample_result['gsr']}")
            print(f"   GSR Status: {sample_result['gsr_status']}")
            print(f"   Trend Status: {sample_result['trend_status']}")
            print(f"   Classification: {sample_result['gsr_classification']}")
            print(f"   Color: {sample_result['classification_color']}")
        
        # Additional metadata
        import pandas as pd
        metadata = {
            'computation_timestamp': pd.Timestamp.now().isoformat(),
            'input_datasets': {
                'recharge_villages': len(recharge_data),
                'domestic_villages': len(domestic_data),
                'agricultural_villages': len(agricultural_data),
                'industrial_villages': len(industrial_data)
            },
            'selected_subdistricts': selected_subdistricts,
            'trend_csv_filename': trend_csv_filename,
            'map_image_filename': map_image_filename,
            'flags': {
                'has_domestic_demand': data.get('hasDomesticDemand', False),
                'has_agricultural_demand': data.get('hasAgriculturalDemand', False),
                'has_industrial_demand': data.get('hasIndustrialDemand', False),
                'has_recharge_data': data.get('hasRechargeData', False),
                'has_trend_data': trend_csv_filename is not None,
                'has_geospatial_data': geospatial_result['geojson'] is not None,
                'has_map_image': map_image_filename is not None
            }
        }
        
        # Response matching Django structure exactly
        response_data = {
            "success": True,
            "message": f"GSR analysis completed successfully for {len(matched_results)} villages (including industrial demand)",
            "data": matched_results,
            "summary": summary,
            "metadata": metadata,
            "villages_count": len(matched_results),
            "geospatial_data": geospatial_result['geojson'],
            "merge_statistics": geospatial_result['merge_statistics'],
            "map_image_filename": map_image_filename,
            "map_image_base64": f"data:image/png;base64,{map_image_base64}" if map_image_base64 else None
        }
        
        print(f"\n✅ GSR computation completed successfully!")
        print(f"📤 Sending response with {len(matched_results)} village results\n")
        print("=" * 80 + "\n")
        
        return response_data
        
    except Exception as e:
        print(f"\n❌ ERROR in compute_gsr: {str(e)}")
        import traceback
        traceback.print_exc()
        print("=" * 80 + "\n")
        
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
        "version": "2.2",
        "description": "Computes GSR analysis with comprehensive classification including industrial demand",
        "expected_payload": {
            "rechargeData": "Array of recharge data with 'village_co' and 'recharge' fields",
            "domesticData": "Array of domestic demand data with 'village_code' and 'demand_mld' fields", 
            "agriculturalData": "Array of agricultural demand data with 'village_code' and 'village_demand' fields",
            "industrialData": "Array of industrial demand data with 'village_code' and 'demand_mld' fields",
            "selectedSubDistricts": "Array of selected subdistrict codes",
            "trendCsvFilename": "Optional filename of trend CSV (stored in media/temp/) with Village_ID field",
            "hasDomesticDemand": "Boolean flag",
            "hasAgriculturalDemand": "Boolean flag",
            "hasIndustrialDemand": "Boolean flag",
            "hasRechargeData": "Boolean flag"
        },
        "response_format": {
            "success": "Boolean",
            "data": "Array of village GSR results with trend_status, gsr_classification and classification_color fields",
            "summary": "Summary statistics including trend and classification distribution with industrial demand",
            "metadata": "Additional computation metadata including map_image_filename",
            "geospatial_data": "GeoJSON FeatureCollection with village polygons and GSR data merged",
            "merge_statistics": "Statistics about shapefile-GSR data merge success",
            "map_image_filename": "Filename of generated map image saved in media/temp/",
            "map_image_base64": "Base64 encoded map image string"
        },
        "demand_calculation": {
            "formula": "Total Demand = Domestic Demand + Agricultural Demand + Industrial Demand",
            "gsr_formula": "GSR = Total Recharge / Total Demand",
            "components": {
                "domestic": "Water demand from domestic/residential use",
                "agricultural": "Water demand from crop irrigation",
                "industrial": "Water demand from industrial facilities"
            }
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
