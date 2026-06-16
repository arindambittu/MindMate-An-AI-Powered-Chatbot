import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

print(f"google-generativeai version: {genai.__version__}")

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    print("GEMINI_API_KEY not found in environment variables!")
else:
    genai.configure(api_key=API_KEY)
    try:
        models = []
        for m in genai.list_models():
            models.append({
                "name": m.name,
                "display_name": m.display_name,
                "supported_generation_methods": m.supported_generation_methods
            })
        with open("models.json", "w") as f:
            json.dump(models, f, indent=2)
        print("Models written to models.json")
    except Exception as e:
        print(f"Error listing models: {e}")
