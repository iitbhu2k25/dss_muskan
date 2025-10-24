import re
import json
import requests
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from bs4 import BeautifulSoup

CACHE_KEY = "imd_rainfall_areas"
CACHE_TIMEOUT = 60 * 15  # cache for 15 minutes

class DistrictDailyRainfallAPIView(APIView):
    permission_classes = [AllowAny]

    def extract_areas_from_html(self, html_content):
        soup = BeautifulSoup(html_content, 'html.parser')
        script_tags = soup.find_all('script')
        target_script = None
        for script in script_tags:
            if script.string and 'AmCharts.makeChart' in script.string and '"areas": [' in script.string:
                target_script = script.string
                break

        if not target_script:
            return None

        # More robust extraction of the areas array
        # Find the start of "areas": [
        start_match = re.search(r'"areas"\s*:\s*\[', target_script)
        if not start_match:
            return None
        start_pos = start_match.end()

        # Find the end: matching ]
        brace_count = 1  # Start with 1 for the [
        end_pos = start_pos
        i = start_pos
        while i < len(target_script) and brace_count > 0:
            if target_script[i] == '[':
                brace_count += 1
            elif target_script[i] == ']':
                brace_count -= 1
            i += 1
        end_pos = i - 1  # Position before the closing ]

        areas_str = target_script[start_pos:end_pos].strip()

        # Clean the string for JSON parsing
        # Remove trailing commas
        areas_str = re.sub(r',\s*([}\]]|\s*$)', r'\1', areas_str)
        # Quote unquoted keys if any
        areas_str = re.sub(r'([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', areas_str)
        # Handle HTML escapes in strings - keep as is for raw output
        # No need to replace <\/br> since user wants raw balloonText

        try:
            areas = json.loads('[' + areas_str + ']')
            return areas
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            print("Sample areas_str:", areas_str[:500])
            return None

    def fetch_geojson(self):
        geojson_url = "https://mausam.imd.gov.in/imd_latest/contents/district_shapefiles/DISTRICT_F-2.json"
        try:
            response = requests.get(geojson_url, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"GeoJSON fetch failed: {e}")
            return None

    def get(self, request):
        param = request.GET.get('msg', 'D')
        cache_key = f"{CACHE_KEY}_{param}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)

        url = f"https://mausam.imd.gov.in/imd_latest/contents/rainfallinformation.php?msg={param}"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

        try:
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            html_content = response.text
        except Exception as e:
            return Response({"error": f"Failed to fetch data: {str(e)}"}, status=500)

        areas = self.extract_areas_from_html(html_content)
        if not areas:
            return Response({"error": "Failed to extract rainfall data"}, status=500)

        # Fetch GeoJSON and map geometries by ID
        geojson_data = self.fetch_geojson()
        if not geojson_data:
            return Response({"error": "Failed to fetch GeoJSON"}, status=500)

        # Create a mapping from title (district name) to area data for matching
        title_to_area = {}
        for area in areas:
            title = area.get('title', '').upper().strip()  # Normalize for matching
            if title:
                title_to_area[title] = area

        # Enhance GeoJSON features with rainfall data by matching on district name
        features = []
        for feature in geojson_data.get('features', []):
            props = feature.get('properties', {})
            district_name = props.get('DISTRICT', '').upper().strip()  # Assuming 'DISTRICT' field in GeoJSON
            enhanced_props = props.copy()
            
            if district_name in title_to_area:
                rainfall_data = title_to_area[district_name]
                enhanced_props.update({
                    'rainfall_title': rainfall_data.get('title', district_name),
                    'rainfall_color': rainfall_data.get('color', '#D8D8D8'),
                    'rainfall_info': rainfall_data.get('info', 'No Data'),
                    'rainfall_balloonText': rainfall_data.get('balloonText', f"{district_name} : <br/> Departure : No Data <br/> Actual : 0 mm <br/> Normal : 0 mm")
                })
            else:
                # Fallback for unmatched districts
                enhanced_props.update({
                    'rainfall_title': district_name,
                    'rainfall_color': '#D8D8D8',
                    'rainfall_info': 'No Data',
                    'rainfall_balloonText': f"{district_name} : <br/> Departure : No Data <br/> Actual : 0 mm <br/> Normal : 0 mm"
                })

            enhanced_feature = {
                'type': 'Feature',
                'properties': enhanced_props,
                'geometry': feature.get('geometry')  # Ensures coordinates are included
            }
            features.append(enhanced_feature)

        # Prepare output as full GeoJSON with period
        output = {
            "type": "FeatureCollection",
            "period": param,
            "features": features
        }

        cache.set(cache_key, output, CACHE_TIMEOUT)
        return Response(output)
    

