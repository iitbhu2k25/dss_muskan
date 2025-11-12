# # app/services/population_service.py
# import os
# import pandas as pd
# from typing import List, Optional, Dict, Any
# from app.models import Village, Population2011


# class PopulationService:
#     def __init__(self, media_root: str = None):
#         self.media_root = media_root or settings.MEDIA_ROOT

#     def forecast(self,
#                  csv_filename: str,
#                  village_codes: Optional[List[str]] = None,
#                  subdistrict_codes: Optional[List[int]] = None,
#                  lpcd: float = 60.0) -> Dict[str, Any]:

#         # === 1. Load CSV ===
#         csv_path = os.path.join(self.media_root, "temp", csv_filename)
#         if not os.path.exists(csv_path):
#             raise ValueError(f"CSV file not found: {csv_filename}")

#         df = pd.read_csv(csv_path)
#         year_cols = [col for col in df.columns if col.upper().startswith(("PRE_", "POST_"))]
#         if not year_cols:
#             raise ValueError("No PRE_/POST_ year columns found")

#         years = [int(col.split("_")[1]) for col in year_cols if "_" in col]
#         if not years:
#             raise ValueError("No valid year in column names")
#         target_year = max(years)

#         try:
#             lpcd = float(lpcd)
#         except (ValueError, TypeError):
#             raise ValueError("lpcd must be a number")

#         # === 2. Filter villages ===
#         if village_codes:
#             if not isinstance(village_codes, list):
#                 raise ValueError("village_code must be a list")
#             villages = Village.objects.filter(village_code__in=village_codes)
#         elif subdistrict_codes:
#             if not isinstance(subdistrict_codes, list):
#                 raise ValueError("subdistrict_code must be a list")
#             villages = Village.objects.filter(subdistrict_code_id__in=subdistrict_codes)
#         else:
#             raise ValueError("Provide village_code or subdistrict_code")

#         if not villages.exists():
#             raise ValueError("No villages found")

#         # === 3. Forecast logic ===
#         results = []
#         base_year = 2011

#         for village in villages:
#             try:
#                 sub = Population2011.objects.get(subdistrict_code=village.subdistrict_code_id)
#             except Population2011.DoesNotExist:
#                 results.append({
#                     "village_code": village.village_code,
#                     "error": "Subdistrict data not found"
#                 })
#                 continue

#             # Historical populations
#             p1, p2, p3, p4, p5, p6, p7 = (
#                 sub.population_1951, sub.population_1961, sub.population_1971,
#                 sub.population_1981, sub.population_1991, sub.population_2001,
#                 sub.population_2011
#             )

#             # Decadal differences
#             d1, d2, d3, d4, d5, d6 = (p2-p1, p3-p2, p4-p3, p5-p4, p6-p5, p7-p6)
#             d_mean = (d1 + d2 + d3 + d4 + d5 + d6) / 6
#             m_mean = ((d2-d1) + (d3-d2) + (d4-d3) + (d5-d4) + (d6-d5)) / 5

#             # Ratio k
#             k = village.population_2011 / p7 if p7 else 0

#             # Years difference
#             n = (target_year - base_year) / 10

#             # Forecast
#             forecast = int(
#                 village.population_2011 +
#                 (k * n * d_mean) +
#                 (k * (n * (n + 1)) * m_mean / 2)
#             )

#             # Demand (MLD)
#             demand = round(((forecast * lpcd) / 1000) * 365, 3) / 1000
#             demand = round(demand, 2)

#             results.append({
#                 "village_code": village.village_code,
#                 "village_name": village.village_name,
#                 "subdistrict_code": village.subdistrict_code_id,
#                 "base_year": base_year,
#                 "target_year": target_year,
#                 "population_2011": village.population_2011,
#                 "forecast_population": forecast,
#                 "lpcd": lpcd,
#                 "demand_mld": demand
#             })

#         return {"forecasts": results}