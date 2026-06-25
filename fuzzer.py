import requests
import time

# Updated target URL to match the likely Blueprint prefix
TARGET_URL = "http://127.0.0.1:5000/auth/login"

# Updated payloads to use "username" instead of "email"
malicious_payloads = [
    {"username": "test@vault.com", "password": "wrongpassword"},  # Standard brute force
    {"username": "admin' OR 1=1--", "password": "password"},      # Classic SQL Injection
    {"username": "<script>alert('hack')</script>", "password": "pw"}, # XSS Payload
    {"username": "A" * 50000, "password": "password"},            # Buffer overflow / Massive string
    {"username": ["an array", "instead of a string"], "password": "pw"}, # Type mismatch
    {} # Completely empty JSON
]

print(f"[*] Initiating fuzzing attack on {TARGET_URL}...")
print("[*] Testing for crash resilience and rate limiting...\n")

for i in range(1, 31):
    payload = malicious_payloads[i % len(malicious_payloads)]
    
    try:
        response = requests.post(TARGET_URL, json=payload, timeout=2)
        print(f"Request {i:02d} | Status: {response.status_code} | Payload Type: {str(payload)[:30]}...")
        
    except requests.exceptions.ReadTimeout:
        print(f"Request {i:02d} | TIMEOUT (The server might be struggling to process the payload)")
    except Exception as e:
        print(f"Request {i:02d} | CONNECTION FAILED: {e}")
