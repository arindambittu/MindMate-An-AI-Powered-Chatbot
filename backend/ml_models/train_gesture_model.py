# train_gesture_model.py

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np
import os

# --- Configuration ---
MODEL_DIR = 'ml_models'
MODEL_NAME = 'gesture_model.h5'
os.makedirs(MODEL_DIR, exist_ok=True)
OUTPUT_PATH = os.path.join(MODEL_DIR, MODEL_NAME)

# Define the number of features (21 landmarks * 3 coordinates: x, y, z)
INPUT_FEATURES = 63 
NUM_CLASSES = 5  # Example gestures: [Peace, Thumbs Up, Fist, Open Hand, Point]

def create_gesture_model():
    """Defines the sequential model architecture for gesture recognition."""
    print("Creating Gesture Model architecture...")
    model = keras.Sequential([
        # Input layer expects a flattened vector of 63 coordinates
        layers.Input(shape=(INPUT_FEATURES,)),
        layers.Dense(128, activation='relu', name='dense_1'),
        layers.Dropout(0.3),
        layers.Dense(64, activation='relu', name='dense_2'),
        layers.Dropout(0.2),
        # Output layer with softmax for multi-class classification
        layers.Dense(NUM_CLASSES, activation='softmax', name='gesture_output')
    ], name='Gesture_Recognition_Model')
    
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    return model

def simulate_training_and_save():
    """Simulates a small training run and saves the model."""
    print("Simulating data and training...")
    
    # 1. Simulate data: 100 samples of 63 features
    # In a real app, this would be data collected from MediaPipe
    X_train = np.random.rand(100, INPUT_FEATURES).astype(np.float32)
    
    # 2. Simulate labels: One-hot encoded for 5 classes
    y_train = np.zeros((100, NUM_CLASSES))
    y_train[np.arange(100), np.random.randint(0, NUM_CLASSES, 100)] = 1
    
    # 3. Create and train the model
    model = create_gesture_model()
    
    model.fit(
        X_train, y_train, 
        epochs=5, 
        batch_size=32, 
        verbose=0 # Suppress output for placeholder training
    )
    
    # 4. Save the trained model to the H5 file format
    model.save(OUTPUT_PATH)
    print(f"\n✅ Successfully created and saved model to: {OUTPUT_PATH}")
    print("Model Summary:")
    model.summary()


if __name__ == '__main__':
    simulate_training_and_save()