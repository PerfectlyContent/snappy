import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

export default function Modal({ title, children, onClose }) {
  const [visible, setVisible] = useState(false);
  const overlayRef = useRef();

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 400);
  }

  return (
    <div
      ref={overlayRef}
      className={`modal-overlay ${visible ? 'modal-overlay--visible' : ''}`}
      onClick={(e) => e.target === overlayRef.current && handleClose()}
    >
      <div className={`modal-sheet ${visible ? 'modal-sheet--visible' : ''}`}>
        <div className="modal-sheet__header">
          <h2 className="modal-sheet__title">{title}</h2>
          <button className="modal-sheet__close" onClick={handleClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="modal-sheet__body">
          {children}
        </div>
      </div>
    </div>
  );
}
