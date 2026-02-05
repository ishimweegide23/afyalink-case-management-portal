import urllib.request
import json

# Login
login_data = json.dumps({"email": "admin@afyalink.rw", "password": "Egide12@"}).encode("utf-8")
req = urllib.request.Request("http://localhost:8080/api/auth/login", data=login_data, headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req) as response:
    res = json.loads(response.read().decode())
    token = res["data"]["token"]
print(f"Logged in OK, token length: {len(token)}")

# Test export
req2 = urllib.request.Request(
    "http://localhost:8080/api/audit-logs/export?format=excel",
    headers={"Authorization": f"Bearer {token}"}
)
with urllib.request.urlopen(req2) as response:
    content = response.read()
    content_type = response.headers.get('Content-Type', '')
    print(f"Export SUCCESS: {len(content)} bytes, Content-Type: {content_type}")

# Test stats
req3 = urllib.request.Request(
    "http://localhost:8080/api/audit-logs/stats",
    headers={"Authorization": f"Bearer {token}"}
)
with urllib.request.urlopen(req3) as response:
    res3 = json.loads(response.read().decode())
    print(f"Stats: {res3['data']}")
