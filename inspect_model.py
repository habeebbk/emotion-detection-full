import tensorflow as tf

model = tf.keras.models.load_model('emotion_model.h5')
print("Model Summary:")
model.summary()
print("\nInput shape:", model.input_shape)
print("Output shape:", model.output_shape)
