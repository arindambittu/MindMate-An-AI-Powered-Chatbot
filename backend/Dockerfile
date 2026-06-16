FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt
# Additional dependencies for audio processing / ML parsing (added during plan)
RUN pip install --no-cache-dir librosa torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Create instance directory for SQLite DB
RUN mkdir -p instance

COPY . .

EXPOSE 8000

ENV PORT=8000

CMD ["python", "app.py"]
