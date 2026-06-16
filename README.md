# 🧠 MindMate - AI Mental Health Assistant

MindMate is an intelligent mental health companion powered by Google's Gemini AI. It provides empathetic conversations, mood tracking, and personalized mental wellness support.

## ✨ Features

- 💬 **AI-Powered Chat**: Natural conversations with Gemini-powered AI assistant
- 📸 **Vision Support**: Send images for analysis and discussion
- 🎤 **Voice Input**: Speak your thoughts using speech recognition
- 💾 **Conversation History**: Save and revisit past conversations (logged-in users)
- 🎨 **Beautiful UI**: Modern, glassmorphic design with smooth animations
- 🔒 **Guest & Authenticated Modes**: Try without signing up or create an account
- 🔌 **Connection Monitoring**: Real-time server status with automatic health checks

## 🚀 Quick Start

### Using Startup Scripts (Recommended)

The easiest way to run MindMate:

```bash
# Start both backend and frontend automatically
start-all.bat
```

Or start just the backend:

```bash
# Windows Batch
start-backend.bat

# PowerShell (with enhanced error checking)
.\start-backend.ps1
```

### Manual Start

**Backend:**
```bash
cd backend
.\venv\Scripts\python.exe app.py
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Access the application at: `http://localhost:5173`

## 📋 Prerequisites

- **Python 3.10+** (for backend)
- **Node.js 16+** (for frontend)
- **Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))

## ⚙️ Setup

See [SETUP.md](./SETUP.md) for detailed installation and configuration instructions.

### Quick Setup

1. **Install Backend Dependencies:**
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Install Frontend Dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Configure Environment:**
   
   Create `.env` in the root directory:
   ```env
   GEMINI_API_KEY=your-gemini-api-key
   JWT_SECRET_KEY=your-secret-key
   ```

4. **Run the Application:**
   ```bash
   start-all.bat
   ```

## 🛠️ Tech Stack

### Backend
- **Flask** - Python web framework
- **SQLAlchemy** - Database ORM
- **Google Gemini AI** - AI model (gemini-2.0-flash)
- **JWT** - Authentication
- **SQLite** - Database

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Framer Motion** - Animations
- **React Markdown** - Message rendering

## 📁 Project Structure

```
MindMate/
├── backend/                 # Flask backend server
│   ├── app.py              # Main Flask application
│   ├── models.py           # Database models
│   ├── venv/               # Python virtual environment
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── features/chat/  # Chat interface
│   │   ├── context/        # Auth context
│   │   └── components/     # UI components
│   └── package.json        # Node dependencies
├── start-all.bat           # Start both services
├── start-backend.bat       # Start backend only
├── start-backend.ps1       # PowerShell backend starter
├── SETUP.md               # Detailed setup guide
└── README.md              # This file
```

## 🔧 New Features

### Connection Status Indicator
- Real-time server connection monitoring
- Visual status indicator (green/red/yellow)
- Automatic health checks every 30 seconds
- Manual retry option when offline

### Enhanced Error Messages
The application now provides specific, actionable error messages:

- **Connection Errors**: Step-by-step instructions to start the server
- **Timeout Errors**: Notification when server is slow to respond
- **API Errors**: Detailed error information for debugging

### Automated Startup Scripts
- `start-all.bat` - Launch both services with one command
- `start-backend.bat` - Simple backend launcher
- `start-backend.ps1` - Advanced PowerShell version with port checking

## 🐛 Troubleshooting

### "Failed to fetch" Error
The backend server is not running. Use `start-backend.bat` to start it.

### Port Already in Use
Another process is using port 8000. Find and kill it:
```powershell
netstat -ano | findstr :8000
```

### More Issues?
Check [SETUP.md](./SETUP.md) for comprehensive troubleshooting.

## 📖 Documentation

- [SETUP.md](./SETUP.md) - Complete setup and troubleshooting guide
- [Backend README](./backend/README.md) - Backend API documentation (if available)
- [Frontend README](./frontend/README.md) - Frontend development guide

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is for educational purposes. Please ensure compliance with Google's Gemini API terms of service.

## 🙏 Acknowledgments

- Powered by [Google Gemini AI](https://ai.google.dev/)
- Icons by [Lucide](https://lucide.dev/)
- UI components inspired by modern design principles

## 📞 Support

If you encounter issues:
1. Check the connection status indicator in the chat header
2. Review error messages for specific guidance
3. Consult [SETUP.md](./SETUP.md) for troubleshooting
4. Ensure all prerequisites are installed

---

**Made with ❤️ for mental wellness**
