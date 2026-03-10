import { useState, useEffect } from 'react';
import { Send, Mail, MessageCircle, Smartphone } from 'lucide-react';
import { api } from '../../utils/api';
import Modal from '../Common/Modal';
import Input from '../Common/Input';
import { TextArea } from '../Common/Input';
import Button from '../Common/Button';
import Toast from '../Common/Toast';
import './ReachOutModal.css';

const CHANNELS = [
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'sms', label: 'SMS', icon: Smartphone },
];

export default function ShareModal({ classificationData, onClose, onSent }) {
  const [channel, setChannel] = useState('email');
  const [to, setTo] = useState('');
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

  const needsRecipient = !to.trim();
  const canSend = body.trim() && !needsRecipient;

  function cleanPhone(ph) {
    return ph.replace(/[\s\-()]/g, '');
  }

  function handleSend() {
    if (!canSend) return;

    if (channel === 'email') {
      const mailto = `mailto:${encodeURIComponent(to.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailto, '_blank');
    } else if (channel === 'whatsapp') {
      window.open(`https://wa.me/${cleanPhone(to)}?text=${encodeURIComponent(body)}`, '_blank');
    } else if (channel === 'sms') {
      window.open(`sms:${cleanPhone(to)}?body=${encodeURIComponent(body)}`, '_blank');
    }

    if (onSent) onSent();
  }

  const sendLabel = {
    email: 'Open Email',
    whatsapp: 'Open WhatsApp',
    sms: 'Open Messages',
  };

  const recipientPlaceholder = channel === 'email' ? 'email@example.com' : 'Phone number';
  const recipientType = channel === 'email' ? 'email' : 'tel';

  return (
    <Modal title="Share" onClose={onClose}>
      <div className="reachout">
        <div className="reachout__tabs">
          {CHANNELS.map(ch => (
            <button
              key={ch.id}
              className={`reachout__tab ${channel === ch.id ? 'reachout__tab--active' : ''}`}
              onClick={() => setChannel(ch.id)}
              aria-pressed={channel === ch.id}
            >
              <ch.icon size={14} />
              <span>{ch.label}</span>
            </button>
          ))}
        </div>

        <div className="reachout__recipient-row">
          <span className="reachout__recipient-label">To:</span>
          <input
            className="reachout__recipient-input"
            type={recipientType}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder={recipientPlaceholder}
          />
        </div>

        {composing ? (
          <div className="reachout__composing">
            <div className="reachout__composing-dot" />
            <span>Snappy is writing...</span>
          </div>
        ) : (
          <>
            {channel === 'email' && (
              <Input
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            )}
            <TextArea
              label="Message"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
            />
          </>
        )}

        <Button
          variant="primary"
          fullWidth
          icon={Send}
          disabled={composing || !canSend}
          onClick={handleSend}
        >
          {sendLabel[channel]}
        </Button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Modal>
  );
}
