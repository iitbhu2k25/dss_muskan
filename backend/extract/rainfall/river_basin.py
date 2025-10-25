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

    # Example precipitation data for days keyed by river basin id
    day_precipitation_data = {
        "Day1": {
            1: {"title": "Ajoy:Ajoy", "fmo": "fmo_asansol", "precip": "0 mm", "color": "#FFFFFF"},
            2: {"title": "Alaknanda:Alaknanda", "fmo": "fmo_lucknow", "precip": "0 mm", "color": "#FFFFFF"},
            9: {"title": "Barak:Barak at Silchar", "fmo": "fmo_guwahati", "precip": "0.1 - 10 mm", "color": "#009933"},
            # Fill other basins as needed
        },
        # Add data for other days - Day2, Day3,... AAP
    }

    def get(self, request, *args, **kwargs):
        day = kwargs.get('day', request.GET.get("day", "Day1"))

        if day not in self.day_precipitation_data:
            return JsonResponse({"error": f"Invalid day value {day}"}, status=400)

        try:
            # Fetch HTML page for specified day
            url = f"{self.BASE_URL}?msg={day}"
            response = requests.get(url, timeout=30, verify=False)
            response.raise_for_status()
            html = response.text

            soup = BeautifulSoup(html, 'html.parser')

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

            # Build AmCharts areas array with precipitation data matching GeoJSON features by id
            areas = []
            for feature in geojson_data.get("features", []):
                props = feature.get("properties", {})
                area_id = props.get("id") or props.get("ID") or props.get("Id")
                if area_id is None:
                    continue

                basin_data = self.day_precipitation_data[day].get(area_id)
                if basin_data is None:
                    area_obj = {
                        "id": area_id,
                        "title": props.get("name", "Unknown"),
                        "color": "#FFFFFF"
                    }
                else:
                    area_obj = {
                        "id": area_id,
                        "title": f"{basin_data['title']}<br>FMO:{basin_data['fmo']}<br>{basin_data['precip']}<br> Date:2025-10-24",
                        "color": basin_data["color"]
                    }
                areas.append(area_obj)

            result = {
                "mapVar": geojson_data,
                "areas": areas
            }

            return JsonResponse(result)

        except requests.RequestException as e:
            return JsonResponse({"error": f"Failed to fetch data: {str(e)}"}, status=502)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
