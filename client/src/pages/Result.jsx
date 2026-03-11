import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, FileText, User, Receipt, StickyNote,
  Save, Share2, ChevronDown, ChevronUp, ExternalLink, AlertTriangle,
  UserPlus, X, Archive, Download, Ticket, CookingPot, Pill,
  Package, PenLine, Monitor
} from 'lucide-react';
import { buildCalendarUrl, downloadIcsFile, downloadVCard, downloadImage } from '../utils/export';
import { saveItem } from '../utils/storage';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import Badge from '../components/Common/Badge';
import Toast from '../components/Common/Toast';
import ShareModal from '../components/Actions/ShareModal';
import ReachOutModal from '../components/Actions/ReachOutModal';
import './Result.css';

const TYPE_ICONS = {
  calendar: Calendar,
  receipt: Receipt,
  contact: User,
  document: FileText,
  note: StickyNote,
  ticket: Ticket,
  recipe: CookingPot,
  prescription: Pill,
  product: Package,
  handwriting: PenLine,
  screenshot: Monitor,
};

const TYPE_ACTIONS = {
  calendar: 'Add to Calendar',
  receipt: 'Save Receipt',
  contact: 'Save Contact',
  document: 'Save Document',
  note: 'Save Reminder',
  ticket: 'Save Ticket',
  recipe: 'Save Recipe',
  prescription: 'Save Prescription',
  product: 'Save Product',
  handwriting: 'Save Reminder',
  screenshot: 'Save Screenshot',
};

