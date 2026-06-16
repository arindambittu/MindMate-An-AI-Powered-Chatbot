import os

class Config:
    # Set your Gemini API key here.
    # It is highly recommended to use an environment variable for security.
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    
    # Paths for your machine learning models
    # Ensure these paths are correct relative to your app.py
    GESTURE_MODEL_PATH = "ml_models/gesture_model.h5"
    SENTIMENT_MODEL_PATH = "ml_models/sentiment_model.h5"
    VOICE_EMOTION_MODEL_PATH = "ml_models/voice_emotion_model.pt"

    # Directory for temporary file uploads
    UPLOAD_FOLDER = "uploads"