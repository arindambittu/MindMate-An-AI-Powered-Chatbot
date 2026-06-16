class FusionEngine:
    def __init__(self, analyzer):
        self.analyzer = analyzer

    def fuse_multimodal_context(self, user_text, audio_data=None, gesture_state="none", image_data=None):
        """
        Takes inputs from various modalities and creates an enriched context prompt for Gemini.
        """
        # 1. Text Sentiment
        text_sentiment = "neutral"
        if user_text:
            text_sentiment = self.analyzer.analyze_sentiment(user_text)

        # 2. Voice Emotion
        voice_emotion = "neutral"
        if audio_data:
            voice_emotion = self.analyzer.analyze_voice_emotion(audio_data)

        # 3. Fusion prompt Construction
        system_context = (
            f"### MULTIMODAL CONTEXT (Invisible to user) ###\n"
            f"Current Emotional Sentiment from Text: {text_sentiment}\n"
            f"Current Vocal Emotion: {voice_emotion}\n"
            f"Current User Physical Gesture: {gesture_state}\n"
            f"Instruction: You are MindMate, a highly empathetic mental wellness assistant. "
            f"Subtly adjust your tone based on the emotional context above. "
            f"Never expose the raw multimodal states to the user. "
            f"### END CONTEXT ###\n"
        )
        
        # Combine
        combined_prompt = f"{system_context}\nUser explicitly says: {user_text}" if user_text else f"{system_context}\n[User sent an image or gesture without speaking]"
        return combined_prompt
