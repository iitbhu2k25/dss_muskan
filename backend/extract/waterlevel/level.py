import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny 
class HGStationDataAPIView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        # Validate required fields
        station_code = request.data.get("stationCode")
        start_date = request.data.get("startDate")
        end_date = request.data.get("endDate")

        if not station_code or not start_date or not end_date:
            return Response(
                {"error": "stationCode, startDate, and endDate are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # External API endpoint
        url = "https://ffs.india-water.gov.in/web-api/getHGStationDataForFFS/"

        # Payload for external API
        payload = {
            "stationCode": station_code,
            "startDate": start_date,
            "endDate": end_date
        }

        try:
            # Send POST request to external API
            response = requests.post(url, json=payload, timeout=20)

            # If external API fails
            if response.status_code != 200:
                return Response(
                    {
                        "error": "External API returned an error",
                        "status_code": response.status_code,
                        "details": response.text
                    },
                    status=status.HTTP_502_BAD_GATEWAY
                )

            # Normal success response
            return Response(response.json(), status=status.HTTP_200_OK)

        except requests.exceptions.RequestException as e:
            return Response(
                {"error": "Failed to reach external API", "details": str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
