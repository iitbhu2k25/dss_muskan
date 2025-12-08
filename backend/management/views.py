from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from .service import register_admin, login_admin, logout_admin, get_all_admins
from .serializers import LoginSerializer, PersonalAdminSerializer


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
            
            

class LogoutAdminView(APIView):
    permission_classes = [AllowAny] 

    def post(self, request):
        auth_header = request.headers.get('Authorization')
        token = auth_header.split(' ')[1] if auth_header and auth_header.startswith('Bearer ') else None

        success, message = logout_admin(token)
        if success:
            return Response({"success": True, "message": message}, status=status.HTTP_200_OK)
        else:
            return Response({"success": False, "message": message}, status=status.HTTP_401_UNAUTHORIZED)
        
        

class PersonalAdminListView(APIView):
    permission_classes = [AllowAny] 
    def get(self, request):
        admins = get_all_admins()
        serializer = PersonalAdminSerializer(admins, many=True)
        return Response({
            "success": True,
            "data": serializer.data
        }, status=status.HTTP_200_OK)        
            
            
            
class RegisterEmployeeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        success, result = register_employee(request.data)
        if success:
            employee = result['employee']
            token = result['token']
            return Response({
                "success": True,
                "message": "Employee registration successful",
                "employee": {
                    "id": employee.id,
                    "name": employee.name,
                    "email": employee.email,
                    "username": employee.username,
                    "department": employee.department,
                    "supervisor": employee.supervisor,
                    "project_name": employee.project_name
                },
                "token": token
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({"success": False, "message": result}, status=status.HTTP_400_BAD_REQUEST)