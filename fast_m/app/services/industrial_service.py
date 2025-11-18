# # app/services/industrial_service.py
# import pandas as pd
# from typing import Dict, List, Any


# class IndustrialService:
#     """
#     Service to calculate industrial water demand based on industry types,
#     sub-industries, their counts, and SWC (Specific Water Consumption) values.
#     """

#     # Hardcoded industrial data with SWC ranges
#     INDUSTRIAL_DATA = {
#         "Thermal Power Plants": {
#             "unit": "m³/MW",
#             "subIndustries": {
#                 "Small (Up to 1000 MW)": {"swc_range": (2.3, 3.9)},
#                 "Medium (Between 1000 to 2500 MW)": {"swc_range": (1.9, 6.5)},
#                 "Large (2500 MW and more)": {"swc_range": (3.0, 3.2)}
#             }
#         },
#         "Pulp & Paper": {
#             "unit": "m³/MT",
#             "subIndustries": {
#                 "Integrated Mills": {"swc_range": (30.5, 33.0)},
#                 "RCF Mills": {"swc_range": (9.9, 13.0)}
#             }
#         },
#         "Textiles": {
#             "unit": "m³/MT",
#             "subIndustries": {
#                 "Integrated Industry (cotton)": {"swc_range": (104.1, 343.5)},
#                 "Fabric Processing Industry (cotton)": {"swc_range": (51.1, 97.5)},
#                 "Integrated Industry (woollen)": {"swc_range": (237.1, 237.1)}
#             }
#         },
#         "Iron & Steel": {
#             "unit": "m³/MT",
#             "subIndustries": {
#                 "Iron & Steel": {"swc_range": (5.3, 7.7)}
#             }
#         }
#     }

#     def parse_swc_string(self, swc_string: str) -> tuple:
#         """
#         Parse SWC string from frontend (e.g., "2.3 - 3.9" or "237.1") into tuple.
        
#         Args:
#             swc_string: SWC value as string (e.g., "2.3 - 3.9" or "237.1")
            
#         Returns:
#             Tuple of (min, max) SWC values
#         """
#         try:
#             swc_string = swc_string.strip()
#             if '-' in swc_string:
#                 parts = swc_string.split('-')
#                 min_val = float(parts[0].strip())
#                 max_val = float(parts[1].strip())
#                 return (min_val, max_val)
#             else:
#                 # Single value (e.g., "237.1")
#                 val = float(swc_string)
#                 return (val, val)
#         except Exception as e:
#             raise ValueError(f"Invalid SWC format: {swc_string}. Error: {str(e)}")

#     def calculate_swc_mean(self, swc_range: tuple) -> float:
#         """
#         Calculate the mean of SWC range.
        
#         Args:
#             swc_range: Tuple of (min, max) SWC values
            
#         Returns:
#             Mean SWC value
#         """
#         return (swc_range[0] + swc_range[1]) / 2

#     def convert_mw_to_mt(self, value_mw: float) -> float:
#         """
#         Convert MW to MT (assuming 1 MW = 1 MT for water consumption equivalence).
#         This is a simplified conversion. Adjust based on actual conversion standards.
        
#         Args:
#             value_mw: Value in MW
            
#         Returns:
#             Value in MT
#         """
#         # Standard conversion: 1 MW ≈ 1 MT (for water demand calculations)
#         return value_mw

#     def process_industrial_demand(
#         self,
#         subdistrict_code: List[str],
#         industrial_data: Dict[str, Dict[str, Dict[str, Any]]]
#     ) -> Dict[str, Any]:
#         """
#         Process industrial demand calculation.
        
#         Args:
#             subdistrict_code: List of subdistrict codes
#             industrial_data: Dictionary containing industry types and their sub-industries with counts and SWC
#                 Format: {
#                     "Thermal Power Plants": {
#                         "Small (Up to 1000 MW)": {"count": 5, "swc": "2.3 - 3.9"},
#                         "Medium (Between 1000 to 2500 MW)": {"count": 3, "swc": "1.9 - 6.5"}
#                     },
#                     "Pulp & Paper": {
#                         "Integrated Mills": {"count": 2, "swc": "30.5 - 33.0"}
#                     }
#                 }
        
#         Returns:
#             Dictionary containing calculation results
#         """
#         try:
#             results = []
#             total_demand_mt = 0.0
            
#             # Process each industry type
#             for industry_type, sub_industries in industrial_data.items():
#                 # Get unit from hardcoded data if available, otherwise default to m³/MT
#                 if industry_type in self.INDUSTRIAL_DATA:
#                     industry_unit = self.INDUSTRIAL_DATA[industry_type]["unit"]
#                 else:
#                     industry_unit = "m³/MT"  # Default unit
                
