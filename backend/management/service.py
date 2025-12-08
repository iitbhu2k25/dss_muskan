##################------For Admin---------#####################

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
    except PersonalAdmin.DoesNotExist:
        return False, "Invalid email or password"

    if not check_password(password, admin.password):
        return False, "Invalid email or password"

    # Reactivate user on login
    if not admin.is_active:
        admin.is_active = True
        admin.save()

    token = jwt.encode({"user_id": admin.id}, settings.SECRET_KEY, algorithm="HS256")
    return True, {"user": admin, "token": token}




def logout_admin(token):
    """Marks the admin as inactive based on JWT token."""
    if not token:
        return False, "Token missing"

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("user_id")
        admin = PersonalAdmin.objects.get(id=user_id)
    except (jwt.ExpiredSignatureError, jwt.DecodeError, PersonalAdmin.DoesNotExist):
        return False, "Invalid token"

    admin.is_active = False
    admin.save()
    return True, "Logout successful"


