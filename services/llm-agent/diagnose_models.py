import google.generativeai as genai
import os
import sys
from dotenv import load_dotenv

# Force unbuffered output
sys.stdout.reconfigure(encoding='utf-8')

print("--- DIAGNOSTIC START ---")
load_dotenv()
key = os.getenv("GEMINI_KEY")
if not key:
    print("ERROR: GEMINI_KEY not found in env")
    sys.exit(1)

print(f"Key found: {key[:5]}...{key[-5:]}")
genai.configure(api_key=key)

print("Calling list_models()...")
try:
    count = 0
    for m in genai.list_models():
        count += 1
        print(f"Found model: {m.name}")
        if 'generateContent' in m.supported_generation_methods:
             print(f" -> Supports generateContent: {m.name}")
    print(f"--- DIAGNOSTIC END (Found {count} models) ---")
except Exception as e:
    print(f"EXCEPTION: {e}")
