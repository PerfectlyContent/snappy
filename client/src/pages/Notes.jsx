import { useState, useEffect, useRef, useCallback } from 'react';
import { StickyNote, Plus, Trash2, Check, X, ChevronDown, Mic } from 'lucide-react';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import Toast from '../components/Common/Toast';
import { useVoice } from '../hooks/useVoice';
import { api } from '../utils/api';
import './Notes.css';

const STORAGE_KEY = 'snappy_notes';

function loadNotes() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [editData, setEditData] = useState({});
  const [toast, setToast] = useState(null);
  const [entered, setEntered] = useState(false);
  const titleRef = useRef(null);

  const [voiceSource, setVoiceSource] = useState(false);

  const handleVoiceComplete = useCallback(async (text) => {
    setComposing(true);
    setContent(text);
    setTitle('');
    setVoiceSource(true);

    // Auto-generate a title using the classify API
    try {
      const result = await api.classifyVoice(text);
      if (result?.type === 'note' && result?.data?.title) {
        setTitle(result.data.title);
      }
      if (result?.type === 'note' && result?.data?.content) {
        setContent(result.data.content);
      }
    } catch (err) {
      // Silently fail — user can still type a title manually
      console.warn('Auto-title generation failed:', err);
    }
  }, []);

  const handleVoiceError = useCallback((message) => {
    setToast({ message, type: 'error' });
  }, []);

  const { listening, transcript, supported: voiceSupported, startListening, stopListening } = useVoice({
    onComplete: handleVoiceComplete,
    onError: handleVoiceError,
  });

  useEffect(() => {
    setNotes(loadNotes());
    requestAnimationFrame(() => setEntered(true));
  }, []);

  useEffect(() => {
    if (composing && titleRef.current) {
      titleRef.current.focus();
    }
  }, [composing]);

  function handleCreate() {
    if (!title.trim() && !content.trim()) return;

    const note = {
      id: Date.now().toString(36),
      title: title.trim() || 'Untitled',
      content: content.trim(),
      source: voiceSource ? 'voice' : 'typed',
      completed: false,
      timestamp: new Date().toISOString(),
    };

    const updated = [note, ...notes];
    setNotes(updated);
    saveNotes(updated);
    setTitle('');
    setContent('');
    setComposing(false);
    setVoiceSource(false);
    setToast({ message: 'Reminder saved', type: 'success' });
  }

  function handleDelete(id) {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    saveNotes(updated);
    setExpandedId(null);
    setToast({ message: 'Reminder deleted', type: 'success' });
  }

  function handleToggleCompleted(id, e) {
    e.stopPropagation();
    const updated = notes.map(n =>
      n.id === id ? { ...n, completed: !n.completed } : n
    );
    setNotes(updated);
    saveNotes(updated);
  }

  function handleExpand(id) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    const note = notes.find(n => n.id === id);
    setEditData({ title: note.title, content: note.content });
    setExpandedId(id);
  }

  function handleSaveEdit(id) {
    const updated = notes.map(n =>
      n.id === id ? { ...n, title: editData.title || 'Untitled', content: editData.content } : n
    );
    setNotes(updated);
    saveNotes(updated);
    setExpandedId(null);
    setToast({ message: 'Reminder updated', type: 'success' });
  }

  function formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  }

  return (
    <div className={`notes ${entered ? 'notes--entered' : ''}`}>
      <div className="notes__top">
        <h1 className="notes__heading">Reminders</h1>
        <div className="notes__top-actions">
          <button
            className={`notes__voice-btn ${listening ? 'notes__voice-btn--active' : ''}`}
            onClick={() => {
              if (!voiceSupported) {
                setToast({ message: 'Voice input is not supported in this browser', type: 'error' });
                return;
              }
              listening ? stopListening() : startListening();
            }}
            aria-label={listening ? 'Stop recording' : 'Voice reminder'}
          >
            <Mic size={18} />
          </button>
          <button
            className="notes__new-btn"
            onClick={() => { setComposing(!composing); setTitle(''); setContent(''); }}
            aria-label={composing ? 'Cancel new reminder' : 'New reminder'}
          >
            {composing ? <X size={18} /> : <Plus size={18} />}
            <span>{composing ? 'Cancel' : 'New Reminder'}</span>
          </button>
        </div>
      </div>

      {listening && (
        <div className="notes__listening">
          <div className="notes__listening-dot" />
          <span>{transcript || 'Listening...'}</span>
        </div>
      )}

      {composing && (
        <Card className="notes__composer" padding="none">
          <div className="notes__composer-inner">
            <input
              ref={titleRef}
              className="notes__composer-title"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="notes__composer-content"
              placeholder="Write your reminder..."
              value={content}
              rows={4}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="notes__composer-actions">
              <Button
                variant="primary"
                size="small"
                icon={Check}
                onClick={handleCreate}
                disabled={!title.trim() && !content.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        </Card>
      )}

      {notes.length === 0 && !composing ? (
        <div className="notes__empty">
          <div className="notes__empty-illustration">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
              <rect x="25" y="20" width="70" height="80" rx="10" stroke="currentColor" strokeWidth="1.5" opacity="0.15"/>
              <line x1="38" y1="42" x2="82" y2="42" stroke="currentColor" strokeWidth="1.5" opacity="0.2" strokeLinecap="round"/>
              <line x1="38" y1="54" x2="72" y2="54" stroke="currentColor" strokeWidth="1.5" opacity="0.15" strokeLinecap="round"/>
              <line x1="38" y1="66" x2="78" y2="66" stroke="currentColor" strokeWidth="1.5" opacity="0.12" strokeLinecap="round"/>
              <line x1="38" y1="78" x2="58" y2="78" stroke="currentColor" strokeWidth="1.5" opacity="0.08" strokeLinecap="round"/>
              <circle cx="85" cy="85" r="16" stroke="currentColor" strokeWidth="1.5" opacity="0.1"/>
              <line x1="85" y1="79" x2="85" y2="91" stroke="currentColor" strokeWidth="1.5" opacity="0.15" strokeLinecap="round"/>
              <line x1="79" y1="85" x2="91" y2="85" stroke="currentColor" strokeWidth="1.5" opacity="0.15" strokeLinecap="round"/>
            </svg>
          </div>
          <h3>No reminders yet</h3>
          <p>Jot down thoughts or speak to Snappy</p>
          <Button variant="secondary" size="small" onClick={() => setComposing(true)}>
            Create your first reminder
          </Button>
        </div>
      ) : (
        <div className="notes__list">
          {notes.map((note) => (
            <div key={note.id} className={`notes__card-wrap ${note.completed ? 'notes__card-wrap--completed' : ''}`}>
              <button
                className={`notes__card ${expandedId === note.id ? 'notes__card--expanded' : ''}`}
                onClick={() => handleExpand(note.id)}
                aria-expanded={expandedId === note.id}
              >
                <div className="notes__card-header">
                  <label
                    className={`notes__checkbox ${note.completed ? 'notes__checkbox--checked' : ''}`}
                    onClick={(e) => handleToggleCompleted(note.id, e)}
                    aria-label={note.completed ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    <input
                      type="checkbox"
                      checked={!!note.completed}
                      onChange={() => {}}
                      tabIndex={-1}
                    />
                    <span className="notes__checkbox-box">
                      {note.completed && <Check size={12} strokeWidth={3} />}
                    </span>
                  </label>
                  <div className="notes__card-info">
                    <span className={`notes__card-title ${note.completed ? 'notes__card-title--completed' : ''}`}>{note.title}</span>
                    <span className="notes__card-time">{formatTime(note.timestamp)}</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`notes__card-chevron ${expandedId === note.id ? 'notes__card-chevron--up' : ''}`}
                  />
                </div>
                {expandedId !== note.id && note.content && (
                  <p className={`notes__card-preview ${note.completed ? 'notes__card-preview--completed' : ''}`}>{note.content}</p>
                )}
              </button>

              {expandedId === note.id && (
                <div className="notes__card-edit">
                  <input
                    className="notes__edit-title"
                    value={editData.title || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Title"
                  />
                  <textarea
                    className="notes__edit-content"
                    value={editData.content || ''}
                    rows={4}
                    onChange={(e) => setEditData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Reminder content"
                  />
                  <div className="notes__card-actions">
                    <Button variant="primary" size="small" icon={Check} onClick={() => handleSaveEdit(note.id)}>
                      Save
                    </Button>
                    <button className="notes__delete-btn" onClick={() => handleDelete(note.id)} aria-label="Delete reminder">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