#                 # Process each sub-industry
#                 for sub_industry_name, sub_industry_data in sub_industries.items():
#                     count = sub_industry_data.get("count", 0)
#                     if count <= 0:
#                         continue
                    
#                     # Get SWC from frontend payload
#                     swc_string = sub_industry_data.get("swc", "")
#                     if not swc_string:
#                         raise ValueError(f"SWC value missing for '{sub_industry_name}'")
                    
#                     # Parse SWC string to tuple
#                     swc_range = self.parse_swc_string(swc_string)
#                     swc_mean = self.calculate_swc_mean(swc_range)
                    
#                     # Calculate demand for this sub-industry
#                     demand = swc_mean * count
                    
#                     # Convert to MT if unit is MW
#                     if "MW" in industry_unit:
#                         demand_mt = self.convert_mw_to_mt(demand)
#                     else:
#                         demand_mt = demand
                    
#                     total_demand_mt += demand_mt
                    
#                     # Store individual sub-industry result
#                     results.append({
#                         "industry_type": industry_type,
#                         "sub_industry": sub_industry_name,
#                         "unit": industry_unit,
#                         "swc_range": swc_string,
#                         "swc_mean": round(swc_mean, 2),
#                         "count": count,
#                         "demand_m3": round(demand, 2),
#                         "demand_mt": round(demand_mt, 2)
#                     })
            
#             # Calculate summary statistics
#             summary = {
#                 "total_subdistricts": len(subdistrict_code),
#                 "subdistrict_codes": subdistrict_code,
#                 "total_industry_types": len(industrial_data),
#                 "total_sub_industries": len(results),
#                 "total_demand_m3": round(total_demand_mt, 2),
#                 "total_demand_mt": round(total_demand_mt, 2),
#                 "total_demand_million_liters": round(total_demand_mt * 1000, 2)  # Convert m³ to liters
#             }
            
#             # Group results by industry type for better organization
#             grouped_results = {}
#             for result in results:
#                 industry = result["industry_type"]
#                 if industry not in grouped_results:
#                     grouped_results[industry] = []
#                 grouped_results[industry].append(result)
            
#             return {
#                 "success": True,
#                 "summary": summary,
#                 "detailed_results": results,
#                 "grouped_by_industry": grouped_results
#             }
            
#         except Exception as e:
#             return {
#                 "success": False,
#                 "message": f"Error processing industrial demand: {str(e)}"
#             }

#     def validate_industrial_data(
#         self,
#         industrial_data: Dict[str, Dict[str, Dict[str, Any]]]
#     ) -> Dict[str, Any]:
#         """
#         Validate the incoming industrial data structure.
        
#         Args:
#             industrial_data: Industrial data to validate
            
#         Returns:
#             Validation result dictionary
#         """
#         errors = []
#         warnings = []
        
#         if not industrial_data:
#             errors.append("Industrial data is empty")
#             return {
#                 "valid": False,
#                 "errors": errors,
#                 "warnings": warnings
#             }
        
#         for industry_type, sub_industries in industrial_data.items():
#             # Check if industry type exists in hardcoded data (optional check)
#             if industry_type not in self.INDUSTRIAL_DATA:
#                 warnings.append(f"Unknown industry type: {industry_type}")
            
#             for sub_industry_name, sub_industry_data in sub_industries.items():
#                 # Check if sub-industry exists in hardcoded data (optional check)
#                 if industry_type in self.INDUSTRIAL_DATA:
#                     industry_info = self.INDUSTRIAL_DATA[industry_type]
#                     if sub_industry_name not in industry_info["subIndustries"]:
#                         warnings.append(
#                             f"Unknown sub-industry '{sub_industry_name}' for industry '{industry_type}'"
#                         )
                
#                 # Check count value
#                 count = sub_industry_data.get("count", 0)
#                 if not isinstance(count, (int, float)):
#                     errors.append(
#                         f"Invalid count type for '{sub_industry_name}': expected number, got {type(count)}"
#                     )
#                 elif count < 0:
#                     errors.append(
#                         f"Invalid count for '{sub_industry_name}': count cannot be negative"
#                     )
                
#                 # Validate SWC field
#                 swc = sub_industry_data.get("swc", "")
#                 if not swc:
#                     errors.append(
#                         f"Missing SWC value for '{sub_industry_name}'"
#                     )
#                 elif not isinstance(swc, str):
#                     errors.append(
#                         f"Invalid SWC type for '{sub_industry_name}': expected string, got {type(swc)}"
#                     )
#                 else:
#                     # Try to parse SWC to validate format
#                     try:
#                         self.parse_swc_string(swc)
#                     except Exception as e:
#                         errors.append(
#                             f"Invalid SWC format for '{sub_industry_name}': {str(e)}"
#                         )
        
#         return {
#             "valid": len(errors) == 0,
#             "errors": errors,
#             "warnings": warnings
#         }