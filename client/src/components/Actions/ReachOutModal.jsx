import { useState, useEffect, useCallback } from 'react';
import { Share2, Mail, MessageCircle, Smartphone, Mic } from 'lucide-react';
import { api } from '../../utils/api';
import { useVoice } from '../../hooks/useVoice';
import Modal from '../Common/Modal';
import { TextArea } from '../Common/Input';
import Button from '../Common/Button';
import Toast from '../Common/Toast';
import './ReachOutModal.css';

export default function ReachOutModal({ contactData, onClose }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [composing, setComposing] = useState(true);
  const [toast, setToast] = useState(null);

  const handleVoiceComplete = useCallback((text) => {
    setBody(prev => prev ? prev + ' ' + text : text);
  }, []);

  const handleVoiceError = useCallback((message) => {
    setToast({ message, type: 'error' });
  }, []);

  const { listening, transcript, supported: voiceSupported, startListening, stopListening } = useVoice({
    onComplete: handleVoiceComplete,
    onError: handleVoiceError,
  });

  useEffect(() => {
    let cancelled = false;
    async function compose() {
      setComposing(true);
      try {
        const msg = await api.composeReachOut(contactData, 'email');
        if (!cancelled) {
          setSubject(msg.subject || '');
          setBody(msg.body || '');
        }
      } catch {
        if (!cancelled) {
          const firstName = contactData.name?.split(' ')[0] || 'there';
          setSubject(`Hi ${firstName}!`);
          setBody(`Hi ${firstName}, great connecting with you!`);
        }
      } finally {
        if (!cancelled) setComposing(false);
      }
    }
    compose();
    return () => { cancelled = true; };
  }, [contactData]);

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
        onClose();
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback: copy to clipboard
    try {
      const fullText = subject ? `${subject}\n\n${shareText}` : shareText;
      await navigator.clipboard.writeText(fullText);
      setToast({ message: 'Copied to clipboard', type: 'success' });
    } catch {
      setToast({ message: 'Could not share — try copying manually', type: 'error' });
    }
  }

  return (
    <Modal title={`Message ${contactData.name || 'Contact'}`} onClose={onClose}>
      <div className="reachout">
        {composing ? (
          <div className="reachout__composing">
            <div className="reachout__composing-dot" />
            <span>Snappy is writing...</span>
          </div>
        ) : (
          <>
            <div className="reachout__body-wrap">
              <TextArea
                label="Message"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
              />
              <button
                className={`reachout__voice-btn ${listening ? 'reachout__voice-btn--active' : ''}`}
                onClick={() => {
                  if (!voiceSupported) {
                    setToast({ message: 'Voice not supported in this browser', type: 'error' });
                    return;
                  }
                  listening ? stopListening() : startListening();
                }}
                aria-label={listening ? 'Stop recording' : 'Dictate message'}
              >
                <Mic size={16} />
              </button>
            </div>

            {listening && (
              <div className="reachout__listening">
                <div className="reachout__listening-dot" />
                <span>{transcript || 'Listening...'}</span>
              </div>
            )}
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
