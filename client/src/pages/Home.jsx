import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Image, Camera, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useClassify } from '../hooks/useClassify';
import { useVoice } from '../hooks/useVoice';
import Toast from '../components/Common/Toast';
import CameraModal from '../components/Input/CameraModal';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const { authenticated, login } = useAuth();
  const { classifyImage, classifyVoice, loading } = useClassify();
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [toast, setToast] = useState(null);
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

  const handleVoiceComplete = useCallback(async (finalTranscript) => {
    setVoiceProcessing(true);
    try {
      const result = await classifyVoice(finalTranscript);
      sessionStorage.setItem('snappy_result', JSON.stringify(result));
      sessionStorage.removeItem('snappy_image');
      navigate('/result');
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setVoiceProcessing(false);
    }
  }, [classifyVoice, navigate]);

  const handleVoiceError = useCallback((message) => {
    setToast({ message, type: 'error' });
  }, []);

  const { listening, transcript, supported: voiceSupported, startListening, stopListening } = useVoice({ onComplete: handleVoiceComplete, onError: handleVoiceError });

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    try {
      const result = await classifyImage(file);
      sessionStorage.setItem('snappy_result', JSON.stringify(result));
      sessionStorage.setItem('snappy_fileName', file.name);
      const reader = new FileReader();
      reader.onload = () => {
        sessionStorage.setItem('snappy_image', reader.result);
        navigate('/result');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  }, [classifyImage, navigate]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  }, [handleFile]);

  const handleVoiceToggle = () => {
    if (!voiceSupported) {
      setToast({ message: 'Voice input is not supported in this browser', type: 'error' });
      return;
    }
    listening ? stopListening() : startListening();
  };

  return (
    <div className={`home ${entered ? 'home--entered' : ''}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
        hidden
      />

      {/* Hero */}
      <div className="home__hero">
        <h1 className="home__title">Get it done, in a snap.</h1>
        <p className="home__subtitle">
          Take a photo or tell it what to do, Snappy will take care of the rest.
        </p>
      </div>

      {/* Illustration */}
      <div className="home__illustration" aria-hidden="true">
        <img src="/illustration.png" alt="" />
      </div>

      {/* Main actions */}
      {(loading || voiceProcessing) ? (
        <div className="home__loading">
          <div className="home__spinner" />
          <p className="home__loading-text">
            {voiceProcessing ? 'Processing voice...' : 'Analyzing image...'}
          </p>
        </div>
      ) : (
        <div className="home__cards">
          <button className="home__card" onClick={() => setShowCamera(true)}>
            <div className="home__card-icon home__card-icon--camera">
              <Camera size={28} strokeWidth={1.5} />
            </div>
            <span className="home__card-title">Take Photo</span>
          </button>

          <button
            className="home__card"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <div className="home__card-icon home__card-icon--upload">
              <Image size={28} strokeWidth={1.5} />
            </div>
            <span className="home__card-title">Upload Image</span>
          </button>
        </div>
      )}

      {/* Voice */}
      {!(loading || voiceProcessing) && (
        <button
          className={`home__voice ${listening ? 'home__voice--active' : ''}`}
          onClick={handleVoiceToggle}
          disabled={loading}
        >
          <div className={`home__voice-dot ${listening ? 'home__voice-dot--active' : ''}`}>
            {listening ? <MicOff size={22} /> : <Mic size={22} />}
          </div>
          <div className="home__voice-text">
            <span className="home__voice-label">
              {listening ? 'Listening...' : 'Talk to Snappy'}
            </span>
            <span className="home__voice-hint">
              {listening && transcript ? transcript : 'Tell Snappy to book an event or save your thoughts'}
            </span>
          </div>
          {listening ? (
            <div className="home__bars">
              <span /><span /><span /><span />
            </div>
          ) : (
            <ChevronRight size={18} className="home__voice-chevron" />
          )}
        </button>
      )}

      {/* Google connect */}
      {!authenticated && (
        <div className="home__connect">
          <div className="home__connect-left">
            <div className="home__connect-g">
              <svg width="28" height="28" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            </div>
            <div>
              <p className="home__connect-title">Connect Google</p>
              <p className="home__connect-sub">Add events, contacts, and files automatically</p>
            </div>
          </div>
          <button className="home__connect-btn" onClick={login}>Connect</button>
        </div>
      )}

      {showCamera && (
        <CameraModal
          onCapture={(file) => { setShowCamera(false); handleFile(file); }}
          onClose={() => setShowCamera(false)}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
