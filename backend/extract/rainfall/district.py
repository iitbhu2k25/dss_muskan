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

    def create_error_geojson(self, error_message, period="D"):
        """Always return GeoJSON format, even for errors"""
        return {
            "type": "FeatureCollection",
            "period": period,
            "error": error_message,
            "features": []
        }

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
            # Return error in GeoJSON format
            return Response(self.create_error_geojson(f"Failed to fetch data: {str(e)}", param), status=500)

        areas = self.extract_areas_from_html(html_content)
        if not areas:
            # Return error in GeoJSON format
            return Response(self.create_error_geojson("Failed to extract rainfall data", param), status=500)

        # Fetch GeoJSON and map geometries by ID
        geojson_data = self.fetch_geojson()
        if not geojson_data:
            # Return error in GeoJSON format
            return Response(self.create_error_geojson("Failed to fetch GeoJSON", param), status=500)

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

    def create_error_geojson(self, error_message, period="W"):
        """Always return GeoJSON format, even for errors"""
        return {
            "type": "FeatureCollection",
            "period": period,
            "error": error_message,
            "features": []
        }

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
        param = request.GET.get('msg', 'W')
        cache_key = f"{CACHE_KEY}_weekly_{param}"
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
            # Return error in GeoJSON format
            return Response(self.create_error_geojson(f"Failed to fetch data: {str(e)}", param), status=500)

        areas = self.extract_areas_from_html(html_content)
        if not areas:
            # Return error in GeoJSON format
            return Response(self.create_error_geojson("Failed to extract rainfall data", param), status=500)

        # Fetch GeoJSON and map geometries by ID
        geojson_data = self.fetch_geojson()
        if not geojson_data:
            # Return error in GeoJSON format
            return Response(self.create_error_geojson("Failed to fetch GeoJSON", param), status=500)

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


class DistrictMonthlyRainfallGeoJSONAPIView(APIView):
    permission_classes = [AllowAny]

    def create_error_geojson(self, error_message, period="M"):
        """Always return GeoJSON format, even for errors"""
        return {
            "type": "FeatureCollection",
            "period": period,
            "error": error_message,
            "features": []
        }

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
        param = request.GET.get('msg', 'M')
        cache_key = f"{CACHE_KEY}_monthly_{param}"
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
            # Return error in GeoJSON format
            return Response(self.create_error_geojson(f"Failed to fetch data: {str(e)}", param), status=500)

        areas = self.extract_areas_from_html(html_content)
        if not areas:
            # Return error in GeoJSON format
            return Response(self.create_error_geojson("Failed to extract rainfall data", param), status=500)

        # Fetch GeoJSON and map geometries by ID
        geojson_data = self.fetch_geojson()
        if not geojson_data:
            # Return error in GeoJSON format
            return Response(self.create_error_geojson("Failed to fetch GeoJSON", param), status=500)

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


class DistrictCumulativeRainfallGeoJSONAPIView(APIView):
    permission_classes = [AllowAny]

    def create_error_geojson(self, error_message, period="C"):
        """Always return GeoJSON format, even for errors"""
        return {
            "type": "FeatureCollection",
            "period": period,
            "error": error_message,
            "features": []
        }

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
        param = request.GET.get('msg', 'C')
        cache_key = f"{CACHE_KEY}_cumulative_{param}"
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
            # Return error in GeoJSON format
            return Response(self.create_error_geojson(f"Failed to fetch data: {str(e)}", param), status=500)

        areas = self.extract_areas_from_html(html_content)
        if not areas:
            # Return error in GeoJSON format
            return Response(self.create_error_geojson("Failed to extract rainfall data", param), status=500)

        # Fetch GeoJSON and map geometries by ID
        geojson_data = self.fetch_geojson()
        if not geojson_data:
            # Return error in GeoJSON format
            return Response(self.create_error_geojson("Failed to fetch GeoJSON", param), status=500)

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
