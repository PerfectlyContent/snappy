import { useState, useEffect } from 'react';
import { Send, Mail } from 'lucide-react';
import { api } from '../../utils/api';
import Modal from '../Common/Modal';
import Input from '../Common/Input';
import { TextArea } from '../Common/Input';
import Button from '../Common/Button';

export default function ForwardModal({ classificationData, onClose, onSent }) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [composing, setComposing] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function compose() {
      try {
        const msg = await api.composeMessage(classificationData);
        setSubject(msg.subject);
        setBody(msg.body);
      } catch (err) {
        setSubject(`Sharing: ${classificationData.data?.eventTitle || classificationData.data?.vendor || classificationData.data?.name || 'Item'}`);
        setBody('Here are the details I wanted to share with you.');
      } finally {
        setComposing(false);
      }
    }
    compose();
  }, [classificationData]);

  async function handleSend() {
    if (!to) {
      setError('Please enter an email address');
      return;
    }
    setSending(true);
    setError(null);
    try {
      await api.sendMessage(to, subject, body);
      onSent();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal title="Forward" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <Input
          label="Send to"
          type="email"
          placeholder="email@example.com"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          icon={Mail}
          error={error}
        />

        {composing ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--label-tertiary)', fontSize: 'var(--text-sm)' }}>
            AI is writing your message...
          </div>
        ) : (
          <>
            <Input
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
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
          loading={sending}
          disabled={composing}
          onClick={handleSend}
        >
          Send
        </Button>
      </div>
    </Modal>
  );
}
