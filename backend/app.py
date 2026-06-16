from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
import logging
import jwt
import datetime
import json
import io
import base64
import pdfplumber
from functools import wraps
from dotenv import load_dotenv
from utils.ai_analyzer import AIAnalyzer
from logic.fusion_engine import FusionEngine

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from models import db, Conversation, Message, User

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}) # Enable CORS for all API routes

# Database Configuration
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, 'instance', 'mindmate.db')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + db_path
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'default_secret_key')

db.init_app(app)

with app.app_context():
    db.create_all()

# Configuration
API_KEY = os.getenv("GEMINI_API_KEY") 
if not API_KEY:
    logger.error("GEMINI_API_KEY not found in environment variables!")
else:
    genai.configure(api_key=API_KEY)

# Initialize Gemini Model
try:
    model = genai.GenerativeModel('gemini-2.5-flash')
    logger.info("Gemini model initialized successfully.")
except Exception as e:
    logger.error(f"Error initializing Gemini model: {e}")
    model = None

# Initialize AI Analyzer
try:
    analyzer = AIAnalyzer()
    fusion_engine = FusionEngine(analyzer)
    logger.info("AI Analyzer and Fusion Engine initialized.")
except Exception as e:
    logger.error(f"Error initializing AI Analyzer: {e}")
    analyzer = None
    fusion_engine = None

# Authentication Decorator
def token_required(f=None, optional=False):
    if f is None:
        return lambda func: token_required(func, optional=optional)

    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]

        if not token:
            if optional:
                return f(None, *args, **kwargs)
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = db.session.get(User, data['user_id'])
            if not current_user:
                if optional:
                    return f(None, *args, **kwargs)
                return jsonify({'message': 'User not found!'}), 401
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, Exception) as e:
            if optional:
                return f(None, *args, **kwargs)
            return jsonify({'message': str(e)}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

def extract_text_from_pdf(base64_data):
    """Extract text from a base64 encoded PDF file."""
    try:
        # Clean the base64 string
        if 'base64,' in base64_data:
            base64_data = base64_data.split('base64,')[1]
        
        pdf_bytes = base64.b64decode(base64_data)
        text = ""
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        return None

def get_gemini_history(messages):
    """Convert database messages to Gemini history format."""
    history = []
    recent_messages = messages[-15:]
    for msg in recent_messages:
        role = "user" if msg.sender == "user" else "model"
        history.append({
            "role": role,
            "parts": [msg.content]
        })
    return history

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "MindMate Backend"})

# --- Auth Routes ---
@app.route('/api/auth/register', methods=['POST'])
def register():
    import re
    data = request.json
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()

    if not username or not email:
        return jsonify({'message': 'Missing fields'}), 400

    # Username validation: 3-20 chars, alphanumeric + underscore/dash
    if not re.match(r'^[a-zA-Z0-9_-]{3,20}$', username):
        return jsonify({'message': 'Username must be 3-20 characters long and contain only letters, numbers, underscore, or dash'}), 400

    # Email validation
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        return jsonify({'message': 'Invalid email format'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username already exists'}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already exists'}), 400

    user = User(username=username, email=email)
    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email', '').strip()

    if not email:
        return jsonify({'message': 'Email is required'}), 400

    # For simple passwordless, we find by email. 
    # In a real app, this would trigger an email verification link.
    # For now, we allow instant login if the email exists.
    from sqlalchemy import func
    user = User.query.filter(func.lower(User.email) == func.lower(email)).first()

    if user:
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, app.config['SECRET_KEY'], algorithm="HS256")

        return jsonify({
            'token': token,
            'user': user.to_dict()
        })

    return jsonify({'message': 'No account found with this email'}), 404

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_me(current_user):
    return jsonify(current_user.to_dict())


