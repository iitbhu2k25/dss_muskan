from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .models import Block, Village
from .serializers import BlockSerializer, VillageSerializer




class BlockByDistrictAPI(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        districtcodes = request.data.get('districtcodes')

        # ✅ Validation
        if not districtcodes or not isinstance(districtcodes, list):
            return Response(
                {"error": "districtcodes must be a non-empty list"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Multiple filter
        blocks = Block.objects.filter(districtcode__in=districtcodes)
        serializer = BlockSerializer(blocks, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)



class VillageByBlockAPI(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        blockcodes = request.data.get('blockcodes')

        # ✅ Validation
        if not blockcodes or not isinstance(blockcodes, list):
            return Response(
                {"error": "blockcodes must be a non-empty list"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Multiple filter
        villages = Village.objects.filter(blockcode__in=blockcodes)
        serializer = VillageSerializer(villages, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)