class DistrictWeeklyRainfallGeoJSONAPIView(APIView):
    permission_classes = [AllowAny]

    def extract_js_object(self, html_content, var_name):
        start_pattern = f'var {var_name} ='
        start_index = html_content.find(start_pattern)
        if start_index == -1:
            print("Var not found")
            return None
        start_index += len(start_pattern)

        brace_start = html_content.find('{', start_index)
        if brace_start == -1:
            print("Brace not found")
            return None

        brace_count = 0
        i = brace_start
        while i < len(html_content):
            char = html_content[i]
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    js_str = html_content[brace_start:i + 1]
                    break
            i += 1
        else:
            print("End of file without closing brace")
            return None

        js_str = js_str.rstrip('; \n\t ')
        js_str = re.sub(r'//.*?$', '', js_str, flags=re.MULTILINE)
        js_str = re.sub(r',\s*([}\]])', r'\1', js_str)
        js_str = re.sub(r'([{,])\s*([a-zA-Z0-9_]+)\s*:', r'\1"\2":', js_str)
        js_str = js_str.replace("'", '"')
        js_str = js_str.replace("\\/", "/")
        js_str = js_str.strip()

        try:
            parsed = json.loads(js_str)
            print("Parsed successfully")
            return parsed
        except Exception as e:
            print(f"JSON parse failed: {e}")
            print("JS str preview:", repr(js_str[:500]))
            return None

    def get_rainfall_category(self, departure_str):
        try:
            if not departure_str or departure_str == "-100%":
                return "No Rain"
            value = int(departure_str.replace("%", ""))
            if value <= -100:
                return "No Rain"
            elif -99 <= value <= -60:
                return "Large Deficient"
            elif -59 <= value <= -20:
                return "Deficient"
            elif -19 <= value <= 19:
                return "Normal"
            elif 20 <= value <= 59:
                return "Excess"
            else:
                return "Large Excess"
        except:
            return "No Data"

    def get(self, request):
        cache_key_district_weekly = CACHE_KEY + "_district_weekly"
        cached_geojson = cache.get(cache_key_district_weekly)
        if cached_geojson:
            return Response(cached_geojson)

        # Replace with your actual district weekly rainfall data URL
        url = "https://mausam.imd.gov.in/imd_latest/contents/rainfallinformation.php?msg=C"

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            html_content = response.text
            print("Fetched HTML length:", len(html_content))
        except Exception as e:
            return Response({"error": f"Fetch failed: {str(e)}"}, status=500)

        js_data = self.extract_js_object(html_content, "countrydataprovider")
        if not js_data:
            return Response({"error": "Could not extract JS data"}, status=500)

        areas = js_data.get("areas", [])
        images = js_data.get("images", [])

        coord_map = {
            img["label"].strip().upper(): [img["longitude"], img["latitude"]]
            for img in images if "latitude" in img and "longitude" in img
        }

        features = []
        for area in areas:
            district_name = area["title"].strip().upper()
            if "REGION" in district_name or "COUNTRY" in district_name:
                continue

            district_clean = district_name.replace(" (UT)", "").replace(" & ", " AND ").strip()

            coords = None
            for key, coord in coord_map.items():
                key_clean = key.replace(" AND ", " & ").strip()
                if key_clean in district_clean or district_clean in key_clean:
                    coords = coord
                    break
            if not coords:
                print(f"No coordinates found for {district_name}")
                continue

            balloon = area.get("balloonText", "") or ""
            actual_match = re.search(r'Actual\s*:\s*([\d.]+)', balloon)
            normal_match = re.search(r'Normal\s*:\s*([\d.]+)', balloon)
            departure_match = re.search(r'Departure\s*:\s*([-+0-9.%]+)', balloon)

            actual_val = f"{actual_match.group(1)} mm" if actual_match else "0 mm"
            normal_val = f"{normal_match.group(1)} mm" if normal_match else "0 mm"
            dep_val = departure_match.group(1) if departure_match else area.get("info", "")

            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": coords
                },
                "properties": {
                    "district": district_name.title(),
                    "district_id": area.get("id", ""),
                    "actual_rainfall": actual_val,
                    "normal_rainfall": normal_val,
                    "departure": dep_val,
                    "category": self.get_rainfall_category(dep_val),
                    "color": area.get("color", "#FFFFFF"),
                    "data_source": "India Meteorological Department",
                    "last_updated": request.GET.get("date", "This Week")
                }
            })

        geojson = {
            "type": "FeatureCollection",
            "features": features,
            "metadata": {
                "title": "India District-wise Weekly Rainfall Data",
                "source": "India Meteorological Department",
                "total_districts": len(features),
                "legend": {
                    "No Rain": {"range": "-100%", "color": "#FFFFFF"},
                    "Large Deficient": {"range": "-99% to -60%", "color": "#FFFF00"},
                    "Deficient": {"range": "-59% to -20%", "color": "#FF0012"},
                    "Normal": {"range": "-19% to 19%", "color": "#00FF3E"},
                    "Excess": {"range": "20% to 59%", "color": "#58CCED"},
                    "Large Excess": {"range": "≥60%", "color": "#3895D3"}
                }
            }
        }

        cache.set(cache_key_district_weekly, geojson, CACHE_TIMEOUT)

        return Response(geojson)



