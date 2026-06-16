# MindMate Setup & Running Guide

## Quick Start

### Option 1: Start Everything (Recommended)

The easiest way to run MindMate is using the all-in-one script:

```bash
# Double-click this file or run from terminal
start-all.bat
```

This will automatically:
- Start the backend server on `http://localhost:8000`
- Start the frontend development server on `http://localhost:5173`
- Open two separate terminal windows for each service

### Option 2: Start Backend Only

If you only need the backend server:

**Using Batch Script (Recommended):**
```bash
start-backend.bat
```

**Using PowerShell (Advanced):**
```powershell
.\start-backend.ps1
```

The PowerShell version includes additional features:
- Checks if port 8000 is already in use
- Validates virtual environment exists
- Enhanced error reporting

### Option 3: Manual Start

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

## Prerequisites

### Backend Requirements
- Python 3.10 or higher
- Virtual environment with dependencies installed
- `.env` file with `GEMINI_API_KEY` configured

### Frontend Requirements
- Node.js (v16 or higher)
- npm dependencies installed (`npm install`)

## Environment Setup

### First Time Setup

1. **Backend Virtual Environment:**
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Frontend Dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Environment Variables:**
   
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your-actual-gemini-api-key-here
   JWT_SECRET_KEY=your-secret-key-here
   ```

## Troubleshooting

### "Failed to fetch" or "Server Offline" Error

**Symptoms:**
- Chat shows "Failed to fetch" error
- Red "Server Offline" indicator in chat header
- Unable to send messages

**Solution:**
1. Check if the backend server is running
2. Use `start-backend.bat` to start the server
3. Verify the server is accessible at `http://localhost:8000/api/health`

### Port Already in Use

**Symptoms:**
- Error: "Port 8000 is already in use"
- Server fails to start

**Solution:**
1. Find the process using port 8000:
   ```powershell
   netstat -ano | findstr :8000
   ```
2. Kill the process or use a different port

### Virtual Environment Not Found

**Symptoms:**
- "Virtual environment not found!" error
- startup scripts fail to run

**Solution:**
1. Recreate the virtual environment:
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

### Frontend Not Loading

**Symptoms:**
- Cannot access `http://localhost:5173`
- Frontend development server not running

**Solution:**
1. Ensure you're in the frontend directory:
   ```bash
   cd frontend
   npm run dev
   ```
2. Check if node_modules exists, if not:
   ```bash
   npm install
   ```

### GEMINI_API_KEY Missing

**Symptoms:**
- Backend starts but shows API key warnings
- Chat responses fail

**Solution:**
1. Create/update `.env` file in the root directory
2. Add your Gemini API key:
   ```env
   GEMINI_API_KEY=your-actual-api-key
   ```
3. Restart the backend server

## Connection Status Indicator

The chat interface now includes a visual connection status indicator in the header:

- **🟢 Green (Online)**: Server is connected and ready
- **🔴 Red (Server Offline)**: Cannot connect to backend
- **🟡 Yellow (Checking)**: Verifying server status

When offline, a "Retry" button appears to manually check the connection.

## Automated Server Health Checks

The frontend automatically checks server health:
- On page load
- Every 30 seconds while the app is running
- After connection errors

## Error Messages

The application now provides detailed, actionable error messages:

### Connection Errors
Shows step-by-step instructions to start the backend server.

### Timeout Errors
Indicates the server is slow to respond.

### API Errors
Displays the specific error with troubleshooting guidance.

## Development Tips

1. **Keep terminals open**: Don't close the backend or frontend terminal windows while using the app
2. **Use start-all.bat**: Simplest way to run both services
3. **Check the indicators**: The connection status indicator helps diagnose issues quickly
4. **Read error messages**: New error messages provide specific guidance

## Support

If you encounter issues not covered here:
1. Check the terminal output for detailed error messages
2. Verify all prerequisites are met
3. Ensure environment variables are properly configured
4. Check that ports 8000 and 5173 are available
