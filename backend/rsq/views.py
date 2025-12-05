from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .models import Block, Village, GroundWaterData
from .serializers import BlockSerializer, VillageSerializer, GroundWaterDataSerializer
import os
import geopandas as gpd
from django.conf import settings
from .utils import get_stage_status_and_color

class BlockByDistrictAPI(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        districtcodes = request.data.get('districtcodes')


        if not districtcodes or not isinstance(districtcodes, list):
            return Response(
                {"error": "districtcodes must be a non-empty list"},
                status=status.HTTP_400_BAD_REQUEST
            )

      
        blocks = Block.objects.filter(districtcode__in=districtcodes)
        serializer = BlockSerializer(blocks, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)



class VillageByBlockAPI(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        blockcodes = request.data.get('blockcodes')

 
        if not blockcodes or not isinstance(blockcodes, list):
            return Response(
                {"error": "blockcodes must be a non-empty list"},
                status=status.HTTP_400_BAD_REQUEST
            )

        
        villages = Village.objects.filter(blockcode__in=blockcodes)
        serializer = VillageSerializer(villages, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

class VillageGroundWaterGeoJSONAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            # ✅ 1. READ REQUEST DATA
            year_full = request.data.get("year")
            vlcodes = request.data.get("vlcodes")

            if not year_full or not vlcodes:
                return Response(
                    {"error": "year and vlcodes are required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ✅ 2. CONVERT YEAR FORMAT (2020 - 21)
            db_year = year_full[:4] + "-" + year_full[7:9]

            # ✅ 3. CONVERT VLCODES TO STRING (FOR SHAPEFILE MATCH)
            vlcodes_str = [str(v) for v in vlcodes]

            # ✅ 4. FETCH DB DATA (ALL COLUMNS)
            gw_data_qs = GroundWaterData.objects.filter(
                Year=db_year,
                vlcode__in=vlcodes
            )

            if not gw_data_qs.exists():
                return Response(
                    {
                        "error": "No matching groundwater data found",
                        "debug_year_used": db_year,
                        "debug_vlcodes": vlcodes
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            serializer = GroundWaterDataSerializer(gw_data_qs, many=True)
            db_data_list = serializer.data

            # ✅ 5. LOAD SHAPEFILE
            shp_path = os.path.join(
                settings.MEDIA_ROOT,
                "gwa_data",
                "gwa_shp",
                "Final_Village",
                "Village_New.shp"
            )

            if not os.path.exists(shp_path):
                return Response(
                    {"error": "Village shapefile not found"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            gdf = gpd.read_file(shp_path)

            # ✅ ✅ ✅  ADD PROJECTION CHANGE HERE (TO EPSG:3857)
            if gdf.crs is None:
                gdf = gdf.set_crs(epsg=4326)     # assume WGS84 if missing

            gdf = gdf.to_crs(epsg=3857)         # ✅ REPROJECT TO WEB MERCATOR

            # ✅ 6. ENSURE vlcode STRING TYPE
            gdf["vlcode"] = gdf["vlcode"].astype(str)

            # ✅ 7. FILTER SHAPEFILE
            gdf_filtered = gdf[gdf["vlcode"].isin(vlcodes_str)]

            if gdf_filtered.empty:
                return Response(
                    {
                        "error": "No matching villages found in shapefile",
                        "debug_vlcodes_str": vlcodes_str
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            # ✅ 8. CONVERT SHAPEFILE → GEOJSON
            geojson = gdf_filtered.__geo_interface__   # ✅ SAME OUTPUT STRUCTURE

            # ✅ 9. BUILD DB DICTIONARY WITH ALL FIELDS + STATUS + COLOR
            db_dict = {}

            for item in db_data_list:
                stage = item.get("Stage_of_Ground_Water_Extraction")

                status_text, color = get_stage_status_and_color(stage)

                item["status"] = status_text
                item["color"] = color

                db_dict[int(item["vlcode"])] = item

            # ✅ 10. MERGE SHAPEFILE + DATABASE (FULL COLUMN MERGE)
            final_features = []

            for feature in geojson["features"]:
                shp_vlcode_str = feature["properties"]["vlcode"]
                shp_vlcode_int = int(shp_vlcode_str)

                if shp_vlcode_int in db_dict:
                    feature["properties"] = db_dict[shp_vlcode_int]

                final_features.append(feature)

            # ✅ 11. FINAL GEOJSON OUTPUT (UNCHANGED FOR FRONTEND)
            final_geojson = {
                "type": "FeatureCollection",
                "features": final_features
            }

            return Response(final_geojson, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

