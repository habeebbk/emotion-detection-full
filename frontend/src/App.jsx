import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { Camera, Upload, RefreshCw, Brain, ArrowLeft, Activity } from 'lucide-react';

function App() {
  const [view, setView] = useState('landing'); // 'landing', 'camera', 'upload'
  const [capturedResults, setCapturedResults] = useState([]);
  const [uploadResults, setUploadResults] = useState([]);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [originalDims, setOriginalDims] = useState({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  // Vibrant colors for different people
  const detectionColors = [
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#22c55e', // Green
    '#eab308', // Yellow
    '#a855f7', // Purple
    '#ec4899', // Pink
    '#06b6d4'  // Cyan
  ];

  // Dynamically determine the backend URL
  const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`;

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const requestRef = useRef();

  // Webcam Setup
  useEffect(() => {
    if (view === 'camera') {
      startWebcam();
    } else {
      stopWebcam();
    }
    return () => stopWebcam();
  }, [view]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        requestRef.current = requestAnimationFrame(processFrame);
      }
    } catch (err) {
      console.error("Error accessing webcam: ", err);
      setView('landing');
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    cancelAnimationFrame(requestRef.current);
  };

  const processFrame = async () => {
    if (view !== 'camera' || !videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, 640, 480);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

    try {
      const response = await fetch(`${API_BASE}/predict_frame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl })
      });
      const data = await response.json();
      setCapturedResults(data.results || []);

      // Draw detection boxes
      drawDetections(data.results || []);
    } catch (err) {
      console.error("Frame prediction error:", err);
    }

    // Delay next frame to save resources
    setTimeout(() => {
      requestRef.current = requestAnimationFrame(processFrame);
    }, 120);
  };

  const drawDetections = (detections) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 3;
    ctx.font = 'bold 18px Inter';

    detections.forEach((det, i) => {
      const [x, y, w, h] = det.box;
      const color = detectionColors[i % detectionColors.length];

      ctx.strokeStyle = color;
      ctx.strokeRect(x, y, w, h);

      const label = `Person ${i + 1}: ${det.emotion}`;
      const textWidth = ctx.measureText(label).width;

      ctx.fillStyle = color;
      ctx.fillRect(x, y - 30, textWidth + 20, 30);

      ctx.fillStyle = 'white';
      ctx.fillText(label, x + 10, y - 8);
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setUploadPreview(previewUrl);

    const img = new Image();
    img.onload = () => {
      setOriginalDims({ width: img.width, height: img.height });
    };
    img.src = previewUrl;

    setIsProcessing(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setUploadResults(data.results || []);
    } catch (err) {
      console.error("Upload prediction error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetUpload = () => {
    setUploadPreview(null);
    setUploadResults([]);
    setOriginalDims({ width: 0, height: 0 });
  };

  return (
    <div className="app-container">
      {view === 'landing' && (
        <div className="landing-page">
          <header className="header">
            <div className="logo-container">
              <Activity className="logo-icon" size={40} />
              <h1>SentientAI</h1>
            </div>
            <p>Advanced Real-time Emotion Intelligence</p>
          </header>

          <div className="landing-buttons">
            <button className="landing-btn cam-btn" onClick={() => setView('camera')}>
              <div className="btn-icon">
                <Camera size={48} />
              </div>
              <div className="btn-content">
                <h3>Live Camera</h3>
                <p>Real-time expression detection</p>
              </div>
            </button>

            <button className="landing-btn upload-btn" onClick={() => setView('upload')}>
              <div className="btn-icon">
                <Upload size={48} />
              </div>
              <div className="btn-content">
                <h3>Upload Image</h3>
                <p>Analyze pre-captured photos</p>
              </div>
            </button>
          </div>

          <footer className="footer">
            Powered by TensorFlow & OpenCV
          </footer>
        </div>
      )}

      {view === 'camera' && (
        <div className="view-page">
          <button className="back-btn" onClick={() => setView('landing')}>
            <ArrowLeft size={20} /> Back to Home
          </button>

          <section className="mode-card">
            <div className="card-header">
              <h2><Camera size={24} /> Live Detection</h2>
              <div className="status-indicator">
                <div className="status-dot active"></div>
                <span>System Live</span>
              </div>
            </div>

            <div className="view-container">
              <video
                ref={videoRef}
                className="webcam-view"
                muted
                playsInline
              />
              <canvas
                ref={canvasRef}
                className="canvas-overlay"
                width={640}
                height={480}
              />
            </div>

            <div className="results-panel">
              {capturedResults.length > 0 ? (
                capturedResults.map((res, i) => (
                  <span
                    key={i}
                    className="emotion-badge"
                    style={{ backgroundColor: detectionColors[i % detectionColors.length], color: 'white' }}
                  >
                    Person {i + 1}: {res.emotion} ({(res.confidence * 100).toFixed(0)}%)
                  </span>
                ))
              ) : (
                <p className="placeholder-text">Waiting for face detection...</p>
              )}
            </div>
          </section>
        </div>
      )}

      {view === 'upload' && (
        <div className="view-page">
          <button className="back-btn" onClick={() => setView('landing')}>
            <ArrowLeft size={20} /> Back to Home
          </button>

          <section className="mode-card">
            <div className="card-header">
              <h2><Upload size={24} /> Image Analysis</h2>
            </div>

            <div className="view-container">
              {uploadPreview ? (
                <div className="preview-wrapper">
                  <div className="image-relative-container">
                    <img src={uploadPreview} className="preview-image" alt="Upload Preview" />
                    <div className="detections-overlay">
                      {uploadResults.map((det, i) => (
                        <div
                          key={i}
                          className="detection-box"
                          style={{
                            left: `${(det.box[0] / originalDims.width) * 100}%`,
                            top: `${(det.box[1] / originalDims.height) * 100}%`,
                            width: `${(det.box[2] / originalDims.width) * 100}%`,
                            height: `${(det.box[3] / originalDims.height) * 100}%`,
                            borderColor: detectionColors[i % detectionColors.length]
                          }}
                        >
                          <div
                            className="box-label"
                            style={{ backgroundColor: detectionColors[i % detectionColors.length] }}
                          >
                            Person {i + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="upload-area" onClick={() => fileInputRef.current.click()}>
                  <Brain size={64} className="floating-icon" />
                  <p>Drop image or click to upload</p>
                </div>
              )}
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileUpload} hidden accept="image/*" />

            <div className="controls">
              <button className="btn btn-primary" onClick={() => fileInputRef.current.click()}>
                <Upload size={18} /> {uploadPreview ? 'Change Image' : 'Select Image'}
              </button>
              {uploadPreview && (
                <button className="btn btn-outline" onClick={resetUpload}>
                  Reset
                </button>
              )}
            </div>

            <div className="results-panel">
              {isProcessing ? (
                <div className="processing-indicator">
                  <RefreshCw className="spin" size={24} />
                  <p>Analyzing expressions...</p>
                </div>
              ) : (
                uploadResults.length > 0 ? (
                  uploadResults.map((res, i) => (
                    <div key={i} className="result-item">
                      <span
                        className="emotion-badge"
                        style={{ backgroundColor: detectionColors[i % detectionColors.length], color: 'white' }}
                      >
                        Person {i + 1}: {res.emotion} ({(res.confidence * 100).toFixed(0)}%)
                      </span>
                    </div>
                  ))
                ) : (
                  uploadPreview && <p className="placeholder-text">No faces detected</p>
                )
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;

