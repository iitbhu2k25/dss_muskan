from django.urls import path
from .views import BlockByDistrictAPI, VillageByBlockAPI

urlpatterns = [
    path('getblocks', BlockByDistrictAPI.as_view(), name='get_blocks'),
    path('getvillages', VillageByBlockAPI.as_view(), name='get_villages'),
]
