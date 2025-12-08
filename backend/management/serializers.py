from rest_framework import serializers
from .models import PersonalAdmin

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
