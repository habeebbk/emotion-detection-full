import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { Camera, Upload, RefreshCw, Brain, Eye, User } from 'lucide-react';

function App() {
  const [realTimeMode, setRealTimeMode] = useState(false);
  const [capturedResults, setCapturedResults] = useState([]);
  const [uploadResults, setUploadResults] = useState([]);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Dynamically determine the backend URL
  const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`;

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const requestRef = useRef();

  // Webcam Setup
  useEffect(() => {
    if (realTimeMode) {
      startWebcam();
    } else {
      stopWebcam();
    }
  }, [realTimeMode]);

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
      setRealTimeMode(false);
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
    if (!realTimeMode || !videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, 640, 480);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.5);

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
    }, 100);
  };

  const drawDetections = (detections) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 3;
    ctx.font = '20px Inter';

    detections.forEach(det => {
      const [x, y, w, h] = det.box;
      ctx.strokeStyle = '#6366f1';
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = '#6366f1';
      ctx.fillRect(x, y - 30, ctx.measureText(det.emotion).width + 20, 30);

      ctx.fillStyle = 'white';
      ctx.fillText(det.emotion, x + 5, y - 8);
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadPreview(URL.createObjectURL(file));
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

  return (
    <div className="app-container">
      <header className="header">
        <h1>SentientAI</h1>
        <p>Advanced Real-time Emotion Intelligence</p>
      </header>

      <div className="main-grid">
        {/* Real-time Section */}
        <section className="card">
          <h2><Camera size={24} /> Live Detection</h2>
          <div className="view-container">
            <video
              ref={videoRef}
              className="webcam-view"
              muted
              playsInline
              style={{ display: realTimeMode ? 'block' : 'none' }}
            />
            <canvas
              ref={canvasRef}
              className="canvas-overlay"
              width={640}
              height={480}
              style={{ display: realTimeMode ? 'block' : 'none' }}
            />
            {!realTimeMode && (
              <div className="upload-area" onClick={() => setRealTimeMode(true)}>
                <RefreshCw size={48} color="#6366f1" />
                <p>Click to start webcam</p>
              </div>
            )}
          </div>

          <div className="controls">
            <button
              className={`btn ${realTimeMode ? 'btn-outline' : 'btn-primary'}`}
              onClick={() => setRealTimeMode(!realTimeMode)}
            >
              {realTimeMode ? 'Stop Camera' : 'Start Camera'}
            </button>
          </div>

          <div className="results-panel">
            {capturedResults.map((res, i) => (
              <span key={i} className={`emotion-badge emotion-${res.emotion}`}>
                {res.emotion} ({(res.confidence * 100).toFixed(0)}%)
              </span>
            ))}
          </div>

          <div className="status-indicator">
            <div className={`status-dot ${realTimeMode ? 'active' : ''}`}></div>
            <span>{realTimeMode ? 'System Live' : 'System Offline'}</span>
          </div>
        </section>

        {/* Upload Section */}
        <section className="card">
          <h2><Upload size={24} /> Image Analysis</h2>
          <div className="view-container">
            {uploadPreview ? (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <img src={uploadPreview} className="preview-image" alt="Upload Preview" />
                <div className="canvas-overlay">
                  {uploadResults.map((det, i) => {
                    // Logic to scale boxes to preview image would go here if needed
                    return null;
                  })}
                </div>
              </div>
            ) : (
              <div className="upload-area" onClick={() => fileInputRef.current.click()}>
                <Brain size={48} color="#a855f7" />
                <p>Drop image or click to upload</p>
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            hidden
            accept="image/*"
          />

          <div className="controls">
            <button className="btn btn-primary" onClick={() => fileInputRef.current.click()}>
              <Upload size={18} /> Upload Image
            </button>
            {uploadPreview && (
              <button className="btn btn-outline" onClick={() => { setUploadPreview(null); setUploadResults([]); }}>
                Reset
              </button>
            )}
          </div>

          <div className="results-panel">
            {isProcessing ? (
              <p>Analyzing expressions...</p>
            ) : (
              uploadResults.map((res, i) => (
                <div key={i} style={{ marginBottom: '1rem' }}>
                  <span className={`emotion-badge emotion-${res.emotion}`}>
                    {res.emotion} ({(res.confidence * 100).toFixed(0)}%)
                  </span>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0' }}>
                    Detection found at position {res.box[0]}, {res.box[1]}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <footer style={{ marginTop: '3rem', color: '#475569', fontSize: '0.9rem' }}>
        Powered by TensorFlow and OpenCV
      </footer>
    </div>
  );
}

export default App;