@app.route('/api/user/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.json
    bio = data.get('bio', '').strip()
    journey = data.get('journey', '').strip()
    location = data.get('location', '').strip()

    # Validate input lengths
    if bio and len(bio) > 500:
        return jsonify({'message': 'Bio must be 500 characters or less'}), 400
    if journey and len(journey) > 1000:
        return jsonify({'message': 'Journey must be 1000 characters or less'}), 400
    if location and len(location) > 100:
        return jsonify({'message': 'Location must be 100 characters or less'}), 400

    # Update user profile
    current_user.bio = bio if bio else None
    current_user.journey = journey if journey else None
    current_user.location = location if location else None
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Profile updated successfully',
            'user': current_user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating profile: {e}")
        return jsonify({'message': 'Failed to update profile'}), 500

@app.route('/api/user/stats', methods=['GET'])
@token_required
def get_user_stats(current_user):
    try:
        stats = current_user.get_stats()
        return jsonify(stats), 200
    except Exception as e:
        logger.error(f"Error fetching user stats: {e}")
        return jsonify({'message': 'Failed to fetch statistics'}), 500

# --- Secured Chat Routes ---
@app.route('/api/chat', methods=['POST'])
@token_required(optional=True)
def chat_endpoint(current_user):
    data = request.json
    user_message = data.get('message', '')
    image_data = data.get('image')
    pdf_data = data.get('pdf')
    conversation_id = data.get('conversationId')
    stream = data.get('stream', False)

    # Handle PDF text extraction
    if pdf_data:
        extracted_text = extract_text_from_pdf(pdf_data)
        if extracted_text:
            # Prepend context to the user message
            context_prefix = f"### [Document Content] ###\n{extracted_text}\n### [End of Document] ###\n\n"
            user_message = f"{context_prefix}{user_message}" if user_message else f"{context_prefix}Please summarize this document."

    if not user_message and not image_data:
        return jsonify({"error": "No message or image provided"}), 400

    preferred_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    fallback_models = [
        preferred_model, 
        "gemini-2.5-flash", 
        "gemini-3.5-flash", 
        "gemini-flash-latest", 
        "gemini-2.0-flash", 
    ]
    
    # Pre-processing for user and conversation
    if current_user:
        if not conversation_id:
            title = user_message[:30] + "..." if user_message else "New Conversation"
            conversation = Conversation(title=title, user_id=current_user.id)
            db.session.add(conversation)
            db.session.commit()
            conversation_id = conversation.id
        else:
            conversation = db.session.get(Conversation, conversation_id)
            if not conversation or conversation.user_id != current_user.id:
                 conversation = Conversation(title="New Conversation", user_id=current_user.id)
                 db.session.add(conversation)
                 db.session.commit()
                 conversation_id = conversation.id

        if user_message:
            db.session.add(Message(conversation_id=conversation_id, sender='user', content=user_message))
        elif image_data:
            db.session.add(Message(conversation_id=conversation_id, sender='user', content="[Image sent]"))
        db.session.commit()

        history_msgs = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.timestamp).all()
        gemini_history = get_gemini_history(history_msgs[:-1] if user_message or image_data else history_msgs)
    else:
        # Guest mode
        gemini_history = []
        for h in data.get('history', []):
            gemini_history.append({
                "role": "user" if h['sender'] == 'user' else "model",
                "parts": [h['text']]
            })

    def generate():
        full_response = ""
        used_model = None
        import traceback
        
        for model_name in fallback_models:
            try:
                logger.info(f"Attempting to stream with model: {model_name}")
                current_model = genai.GenerativeModel(model_name)
                chat = current_model.start_chat(history=gemini_history)
                
                content = []
                if user_message:
                    if fusion_engine:
                        gesture_state = data.get('gesture', 'none')
                        enriched = fusion_engine.fuse_multimodal_context(user_message, gesture_state=gesture_state)
                        content.append(enriched)
                    else:
                        content.append(user_message)
                if image_data:
                    import base64
                    from io import BytesIO
                    from PIL import Image
                    image_data_cleaned = image_data.split('base64,')[1] if 'base64,' in image_data else image_data
                    image_bytes = base64.b64decode(image_data_cleaned)
                    content.append(Image.open(BytesIO(image_bytes)))

                response = chat.send_message(content, stream=True)
                used_model = model_name
                
                for chunk in response:
                    try:
                        if chunk.text:
                            full_response += chunk.text
                            yield f"data: {json.dumps({'text': chunk.text, 'model': model_name, 'conversationId': conversation_id})}\n\n"
                    except Exception as e:
                        logger.error(f"Error reading chunk from {model_name}: {e}")
                        continue
                
                # Save bot response to DB if in secured mode
                if current_user and conversation_id and full_response:
                    db.session.add(Message(conversation_id=conversation_id, sender='bot', content=full_response))
                    db.session.commit()
                
                return # Successfully processed
                
            except Exception as e:
                error_msg = str(e)
                logger.warning(f"Error with model {model_name}: {error_msg}")
                logger.error(traceback.format_exc())
                if model_name == fallback_models[-1]:
                    yield f"data: {json.dumps({'error': error_msg, 'conversationId': conversation_id})}\n\n"
                continue

    if stream:
        from flask import Response
        return Response(generate(), mimetype='text/event-stream')
    
    # Non-streaming fallback (legacy compatibility)
    last_error = None
    for model_name in fallback_models:
        try:
            current_model = genai.GenerativeModel(model_name)
            chat = current_model.start_chat(history=gemini_history)
            content = []
            if user_message:
                if fusion_engine:
                    gesture_state = data.get('gesture', 'none')
                    enriched = fusion_engine.fuse_multimodal_context(user_message, gesture_state=gesture_state)
                    content.append(enriched)
                else:
                    content.append(user_message)
            if image_data:
                import base64
                from io import BytesIO
                from PIL import Image
                image_data_cleaned = image_data.split('base64,')[1] if 'base64,' in image_data else image_data
                image_bytes = base64.b64decode(image_data_cleaned)
                content.append(Image.open(BytesIO(image_bytes)))

            response = chat.send_message(content)
            ai_response = response.text
            
            if current_user and conversation_id:
                db.session.add(Message(conversation_id=conversation_id, sender='bot', content=ai_response))
                db.session.commit()

            return jsonify({"response": ai_response, "conversationId": conversation_id, "model": model_name})
        except Exception as e:
            last_error = str(e)
            continue
            
    return jsonify({"error": "All models failed", "details": last_error}), 500