class DistrictMonthlyRainfallGeoJSONAPIView(APIView):
    permission_classes = [AllowAny]

    def extract_js_object(self, html_content, var_name):
        start_pattern = f'var {var_name} ='
        start_index = html_content.find(start_pattern)
        if start_index == -1:
            print("Var not found")
            return None
        start_index += len(start_pattern)

        brace_start = html_content.find('{', start_index)
        if brace_start == -1:
            print("Brace not found")
            return None

        brace_count = 0
        i = brace_start
        while i < len(html_content):
            char = html_content[i]
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    js_str = html_content[brace_start:i + 1]
                    break
            i += 1
        else:
            print("End of file without closing brace")
            return None

        js_str = js_str.rstrip('; \n\t ')
        js_str = re.sub(r'//.*?$', '', js_str, flags=re.MULTILINE)
        js_str = re.sub(r',\s*([}\]])', r'\1', js_str)
        js_str = re.sub(r'([{,])\s*([a-zA-Z0-9_]+)\s*:', r'\1"\2":', js_str)
        js_str = js_str.replace("'", '"')
        js_str = js_str.replace("\\/", "/")
        js_str = js_str.strip()

        try:
            parsed = json.loads(js_str)
            print("Parsed successfully")
            return parsed
        except Exception as e:
            print(f"JSON parse failed: {e}")
            print("JS str preview:", repr(js_str[:500]))
            return None

    def get_rainfall_category(self, departure_str):
        try:
            if not departure_str or departure_str == "-100%":
                return "No Rain"
            value = int(departure_str.replace("%", ""))
            if value <= -100:
                return "No Rain"
            elif -99 <= value <= -60:
                return "Large Deficient"
            elif -59 <= value <= -20:
                return "Deficient"
            elif -19 <= value <= 19:
                return "Normal"
            elif 20 <= value <= 59:
                return "Excess"
            else:
                return "Large Excess"
        except:
            return "No Data"

    def get(self, request):
        cache_key_district_monthly = CACHE_KEY + "_district_monthly"
        cached_geojson = cache.get(cache_key_district_monthly)
        if cached_geojson:
            return Response(cached_geojson)

        # Replace URL below with the actual district monthly rainfall data URL
        url = "https://mausam.imd.gov.in/imd_latest/contents/rainfallinformation.php?msg=M"

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            html_content = response.text
            print("Fetched HTML length:", len(html_content))
        except Exception as e:
            return Response({"error": f"Fetch failed: {str(e)}"}, status=500)

        js_data = self.extract_js_object(html_content, "countrydataprovider")
        if not js_data:
            return Response({"error": "Could not extract JS data"}, status=500)

        areas = js_data.get("areas", [])
        images = js_data.get("images", [])

        coord_map = {
            img["label"].strip().upper(): [img["longitude"], img["latitude"]]
            for img in images if "latitude" in img and "longitude" in img
        }

        features = []
        for area in areas:
            district_name = area["title"].strip().upper()
            if "REGION" in district_name or "COUNTRY" in district_name:
                continue

            district_clean = district_name.replace(" (UT)", "").replace(" & ", " AND ").strip()

            coords = None
            for key, coord in coord_map.items():
                key_clean = key.replace(" AND ", " & ").strip()
                if key_clean in district_clean or district_clean in key_clean:
                    coords = coord
                    break
            if not coords:
                print(f"No coordinates found for {district_name}")
                continue

            balloon = area.get("balloonText", "") or ""
            actual_match = re.search(r'Actual\s*:\s*([\d.]+)', balloon)
            normal_match = re.search(r'Normal\s*:\s*([\d.]+)', balloon)
            departure_match = re.search(r'Departure\s*:\s*([-+0-9.%]+)', balloon)

            actual_val = f"{actual_match.group(1)} mm" if actual_match else "0 mm"
            normal_val = f"{normal_match.group(1)} mm" if normal_match else "0 mm"
            dep_val = departure_match.group(1) if departure_match else area.get("info", "")

            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": coords
                },
                "properties": {
                    "district": district_name.title(),
                    "district_id": area.get("id", ""),
                    "actual_rainfall": actual_val,
                    "normal_rainfall": normal_val,
                    "departure": dep_val,
                    "category": self.get_rainfall_category(dep_val),
                    "color": area.get("color", "#FFFFFF"),
                    "data_source": "India Meteorological Department",
                    "last_updated": request.GET.get("date", "This Month")
                }
            })

        geojson = {
            "type": "FeatureCollection",
            "features": features,
            "metadata": {
                "title": "India District-wise Monthly Rainfall Data",
                "source": "India Meteorological Department",
                "total_districts": len(features),
                "legend": {
                    "No Rain": {"range": "-100%", "color": "#FFFFFF"},
                    "Large Deficient": {"range": "-99% to -60%", "color": "#FFFF00"},
                    "Deficient": {"range": "-59% to -20%", "color": "#FF0012"},
                    "Normal": {"range": "-19% to 19%", "color": "#00FF3E"},
                    "Excess": {"range": "20% to 59%", "color": "#58CCED"},
                    "Large Excess": {"range": "≥60%", "color": "#3895D3"}
                }
            }
        }

        cache.set(cache_key_district_monthly, geojson, CACHE_TIMEOUT)

        return Response(geojson)

