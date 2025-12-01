#!/usr/bin/env python3
"""Simple smoke test script that verifies backend endpoints are working.

Usage:
  python3 tools/smoke_test.py

Requires: requests
"""
import sys
import os
import time
import json

try:
    import requests
except Exception:
    print("The 'requests' library is required. Install with: pip install requests")
    sys.exit(2)

BASE = os.getenv("SIMTS_API_URL", "http://127.0.0.1:8000")

def expect_ok(resp):
    if resp.status_code != 200:
        print(f"FAIL: HTTP {resp.status_code} -> {resp.text}")
        return False
    try:
        data = resp.json()
    except Exception:
        print("FAIL: response is not JSON")
        return False
    if not data.get("ok"):
        print("FAIL: response JSON 'ok' != true ->", json.dumps(data, indent=2, ensure_ascii=False))
        return False
    return True

def test_list_cases():
    print("[*] Testing GET /api/cases ...")
    try:
        r = requests.get(f"{BASE}/api/cases", timeout=10)
    except Exception as e:
        print("ERROR connecting to backend:", e)
        return False
    return expect_ok(r)

def test_generate_case():
    print("[*] Testing POST /api/simulate (generate)...")
    payload = {"generate": True, "theme": "Salud mental", "difficulty": "basico"}
    try:
        r = requests.post(f"{BASE}/api/simulate", json=payload, timeout=60)
    except Exception as e:
        print("ERROR connecting to backend:", e)
        return False
    if not expect_ok(r):
        return False
    data = r.json()
    if not data.get("case"):
        print("WARN: response didn't include 'case' field; raw text:\n", data.get("text"))
        return False
    return True

def main():
    print("Smoke test starting against:", BASE)
    ok1 = test_list_cases()
    # small pause
    time.sleep(0.5)
    ok2 = test_generate_case()
    if ok1 and ok2:
        print("\nALL CHECKS PASSED")
        return 0
    else:
        print("\nSome checks failed")
        return 1

if __name__ == '__main__':
    sys.exit(main())
