# train_voice_emotion_model.py

import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import os

# --- Configuration ---
MODEL_DIR = 'ml_models'
MODEL_NAME = 'voice_emotion_model.pt'
os.makedirs(MODEL_DIR, exist_ok=True)
OUTPUT_PATH = os.path.join(MODEL_DIR, MODEL_NAME)

# Hyperparameters for audio features
MFCC_COUNT = 40  # Number of MFCC features extracted from audio
TIME_STEPS = 100 # Max length of the audio sequence after padding/truncating
NUM_CLASSES = 5  # Example emotions: [Calm, Happy, Angry, Sad, Neutral]

class VoiceEmotionClassifier(nn.Module):
    """
    Defines a CNN-RNN model for voice emotion classification (PyTorch).
    This architecture is often used for feature sequences like MFCCs.
    """
    def __init__(self):
        super(VoiceEmotionClassifier, self).__init__()
        
        # 1. Convolutional Layer (for local feature extraction)
        self.cnn = nn.Sequential(
            # Input: (Batch, 1 Channel, MFCC_COUNT, TIME_STEPS)
            nn.Conv2d(1, 32, kernel_size=(3, 3), padding=1),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=(2, 2)),
        )
        
        # Calculate the features going into the RNN after CNN/Pooling
        # (MFCC_COUNT/2) * (TIME_STEPS/2) * 32
        self.rnn_input_size = int(MFCC_COUNT/2) * 32 # Assuming we flatten the time-axis
        
        # 2. Recurrent Layer (for temporal sequence processing)
        self.rnn = nn.LSTM(
            input_size=self.rnn_input_size,
            hidden_size=64,
            num_layers=2,
            batch_first=True,
            bidirectional=True
        )
        
        # 3. Fully Connected Layer (Classifier)
        self.fc = nn.Linear(64 * 2, NUM_CLASSES) # 64 hidden * 2 (bidirectional)

    def forward(self, x):
        # x shape: (batch_size, 1, MFCC_COUNT, TIME_STEPS)
        x = self.cnn(x)
        # Flatten for RNN: (batch_size, TIME_STEPS/2, features)
        x = x.permute(0, 3, 1, 2).contiguous() # (Batch, Time_steps, Channel, Features)
        x = x.view(x.size(0), x.size(1), -1) 
        
        # Pass through RNN
        _, (h_n, _) = self.rnn(x)
        
        # Concatenate the final forward and backward hidden states
        h_n = torch.cat((h_n[-2,:,:], h_n[-1,:,:]), dim=1)
        
        # Final classification
        out = self.fc(h_n)
        return out

def simulate_training_and_save():
    """Simulates a small training run and saves the PyTorch model (.pt)."""
    print("Simulating audio feature data and training...")
    
    # 1. Simulate data: 100 samples
    # Input tensor: (Batch, Channel, Height=MFCC, Width=Time)
    X_train = torch.randn(100, 1, MFCC_COUNT, TIME_STEPS).float()
    
    # 2. Simulate labels
    y_train = torch.randint(0, NUM_CLASSES, (100,)).long()
    
    # 3. Create model, loss, and optimizer
    model = VoiceEmotionClassifier()
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    # 4. Simulate a single training epoch
    model.train()
    for _ in range(1): # Run one "epoch"
        optimizer.zero_grad()
        output = model(X_train)
        loss = criterion(output, y_train)
        loss.backward()
        optimizer.step()
    
    # 5. Save the state dictionary (weights) to the .pt file format
    torch.save(model.state_dict(), OUTPUT_PATH)
    print(f"\n✅ Successfully created and saved PyTorch model to: {OUTPUT_PATH}")
    print(f"Model Architecture:\n{model}")

if __name__ == '__main__':
    simulate_training_and_save()