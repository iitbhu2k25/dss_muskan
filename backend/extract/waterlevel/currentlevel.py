from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from selenium import webdriver
from selenium.webdriver.chrome.options import Options  # Changed
from bs4 import BeautifulSoup
import time
from datetime import datetime
import re

class WaterLevelAPIView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        station_code = request.data.get('station_code')
        
        if not station_code:
            return Response(
                {"error": "station_code is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        url = f"https://ffs.india-water.gov.in/#/main/station-detail/{station_code}"
        
        try:
            # Set up headless Chrome browser
            chrome_options = Options()
            chrome_options.add_argument("--headless=new")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")  # Added for server
            
            driver = webdriver.Chrome(options=chrome_options)  # Changed
            
            # Open page and wait for JS to load
            driver.get(url)
            time.sleep(5)
            
            # Parse page
            soup = BeautifulSoup(driver.page_source, 'html.parser')
            driver.quit()
            
            # Extract Present Water Level
            wl_value = None
            for div in soup.find_all("div"):
                text = div.get_text(strip=True)
                match = re.match(r'^(\d+\.\d+)', text)
                if match:
                    val = float(match.group(1))
                    if 10 <= val <= 150:
                        wl_value = val
                        break
            
            if wl_value is not None:
                current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                
                return Response({
                    'DateTime': current_time,
                    'Water_Level_m': wl_value
                }, status=status.HTTP_200_OK)
                
            return Response(
                {"error": "Water level not found on page"}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )