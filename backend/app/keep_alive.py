import requests
import time
import os
from datetime import datetime

API_URL = os.getenv('API_URL', 'https://geneticalgo.onrender.com')

def ping_server():
    while True:
        try:
            response = requests.get(f"{API_URL}/health")
            print(f"[{datetime.now()}] Ping status: {response.status_code}")
        except Exception as e:
            print(f"[{datetime.now()}] Error pinging server: {str(e)}")
        
        # Sleep for 14 minutes (just under Render's 15-minute limit)
        time.sleep(840)

if __name__ == "__main__":
    ping_server()