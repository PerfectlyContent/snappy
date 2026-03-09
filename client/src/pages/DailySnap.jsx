import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sun, Cloud, Sparkles, Calendar, StickyNote,
  MapPin, Clock, RefreshCw, LogIn, ChevronRight,
  Lightbulb, Link2, Bell, Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import Card from '../components/Common/Card';
import Toast from '../components/Common/Toast';
import Button from '../components/Common/Button';
import './DailySnap.css';

const NOTES_KEY = 'snappy_notes';

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function formatEventTime(event) {
  if (!event.start?.dateTime) return 'All day';
  const start = new Date(event.start.dateTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const end = event.end?.dateTime
    ? new Date(event.end.dateTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : null;
  return end ? `${start} – ${end}` : start;
}

function getDayTypeColor(dayType) {
  switch (dayType) {
    case 'busy': return 'var(--destructive)';
    case 'moderate': return 'var(--warning)';
    case 'light': return 'var(--success)';
    case 'free': return 'var(--accent)';
    default: return 'var(--label-tertiary)';
  }
}

function getDayTypeLabel(dayType) {
  switch (dayType) {
    case 'busy': return 'Busy day';
    case 'moderate': return 'Moderate';
    case 'light': return 'Light day';
    case 'free': return 'All clear';
    default: return '';
  }
}

export default function DailySnap() {
  const { authenticated, user, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [snap, setSnap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [entered, setEntered] = useState(false);

  const timeOfDay = getTimeOfDay();
  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  async function fetchSnap() {
    setLoading(true);
    setError(null);
    try {
      const notes = JSON.parse(localStorage.getItem(NOTES_KEY) || '[]');
      const notesParam = encodeURIComponent(JSON.stringify(
        notes.slice(0, 10).map(n => ({ title: n.title, content: n.content, source: n.source || 'typed' }))
      ));
      const data = await api.getDailySnap(notesParam);
      setSnap(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

  useEffect(() => {
    if (authenticated && !authLoading) {
      fetchSnap();
    }
  }, [authenticated, authLoading]);

  // Unauthenticated state
  if (!authLoading && !authenticated) {
    return (
      <div className={`dsnap ${entered ? 'dsnap--entered' : ''}`}>
        <div className="dsnap__header">
          <div className="dsnap__date">{todayStr}</div>
          <h1 className="dsnap__title">
            Good {timeOfDay}
          </h1>
        </div>

        <Card className="dsnap__auth-card">
          <div className="dsnap__auth-inner">
            <div className="dsnap__auth-icon">
              <Sparkles size={24} />
            </div>
            <h3>Connect Google to get your Daily Snap</h3>
            <p>Sign in to pull your calendar events and get an AI-powered overview of your day.</p>
            <Button variant="primary" icon={LogIn} onClick={login}>
              Sign in with Google
            </Button>
          </div>
        </Card>

        <div className="dsnap__notes-section">
          <div className="dsnap__section-header">
            <StickyNote size={16} />
            <span>Your Notes</span>
            <button className="dsnap__see-all" onClick={() => navigate('/notes')}>
              See all <ChevronRight size={14} />
            </button>
          </div>
          <NotesList />
        </div>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  return (
    <div className={`dsnap ${entered ? 'dsnap--entered' : ''}`}>
      {/* Header */}
      <div className="dsnap__header">
        <div className="dsnap__date">{todayStr}</div>
        <h1 className="dsnap__title">
          {snap?.greeting || `Good ${timeOfDay}`}
        </h1>
        {!loading && (
          <button className="dsnap__refresh" onClick={fetchSnap} aria-label="Refresh daily snap">
            <RefreshCw size={16} />
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="dsnap__loading">
          <div className="dsnap__loading-shimmer" />
          <div className="dsnap__loading-shimmer dsnap__loading-shimmer--short" />
          <div className="dsnap__loading-shimmer dsnap__loading-shimmer--medium" />
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <Card className="dsnap__error-card">
          <p>{error}</p>
          <Button variant="secondary" size="small" onClick={fetchSnap}>
            Try again
          </Button>
        </Card>
      )}

      {/* AI Summary */}
      {snap && !loading && (
        <>
          <Card className="dsnap__summary-card">
            <div className="dsnap__summary-inner">
              <div className="dsnap__summary-badge" style={{ color: getDayTypeColor(snap.dayType) }}>
                <span
                  className="dsnap__badge-dot"
                  style={{ background: getDayTypeColor(snap.dayType) }}
                />
                {getDayTypeLabel(snap.dayType)}
              </div>
              <p className="dsnap__summary-text">{snap.summary}</p>
              {snap.focusHint && (
                <div className="dsnap__focus">
                  <Sparkles size={14} />
                  <span>{snap.focusHint}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Nudges */}
          {snap.nudges?.length > 0 && (
            <div className="dsnap__nudges">
              <div className="dsnap__section-header">
                <Lightbulb size={16} />
                <span>Nudges</span>
              </div>
              <div className="dsnap__nudges-list">
                {snap.nudges.map((nudge, i) => (
                  <div key={i} className={`dsnap__nudge dsnap__nudge--${nudge.type}`}>
                    <div className="dsnap__nudge-icon">
                      {nudge.type === 'connection' ? <Link2 size={14} /> :
                       nudge.type === 'reminder' ? <Bell size={14} /> :
                       <Zap size={14} />}
                    </div>
                    <div className="dsnap__nudge-body">
                      <p className="dsnap__nudge-text">{nudge.text}</p>
                      {nudge.noteTitle && (
                        <span className="dsnap__nudge-source">From note: {nudge.noteTitle}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="dsnap__section">
            <div className="dsnap__section-header">
              <Calendar size={16} />
              <span>Today's Schedule</span>
              <span className="dsnap__count">{snap.eventCount}</span>
            </div>

            {snap.events?.length > 0 ? (
              <div className="dsnap__timeline">
                {snap.events.map((event, i) => (
                  <a
                    key={event.id || i}
                    className="dsnap__event"
                    href={event.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="dsnap__event-time">
                      <Clock size={13} />
                      {formatEventTime(event)}
                    </div>
                    <div className="dsnap__event-title">{event.summary}</div>
                    {event.location && (
                      <div className="dsnap__event-location">
                        <MapPin size={12} />
                        {event.location}
                      </div>
                    )}
                  </a>
                ))}
              </div>
            ) : (
              <div className="dsnap__empty-section">
                <Sun size={20} />
                <span>No events today — enjoy the open space</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Notes */}
      <div className="dsnap__section">
        <div className="dsnap__section-header">
          <StickyNote size={16} />
          <span>Your Notes</span>
          <button className="dsnap__see-all" onClick={() => navigate('/notes')}>
            See all <ChevronRight size={14} />
          </button>
        </div>
        <NotesList />
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function NotesList() {
  const notes = JSON.parse(localStorage.getItem(NOTES_KEY) || '[]');
  const recent = notes.slice(0, 4);

  if (recent.length === 0) {
    return (
      <div className="dsnap__empty-section">
        <StickyNote size={20} />
        <span>No notes yet</span>
      </div>
    );
  }

  return (
    <div className="dsnap__notes-list">
      {recent.map(note => (
        <div key={note.id} className="dsnap__note">
          <div className="dsnap__note-title">{note.title}</div>
          {note.content && (
            <div className="dsnap__note-preview">{note.content}</div>
          )}
        </div>
      ))}
    </div>
  );
}
