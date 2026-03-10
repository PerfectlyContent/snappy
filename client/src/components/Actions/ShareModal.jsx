import { useState, useEffect } from 'react';
import { Share2 } from 'lucide-react';
import { api } from '../../utils/api';
import Modal from '../Common/Modal';
import { TextArea } from '../Common/Input';
import Button from '../Common/Button';
import Toast from '../Common/Toast';
import './ShareModal.css';

export default function ShareModal({ classificationData, onClose, onSent }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [composing, setComposing] = useState(true);
  const [toast, setToast] = useState(null);

  const title = classificationData.data?.eventTitle
    || classificationData.data?.vendor
    || classificationData.data?.name
    || classificationData.data?.title
    || 'Item';

  useEffect(() => {
    let cancelled = false;
    async function compose() {
      setComposing(true);
      try {
        const msg = await api.composeMessage(classificationData);
        if (!cancelled) {
          setSubject(msg.subject || `Sharing: ${title}`);
          setBody(msg.body || '');
        }
      } catch {
        if (!cancelled) {
          setSubject(`Sharing: ${title}`);
          setBody('Here are the details I wanted to share with you.');
        }
      } finally {
        if (!cancelled) setComposing(false);
      }
    }
    compose();
    return () => { cancelled = true; };
  }, [classificationData, title]);

  async function handleShare() {
    const shareText = body.trim();
    if (!shareText) return;

    // Use native Web Share API (opens the OS share sheet)
    if (navigator.share) {
      try {
        await navigator.share({
          title: subject,
          text: shareText,
        });
        if (onSent) onSent();
        return;
      } catch (err) {
        // User cancelled the share sheet — not an error
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback for desktop browsers without Web Share API:
    // copy to clipboard so user can paste into any app
    try {
      const fullText = subject ? `${subject}\n\n${shareText}` : shareText;
      await navigator.clipboard.writeText(fullText);
      setToast({ message: 'Copied to clipboard', type: 'success' });
      setTimeout(() => { if (onSent) onSent(); }, 1200);
    } catch {
      setToast({ message: 'Could not share — try copying manually', type: 'error' });
    }
  }

  return (
    <Modal title="Share" onClose={onClose}>
      <div className="share-modal">
        {composing ? (
          <div className="share-modal__composing">
            <div className="share-modal__composing-dot" />
            <span>Snappy is writing...</span>
          </div>
        ) : (
          <>
            <div className="share-modal__preview-label">Preview</div>
            <div className="share-modal__preview">
              {subject && <p className="share-modal__preview-subject">{subject}</p>}
              <p className="share-modal__preview-body">{body}</p>
            </div>
            <TextArea
              label="Edit message"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
            />
          </>
        )}

        <Button
          variant="primary"
          fullWidth
          icon={Share2}
          disabled={composing || !body.trim()}
          onClick={handleShare}
        >
          {navigator.share ? 'Share' : 'Copy to Clipboard'}
        </Button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Modal>
  );
}
