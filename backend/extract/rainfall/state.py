import re
import json
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

CACHE_KEY = "imd_rainfall_geojson"
CACHE_TIMEOUT = 60 * 15  # cache for 15 minutes

class RainfallGeoJSONAPIView(APIView):
    permission_classes = [AllowAny]

    def extract_js_object(self, html_content, var_name):
        # (same as your existing extraction implementation)
        start_pattern = f'var {var_name} ='
        start_index = html_content.find(start_pattern)
        if start_index == -1:
            return None
        start_index += len(start_pattern)

        brace_start = html_content.find('{', start_index)
        if brace_start == -1:
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
            return None

        js_str = re.sub(r'([{,])\s*([a-zA-Z0-9_]+)\s*:', r'\1"\2":', js_str)
        js_str = js_str.replace("'", '"')
        js_str = js_str.replace("\\/", "/")

        try:
            return json.loads(js_str)
        except Exception as e:
            print(f"JSON parse failed: {e}")
            return None

    def get_rainfall_category(self, departure_str):
        # (same as before)
        try:
            if not departure_str or departure_str == "-100%":
                return "No Rain"
            value = int(departure_str.replace("%", ""))
            if value <= -99:
                return "No Rain"
            elif -99 < value <= -60:
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
        # Check cache first
        cached_geojson = cache.get(CACHE_KEY)
        if cached_geojson:
            return Response(cached_geojson)

        url = "https://mausam.imd.gov.in/imd_latest/contents/index_rainfall_state_new.php?msg=D"

        options = Options()
        options.headless = True
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        # Optionally disable images/scripts via Chrome preferences (further speedup)
        prefs = {"profile.managed_default_content_settings.images": 2}
        options.add_experimental_option("prefs", prefs)

        try:
            driver = webdriver.Chrome(options=options)
            driver.get(url)
            html_content = driver.page_source
            driver.quit()
        except Exception as e:
            return Response({"error": f"Selenium fetch failed: {str(e)}"}, status=500)

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
            state_name = area["title"].strip().upper()
            if "REGION" in state_name or "COUNTRY" in state_name:
                continue

            coords = None
            for key, coord in coord_map.items():
                if key in state_name or state_name in key:
                    coords = coord
                    break
            if not coords:
                print(f"No coordinates found for {state_name}")
                continue

            balloon = area.get("balloonText", "")
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
                    "state": state_name.title(),
                    "state_id": area.get("id", ""),
                    "actual_rainfall": actual_val,
                    "normal_rainfall": normal_val,
                    "departure": dep_val,
                    "category": self.get_rainfall_category(dep_val),
                    "color": area.get("color", "#FFFFFF"),
                    "data_source": "India Meteorological Department",
                    "last_updated": request.GET.get("date", "Today")
                }
            })

        geojson = {
            "type": "FeatureCollection",
            "features": features,
            "metadata": {
                "title": "India State-wise Rainfall Data",
                "source": "India Meteorological Department",
                "total_states": len(features),
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

        # Cache the geojson for next requests
        cache.set(CACHE_KEY, geojson, CACHE_TIMEOUT)

        return Response(geojson)
