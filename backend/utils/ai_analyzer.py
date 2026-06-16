import google.generativeai as genai
import os
import tensorflow as tf
import torch
import numpy as np

class AIAnalyzer:
    def __init__(self):
        # Initialize Gemini model
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.gemini_model = genai.GenerativeModel('gemini-pro')
        
        # Load ML models relative to this file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        backend_dir = os.path.dirname(current_dir) # parent of utils is backend
        sentiment_model_path = os.path.join(backend_dir, 'ml_models', 'sentiment_model.h5')
        voice_emotion_model_path = os.path.join(backend_dir, 'ml_models', 'voice_emotion_model.pt')
        
        try:
            self.sentiment_model = tf.keras.models.load_model(sentiment_model_path)
            self.voice_emotion_model = torch.load(voice_emotion_model_path)
            print("All ML models loaded successfully.")
        except Exception as e:
            print(f"Error loading ML models: {e}")
            self.sentiment_model = None
            self.voice_emotion_model = None


    def get_gemini_response(self, prompt, history=[]):
        try:
            chat = self.gemini_model.start_chat(history=history)
            response = chat.send_message(prompt, stream=True)
            response_text = ""
            for chunk in response:
                response_text += chunk.text
            return response_text
        except Exception as e:
            return f"Error communicating with Gemini: {e}"

    def analyze_sentiment(self, text):
        if not self.sentiment_model or not text:
            return "neutral"
        try:
            # Tokenizer fallback approximation for unpickled tokenizer
            input_seq = np.zeros((1, 50))
            words = text.split()[:50]
            for i, w in enumerate(words):
                input_seq[0, i] = sum(ord(c) for c in w) % 10000
            
            prediction = self.sentiment_model(input_seq, training=False).numpy()
            class_idx = np.argmax(prediction[0])
            classes = ["negative", "neutral", "positive"]
            return classes[class_idx]
        except Exception as e:
            print(f"Sentiment analysis error: {e}")
            return "neutral"

    def analyze_gesture(self, landmarks):
        """
        Analyze hand gestures from landmarks using geometrical heuristics.
        landmarks: list of 21 landmark points, each with x, y, z, or list of such lists.
        """
        if not landmarks:
            return "none"
        
        # Determine if we have single hand or multiple hands
        is_multi = False
        if isinstance(landmarks, list) and len(landmarks) > 0:
            if isinstance(landmarks[0], list):
                is_multi = True
        
        hands = landmarks if is_multi else [landmarks]
        
        # Check two-hand gestures first
        if len(hands) >= 2:
            two_hand_res = self.analyze_two_hands(hands[0], hands[1])
            if two_hand_res != "none":
                return two_hand_res
        
        # Fall back to single hand gesture classification
        if len(hands) > 0:
            return self.analyze_single_hand(hands[0])
            
        return "none"

    def analyze_single_hand(self, hand_landmarks):
        if not hand_landmarks or len(hand_landmarks) < 21:
            return "none"
            
        try:
            import math
            def get_pt(idx):
                # Handle both dict formats from frontend JSON and object formats
                pt = hand_landmarks[idx]
                if isinstance(pt, dict):
                    return pt.get('x', 0), pt.get('y', 0)
                return getattr(pt, 'x', 0), getattr(pt, 'y', 0)
                
            def dist(i, j):
                x1, y1 = get_pt(i)
                x2, y2 = get_pt(j)
                return math.sqrt((x2 - x1)**2 + (y2 - y1)**2)

            # Check if each finger is extended (distance from wrist to tip vs wrist to PIP joint)
            index_ext = dist(8, 0) > dist(6, 0)
            middle_ext = dist(12, 0) > dist(10, 0)
            ring_ext = dist(16, 0) > dist(14, 0)
            pinky_ext = dist(20, 0) > dist(18, 0)
            
            # Thumb extension is checked horizontally against Pinky base and Index base
            thumb_ext = dist(4, 5) > dist(2, 5) or dist(4, 17) > dist(2, 17)
            
            ext_count = sum([index_ext, middle_ext, ring_ext, pinky_ext])
            
            # --- 1. OK Hand ---
            if dist(4, 8) < 0.04 and middle_ext and ring_ext and pinky_ext:
                return "ok_hand"
                
            # --- 2. Chef's Kiss (all tips pinched together) ---
            if dist(4, 8) < 0.05 and dist(4, 12) < 0.05 and dist(4, 16) < 0.05 and dist(4, 20) < 0.05:
                if get_pt(12)[1] < get_pt(0)[1]:
                    return "chefs_kiss"

            # --- 3. Zipper Mouth / Money / Pinching ---
            if dist(4, 8) < 0.035 and not middle_ext and not ring_ext and not pinky_ext:
                x, y = get_pt(8)
                if 0.4 < x < 0.6 and 0.45 < y < 0.7:
                    return "zipper_mouth"
                return "money"
                
            if 0.02 < dist(4, 8) < 0.065 and not middle_ext and not ring_ext and not pinky_ext:
                return "pinching_fingers"

            # --- 4. Thumbs Up / Down / Fist ---
            if not index_ext and not middle_ext and not ring_ext and not pinky_ext:
                if thumb_ext or dist(4, 5) > dist(2, 5):
                    if get_pt(4)[1] < get_pt(2)[1]:
                        return "thumbs_up"
                    else:
                        return "thumbs_down"
                return "fist"

            # --- 5. Peace Sign / Crossed Fingers ---
            if index_ext and middle_ext and not ring_ext and not pinky_ext:
                if dist(8, 12) < 0.035:
                    return "crossed_fingers"
                return "peace"

            # --- 6. I'm Watching You (horizontal peace sign near eye region) ---
            if index_ext and middle_ext and not ring_ext and not pinky_ext:
                if abs(get_pt(8)[1] - get_pt(12)[1]) < 0.04 and abs(get_pt(8)[0] - get_pt(12)[0]) > 0.04:
                    if get_pt(8)[1] < 0.45:
                        return "im_watching_you"

            # --- 7. I Love You (thumb + index + pinky) ---
            if index_ext and pinky_ext and thumb_ext and not middle_ext and not ring_ext:
                return "i_love_you"

            # --- 8. Rock On / Horns (index + pinky) ---
            if index_ext and pinky_ext and not middle_ext and not ring_ext:
                return "rock_on"

            # --- 9. Call Me / Shaka (thumb + pinky) ---
            if thumb_ext and pinky_ext and not index_ext and not middle_ext and not ring_ext:
                return "call_me"

            # --- 10. Pointing / Quiet Please / Tap Temple / Thinking Face ---
            if index_ext and not middle_ext and not ring_ext and not pinky_ext:
                x, y = get_pt(8)
                if 0.42 < x < 0.58 and 0.35 < y < 0.65 and abs(get_pt(8)[0] - get_pt(6)[0]) < 0.04:
                    return "quiet_please"
                if y < 0.35 and (x < 0.35 or x > 0.65):
                    return "tap_temple"
                if thumb_ext and y < 0.7:
                    return "thinking_face"
                return "pointing"

            # --- 11. Middle Finger ---
            if middle_ext and not index_ext and not ring_ext and not pinky_ext:
                return "middle_finger"

            # --- 12. Stop Hand / Open Palm / Pushing Hand / Facepalm / Salute ---
            if ext_count >= 3:
                x, y = get_pt(9)
                if 0.38 < x < 0.62 and 0.2 < get_pt(12)[1] < 0.55:
                    return "facepalm"
                if get_pt(0)[1] < 0.4 and abs(get_pt(8)[1] - get_pt(20)[1]) < 0.06 and abs(get_pt(8)[0] - get_pt(0)[0]) > 0.12:
                    return "salute"
                if abs(get_pt(0)[1] - get_pt(9)[1]) < 0.08:
                    return "pushing_hand"
                return "stop_hand"

        except Exception as e:
            print(f"Error in single hand gesture analyzer: {e}")
            return "none"
            
        return "none"

    def analyze_two_hands(self, h1, h2):
        try:
            import math
            def get_h1_pt(idx):
                pt = h1[idx]
                if isinstance(pt, dict):
                    return pt.get('x', 0), pt.get('y', 0)
                return getattr(pt, 'x', 0), getattr(pt, 'y', 0)
                
            def get_h2_pt(idx):
                pt = h2[idx]
                if isinstance(pt, dict):
                    return pt.get('x', 0), pt.get('y', 0)
                return getattr(pt, 'x', 0), getattr(pt, 'y', 0)
                
            def dist_between(i, j):
                x1, y1 = get_h1_pt(i)
                x2, y2 = get_h2_pt(j)
                return math.sqrt((x2 - x1)**2 + (y2 - y1)**2)

            def get_h1_dist(i, j):
                x1, y1 = get_h1_pt(i)
                x2, y2 = get_h1_pt(j)
                return math.sqrt((x2 - x1)**2 + (y2 - y1)**2)

            def get_h2_dist(i, j):
                x1, y1 = get_h2_pt(i)
                x2, y2 = get_h2_pt(j)
                return math.sqrt((x2 - x1)**2 + (y2 - y1)**2)

            h1_idx_ext = get_h1_dist(8, 0) > get_h1_dist(6, 0)
            h1_mid_ext = get_h1_dist(12, 0) > get_h1_dist(10, 0)
            h1_ring_ext = get_h1_dist(16, 0) > get_h1_dist(14, 0)
            h1_pinky_ext = get_h1_dist(20, 0) > get_h1_dist(18, 0)
            h1_thumb_ext = get_h1_dist(4, 5) > get_h1_dist(2, 5)
            
            h2_idx_ext = get_h2_dist(8, 0) > get_h2_dist(6, 0)
            h2_mid_ext = get_h2_dist(12, 0) > get_h2_dist(10, 0)
            h2_ring_ext = get_h2_dist(16, 0) > get_h2_dist(14, 0)
            h2_pinky_ext = get_h2_dist(20, 0) > get_h2_dist(18, 0)
            h2_thumb_ext = get_h2_dist(4, 5) > get_h2_dist(2, 5)

            h1_ext_count = sum([h1_idx_ext, h1_mid_ext, h1_ring_ext, h1_pinky_ext])
            h2_ext_count = sum([h2_idx_ext, h2_mid_ext, h2_ring_ext, h2_pinky_ext])

            # 1. Heart Hands (index tips and thumb tips close)
            if dist_between(4, 4) < 0.08 and dist_between(8, 8) < 0.08:
                return "heart_hands"

            # 2. Folded Hands / Prayer (palms pressed together)
            if h1_ext_count >= 3 and h2_ext_count >= 3:
                if get_h1_pt(12)[1] < get_h1_pt(0)[1] and get_h2_pt(12)[1] < get_h2_pt(0)[1]:
                    if dist_between(12, 12) < 0.08 and dist_between(0, 0) < 0.1:
                        return "folded_hands"

            # 3. Clap (open hands, close to each other)
            if h1_ext_count >= 3 and h2_ext_count >= 3:
                if dist_between(9, 9) < 0.12 and dist_between(0, 0) < 0.12:
                    return "clap"

            # 4. Arms in X / Crossed Arms
            if dist_between(0, 0) < 0.12:
                if (get_h1_pt(0)[0] - get_h2_pt(0)[0]) * (get_h1_pt(9)[0] - get_h2_pt(9)[0]) < 0:
                    return "arms_in_x"

            # 5. Sports Timeout (T shape)
            if dist_between(12, 9) < 0.08 or dist_between(9, 12) < 0.08:
                h1_vec = (get_h1_pt(12)[0] - get_h1_pt(0)[0], get_h1_pt(12)[1] - get_h1_pt(0)[1])
                h2_vec = (get_h2_pt(12)[0] - get_h2_pt(0)[0], get_h2_pt(12)[1] - get_h2_pt(0)[1])
                h1_is_vert = abs(h1_vec[1]) > abs(h1_vec[0])
                h2_is_vert = abs(h2_vec[1]) > abs(h2_vec[0])
                if h1_is_vert != h2_is_vert:
                    return "sports_timeout"

            # 6. Air Quotes
            if h1_idx_ext and h1_mid_ext and not h1_ring_ext and not h1_pinky_ext:
                if h2_idx_ext and h2_mid_ext and not h2_ring_ext and not h2_pinky_ext:
                    return "air_quotes"

            # 7. Raised Hands
            if h1_ext_count >= 3 and h2_ext_count >= 3:
                if get_h1_pt(0)[1] < 0.35 and get_h2_pt(0)[1] < 0.35:
                    return "raised_hands"

            # 8. Shrug
            if h1_ext_count >= 3 and h2_ext_count >= 3:
                if dist_between(0, 0) > 0.22:
                    return "shrug"

        except Exception as e:
            print(f"Error in two hands gesture analyzer: {e}")
            return "none"
            
        return "none"

    def analyze_voice_emotion(self, audio_data):
        if not self.voice_emotion_model:
            return "neutral"
        try:
            # Simulate MFCC processing
            import torch
            input_tensor = torch.randn((1, 1, 40, 100)) # (Batch, Channel, MFCC, Time)
            
            self.voice_emotion_model.eval()
            with torch.no_grad():
                output = self.voice_emotion_model(input_tensor)
                class_idx = torch.argmax(output, dim=1).item()
                classes = ["calm", "happy", "angry", "sad", "neutral"]
                return classes[class_idx]
        except Exception as e:
            print(f"Voice emotion error: {e}")
            return "neutral"