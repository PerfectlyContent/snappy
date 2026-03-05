import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import './Toast.css';

export default function Toast({ message, type = 'success', onClose, duration = 4000 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const Icon = type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div className={`toast toast--${type} ${visible ? 'toast--visible' : ''}`} role="status" aria-live="polite">
      <Icon size={20} className="toast__icon" />
      <span className="toast__message">{message}</span>
      <button className="toast__close" onClick={() => { setVisible(false); setTimeout(onClose, 300); }} aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}
