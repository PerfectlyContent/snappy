import { useEffect, useRef, useState } from 'react';
import { X, Camera, RefreshCw } from 'lucide-react';
import './CameraModal.css';

export default function CameraModal({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = 'hidden';
    startCamera('environment');
    return () => {
      document.body.style.overflow = '';
      stopCamera();
    };
  }, []);

  async function startCamera(facing) {
    stopCamera();
    setReady(false);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setReady(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Could not access camera. Please allow camera permissions.');
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }

  function handleCapture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `snap-${Date.now()}.jpg`, { type: 'image/jpeg' });
        stopCamera();
        onCapture(file);
      }
    }, 'image/jpeg', 0.92);
  }

  function handleFlip() {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  }

  function handleClose() {
    setVisible(false);
    stopCamera();
    setTimeout(onClose, 300);
  }

  return (
    <div className={`camera-modal ${visible ? 'camera-modal--visible' : ''}`}>
      <div className="camera-modal__header">
        <button className="camera-modal__close" onClick={handleClose} aria-label="Close camera">
          <X size={24} />
        </button>
      </div>

      <div className="camera-modal__viewfinder">
        {error ? (
          <div className="camera-modal__error">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-modal__video"
            />
            {!ready && (
              <div className="camera-modal__loading">
                <div className="camera-modal__spinner" />
              </div>
            )}
          </>
        )}
      </div>

      <canvas ref={canvasRef} hidden />

      <div className="camera-modal__controls">
        <div className="camera-modal__control-spacer" />
        <button
          className="camera-modal__shutter"
          onClick={handleCapture}
          disabled={!ready}
          aria-label="Take photo"
        >
          <div className="camera-modal__shutter-inner" />
        </button>
        <button className="camera-modal__flip" onClick={handleFlip} aria-label="Flip camera">
          <RefreshCw size={24} />
        </button>
      </div>
    </div>
  );
}