class DistrictCumulativeRainfallGeoJSONAPIView(APIView):
    permission_classes = [AllowAny]

    def extract_js_object(self, html_content, var_name):
        start_pattern = f'var {var_name} ='
        start_index = html_content.find(start_pattern)
        if start_index == -1:
            print("Var not found")
            return None
        start_index += len(start_pattern)

        brace_start = html_content.find('{', start_index)
        if brace_start == -1:
            print("Brace not found")
            return None

        brace_count = 0
        i = brace_start
        while i < len(html_content):
            char = html_content[i]
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    js_str = html_content[brace_start:i + 1]
                    break
            i += 1
        else:
            print("End of file without closing brace")
            return None

        js_str = js_str.rstrip('; \n\t ')
        js_str = re.sub(r'//.*?$', '', js_str, flags=re.MULTILINE)
        js_str = re.sub(r',\s*([}\]])', r'\1', js_str)
        js_str = re.sub(r'([{,])\s*([a-zA-Z0-9_]+)\s*:', r'\1"\2":', js_str)
        js_str = js_str.replace("'", '"')
        js_str = js_str.replace("\\/", "/")
        js_str = js_str.strip()

        try:
            parsed = json.loads(js_str)
            print("Parsed successfully")
            return parsed
        except Exception as e:
            print(f"JSON parse failed: {e}")
            print("JS str preview:", repr(js_str[:500]))
            return None

    def get_rainfall_category(self, departure_str):
        try:
            if not departure_str or departure_str == "-100%":
                return "No Rain"
            value = int(departure_str.replace("%", ""))
            if value <= -100:
                return "No Rain"
            elif -99 <= value <= -60:
                return "Large Deficient"
            elif -59 <= value <= -20:
                return "Deficient"
            elif -19 <= value <= 19:
                return "Normal"
            elif 20 <= value <= 59:
                return "Excess"
            else:
                return "Large Excess"
        except:
            return "No Data"

    def get(self, request):
        cache_key_district_cumulative = CACHE_KEY + "_district_cumulative"
        cached_geojson = cache.get(cache_key_district_cumulative)
        if cached_geojson:
            return Response(cached_geojson)

        # Replace URL below with the actual district cumulative rainfall data URL
        url = "https://mausam.imd.gov.in/imd_latest/contents/rainfallinformation.php?msg=C"

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            html_content = response.text
            print("Fetched HTML length:", len(html_content))
        except Exception as e:
            return Response({"error": f"Fetch failed: {str(e)}"}, status=500)

        js_data = self.extract_js_object(html_content, "countrydataprovider")
        if not js_data:
            return Response({"error": "Could not extract JS data"}, status=500)

        areas = js_data.get("areas", [])
        images = js_data.get("images", [])

        coord_map = {
            img["label"].strip().upper(): [img["longitude"], img["latitude"]]
            for img in images if "latitude" in img and "longitude" in img
        }

        features = []
        for area in areas:
            district_name = area["title"].strip().upper()
            if "REGION" in district_name or "COUNTRY" in district_name:
                continue

            district_clean = district_name.replace(" (UT)", "").replace(" & ", " AND ").strip()

            coords = None
            for key, coord in coord_map.items():
                key_clean = key.replace(" AND ", " & ").strip()
                if key_clean in district_clean or district_clean in key_clean:
                    coords = coord
                    break
            if not coords:
                print(f"No coordinates found for {district_name}")
                continue

            balloon = area.get("balloonText", "") or ""
            actual_match = re.search(r'Actual\s*:\s*([\d.]+)', balloon)
            normal_match = re.search(r'Normal\s*:\s*([\d.]+)', balloon)
            departure_match = re.search(r'Departure\s*:\s*([-+0-9.%]+)', balloon)

            actual_val = f"{actual_match.group(1)} mm" if actual_match else "0 mm"
            normal_val = f"{normal_match.group(1)} mm" if normal_match else "0 mm"
            dep_val = departure_match.group(1) if departure_match else area.get("info", "")

            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": coords
                },
                "properties": {
                    "district": district_name.title(),
                    "district_id": area.get("id", ""),
                    "actual_rainfall": actual_val,
                    "normal_rainfall": normal_val,
                    "departure": dep_val,
                    "category": self.get_rainfall_category(dep_val),
                    "color": area.get("color", "#FFFFFF"),
                    "data_source": "India Meteorological Department",
                    "last_updated": request.GET.get("date", "Cumulative")
                }
            })

        geojson = {
            "type": "FeatureCollection",
            "features": features,
            "metadata": {
                "title": "India District-wise Cumulative Rainfall Data",
                "source": "India Meteorological Department",
                "total_districts": len(features),
                "legend": {
                    "No Rain": {"range": "-100%", "color": "#FFFFFF"},
                    "Large Deficient": {"range": "-99% to -60%", "color": "#FFFF00"},
                    "Deficient": {"range": "-59% to -20%", "color": "#FF0012"},
                    "Normal": {"range": "-19% to 19%", "color": "#00FF3E"},
                    "Excess": {"range": "20% to 59%", "color": "#58CCED"},
                    "Large Excess": {"range": "≥60%", "color": "#3895D3"}
                }
            }
        }

        cache.set(cache_key_district_cumulative, geojson, CACHE_TIMEOUT)

        return Response(geojson)
