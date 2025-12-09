from rest_framework import serializers
from .models import PersonalAdmin, PersonalEmployee
from django.contrib.auth.hashers import make_password


class PersonalAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonalAdmin
        fields = "__all__"

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonalAdmin
        fields = ['id', 'name', 'email', 'username', 'password', 'department', 'projects']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = PersonalAdmin(**validated_data)
        user.save()  
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    
    


class EmployeeRegisterSerializer(serializers.ModelSerializer):
    """Serializer for employee registration"""
    class Meta:
        model = PersonalEmployee
        fields = [
            'id', 'name', 'email', 'username', 'password',
            'department', 'supervisor', 'project_name', 'is_active'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'is_active': {'read_only': True}
        }

    def create(self, validated_data):
        # Hash the password before saving
        validated_data['password'] = make_password(validated_data['password'])
        validated_data['is_active'] = True  # Set active on registration
        employee = PersonalEmployee.objects.create(**validated_data)
        return employee


class EmployeeLoginSerializer(serializers.Serializer):
    """Serializer for employee login"""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate_email(self, value):
        return value.lower().strip()


class EmployeeSerializer(serializers.ModelSerializer):
    """Serializer for employee data (without password)"""
    projectName = serializers.CharField(source='project_name', read_only=True)
    
    class Meta:
        model = PersonalEmployee
        fields = [
            'id', 'name', 'email', 'username',
            'department', 'supervisor', 'projectName', 'is_active'
        ]
        read_only_fields = fields

class ProjectFilterSerializer(serializers.Serializer):
    """Serializer for filtering employees by projects"""
    projects = serializers.ListField(
        child=serializers.CharField(max_length=200),
        allow_empty=False
    )