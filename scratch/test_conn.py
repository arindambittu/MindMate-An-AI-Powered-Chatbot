import tensorflow as tf
import numpy as np

model_path = "backend/ml_models/sentiment_model.h5"
model = tf.keras.models.load_model(model_path)
input_seq = np.zeros((1, 50))

# Call directly
prediction = model(input_seq, training=False).numpy()
print("Direct call output:", prediction)
