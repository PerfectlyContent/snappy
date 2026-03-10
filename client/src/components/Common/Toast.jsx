import { useEffect, useState } from 'react';
import { Check, AlertTriangle, X } from 'lucide-react';
import './Toast.css';

export default function Toast({ message, type = 'success', onClose, duration = 3500 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const Icon = type === 'success' ? Check : AlertTriangle;

  return (
    <div className={`toast toast--${type} ${visible ? 'toast--visible' : ''}`} role="status" aria-live="polite">
      <Icon size={16} strokeWidth={2.5} className="toast__icon" />
      <span className="toast__message">{message}</span>
      <button className="toast__close" onClick={() => { setVisible(false); setTimeout(onClose, 300); }} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}
