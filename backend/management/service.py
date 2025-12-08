from django.conf import settings
from django.contrib.auth.hashers import check_password
from django.db.models import Q
from .models import PersonalAdmin
import jwt

def register_admin(data):
    from .serializers import RegisterSerializer

    # Check existing email or username
    if PersonalAdmin.objects.filter(email=data.get('email')).exists():
        return False, "Email already registered"

    if PersonalAdmin.objects.filter(username=data.get('username')).exists():
        return False, "Username already taken"

    serializer = RegisterSerializer(data=data)
    if serializer.is_valid():
        user = serializer.save()
        token = jwt.encode({"user_id": user.id}, settings.SECRET_KEY, algorithm="HS256")
        return True, {"user": user, "token": token}
    else:
        return False, serializer.errors


def login_admin(email, password):
    try:
        admin = PersonalAdmin.objects.get(email=email)
        print(f"Found admin: {admin.email}")
    except PersonalAdmin.DoesNotExist:
        print(f"No admin found with email: {email}")
        return False, "Invalid email or password"

    if not check_password(password, admin.password):
        print(f"Password mismatch for {email}")
        return False, "Invalid email or password"

    print(f"Password correct for {email}")
    token = jwt.encode({"user_id": admin.id}, settings.SECRET_KEY, algorithm="HS256")
    return True, {"user": admin, "token": token}
