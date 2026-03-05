import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, User, Receipt, StickyNote, ExternalLink, Trash2, MessageCircle } from 'lucide-react';
import Badge from '../components/Common/Badge';
import Button from '../components/Common/Button';
import ReachOutModal from '../components/Actions/ReachOutModal';
import './Activity.css';

const TYPE_ICONS = {
  calendar: Calendar,
  receipt: Receipt,
  contact: User,
  document: FileText,
  note: StickyNote,
};

export default function Activity() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [entered, setEntered] = useState(false);
  const [reachOutContact, setReachOutContact] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('snappy_activity') || '[]');
    setItems(stored);
    requestAnimationFrame(() => setEntered(true));
  }, []);

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);

  function clearActivity() {
    localStorage.removeItem('snappy_activity');
    setItems([]);
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
    <div className={`activity ${entered ? 'activity--entered' : ''}`}>
      <div className="activity__top">
        <h1 className="activity__heading">Activity</h1>
        {items.length > 0 && (
          <button className="activity__clear" onClick={clearActivity} aria-label="Clear all activity">
            <Trash2 size={14} />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div className="activity__pills">
        {['all', 'calendar', 'receipt', 'contact', 'document'].map(f => (
          <button
            key={f}
            className={`activity__pill ${filter === f ? 'activity__pill--on' : ''}`}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="activity__empty">
          <div className="activity__empty-illustration">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
              <rect x="20" y="30" width="80" height="60" rx="12" stroke="currentColor" strokeWidth="1.5" opacity="0.15"/>
              <circle cx="60" cy="55" r="14" stroke="currentColor" strokeWidth="1.5" opacity="0.25"/>
              <circle cx="60" cy="55" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.35"/>
              <line x1="35" y1="78" x2="85" y2="78" stroke="currentColor" strokeWidth="1.5" opacity="0.1" strokeLinecap="round"/>
              <line x1="42" y1="84" x2="78" y2="84" stroke="currentColor" strokeWidth="1.5" opacity="0.07" strokeLinecap="round"/>
            </svg>
          </div>
          <h3>Nothing here yet</h3>
          <p>Snap a photo or speak a reminder to get started</p>
          <Button variant="secondary" size="small" onClick={() => navigate('/')}>
            Take your first snap
          </Button>
        </div>
      ) : (
        <div className="activity__list">
          {filtered.map((item, i) => {
            const Icon = TYPE_ICONS[item.type] || FileText;
            const title = item.data?.eventTitle
              || item.data?.events?.[0]?.eventTitle
              || item.data?.vendor || item.data?.name || item.data?.subject || item.data?.title || 'Item';

            const isContact = item.type === 'contact' && (item.data?.email || item.data?.phone);

            return (
              <button
                key={i}
                className="activity__row"
                onClick={() => {
                  if (isContact) {
                    setReachOutContact(item.data);
                  } else if (item.link) {
                    window.open(item.link, '_blank');
                  }
                }}
                aria-label={`${title} — ${item.type}`}
              >
                <div className="activity__row-icon" data-type={item.type}>
                  <Icon size={18} strokeWidth={1.5} />
                </div>
                <div className="activity__row-body">
                  <span className="activity__row-title">{title}</span>
                  <div className="activity__row-meta">
                    <Badge type={item.type} size="mini" />
                    <span className="activity__row-time">{formatTime(item.timestamp)}</span>
                  </div>
                </div>
                {isContact
                  ? <MessageCircle size={14} className="activity__row-link" />
                  : item.link && <ExternalLink size={14} className="activity__row-link" />
                }
              </button>
            );
          })}
        </div>
      )}

      {reachOutContact && (
        <ReachOutModal
          contactData={reachOutContact}
          onClose={() => setReachOutContact(null)}
        />
      )}
    </div>
  );
}
