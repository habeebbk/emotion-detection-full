import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
import base64
import io
from PIL import Image

app = Flask(__name__)
CORS(app)

import os

# Get the directory of the current script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load the model and face cascade with absolute paths
model = load_model(os.path.join(BASE_DIR, 'emotion_model.h5'))
face_cascade = cv2.CascadeClassifier(os.path.join(BASE_DIR, 'haarcascade_frontalface_default.xml'))

emotion_labels = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']

def preprocess_face(face_roi):
    # Resize to 48x48 and convert to grayscale if not already
    gray = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY) if len(face_roi.shape) == 3 else face_roi
    resized = cv2.resize(gray, (48, 48))
    normalized = resized / 255.0
    reshaped = np.reshape(normalized, (1, 48, 48, 1))
    return reshaped

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400
    
    file = request.files['image']
    img_bytes = file.read()
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 5)
    
    results = []
    for (x, y, w, h) in faces:
        roi_gray = gray[y:y+h, x:x+w]
        processed_face = preprocess_face(roi_gray)
        prediction = model.predict(processed_face)
        max_index = int(np.argmax(prediction))
        emotion = emotion_labels[max_index]
        confidence = float(np.max(prediction))
        
        results.append({
            'emotion': emotion,
            'confidence': confidence,
            'box': [int(x), int(y), int(w), int(h)]
        })
        
    return jsonify({'results': results})

@app.route('/predict_frame', methods=['POST'])
def predict_frame():
    data = request.json
    if 'image' not in data:
        return jsonify({'error': 'No image data'}), 400
    
    # Base64 to image
    header, encoded = data['image'].split(",", 1)
    img_data = base64.b64decode(encoded)
    nparr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 5)
    
    results = []
    for (x, y, w, h) in faces:
        roi_gray = gray[y:y+h, x:x+w]
        processed_face = preprocess_face(roi_gray)
        prediction = model.predict(processed_face)
        max_index = int(np.argmax(prediction))
        emotion = emotion_labels[max_index]
        confidence = float(np.max(prediction))
        
        results.append({
            'emotion': emotion,
            'confidence': confidence,
            'box': [int(x), int(y), int(w), int(h)]
        })
        
    return jsonify({'results': results})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
