from django.urls import path
from .rainfall import *

urlpatterns = [
    path('state/rainfall/daily', RainfallGeoJSONAPIView.as_view(), name='rainfall-daily-geojson'),
    path('state/rainfall/weekly', WeeklyRainfallGeoJSONAPIView.as_view(), name='rainfall-weekly-geojson'),
    path('state/rainfall/monthly', MonthlyRainfallGeoJSONAPIView.as_view(), name='rainfall-monthly-geojson'),
    path('state/rainfall/cumulative', MonthlyRainfallGeoJSONAPIView.as_view(), name='rainfall-cummulative-geojson'),
    path('district/rainfall/daily',  DistrictDailyRainfallAPIView.as_view(), name='district-rainfall-daily'),
    path('district/rainfall/weekly', DistrictWeeklyRainfallGeoJSONAPIView.as_view(), name='district-rainfall-weekly'),
    path('district/rainfall/monthly', DistrictMonthlyRainfallGeoJSONAPIView.as_view(), name='district-rainfall-monthly'),
    path('district/rainfall/cumulative', DistrictCumulativeRainfallGeoJSONAPIView.as_view(), name='district-rainfall-cumulative'),
    path('rainfall_stats/statewise', StatewiseDistributionAPIView.as_view(), name='statewise-rainfall-distribution'),
    path('rainfall_stats/statewiseDC', StatewiseDistributionDailyCummAPIView.as_view(), name='statewiseDC-rainfall-distribution'),
    path('rainfall_stats/district/weekcumm', DistrictWeekCummulativeAPIView.as_view(), name='district-week-cumm-rainfall_stats'),
    path('rainfall_stats/district/weekly', DistrictWeeklyAPIView.as_view(), name='district-weekly-rainfall_stats'),
    path('rainfall_stats/district/D&C', DistrictDailyCummAPIView.as_view(), name='district-weekly-cummulative_stats'),


 ]
