import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load from backend/.env
load_dotenv("backend/.env")

API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=API_KEY)

def test_model(model_name, api_version=None):
    print(f"Testing model: {model_name} with API version: {api_version}")
    try:
        if api_version:
            # Note: There isn't a direct way to set api_version in GenerativeModel constructor 
            # in recent versions, it's usually handled in the configure or through internal routing.
            # But we can try to see if it works by default.
            pass
        
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Hello")
        print(f"Success! Response: {response.text[:20]}...")
    except Exception as e:
        print(f"Error: {e}")

test_model("gemini-2.0-flash")
test_model("gemini-2.5-flash")
test_model("gemini-3.5-flash")
test_model("gemini-flash-latest")
