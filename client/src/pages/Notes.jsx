import { useState, useEffect, useRef, useCallback } from 'react';
import { StickyNote, Plus, Trash2, Check, X, ChevronDown, Mic } from 'lucide-react';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import Toast from '../components/Common/Toast';
import { useVoice } from '../hooks/useVoice';
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

  const handleVoiceComplete = useCallback((text) => {
    setComposing(true);
    setContent(text);
    setTitle('');
    setVoiceSource(true);
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
      timestamp: new Date().toISOString(),
    };

    const updated = [note, ...notes];
    setNotes(updated);
    saveNotes(updated);
    setTitle('');
    setContent('');
    setComposing(false);
    setVoiceSource(false);
    setToast({ message: 'Note saved', type: 'success' });
  }

  function handleDelete(id) {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    saveNotes(updated);
    setExpandedId(null);
    setToast({ message: 'Note deleted', type: 'success' });
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
    setToast({ message: 'Note updated', type: 'success' });
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
        <h1 className="notes__heading">Notes</h1>
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
            aria-label={listening ? 'Stop recording' : 'Voice note'}
          >
            <Mic size={18} />
          </button>
          <button
            className="notes__new-btn"
            onClick={() => { setComposing(!composing); setTitle(''); setContent(''); }}
            aria-label={composing ? 'Cancel new note' : 'New note'}
          >
            {composing ? <X size={18} /> : <Plus size={18} />}
            <span>{composing ? 'Cancel' : 'New Note'}</span>
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
              placeholder="Write your note..."
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
          <h3>No notes yet</h3>
          <p>Jot down thoughts or speak to Snappy</p>
          <Button variant="secondary" size="small" onClick={() => setComposing(true)}>
            Create your first note
          </Button>
        </div>
      ) : (
        <div className="notes__list">
          {notes.map((note) => (
            <div key={note.id} className="notes__card-wrap">
              <button
                className={`notes__card ${expandedId === note.id ? 'notes__card--expanded' : ''}`}
                onClick={() => handleExpand(note.id)}
                aria-expanded={expandedId === note.id}
              >
                <div className="notes__card-header">
                  <div className="notes__card-icon">
                    <StickyNote size={16} strokeWidth={1.5} />
                  </div>
                  <div className="notes__card-info">
                    <span className="notes__card-title">{note.title}</span>
                    <span className="notes__card-time">{formatTime(note.timestamp)}</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`notes__card-chevron ${expandedId === note.id ? 'notes__card-chevron--up' : ''}`}
                  />
                </div>
                {expandedId !== note.id && note.content && (
                  <p className="notes__card-preview">{note.content}</p>
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
                    placeholder="Note content"
                  />
                  <div className="notes__card-actions">
                    <Button variant="primary" size="small" icon={Check} onClick={() => handleSaveEdit(note.id)}>
                      Save
                    </Button>
                    <button className="notes__delete-btn" onClick={() => handleDelete(note.id)} aria-label="Delete note">
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
