import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, FileText, User, Receipt, StickyNote,
  Save, Send, ChevronDown, ChevronUp, ExternalLink, AlertTriangle,
  UserPlus, X, Download
} from 'lucide-react';
import { buildCalendarUrl, downloadIcsFile, downloadVCard, downloadImage } from '../utils/export';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import Badge from '../components/Common/Badge';
import Toast from '../components/Common/Toast';
import ForwardModal from '../components/Actions/ForwardModal';
import ReachOutModal from '../components/Actions/ReachOutModal';
import './Result.css';

const TYPE_ICONS = {
  calendar: Calendar,
  receipt: Receipt,
  contact: User,
  document: FileText,
  note: StickyNote,
};

const TYPE_ACTIONS = {
  calendar: 'Add to Calendar',
  receipt: 'Download Receipt',
  contact: 'Add to Contacts',
  document: 'Download Document',
  note: 'Save Note',
};

export default function Result() {
  const navigate = useNavigate();
  const { authenticated, provider } = useAuth();
  const [result, setResult] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [editedData, setEditedData] = useState({});
  const [saved, setSaved] = useState(false);
  const [savedLink, setSavedLink] = useState(null);
  const [showForward, setShowForward] = useState(false);
  const [showReachOut, setShowReachOut] = useState(false);
  const [toast, setToast] = useState(null);
  const [manualType, setManualType] = useState(null);
  const [entered, setEntered] = useState(false);
  const [attendeeInput, setAttendeeInput] = useState('');

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

  useEffect(() => {
    const storedResult = sessionStorage.getItem('snappy_result');
    const storedImage = sessionStorage.getItem('snappy_image');
    if (!storedResult) {
      navigate('/');
      return;
    }
    const parsed = JSON.parse(storedResult);
    setResult(parsed);
    if (parsed.type === 'calendar' && parsed.data?.events) {
      setEditedData(parsed.data);
    } else if (parsed.type === 'calendar' && !parsed.data?.events) {
      setEditedData({ events: [parsed.data] });
    } else {
      setEditedData(parsed.data || {});
    }
    setImageUrl(storedImage);
  }, [navigate]);

  if (!result) return null;

  const type = manualType || result.type;
  const confidence = result.confidence;
  const lowConfidence = confidence < 0.6;
  const Icon = TYPE_ICONS[type] || FileText;
  const events = type === 'calendar' ? (editedData.events || []) : [];

  function updateField(key, value) {
    setEditedData(prev => ({ ...prev, [key]: value }));
  }

  function addAttendee(eventIndex) {
    const email = attendeeInput.trim().toLowerCase();
    if (!email || !email.includes('@')) return;
    const updated = [...events];
    const current = updated[eventIndex].attendees || [];
    if (!current.includes(email)) {
      updated[eventIndex] = { ...updated[eventIndex], attendees: [...current, email] };
      setEditedData({ events: updated });
    }
    setAttendeeInput('');
  }

  function removeAttendee(eventIndex, email) {
    const updated = [...events];
    updated[eventIndex] = {
      ...updated[eventIndex],
      attendees: (updated[eventIndex].attendees || []).filter(e => e !== email),
    };
    setEditedData({ events: updated });
  }

  function handleSaveIcs() {
    const evts = editedData.events || [editedData];
    downloadIcsFile(evts);
    const msg = evts.length > 1
      ? `${evts.length} calendar files downloaded`
      : 'Calendar file downloaded — open to add to Apple Calendar';
    setToast({ message: msg, type: 'success' });
    setSaved(true);

    const activity = JSON.parse(localStorage.getItem('snappy_activity') || '[]');
    activity.unshift({ type, data: editedData, timestamp: new Date().toISOString() });
    localStorage.setItem('snappy_activity', JSON.stringify(activity.slice(0, 50)));
  }

  async function handleSave() {
    // Notes save locally
    if (type === 'note') {
      const ts = new Date().toISOString();
      const noteId = Date.now().toString(36);
      const notes = JSON.parse(localStorage.getItem('snappy_notes') || '[]');
      notes.unshift({ id: noteId, title: editedData.title || 'Untitled', content: editedData.content || '', source: 'voice', timestamp: ts });
      localStorage.setItem('snappy_notes', JSON.stringify(notes));

      const activity = JSON.parse(localStorage.getItem('snappy_activity') || '[]');
      activity.unshift({ type: 'note', data: editedData, timestamp: ts });
      localStorage.setItem('snappy_activity', JSON.stringify(activity.slice(0, 50)));

      setSaved(true);
      setToast({ message: 'Note saved', type: 'success' });
      return;
    }

    let link = null;

    if (type === 'calendar') {
      const evts = editedData.events || [editedData];
      // Open each event in Google Calendar
      evts.forEach((evt, i) => {
        const url = buildCalendarUrl(evt);
        if (url) {
          setTimeout(() => window.open(url, '_blank'), i * 300);
          if (i === 0) link = url;
        }
      });
      const msg = evts.length > 1
        ? `${evts.length} events opened in Google Calendar`
        : 'Opened in Google Calendar';
      setToast({ message: msg, type: 'success' });
    } else if (type === 'contact') {
      if (authenticated && provider === 'google') {
        try {
          await api.createContact(editedData);
          setToast({ message: 'Contact saved to Google Contacts', type: 'success' });
        } catch (err) {
          console.error('Failed to save to Google Contacts:', err);
          downloadVCard(editedData);
          setToast({ message: 'Contact file downloaded — open to add to Contacts', type: 'success' });
        }
      } else {
        downloadVCard(editedData);
        setToast({ message: 'Contact file downloaded — open to add to Contacts', type: 'success' });
      }
    } else {
      // receipt or document → download image
      const imageData = sessionStorage.getItem('snappy_image');
      const fileName = sessionStorage.getItem('snappy_fileName') || `snappy-${type}.png`;
      downloadImage(imageData, fileName);
      setToast({ message: 'File downloaded', type: 'success' });
    }

    setSaved(true);
    setSavedLink(link);

    // Add to activity
    const activity = JSON.parse(localStorage.getItem('snappy_activity') || '[]');
    activity.unshift({
      type,
      data: editedData,
      link,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('snappy_activity', JSON.stringify(activity.slice(0, 50)));
  }

  function renderFields() {
    const fields = Object.entries(editedData).filter(([, v]) =>
      v !== '' && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)
    );

    return fields.map(([key, value]) => (
      <div key={key} className="result__field">
        <label className="result__field-label">{formatLabel(key)}</label>
        {Array.isArray(value) ? (
          <div className="result__field-tags">
            {value.map((item, i) => (
              <span key={i} className="result__field-tag">{item}</span>
            ))}
          </div>
        ) : (
          <input
            className="result__field-input"
            value={value}
            onChange={(e) => updateField(key, e.target.value)}
          />
        )}
      </div>
    ));
  }

  return (
    <div className={`result ${entered ? 'result--entered' : ''}`}>
      {/* Header */}
      <div className="result__header">
        <button className="result__back" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          <span>New Snap</span>
        </button>
      </div>

      {/* Image preview */}
      {imageUrl && (
        <div className="result__image-wrap">
          <img src={imageUrl} alt="Screenshot" className="result__image" />
        </div>
      )}

      {/* Classification header */}
      <Card className="result__classification">
        <div className="result__type-row">
          <div className="result__type-icon-wrap" data-type={type}>
            <Icon size={24} />
          </div>
          <div className="result__type-info">
            <div className="result__type-name-row">
              <Badge type={type} />
              {confidence && (
                <span className={`result__confidence ${lowConfidence ? 'result__confidence--low' : ''}`}>
                  {Math.round(confidence * 100)}% confident
                </span>
              )}
            </div>
            <h2 className="result__type-title">
              {events.length > 1
                ? `${events.length} Events Found`
                : events[0]?.eventTitle || editedData.eventTitle || editedData.vendor || editedData.name || editedData.subject || editedData.title || 'Classified Item'}
            </h2>
          </div>
        </div>

        {lowConfidence && (
          <div className="result__low-confidence">
            <AlertTriangle size={16} />
            <span>Low confidence — please verify the type</span>
            <div className="result__type-options">
              {['calendar', 'receipt', 'contact', 'document', 'note'].map(t => (
                <button
                  key={t}
                  className={`result__type-option ${t === type ? 'result__type-option--active' : ''}`}
                  onClick={() => setManualType(t)}
                  aria-pressed={t === type}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Fields */}
      <Card className="result__fields-card" padding="none">
        <button className="result__fields-toggle" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-label="Toggle details">
          <span>Details</span>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {expanded && (
          <div className="result__fields">
            {type === 'note' ? (
              <div className="result__note-fields">
                <div className="result__field">
                  <label className="result__field-label">Title</label>
                  <input
                    className="result__field-input"
                    value={editedData.title || ''}
                    onChange={(e) => updateField('title', e.target.value)}
                  />
                </div>
                <div className="result__field">
                  <label className="result__field-label">Note</label>
                  <textarea
                    className="result__field-textarea"
                    value={editedData.content || ''}
                    rows={4}
                    onChange={(e) => updateField('content', e.target.value)}
                  />
                </div>
              </div>
            ) : type === 'calendar' && events.length > 0 ? (
              events.map((evt, i) => (
                <div key={i} className="result__event-block">
                  {events.length > 1 && (
                    <div className="result__event-number">Event {i + 1}</div>
                  )}
                  <div className="result__field">
                    <label className="result__field-label">Title</label>
                    <input
                      className="result__field-input"
                      value={evt.eventTitle || ''}
                      onChange={(e) => {
                        const updated = [...events];
                        updated[i] = { ...updated[i], eventTitle: e.target.value };
                        setEditedData({ events: updated });
                      }}
                    />
                  </div>
                  <div className="result__field">
                    <label className="result__field-label">Date</label>
                    <input
                      className="result__field-input"
                      value={evt.date || ''}
                      onChange={(e) => {
                        const updated = [...events];
                        updated[i] = { ...updated[i], date: e.target.value };
                        setEditedData({ events: updated });
                      }}
                    />
                  </div>
                  <div className="result__field">
                    <label className="result__field-label">Time</label>
                    <input
                      className="result__field-input"
                      value={evt.time || ''}
                      onChange={(e) => {
                        const updated = [...events];
                        updated[i] = { ...updated[i], time: e.target.value };
                        setEditedData({ events: updated });
                      }}
                    />
                  </div>
                  {evt.endTime && (
                    <div className="result__field">
                      <label className="result__field-label">End Time</label>
                      <input
                        className="result__field-input"
                        value={evt.endTime || ''}
                        onChange={(e) => {
                          const updated = [...events];
                          updated[i] = { ...updated[i], endTime: e.target.value };
                          setEditedData({ events: updated });
                        }}
                      />
                    </div>
                  )}
                  <div className="result__field">
                    <label className="result__field-label">Location</label>
                    <input
                      className="result__field-input"
                      value={evt.location || ''}
                      placeholder="Add location"
                      onChange={(e) => {
                        const updated = [...events];
                        updated[i] = { ...updated[i], location: e.target.value };
                        setEditedData({ events: updated });
                      }}
                    />
                  </div>
                  <div className="result__field">
                    <label className="result__field-label">Description</label>
                    <input
                      className="result__field-input"
                      value={evt.description || ''}
                      placeholder="Add details"
                      onChange={(e) => {
                        const updated = [...events];
                        updated[i] = { ...updated[i], description: e.target.value };
                        setEditedData({ events: updated });
                      }}
                    />
                  </div>
                  <div className="result__field result__attendees-field">
                    <label className="result__field-label">
                      <UserPlus size={12} />
                      Attendees
                    </label>
                    {(evt.attendees || []).length > 0 && (
                      <div className="result__attendee-chips">
                        {evt.attendees.map(email => (
                          <span key={email} className="result__attendee-chip">
                            {email}
                            <button
                              className="result__attendee-remove"
                              onClick={() => removeAttendee(i, email)}
                              aria-label={`Remove ${email}`}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="result__attendee-input-row">
                      <input
                        className="result__field-input"
                        type="email"
                        value={attendeeInput}
                        placeholder="Type email address"
                        onChange={(e) => setAttendeeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            addAttendee(i);
                          }
                        }}
                      />
                      <button
                        className="result__attendee-add"
                        onClick={() => addAttendee(i)}
                        disabled={!attendeeInput.trim()}
                        aria-label="Add attendee"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              renderFields()
            )}
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className={`result__actions ${saved ? 'result__actions--saved' : ''}`}>
        {saved ? (
          <>
            {type === 'contact' && (editedData.email || editedData.phone) && (
              <Button variant="primary" fullWidth icon={Send} onClick={() => setShowReachOut(true)}>
                Reach Out
              </Button>
            )}
            <Button variant="secondary" fullWidth onClick={() => navigate('/')}>
              Snap Another
            </Button>
            {savedLink && (
              <a href={savedLink} target="_blank" rel="noopener noreferrer" className="result__view-link">
                <ExternalLink size={16} /> Open in Calendar
              </a>
            )}
          </>
        ) : (
          <>
            {type === 'calendar' ? (
              <>
                <Button variant="primary" size="large" fullWidth icon={Save} onClick={handleSave}>
                  {events.length > 1 ? `Add ${events.length} Events to Google Calendar` : 'Add to Google Calendar'}
                </Button>
                <Button variant="secondary" fullWidth icon={Download} onClick={handleSaveIcs}>
                  {events.length > 1 ? `Download ${events.length} .ics Files` : 'Add to Apple Calendar (.ics)'}
                </Button>
              </>
            ) : type === 'contact' ? (
              <>
                <Button
                  variant="primary"
                  size="large"
                  fullWidth
                  icon={authenticated && provider === 'google' ? Save : Download}
                  onClick={handleSave}
                >
                  {authenticated && provider === 'google' ? 'Add to Google Contacts' : 'Save Contact (.vcf)'}
                </Button>
                {authenticated && provider === 'google' && (
                  <Button variant="secondary" fullWidth icon={Download} onClick={() => {
                    downloadVCard(editedData);
                    setToast({ message: 'Contact file downloaded — open to add to Contacts', type: 'success' });
                  }}>
                    Download .vcf File
                  </Button>
                )}
              </>
            ) : (
              <Button
                variant="primary"
                size="large"
                fullWidth
                icon={type === 'receipt' || type === 'document' ? Download : Save}
                onClick={handleSave}
              >
                {TYPE_ACTIONS[type]}
              </Button>
            )}
            <Button
              variant="secondary"
              fullWidth
              icon={Send}
              onClick={() => setShowForward(true)}
            >
              Forward to Someone
            </Button>
          </>
        )}
      </div>

      {showForward && (
        <ForwardModal
          classificationData={{ type, data: editedData }}
          onClose={() => setShowForward(false)}
          onSent={() => {
            setShowForward(false);
            setToast({ message: 'Message sent!', type: 'success' });
          }}
        />
      )}

      {showReachOut && (
        <ReachOutModal
          contactData={editedData}
          onClose={() => setShowReachOut(false)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function formatLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim();
}
