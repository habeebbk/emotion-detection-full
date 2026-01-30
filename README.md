# SentientAI - Emotion Detection Web App

A premium web application for real-time and image-based emotion detection using deep learning.

## Features
- **Real-time Detection**: Uses your webcam to detect emotions in real-time.
- **Image Upload**: Upload any image to analyze expressions.
- **Premium UI**: Sleek, modern dark-themed interface with glassmorphism.
- **Fast Performance**: Optimized frame processing via Flask backend.

## How to Run

### 1. Start the Backend
Open a terminal and run:
```bash
cd backend
python app.py
```
*Note: Make sure you have the dependencies installed: `pip install flask flask-cors opencv-python tensorflow pillow`*

### 2. Start the Frontend
Open another terminal and run:
```bash
cd frontend
npm run dev
```

### 3. Usage
- Open your browser to the URL shown in the frontend terminal (usually `http://localhost:5173`).
- To use real-time detection, click **"Start Camera"**.
- To analyze an image, click **"Upload Image"** or drag and drop a file.

## Tech Stack
- **Frontend**: React, Vite, Lucide Icons
- **Backend**: Flask, TensorFlow/Keras, OpenCV
- **Model**: Custom `.h5` model (FER2013 compatible)