export default function Result() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [editedData, setEditedData] = useState({});
  const [saved, setSaved] = useState(false);
  const [savedLink, setSavedLink] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showReachOut, setShowReachOut] = useState(false);
  const [toast, setToast] = useState(null);
  const [manualType, setManualType] = useState(null);
  const [entered, setEntered] = useState(false);
  const [attendeeInput, setAttendeeInput] = useState('');
  const [imageExpanded, setImageExpanded] = useState(false);

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

  function logActivity(activityType, data, link) {
    const activity = JSON.parse(localStorage.getItem('snappy_activity') || '[]');
    activity.unshift({ type: activityType, data, link, timestamp: new Date().toISOString() });
    localStorage.setItem('snappy_activity', JSON.stringify(activity.slice(0, 50)));
  }

  function handleSaveIcs() {
    const evts = editedData.events || [editedData];
    downloadIcsFile(evts);
    const msg = evts.length > 1
      ? `${evts.length} calendar files downloaded`
      : 'Calendar file downloaded — open to add to Apple Calendar';
    setToast({ message: msg, type: 'success' });
    setSaved(true);
    logActivity(type, editedData, null);
  }

  async function handleSave() {
    // Notes save to localStorage (existing behavior)
    if (type === 'note') {
      const ts = new Date().toISOString();
      const noteId = Date.now().toString(36);
      const notes = JSON.parse(localStorage.getItem('snappy_notes') || '[]');
      notes.unshift({ id: noteId, title: editedData.title || 'Untitled', content: editedData.content || '', source: 'voice', completed: false, timestamp: ts });
      localStorage.setItem('snappy_notes', JSON.stringify(notes));
      logActivity('note', editedData, null);
      setSaved(true);
      setToast({ message: 'Reminder saved', type: 'success' });
      return;
    }

    // Calendar → deep link (no API needed)
    if (type === 'calendar') {
      const evts = editedData.events || [editedData];
      let link = null;
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
      setSaved(true);
      setSavedLink(link);
      logActivity(type, editedData, link);
      return;
    }

    // Contact → save to library + open vCard so OS shows the contact creation card
    if (type === 'contact') {
      setSaving(true);
      try {
        const imageData = sessionStorage.getItem('snappy_image');
        const fileName = sessionStorage.getItem('snappy_fileName') || null;
        const id = await saveItem({ type, data: editedData, image: imageData, fileName });
        downloadVCard(editedData);
        setSaved(true);
        setSavedLink(`/library?id=${id}`);
        setToast({ message: 'Contact saved', type: 'success' });
        logActivity(type, editedData, `/library?id=${id}`);
      } catch (err) {
        console.error('Failed to save contact:', err);
        setToast({ message: 'Failed to save — please try again', type: 'error' });
      } finally {
        setSaving(false);
      }
      return;
    }

    // Receipts, documents, etc. → save to IndexedDB library
    setSaving(true);
    try {
      const imageData = sessionStorage.getItem('snappy_image');
      const fileName = sessionStorage.getItem('snappy_fileName') || null;
      const id = await saveItem({ type, data: editedData, image: imageData, fileName });
      setSaved(true);
      setSavedLink(`/library?id=${id}`);
      setToast({ message: 'Saved to Library', type: 'success' });
      logActivity(type, editedData, `/library?id=${id}`);
    } catch (err) {
      console.error('Failed to save:', err);
      setToast({ message: 'Failed to save — please try again', type: 'error' });
    } finally {
      setSaving(false);
    }
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

      {/* Image preview — collapsible */}
      {imageUrl && (
        <button
          className={`result__image-wrap ${imageExpanded ? 'result__image-wrap--expanded' : ''}`}
          onClick={() => setImageExpanded(!imageExpanded)}
          aria-expanded={imageExpanded}
          aria-label={imageExpanded ? 'Collapse image' : 'Expand image'}
        >
          <img src={imageUrl} alt="Snapped image" className="result__image" />
          <span className="result__image-hint">
            {imageExpanded ? 'Tap to collapse' : 'Tap to view'}
          </span>
        </button>
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
                : events[0]?.eventTitle || editedData.eventTitle || editedData.vendor || editedData.name || editedData.subject || editedData.title || editedData.medication || editedData.app || 'Classified Item'}
            </h2>
          </div>
        </div>

        {lowConfidence && (
          <div className="result__low-confidence">
            <AlertTriangle size={16} />
            <span>Low confidence — please verify the type</span>
          </div>
        )}

        <div className="result__type-options">
          {['calendar', 'receipt', 'contact', 'document', 'note', 'ticket', 'recipe', 'prescription', 'product', 'handwriting', 'screenshot'].map(t => (
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
                  <label className="result__field-label">Reminder</label>
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

      {/* Save destination hint */}
      {!saved && !saving && !['calendar', 'note'].includes(type) && (
        <div className="result__destination">
          <Archive size={14} />
          <span>Saves to your Library</span>
        </div>
      )}

      {/* Actions */}
      <div className={`result__actions ${saved ? 'result__actions--saved' : ''}`}>
        {saved ? (
          <>
            {type === 'contact' && (editedData.email || editedData.phone) && (
              <Button variant="primary" fullWidth icon={Share2} onClick={() => setShowReachOut(true)}>
                Reach Out
              </Button>
            )}
            <Button variant="secondary" fullWidth onClick={() => navigate('/')}>
              Snap Another
            </Button>
            {savedLink && (
              <a href={savedLink} target="_blank" rel="noopener noreferrer" className="result__view-link">
                <ExternalLink size={16} />
                {type === 'calendar' ? 'Open in Calendar' : 'View in Library'}
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
              <Button
                variant="primary"
                size="large"
                fullWidth
                icon={saving ? undefined : UserPlus}
                onClick={handleSave}
                loading={saving}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Add to Contacts'}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="large"
                fullWidth
                icon={saving ? undefined : Save}
                onClick={handleSave}
                loading={saving}
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : TYPE_ACTIONS[type]}
              </Button>
            )}
            <Button
              variant="secondary"
              fullWidth
              icon={Share2}
              onClick={() => setShowShare(true)}
              disabled={saving}
            >
              Share
            </Button>
          </>
        )}
      </div>

      {showShare && (
        <ShareModal
          classificationData={{ type, data: editedData }}
          onClose={() => setShowShare(false)}
          onSent={() => {
            setShowShare(false);
            setToast({ message: 'Shared!', type: 'success' });
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
