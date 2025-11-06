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

            # Wait until the page fully loads
            WebDriverWait(driver, 30).until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )

            # Allow more time for the data to load
            time.sleep(20)

            # Repeatedly check for logs (some appear after delays)
            all_logs = []
            for _ in range(5):
                logs = driver.get_log("browser")
                all_logs.extend(logs)
                time.sleep(3)

        except Exception as e:
            driver.quit()
            return Response({
                "status": "error",
                "message": f"Browser interaction failed: {str(e)}"
            }, status=500)
        finally:
            driver.quit()

        extracted_data = None
        debug_snippets = []

        for entry in all_logs:
            msg = entry.get("message", "")
            debug_snippets.append(msg[:200])  # Save first 200 chars for debugging

            # Look for console output that seems like GeoJSON/array
            if any(k in msg for k in ["geometry", "stationCode", "coordinates"]):
                # Extract array/object
                match = re.search(r"(\[.*\])", msg)
                if not match:
                    match = re.search(r"(\{.*\})", msg)
                if not match:
                    continue

                raw_json = match.group(0)

                cleaned = (
                    raw_json
                    .replace("…", "")
                    .replace("'", '"')
                    .replace("None", "null")
                    .replace("True", "true")
                    .replace("False", "false")
                )

                try:
                    data = json.loads(cleaned)
                    if isinstance(data, list) and len(data) > 0:
                        extracted_data = data
                        break
                    elif isinstance(data, dict) and "features" in data:
                        extracted_data = data
                        break
                except json.JSONDecodeError:
                    continue

        if extracted_data:
            return Response({
                "status": "success",
                "count": len(extracted_data) if isinstance(extracted_data, list) else 1,
                "data": extracted_data
            })
        else:
            return Response({
                "status": "error",
                "message": "No valid GeoJSON or array data found in console logs.",
                "debug_samples": debug_snippets[:10]  # Show some of the logs to debug
            }, status=404)
