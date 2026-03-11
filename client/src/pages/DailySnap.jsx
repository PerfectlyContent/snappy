import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sun, Cloud, Sparkles, Calendar, StickyNote,
  MapPin, Clock, RefreshCw, LogIn, ChevronRight,
  Lightbulb, Link2, Bell, Zap, Check,
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
  const { authenticated, user, provider, login, loading: authLoading, calendarConnected, connectCalendar } = useAuth();
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

  const hasGoogleCalendar = calendarConnected;

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

        {/* Reminders section first - works without sign-in */}
        <div className="dsnap__notes-section">
          <div className="dsnap__section-header">
            <StickyNote size={16} />
            <span>Your Reminders</span>
            <button className="dsnap__see-all" onClick={() => navigate('/notes')}>
              See all <ChevronRight size={14} />
            </button>
          </div>
          <NotesList />
        </div>

        {/* AI Daily Snap preview */}
        <div className="dsnap__preview-section">
          <div className="dsnap__section-header">
            <Sparkles size={16} />
            <span>Daily Snap</span>
            <span className="dsnap__preview-badge">Sign in to unlock</span>
          </div>

          <div className="dsnap__preview-card">
            <div className="dsnap__preview-mockup" aria-hidden="true">
              <div className="dsnap__preview-badge-row">
                <span className="dsnap__preview-dot" />
                <span className="dsnap__preview-line dsnap__preview-line--xs" />
              </div>
              <div className="dsnap__preview-line dsnap__preview-line--full" />
              <div className="dsnap__preview-line dsnap__preview-line--lg" />
              <div className="dsnap__preview-line dsnap__preview-line--md" />
              <div className="dsnap__preview-focus-mock">
                <Sparkles size={12} />
                <span className="dsnap__preview-line dsnap__preview-line--sm" />
              </div>
            </div>

            <div className="dsnap__preview-overlay">
              <div className="dsnap__preview-icon">
                <Sparkles size={20} />
              </div>
              <h3 className="dsnap__preview-title">Your personal daily briefing</h3>
              <p className="dsnap__preview-desc">
                AI reads your reminders and calendar to give you a clear picture of the day ahead.
              </p>
            </div>
          </div>

          <div className="dsnap__features">
            <div className="dsnap__feature">
              <div className="dsnap__feature-icon dsnap__feature-icon--sparkles">
                <Sparkles size={14} />
              </div>
              <div className="dsnap__feature-text">
                <span className="dsnap__feature-label">AI Summary</span>
                <span className="dsnap__feature-desc">Smart overview of your day</span>
              </div>
            </div>
            <div className="dsnap__feature">
              <div className="dsnap__feature-icon dsnap__feature-icon--calendar">
                <Calendar size={14} />
              </div>
              <div className="dsnap__feature-text">
                <span className="dsnap__feature-label">Calendar</span>
                <span className="dsnap__feature-desc">See events at a glance</span>
              </div>
            </div>
            <div className="dsnap__feature">
              <div className="dsnap__feature-icon dsnap__feature-icon--nudges">
                <Lightbulb size={14} />
              </div>
              <div className="dsnap__feature-text">
                <span className="dsnap__feature-label">Nudges</span>
                <span className="dsnap__feature-desc">Gentle reminders from your notes</span>
              </div>
            </div>
          </div>

          <button className="dsnap__signin-cta" onClick={login}>
            <div className="dsnap__signin-cta-left">
              <svg className="dsnap__google-icon" width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Sign in with Google</span>
            </div>
            <ChevronRight size={16} />
          </button>
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
                        <span className="dsnap__nudge-source">From reminder: {nudge.noteTitle}</span>
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
              {hasGoogleCalendar && <span className="dsnap__count">{snap.eventCount}</span>}
            </div>

            {!hasGoogleCalendar ? (
              <div className="dsnap__calendar-hint">
                <Calendar size={18} />
                <div className="dsnap__calendar-hint-text">
                  <span>Connect Google Calendar</span>
                  <span className="dsnap__calendar-hint-sub">
                    See today's events and get smarter daily insights.
                  </span>
                </div>
                {provider === 'google' ? (
                  <button className="dsnap__calendar-hint-btn" onClick={connectCalendar}>
                    Connect
                  </button>
                ) : null}
              </div>
            ) : snap.events?.length > 0 ? (
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
          <span>Your Reminders</span>
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
  const [notes, setNotes] = useState(JSON.parse(localStorage.getItem(NOTES_KEY) || '[]'));
  const recent = notes.slice(0, 4);

  function handleToggle(id) {
    const allNotes = JSON.parse(localStorage.getItem(NOTES_KEY) || '[]');
    const updated = allNotes.map(n =>
      n.id === id ? { ...n, completed: !n.completed } : n
    );
    localStorage.setItem(NOTES_KEY, JSON.stringify(updated));
    setNotes(updated);
  }

  if (recent.length === 0) {
    return (
      <div className="dsnap__empty-section">
        <StickyNote size={20} />
        <span>No reminders yet</span>
      </div>
    );
  }

  return (
    <div className="dsnap__notes-list">
      {recent.map(note => (
        <div key={note.id} className={`dsnap__note ${note.completed ? 'dsnap__note--completed' : ''}`}>
          <label
            className={`dsnap__note-checkbox ${note.completed ? 'dsnap__note-checkbox--checked' : ''}`}
            onClick={(e) => { e.preventDefault(); handleToggle(note.id); }}
          >
            <span className="dsnap__note-checkbox-box">
              {note.completed && <Check size={10} strokeWidth={3} />}
            </span>
          </label>
          <div className="dsnap__note-body">
            <div className={`dsnap__note-title ${note.completed ? 'dsnap__note-title--completed' : ''}`}>{note.title}</div>
            {note.content && (
              <div className={`dsnap__note-preview ${note.completed ? 'dsnap__note-preview--completed' : ''}`}>{note.content}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
