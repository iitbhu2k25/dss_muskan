from django.urls import path
from .rainfall import RainfallGeoJSONAPIView

urlpatterns = [
    path('rainfall/daily', RainfallGeoJSONAPIView.as_view(), name='rainfall-daily-geojson'),
]