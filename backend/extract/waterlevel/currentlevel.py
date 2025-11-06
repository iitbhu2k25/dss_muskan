from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
import json
import re
import time


class FFSConsoleDataView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        options = Options()
        options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        options.set_capability("goog:loggingPrefs", {"browser": "ALL"})

        try:
            options.binary_location = "/usr/bin/google-chrome"
            driver = webdriver.Chrome(options=options)
        except Exception as e:
            return Response({
                "status": "error",
                "message": f"Failed to start Chrome: {str(e)}"
            }, status=500)

        try:
            url = "https://ffs.india-water.gov.in/"
            driver.get(url)

            # Wait for full load
            WebDriverWait(driver, 30).until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )

            # Allow extra time for map + data to load and print in console
            time.sleep(12)

            logs = driver.get_log("browser")

        except Exception as e:
            driver.quit()
            return Response({
                "status": "error",
                "message": f"Browser interaction failed: {str(e)}"
            }, status=500)
        finally:
            driver.quit()

        extracted_data = None

        for entry in logs:
            msg = entry.get("message", "")

            # Find array-like console message containing station data
            if "[" in msg and "geometry" in msg and "stationCode" in msg:
                # Extract array safely using a non-greedy match
                match = re.search(r"\[.*?\]", msg)
                if not match:
                    continue

                raw_json = match.group(0)

                # Clean up special characters and ellipses
                cleaned = (
                    raw_json
                    .replace("…", "")  # remove JS ellipses
                    .replace("'", '"')  # ensure valid JSON quotes
                )

                try:
                    data = json.loads(cleaned)
                    if isinstance(data, list) and len(data) > 0:
                        extracted_data = data
                        break
                except Exception:
                    continue

        if extracted_data:
            return Response({
                "status": "success",
                "count": len(extracted_data),
                "data": extracted_data
            })
        else:
            return Response({
                "status": "error",
                "message": "No valid array data found in console logs."
            }, status=404)
