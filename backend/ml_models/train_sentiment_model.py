# train_sentiment_model.py

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np
import os

# --- Configuration ---
MODEL_DIR = 'ml_models'
MODEL_NAME = 'sentiment_model.h5'
os.makedirs(MODEL_DIR, exist_ok=True)
OUTPUT_PATH = os.path.join(MODEL_DIR, MODEL_NAME)

# Hyperparameters for text data
VOCAB_SIZE = 10000     # Maximum number of unique words to consider
MAX_SEQUENCE_LENGTH = 50 # Max length of a sentence
EMBEDDING_DIM = 100      # Size of the word embedding vector
NUM_CLASSES = 3          # [Negative, Neutral, Positive]

def create_sentiment_model():
    """Defines the LSTM model architecture for text sentiment analysis."""
    print("Creating Sentiment Model architecture...")
    model = keras.Sequential([
        # 1. Embedding layer: Converts word indices to dense vectors
        layers.Embedding(VOCAB_SIZE, EMBEDDING_DIM, input_length=MAX_SEQUENCE_LENGTH),
        # 2. LSTM layer: Processes the sequence data and captures context
        layers.LSTM(128, name='lstm_1'),
        layers.Dropout(0.4),
        # 3. Dense layers for classification
        layers.Dense(64, activation='relu', name='dense_1'),
        layers.Dense(NUM_CLASSES, activation='softmax', name='sentiment_output')
    ], name='Sentiment_Analysis_Model')
    
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    return model

def simulate_training_and_save():
    """Simulates a small training run and saves the model."""
    print("Simulating tokenized data and training...")
    
    # 1. Simulate data: 1000 samples of tokenized, padded text
    # In a real app, this comes from a tokenizer (e.g., Keras Tokenizer)
    X_train = np.random.randint(1, VOCAB_SIZE, size=(1000, MAX_SEQUENCE_LENGTH))
    
    # 2. Simulate labels: One-hot encoded for 3 classes
    y_train = np.zeros((1000, NUM_CLASSES))
    y_train[np.arange(1000), np.random.randint(0, NUM_CLASSES, 1000)] = 1
    
    # 3. Create and train the model
    model = create_sentiment_model()
    
    model.fit(
        X_train, y_train, 
        epochs=3, 
        batch_size=64, 
        verbose=0 # Suppress output for placeholder training
    )
    
    # 4. Save the trained model to the H5 file format
    model.save(OUTPUT_PATH)
    print(f"\n✅ Successfully created and saved model to: {OUTPUT_PATH}")
    print("Model Summary:")
    model.summary()


if __name__ == '__main__':
    simulate_training_and_save()