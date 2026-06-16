import cv2
import mediapipe as mp
import time
import math
import numpy as np
import sys
import webbrowser

# ==========================================
# DEFENSIVE IMPORTS FOR ROBUST EXECUTION
# ==========================================
try:
    import pyautogui
    pyautogui.FAILSAFE = False
    pyautogui_available = True
except Exception:
    pyautogui_available = False
    print("WARNING: PyAutoGUI not available. Simulation mode enabled.")

try:
    import pyttsx3
    engine = pyttsx3.init()
    # Speed up speech rate slightly
    engine.setProperty('rate', 170)
    tts_available = True
except Exception:
    tts_available = False
    print("WARNING: pyttsx3 not available. Voice synthesis disabled.")

# Defensive ML imports to support TensorFlow/PyTorch integration
try:
    import tensorflow as tf
    tf_available = True
except Exception:
    tf_available = False

try:
    import torch
    torch_available = True
except Exception:
    torch_available = False

# ==========================================
# MEDIAPIPE SOLUTIONS INITIALIZATION
# ==========================================
mp_drawing = mp.solutions.drawing_utils
mp_hands = mp.solutions.hands
mp_face_mesh = mp.solutions.face_mesh
mp_pose = mp.solutions.pose

# Initialize MediaPipe instances
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)

face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)

pose = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)

# Custom Hand Connections (White lines connecting knuckles)
HAND_PALM_CONNECTIONS = [
    (0,1), (1,2), (2,3), (3,4),
    (0,5), (5,6), (6,7), (7,8),
    (5,9), (9,10), (10,11), (11,12),
    (9,13), (13,14), (14,15), (15,16),
    (13,17), (0,17), (17,18), (18,19), (19,20)
]

# ==========================================
# MATHEMATICAL HELPER FUNCTIONS
# ==========================================
def calculate_distance(p1, p2):
    return math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

def calculate_angle(a, b, c):
    """Calculates angle ABC (in degrees) using law of cosines or vector math."""
    a = np.array(a) # First point (e.g. hip)
    b = np.array(b) # Joint point (e.g. knee)
    c = np.array(c) # End point (e.g. ankle)
    
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    
    if angle > 180.0:
        angle = 360 - angle
        
    return angle

def get_hand_gesture(landmarks, img_w, img_h):
    """Robust geometrical heuristics for hand gestures."""
    # Convert landmarks to pixel positions
    pts = [(int(lm.x * img_w), int(lm.y * img_h)) for lm in landmarks]
    
    # Extensions
    index_ext = calculate_distance(pts[8], pts[0]) > calculate_distance(pts[6], pts[0])
    middle_ext = calculate_distance(pts[12], pts[0]) > calculate_distance(pts[10], pts[0])
    ring_ext = calculate_distance(pts[16], pts[0]) > calculate_distance(pts[14], pts[0])
    pinky_ext = calculate_distance(pts[20], pts[0]) > calculate_distance(pts[18], pts[0])
    thumb_ext = calculate_distance(pts[4], pts[17]) > calculate_distance(pts[2], pts[17])
    
    count = sum([index_ext, middle_ext, ring_ext, pinky_ext])
    
    # 1. OK SIGN
    if calculate_distance(pts[4], pts[8]) < 25 and middle_ext and ring_ext and pinky_ext:
        return "OK"
        
    # 2. PEACE
    if index_ext and middle_ext and not ring_ext and not pinky_ext:
        return "PEACE (FAN OFF)"
        
    # 3. THUMBS UP
    if thumb_ext and count == 0 and pts[4][1] < pts[3][1]:
        return "THUMBS UP (LIGHT ON)"
        
    # 4. THUMBS DOWN
    if thumb_ext and count == 0 and pts[4][1] > pts[3][1]:
        return "THUMBS DOWN (LIGHT OFF)"
        
    # 5. POINTING
    if index_ext and count == 1:
        return "POINTING"
        
    # 6. OPEN PALM
    if count >= 3 and thumb_ext:
        return "OPEN PALM"
        
    # 7. FIST
    if count == 0 and not thumb_ext:
        return "FIST"
        
    return "SCANNING..."

def speak(text):
    """Speaks text using TTS or prints it out defensively."""
    print(f"TTS Output: {text}", flush=True)
    if tts_available:
        try:
            engine.say(text)
            engine.runAndWait()
        except Exception:
            pass

