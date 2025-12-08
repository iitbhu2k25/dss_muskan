from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .service import register_admin, login_admin
from .serializers import LoginSerializer

class RegisterAdminView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        success, result = register_admin(request.data)
        if success:
            user = result['user']
            token = result['token']
            return Response({
                "success": True,
                "message": "Registration successful",
                "user": {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "username": user.username,
                    "department": user.department,
                    "projects": user.projects
                },
                "token": token
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                "success": False,
                "message": result
            }, status=status.HTTP_400_BAD_REQUEST)


class LoginAdminView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "success": False,
                "message": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        success, result = login_admin(email, password)
        if success:
            admin = result['user']
            token = result['token']
            return Response({
                "success": True,
                "message": "Login successful",
                "user": {
                    "id": admin.id,
                    "name": admin.name,
                    "email": admin.email,
                    "username": admin.username,
                    "department": admin.department,
                    "projects": admin.projects
                },
                "token": token
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                "success": False,
                "message": result
            }, status=status.HTTP_401_UNAUTHORIZED)