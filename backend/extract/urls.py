from django.urls import path
from .rainfall import *

urlpatterns = [
    path('state/rainfall/daily', RainfallGeoJSONAPIView.as_view(), name='rainfall-daily-geojson'),
    path('state/rainfall/weekly', WeeklyRainfallGeoJSONAPIView.as_view(), name='rainfall-weekly-geojson'),
    path('state/rainfall/monthly', MonthlyRainfallGeoJSONAPIView.as_view(), name='rainfall-monthly-geojson'),
    path('state/rainfall/cummulative', MonthlyRainfallGeoJSONAPIView.as_view(), name='rainfall-cummulative-geojson'),
    path('district/rainfall/daily', DistrictDailyRainfallGeoJSONAPIView.as_view(), name='district-rainfall-daily'),
    path('district/rainfall/weekly', DistrictWeeklyRainfallGeoJSONAPIView.as_view(), name='district-rainfall-weekly'),
    path('district/rainfall/monthly', DistrictMonthlyRainfallGeoJSONAPIView.as_view(), name='district-rainfall-monthly'),
    path('district/rainfall/cumulative', DistrictCumulativeRainfallGeoJSONAPIView.as_view(), name='district-rainfall-cumulative'),
]
