##################------For Admin---------#####################

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.db.models import Q
from .models import PersonalAdmin,PersonalEmployee
import jwt
from datetime import datetime, timedelta
from .serializers import EmployeeRegisterSerializer, EmployeeLoginSerializer




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


def get_all_admins():
    return PersonalAdmin.objects.all()


def register_employee(data):
    """
    Register a new employee
    Sets is_active to True by default
    """
    # Check if email already exists
    if PersonalEmployee.objects.filter(email=data.get('email', '').lower()).exists():
        return False, "Email already registered"

    # Check if username already exists
    if PersonalEmployee.objects.filter(username=data.get('username', '').lower()).exists():
        return False, "Username already taken"

    # Validate and create employee
    serializer = EmployeeRegisterSerializer(data=data)
    if serializer.is_valid():
        employee = serializer.save()
        
        # Generate JWT token
        token = generate_employee_token(employee.id)
        
        return True, {"employee": employee, "token": token}
    else:
        # Return validation errors
        errors = serializer.errors
        error_message = "; ".join([f"{k}: {', '.join(v)}" for k, v in errors.items()])
        return False, error_message


def login_employee(email, password):
    """
    Login employee
    Sets is_active to True
    Uses check_password for hashed password comparison
    """
    try:
        # Find employee by email (case-insensitive)
        employee = PersonalEmployee.objects.get(email=email.lower())
        
        # Check password using Django's check_password (handles hashed passwords)
        if not check_password(password, employee.password):
            return False, "Invalid email or password"
        
        # Set employee as active
        employee.is_active = True
        employee.save(update_fields=['is_active'])
        
        # Generate JWT token
        token = generate_employee_token(employee.id)
        
        return True, {"employee": employee, "token": token}
        
    except PersonalEmployee.DoesNotExist:
        return False, "Invalid email or password"
    except Exception as e:
        return False, f"Login error: {str(e)}"


def logout_employee(token):
    """
    Logout employee
    Sets is_active to False
    """
    try:
        # Decode token to get employee_id
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        employee_id = payload.get('employee_id')
        
        if not employee_id:
            return False, "Invalid token"
        
        # Find employee and set inactive
        employee = PersonalEmployee.objects.get(id=employee_id)
        employee.is_active = False
        employee.save(update_fields=['is_active'])
        
        return True, "Logout successful"
        
    except jwt.ExpiredSignatureError:
        return False, "Token has expired"
    except jwt.InvalidTokenError:
        return False, "Invalid token"
    except PersonalEmployee.DoesNotExist:
        return False, "Employee not found"
    except Exception as e:
        return False, f"Logout error: {str(e)}"


def get_employee_status(token):
    """
    Get employee status from token
    """
    try:
        # Decode token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        employee_id = payload.get('employee_id')
        
        if not employee_id:
            return False, "Invalid token"
        
        # Find employee
        employee = PersonalEmployee.objects.get(id=employee_id)
        
        return True, {
            "employee": employee,
            "is_active": employee.is_active
        }
        
    except jwt.ExpiredSignatureError:
        return False, "Token has expired"
    except jwt.InvalidTokenError:
        return False, "Invalid token"
    except PersonalEmployee.DoesNotExist:
        return False, "Employee not found"
    except Exception as e:
        return False, str(e)


def generate_employee_token(employee_id, expiry_days=30):
    """
    Generate JWT token for employee
    """
    payload = {
        'employee_id': employee_id,
        'exp': datetime.utcnow() + timedelta(days=expiry_days),
        'iat': datetime.utcnow()
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    return token


def verify_employee_token(token):
    """
    Verify and decode employee token
    Returns employee if valid and active
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        employee_id = payload.get('employee_id')
        
        # Check if employee exists and is active
        employee = PersonalEmployee.objects.get(id=employee_id, is_active=True)
        return True, employee
        
    except jwt.ExpiredSignatureError:
        return False, "Token has expired"
    except jwt.InvalidTokenError:
        return False, "Invalid token"
    except PersonalEmployee.DoesNotExist:
        return False, "Employee not found or inactive"
    except Exception as e:
        return False, str(e)

