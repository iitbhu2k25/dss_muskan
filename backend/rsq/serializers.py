from rest_framework import serializers
from .models import Block, Village


class BlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Block
        fields = ['block', 'blockcode', 'district']


class VillageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Village
        fields = ['vlcode', 'village']