# ==========================================
# MAIN CONTROLLER MODULE
# ==========================================
def main():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("ERROR: Could not open webcam.")
        return

    # Screen dimensions for pyautogui mapping
    screen_w, screen_h = (1920, 1080)
    if pyautogui_available:
        screen_w, screen_h = pyautogui.size()

    # Active System Mode: 1 -> Hands, 2 -> Face, 3 -> Body/Pose
    active_mode = 1 
    
    # Cursor and smoothing variables
    prev_x, prev_y = 0, 0
    smoothing = 5
    
    # Cooldowns and history buffers
    last_swipe_time = 0
    swipe_cooldown = 1.0 # seconds
    prev_index_x = None
    
    # Speech trigger controls to prevent repeating TTS too fast
    last_speech_time = 0
    speech_cooldown = 3.0
    last_spoken_gesture = ""

    # Drowsiness detection tracking
    blink_start_time = None
    drowsy_alert_active = False

    # Squat counting pose variables
    squat_counter = 0
    squat_stage = "up" # "up" or "down"
    
    # Presentation slides raised hands tracking
    slide_raised_cooldown = False
    last_slide_time = 0

    # FPS Calculation
    prev_frame_time = time.time()
    
    print("\n" + "="*50)
    print(" MINDMATE MASTER GESTURE CONTROL PANEL ACTIVE")
    print("="*50)
    print("Press keyboard keys to switch modes:")
    print("  '1' -> Hand Gesture Control Mode ✋ (Virtual Mouse, Volume, Brightness, TTS)")
    print("  '2' -> Facial Gesture Control Mode 😀 (Head Cursor, Smile Snap, Blink Click)")
    print("  '3' -> Body Pose Control Mode 🕺 (Fitness squat counter, Slide control, Gaming)")
    print("  'q' -> Quit Controller")
    print("="*50 + "\n")

    while cap.isOpened():
        success, image = cap.read()
        if not success:
            continue

        # Flip horizontally for mirrored view
        image = cv2.flip(image, 1)
        img_h, img_w, _ = image.shape
        
        # Draw elegant Purple Camera Frame Boundary
        cv2.rectangle(image, (10, 10), (img_w - 10, img_h - 10), (255, 0, 180), 3)

        # Keyboard hotkey listeners
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('1'):
            active_mode = 1
            speak("Hands Control Mode activated")
        elif key == ord('2'):
            active_mode = 2
            speak("Facial Control Mode activated")
        elif key == ord('3'):
            active_mode = 3
            speak("Body Pose Control Mode activated")

        # Process frames depending on the active tracking mode
        # ======================================================
        # MODE 1: HAND GESTURE CONTROL
        # ======================================================
        if active_mode == 1:
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = hands.process(image_rgb)

            if results.multi_hand_landmarks:
                for hand_landmarks in results.multi_hand_landmarks:
                    landmarks = hand_landmarks.landmark
                    pts = [(int(lm.x * img_w), int(lm.y * img_h)) for lm in landmarks]
                    
                    # 1. Output Coordinate Log for ID 12 (Middle finger tip) in real time
                    mx, my = pts[12][0], pts[12][1]
                    print(f"[12, {mx}, {my}]", flush=True)

                    # 2. Draw Hand Bounding Box dynamically in GREEN
                    x_coords = [p[0] for p in pts]
                    y_coords = [p[1] for p in pts]
                    x_min, x_max = min(x_coords), max(x_coords)
                    y_min, y_max = min(y_coords), max(y_coords)
                    cv2.rectangle(image, (x_min - 20, y_min - 20), (x_max + 20, y_max + 20), (0, 255, 0), 2)

                    # 3. Custom Landmark Highlight Overlay matching the user request
                    # Connectors in white
                    for conn in HAND_PALM_CONNECTIONS:
                        p1 = pts[conn[0]]
                        p2 = pts[conn[1]]
                        cv2.line(image, p1, p2, (255, 255, 255), 2)
                    
                    # Joints in pink/magenta
                    for idx, pt in enumerate(pts):
                        if idx == 12: # Middle finger tip -> LARGE RED DOT
                            cv2.circle(image, pt, 12, (0, 0, 255), -1)
                        elif idx in [4, 8, 16, 20]: # Other fingertips -> PINK/MAGENTA
                            cv2.circle(image, pt, 10, (180, 0, 255), -1)
                        else: # Knuckles/joints -> PINK/MAGENTA
                            cv2.circle(image, pt, 6, (230, 0, 230), -1)

                    # 4. Gesture Heuristic Classifications
                    gesture = get_hand_gesture(landmarks, img_w, img_h)
                    
                    # 5. Executing Gesture Actions in Real Time
                    # VIRTUAL MOUSE CURSOR MOVING (Index Finger Tip Landmark 8)
                    index_x, index_y = pts[8][0], pts[8][1]
                    # Map to screen dimensions
                    screen_x = np.interp(index_x, (50, img_w - 50), (0, screen_w))
                    screen_y = np.interp(index_y, (50, img_h - 50), (0, screen_h))
                    
                    # Smooth cursor movement
                    curr_x = prev_x + (screen_x - prev_x) / smoothing
                    curr_y = prev_y + (screen_y - prev_y) / smoothing
                    
                    if pyautogui_available:
                        pyautogui.moveTo(curr_x, curr_y)
                    prev_x, prev_y = curr_x, curr_y

                    # PINCH TO CLICK
                    thumb_tip = pts[4]
                    dist_pinch = calculate_distance(pts[8], thumb_tip)
                    if dist_pinch < 25: # Pinch detected!
                        cv2.circle(image, pts[8], 15, (0, 255, 0), 2)
                        cv2.putText(image, "CLICK", (pts[8][0] - 20, pts[8][1] - 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                        if pyautogui_available:
                            pyautogui.click()

                    # VOLUME & BRIGHTNESS SYSTEM CONTROLS
                    # Volume control: distance between Thumb (4) and Pinky (20)
                    dist_vol = calculate_distance(pts[4], pts[20])
                    # Brightness control: distance between Thumb (4) and Index (8)
                    dist_bright = calculate_distance(pts[4], pts[8])

                    if gesture == "FIST":
                        # Fist acts as mute
                        if pyautogui_available:
                            pyautogui.press('volumemute')
                            cv2.putText(image, "MUTED", (50, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
                            time.sleep(0.3)

                    # MEDIA PLAYER SWIPE CONTROL
                    now_time = time.time()
                    if prev_index_x is not None and (now_time - last_swipe_time > swipe_cooldown):
                        dx = pts[8][0] - prev_index_x
                        if dx < -70: # Rapid swipe Left -> Prev Track
                            if pyautogui_available:
                                pyautogui.press('prevtrack')
                            speak("Previous track")
                            last_swipe_time = now_time
                        elif dx > 70: # Rapid swipe Right -> Next Track
                            if pyautogui_available:
                                pyautogui.press('nexttrack')
                            speak("Next track")
                            last_swipe_time = now_time
                    prev_index_x = pts[8][0]

                    # SIGN LANGUAGE & SMART HOME COMMANDS (With Speak Throttle)
                    if gesture in ["THUMBS UP (LIGHT ON)", "THUMBS DOWN (LIGHT OFF)", "OK", "PEACE (FAN OFF)"]:
                        if gesture != last_spoken_gesture or (now_time - last_speech_time > speech_cooldown):
                            last_speech_time = now_time
                            last_spoken_gesture = gesture
                            
                            # Smart Home Triggers
                            if gesture == "THUMBS UP (LIGHT ON)":
                                speak("Smart Home Command: Turning lights ON")
                            elif gesture == "THUMBS DOWN (LIGHT OFF)":
                                speak("Smart Home Command: Turning lights OFF")
                            elif gesture == "OK":
                                speak("Smart Home Command: Turning fan ON")
                            elif gesture == "PEACE (FAN OFF)":
                                speak("Smart Home Command: Turning fan OFF")

                    # Draw text card
                    cv2.rectangle(image, (20, img_h - 100), (380, img_h - 30), (0, 0, 0), -1)
                    cv2.rectangle(image, (20, img_h - 100), (380, img_h - 30), (255, 0, 180), 2)
                    cv2.putText(image, f"HAND STATE: {gesture}", (30, img_h - 60), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        # ======================================================
        # MODE 2: FACIAL GESTURE CONTROL
        # ======================================================
        elif active_mode == 2:
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(image_rgb)

            if results.multi_face_landmarks:
                for face_landmarks in results.multi_face_landmarks:
                    pts = [(int(lm.x * img_w), int(lm.y * img_h)) for lm in face_landmarks.landmark]

                    # Overlay Face Mesh landmarks beautifully in pink
                    for pt in pts[::8]: # Draw every 8th point for a premium, lightweight wireframe look
                        cv2.circle(image, pt, 1, (255, 0, 180), -1)

                    # HEAD MOVEMENT CURSOR CONTROL (Nose Tip Landmark ID 1)
                    nose_tip = pts[1]
                    cv2.circle(image, nose_tip, 5, (0, 255, 0), -1) # Green nose dot
                    
                    # Calculate deviation from camera center
                    center_x, center_y = img_w // 2, img_h // 2
                    dx = nose_tip[0] - center_x
                    dy = nose_tip[1] - center_y
                    
                    # Draw a virtual joystick vector
                    cv2.line(image, (center_x, center_y), nose_tip, (255, 255, 255), 1)
                    
                    if abs(dx) > 15 or abs(dy) > 15: # Deadzone threshold
                        # Map nose movement relative vector directly to mouse movement velocity
                        move_x = int(dx * 1.5)
                        move_y = int(dy * 1.5)
                        if pyautogui_available:
                            pyautogui.moveRel(move_x, move_y)

                    # EYE ASPECT RATIO (EAR) FOR BLINK DETECTOR & DROWSINESS
                    # Left eye: upper 159, lower 145, left corner 33, right corner 133
                    left_ear = calculate_distance(pts[159], pts[145]) / max(1, calculate_distance(pts[33], pts[133]))
                    # Right eye: upper 386, lower 374, left corner 362, right corner 263
                    right_ear = calculate_distance(pts[386], pts[374]) / max(1, calculate_distance(pts[362], pts[263]))
                    
                    avg_ear = (left_ear + right_ear) / 2.0
                    
                    if avg_ear < 0.15: # Eyes closed
                        if blink_start_time is None:
                            blink_start_time = time.time()
                        
                        elapsed_closed = time.time() - blink_start_time
                        
                        # Deliberate Eye Blink Click
                        if elapsed_closed >= 0.4 and elapsed_closed < 1.5:
                            cv2.putText(image, "BLINK DETECTED - CLICK", (50, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
                        
                        # DROWSINESS DETECTION SYSTEM (> 2.0 seconds closed)
                        if elapsed_closed >= 2.0:
                            drowsy_alert_active = True
                            cv2.rectangle(image, (50, 180), (img_w - 50, 260), (0, 0, 255), -1)
                            cv2.putText(image, "DROWSINESS ALERT!", (70, 235), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 3)
                            if time.time() - last_speech_time > 4.0:
                                last_speech_time = time.time()
                                speak("Drowsiness Alert detected. Wake up!")
                    else:
                        # Eye Blink Double Click action trigger
                        if blink_start_time is not None:
                            duration = time.time() - blink_start_time
                            if duration >= 0.3 and duration < 1.0:
                                if pyautogui_available:
                                    pyautogui.doubleClick()
                            blink_start_time = None
                            drowsy_alert_active = False

                    # SMILE DETECTION FOR ACTIONS
                    # Left corner 61, Right corner 291, Nose tip 1
                    mouth_width = calculate_distance(pts[61], pts[291])
                    nose_to_mouth = calculate_distance(pts[1], pts[17]) # distance nose to lip
                    smile_ratio = mouth_width / max(1, nose_to_mouth)
                    
                    # If smiling ratio is high, user is smiling!
                    if smile_ratio > 1.95:
                        cv2.putText(image, "SMILE DETECTED!", (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 255), 2)
                        
                        # Take Smile Snapshot photo
                        if time.time() - last_speech_time > 5.0:
                            last_speech_time = time.time()
                            snap_path = "smile_snap.jpg"
                            cv2.imwrite(snap_path, image)
                            speak("Cheeze! Smile photo taken.")
                            # Expression Music Player Happy Link
                            webbrowser.open("https://www.youtube.com/watch?v=ZbZSe6N_BXs") # Ph Williams - Happy
                    elif smile_ratio < 1.3: # Frowning
                        cv2.putText(image, "FROWN DETECTED", (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
                        if time.time() - last_speech_time > 10.0:
                            last_speech_time = time.time()
                            # Expression Music Player Calm Link
                            webbrowser.open("https://www.youtube.com/watch?v=5qap5aO4i9A") # Lofi calm playlist
                            speak("Sad expression detected. Playing calm music playlist.")

                    # Draw Facial Mode HUD Cards
                    cv2.rectangle(image, (20, img_h - 100), (380, img_h - 30), (0, 0, 0), -1)
                    cv2.rectangle(image, (20, img_h - 100), (380, img_h - 30), (255, 0, 180), 2)
                    cv2.putText(image, f"FACE: EAR={avg_ear:.2f} Smile={smile_ratio:.2f}", (30, img_h - 60), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        # ======================================================
        # MODE 3: BODY POSE GESTURE CONTROL
        # ======================================================
        elif active_mode == 3:
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = pose.process(image_rgb)

            if results.pose_landmarks:
                # Draw Pose landmarks
                mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS,
                                          mp_drawing.DrawingSpec(color=(255, 255, 255), thickness=2, circle_radius=2),
                                          mp_drawing.DrawingSpec(color=(255, 0, 180), thickness=2))
                
                # Extract landmarks
                landmarks = results.pose_landmarks.landmark
                pts = [(int(lm.x * img_w), int(lm.y * img_h)) for lm in landmarks]

                # 1. VIRTUAL FITNESS TRAINER (Squat Count Angle Hip-Knee-Ankle)
                # Left Hip 23, Left Knee 25, Left Ankle 27
                hip = pts[23]
                knee = pts[25]
                ankle = pts[27]
                
                knee_angle = calculate_angle(hip, knee, ankle)
                
                # Draw angle on screen above the knee
                cv2.putText(image, f"{int(knee_angle)} deg", (knee[0] + 15, knee[1]),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

                # Squat state logic
                if knee_angle < 115: # Deep squat!
                    squat_stage = "down"
                elif knee_angle > 155 and squat_stage == "down":
                    squat_stage = "up"
                    squat_counter += 1
                    speak(f"Squat {squat_counter}")
                    
                # 2. PRESENTATION SLIDE CONTROL (Left Wrist 15 vs Left Shoulder 11)
                left_wrist = pts[15]
                left_shoulder = pts[11]
                
                now_time = time.time()
                # Hand Raise -> Next Slide
                if left_wrist[1] < left_shoulder[1] - 60:
                    if not slide_raised_cooldown and (now_time - last_slide_time > 2.0):
                        if pyautogui_available:
                            pyautogui.press('right') # Next slide arrow
                        speak("Next slide")
                        slide_raised_cooldown = True
                        last_slide_time = now_time
                else:
                    slide_raised_cooldown = False

                # Left Wrist Wave -> Previous Slide
                if left_wrist[0] < left_shoulder[0] - 100:
                    if now_time - last_slide_time > 2.5:
                        if pyautogui_available:
                            pyautogui.press('left') # Previous slide arrow
                        speak("Previous slide")
                        last_slide_time = now_time

                # 3. GAMING KEYBOARD CONTROLS (Lean body based on Shoulder Midpoint 11 and 12)
                shoulder_mid_x = (pts[11][0] + pts[12][0]) // 2
                frame_mid_x = img_w // 2
                
                if shoulder_mid_x < frame_mid_x - 35: # Leaning Left
                    cv2.putText(image, "GAME LEAN: LEFT (A)", (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
                    if pyautogui_available:
                        pyautogui.keyDown('a')
                        pyautogui.keyUp('d')
                elif shoulder_mid_x > frame_mid_x + 35: # Leaning Right
                    cv2.putText(image, "GAME LEAN: RIGHT (D)", (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
                    if pyautogui_available:
                        pyautogui.keyDown('d')
                        pyautogui.keyUp('a')
                else:
                    if pyautogui_available:
                        pyautogui.keyUp('a')
                        pyautogui.keyUp('d')

                # Draw Fitness Count HUD Cards
                cv2.rectangle(image, (20, img_h - 100), (380, img_h - 30), (0, 0, 0), -1)
                cv2.rectangle(image, (20, img_h - 100), (380, img_h - 30), (255, 0, 180), 2)
                cv2.putText(image, f"SQUAT COUNT: {squat_counter} ({squat_stage.upper()})", (30, img_h - 60), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        # Draw Active Mode HUD Label
        mode_names = {1: "HAND GESTURES ✋", 2: "FACIAL GESTURES 😀", 3: "BODY POSE POSE 🕺"}
        cv2.rectangle(image, (20, 20), (350, 75), (30, 20, 30), -1)
        cv2.rectangle(image, (20, 20), (350, 75), (255, 0, 180), 2)
        cv2.putText(image, "MODE SELECT PANEL:", (30, 42),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1)
        cv2.putText(image, mode_names[active_mode], (30, 64),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        # Real-time Blue FPS Overlay
        current_time = time.time()
        fps = int(1.0 / (current_time - prev_frame_time))
        prev_frame_time = current_time
        # Draw blue label matching user prompt format
        cv2.putText(image, f"{fps} <- FPS", (img_w - 200, 55), 
                    cv2.FONT_HERSHEY_DUPLEX, 0.9, (255, 0, 0), 2)

        # Display output
        cv2.imshow('MindMate Camera Control', image)
        # Wait key handles opencv event queue processing

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
