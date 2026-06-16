import speech_recognition as sr
import os
import io

class SpeechProcessor:
    def __init__(self):
        self.recognizer = sr.Recognizer()

    def transcribe(self, audio_data_stream):
        try:
            audio_data = sr.AudioFile(audio_data_stream)
            with audio_data as source:
                audio = self.recognizer.record(source)
            transcript = self.recognizer.recognize_google(audio)
            return transcript
        except sr.UnknownValueError:
            return "Could not understand audio"
        except sr.RequestError as e:
            return f"Error with speech recognition service: {e}"

    def analyze_tone(self, text):
        # This is a placeholder. A real implementation would use a
        # more advanced ML model from your ai_analyzer.py.
        lower_text = text.lower()
        if "help" in lower_text or "stressed" in lower_text or "anxious" in lower_text:
            return "anxious"
        elif "happy" in lower_text or "great" in lower_text:
            return "calm"
        else:
            return "neutral"