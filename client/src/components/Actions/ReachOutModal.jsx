import { useState, useEffect, useCallback } from 'react';
import { Send, Mail, MessageCircle, Smartphone, Mic } from 'lucide-react';
import { api } from '../../utils/api';
import { useVoice } from '../../hooks/useVoice';
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

export default function ReachOutModal({ contactData, onClose }) {
  const [email, setEmail] = useState(contactData?.email || '');
  const [phone, setPhone] = useState(contactData?.phone || '');

  const defaultChannel = email ? 'email' : phone ? 'whatsapp' : 'email';
  const [channel, setChannel] = useState(defaultChannel);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [composing, setComposing] = useState(true);
  const [sending, setSending] = useState(false);
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
        const msg = await api.composeReachOut(contactData, channel);
        if (!cancelled) {
          setSubject(msg.subject || '');
          setBody(msg.body || '');
        }
      } catch {
        if (!cancelled) {
          const firstName = contactData.name?.split(' ')[0] || 'there';
          setSubject(channel === 'email' ? `Hi ${firstName}!` : '');
          setBody(`Hi ${firstName}, great connecting with you!`);
        }
      } finally {
        if (!cancelled) setComposing(false);
      }
    }
    compose();
    return () => { cancelled = true; };
  }, [channel, contactData]);

  function cleanPhone(ph) {
    return ph.replace(/[\s\-()]/g, '');
  }

  const needsEmail = channel === 'email' && !email.trim();
  const needsPhone = (channel === 'whatsapp' || channel === 'sms') && !phone.trim();
  const canSend = body.trim() && !needsEmail && !needsPhone;

  async function handleSend() {
    if (!canSend) return;
    setSending(true);

    try {
      if (channel === 'email') {
        await api.sendMessage(email.trim(), subject, body);
        setToast({ message: `Email sent to ${contactData.name || email}!`, type: 'success' });
      } else if (channel === 'whatsapp') {
        const ph = cleanPhone(phone);
        window.open(`https://wa.me/${ph}?text=${encodeURIComponent(body)}`, '_blank');
        setToast({ message: 'Opening WhatsApp...', type: 'success' });
      } else if (channel === 'sms') {
        const ph = cleanPhone(phone);
        window.open(`sms:${ph}?body=${encodeURIComponent(body)}`, '_blank');
        setToast({ message: 'Opening Messages...', type: 'success' });
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSending(false);
    }
  }

  const sendLabel = {
    email: 'Send Email',
    whatsapp: 'Open WhatsApp',
    sms: 'Open Messages',
  };

  return (
    <Modal title={`Message ${contactData.name || 'Contact'}`} onClose={onClose}>
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

        {/* Recipient — always editable */}
        {channel === 'email' ? (
          <div className="reachout__recipient-row">
            <span className="reachout__recipient-label">To:</span>
            <input
              className="reachout__recipient-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={`${contactData.name || 'Contact'}'s email`}
            />
          </div>
        ) : (
          <div className="reachout__recipient-row">
            <span className="reachout__recipient-label">To:</span>
            <input
              className="reachout__recipient-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={`${contactData.name || 'Contact'}'s phone`}
            />
          </div>
        )}

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
          icon={Send}
          loading={sending}
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
