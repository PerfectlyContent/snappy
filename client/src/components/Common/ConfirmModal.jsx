import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import './ConfirmModal.css';

export default function ConfirmModal({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="confirm-modal">
        <div className="confirm-modal__body">
          <div className="confirm-modal__icon">
            <AlertTriangle size={20} strokeWidth={1.5} />
          </div>
          <p className="confirm-modal__message">{message}</p>
        </div>
        <div className="confirm-modal__actions">
          <Button variant="ghost" fullWidth onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant="destructive" fullWidth onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
