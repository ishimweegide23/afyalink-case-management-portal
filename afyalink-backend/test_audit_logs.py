import urllib.request
import json
import sys

# Login
login_data = json.dumps({"email": "admin@afyalink.rw", "password": "Egide12@"}).encode("utf-8")
req = urllib.request.Request("http://localhost:8080/api/auth/login", data=login_data, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req) as response:
        res = json.loads(response.read().decode())
        token = res["data"]["token"]

    # Fetch audit logs
    req2 = urllib.request.Request("http://localhost:8080/api/audit-logs?page=0&size=20", headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req2) as response2:
        res2 = json.loads(response2.read().decode())
        print(f"SUCCESS: Found {len(res2['data']['content'])} audit logs")
except urllib.error.HTTPError as e:
    print(f"HTTP ERROR: {e.code}")
    body = e.read().decode()
    print(f"Response Body: {body}")
    sys.exit(1)
except Exception as e:
    print(f"ERROR: {str(e)}")
    sys.exit(1)