@app.route('/api/conversations', methods=['GET'])
@token_required
def get_conversations(current_user):
    conversations = Conversation.query.filter_by(user_id=current_user.id).order_by(Conversation.created_at.desc()).all()
    return jsonify([c.to_dict() for c in conversations])

@app.route('/api/conversations/<int:conversation_id>', methods=['GET'])
@token_required
def get_conversation_history(current_user, conversation_id):
    conversation = db.session.get(Conversation, conversation_id)
    if not conversation or conversation.user_id != current_user.id:
        return jsonify({"error": "Conversation not found"}), 404
    
    messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.timestamp).all()
    
    return jsonify({
        "conversation": conversation.to_dict(),
        "messages": [m.to_dict() for m in messages]
    })

@app.route('/api/conversations/<int:conversation_id>', methods=['DELETE'])
@token_required
def delete_conversation(current_user, conversation_id):
    conversation = db.session.get(Conversation, conversation_id)
    if not conversation or conversation.user_id != current_user.id:
        return jsonify({"error": "Conversation not found"}), 404
    
    try:
        db.session.delete(conversation)
        db.session.commit()
        return jsonify({"message": "Conversation deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting conversation: {e}")
        return jsonify({"error": "Failed to delete conversation"}), 500

# --- Gesture Recognition Endpoint ---
@app.route('/api/gesture/classify', methods=['POST'])
def classify_gesture():
    if not analyzer:
        return jsonify({"error": "Gesture analyzer not available"}), 503
    
    data = request.json
    landmarks = data.get('landmarks')
    
    if not landmarks:
        return jsonify({"gesture": "none"}), 200
    
    gesture = analyzer.analyze_gesture(landmarks)
    return jsonify({"gesture": gesture})

@app.route('/api/chat/sync', methods=['POST'])
@token_required
def sync_chat(current_user):
    data = request.json
    messages = data.get('messages', [])
    if not messages:
        return jsonify({'message': 'No messages to sync'}), 200

    title = messages[0].get('text', 'Guest Conversation')[:30] + "..."
    conversation = Conversation(title=title, user_id=current_user.id)
    db.session.add(conversation)
    db.session.commit()

    for msg in messages:
        db_msg = Message(
            conversation_id=conversation.id,
            sender=msg.get('sender'),
            content=msg.get('text')
        )
        db.session.add(db_msg)
    
    db.session.commit()
    return jsonify({'message': 'Conversation synced', 'conversationId': conversation.id}), 201

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(debug=True, host='0.0.0.0', port=port)
