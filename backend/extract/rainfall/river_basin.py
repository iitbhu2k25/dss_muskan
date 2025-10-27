import requests
import re
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

class RiverBasinAPIView(APIView):
    permission_classes = [AllowAny]

    BASE_URL = "https://mausam.imd.gov.in/imd_latest/contents/index_qpf.php"

    def extract_precipitation_from_script(self, html):
        """
        Extract areas array from the embedded JavaScript in the HTML
        Returns a dictionary keyed by area id
        """
        precip_dict = {}
        
        # Find the areas array in the script
        areas_match = re.search(r'"areas":\s*\[(.*?)\](?=\s*\})', html, re.DOTALL)
        
        if areas_match:
            areas_str = '[' + areas_match.group(1) + ']'
            # Parse individual area objects
            area_objects = re.findall(r'\{[^}]+\}', areas_str)
            
            for area_obj in area_objects:
                # Extract id
                id_match = re.search(r'"id":\s*"(\d+)"', area_obj)
                # Extract title
                title_match = re.search(r'"title":\s*"([^"]+)"', area_obj)
                # Extract color
                color_match = re.search(r'"color":\s*"([^"]+)"', area_obj)
                
                if id_match and title_match and color_match:
                    area_id = int(id_match.group(1))
                    title = title_match.group(1)
                    color = color_match.group(1)
                    
                    # Parse title to extract components
                    parts = title.split("<br>")
                    basin_name = parts[0] if len(parts) > 0 else "Unknown"
                    fmo = parts[1].replace("FMO:", "") if len(parts) > 1 else ""
                    precip = parts[2] if len(parts) > 2 else "0 mm"
                    date = parts[3].replace(" Date:", "").strip() if len(parts) > 3 else ""
                    
                    precip_dict[area_id] = {
                        "title": title,  # Keep full title with <br> tags
                        "basin_name": basin_name,
                        "fmo": fmo,
                        "precip": precip,
                        "color": color,
                        "date": date
                    }
        
        return precip_dict

    def get(self, request, *args, **kwargs):
        day = kwargs.get('day', request.GET.get("day", "Day1"))

        try:
            # Fetch HTML page for specified day
            url = f"{self.BASE_URL}?msg={day}"
            response = requests.get(url, timeout=30, verify=False)
            response.raise_for_status()
            html = response.text

            soup = BeautifulSoup(html, 'html.parser')

            # Extract precipitation data from the embedded script
            precipitation_data = self.extract_precipitation_from_script(html)

            # Extract GeoJSON URL from embedded jQuery.getJSON call
            scripts = soup.find_all("script")
            geojson_url = None
            for script in scripts:
                if script.string and "jQuery.getJSON" in script.string:
                    match = re.search(r'jQuery\.getJSON\(["\'](.*?)["\']', script.string)
                    if match:
                        geojson_url = urljoin(url, match.group(1))
                        break

            if not geojson_url:
                return JsonResponse({"error": "GeoJSON URL not found in IMD page"}, status=500)

            # Fetch GeoJSON content
            geojson_resp = requests.get(geojson_url, timeout=30, verify=False)
            geojson_resp.raise_for_status()
            geojson_data = geojson_resp.json()

            # Merge areas data into GeoJSON features
            for feature in geojson_data.get("features", []):
                props = feature.get("properties", {})
                
                # Get OBJECTID from GeoJSON properties
                object_id = props.get("OBJECTID") or props.get("id") or props.get("ID")
                
                if object_id is not None:
                    try:
                        object_id_int = int(object_id)
                        basin_data = precipitation_data.get(object_id_int)
                        
                        if basin_data:
                            # Merge all precipitation data into feature properties
                            props["title"] = basin_data["title"]
                            props["color"] = basin_data["color"]
                            props["basin_name"] = basin_data["basin_name"]
                            props["fmo_precip"] = basin_data["fmo"]
                            props["precipitation"] = basin_data["precip"]
                            props["date"] = basin_data["date"]
                        else:
                            # Set default values if no precipitation data
                            props["title"] = props.get("Subbasin_1", "Unknown")
                            props["color"] = "#FFFFFF"
                            props["precipitation"] = "0 mm"
                            props["date"] = ""
                    except (ValueError, TypeError):
                        pass

            # Return the enriched GeoJSON as single result
            return JsonResponse(geojson_data, safe=False)

        except requests.RequestException as e:
            return JsonResponse({"error": f"Failed to fetch data: {str(e)}"}, status=502)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)