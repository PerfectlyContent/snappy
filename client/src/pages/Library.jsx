import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, FileText, User, Receipt, StickyNote, Trash2, Download, X, ChevronDown } from 'lucide-react';
import { getItems, getItem, deleteItem } from '../utils/storage';
import { downloadImage, downloadVCard } from '../utils/export';
import Badge from '../components/Common/Badge';
import Button from '../components/Common/Button';
import Toast from '../components/Common/Toast';
import './Library.css';

const TYPE_ICONS = {
  calendar: Calendar,
  receipt: Receipt,
  contact: User,
  document: FileText,
  note: StickyNote,
};

export default function Library() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [entered, setEntered] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadItems();
    requestAnimationFrame(() => setEntered(true));
  }, []);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) setExpandedId(id);
  }, [searchParams]);

  async function loadItems() {
    const all = await getItems();
    setItems(all);
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);

  async function handleDelete(id) {
    await deleteItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
    setExpandedId(null);
    setToast({ message: 'Deleted', type: 'success' });
  }

  function handleExport(item) {
    if (item.type === 'contact') {
      downloadVCard(item.data);
      setToast({ message: 'Contact exported as vCard', type: 'success' });
    } else if (item.image) {
      const fileName = item.fileName || `snappy-${item.type}-${item.id}.png`;
      downloadImage(item.image, fileName);
      setToast({ message: 'File downloaded', type: 'success' });
    }
  }

  function getTitle(item) {
    const d = item.data;
    return d?.vendor || d?.name || d?.subject || d?.title || d?.eventTitle
      || d?.events?.[0]?.eventTitle || 'Saved item';
  }

  function getSubtitle(item) {
    const d = item.data;
    if (item.type === 'receipt') return d?.total ? `${d.total}` : d?.date || null;
    if (item.type === 'contact') return d?.email || d?.phone || d?.company || null;
    if (item.type === 'document') return d?.issuer || d?.date || null;
    return null;
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

  function renderDetail(label, value) {
    if (!value) return null;
    return (
      <div className="library__detail">
        <span className="library__detail-label">{label}</span>
        <span className="library__detail-value">{value}</span>
      </div>
    );
  }

  function renderExpanded(item) {
    const d = item.data || {};
    const fields = Object.entries(d).filter(([k, v]) =>
      v && v !== '' && !Array.isArray(v) && k !== 'events'
    );

    return (
      <div className="library__expanded">
        {item.image && (
          <div className="library__preview">
            <img src={item.image} alt={getTitle(item)} />
          </div>
        )}
        <div className="library__details">
          {fields.map(([key, value]) => (
            renderDetail(
              key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim(),
              String(value)
            )
          ))}
        </div>
        <div className="library__item-actions">
          <Button variant="secondary" size="small" icon={Download} onClick={() => handleExport(item)}>
            Export
          </Button>
          <button className="library__delete-btn" onClick={() => handleDelete(item.id)} aria-label="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`library ${entered ? 'library--entered' : ''}`}>
      <div className="library__top">
        <h1 className="library__heading">Library</h1>
        {items.length > 0 && (
          <span className="library__count">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      <div className="library__pills">
        {['all', 'receipt', 'document', 'contact'].map(f => (
          <button
            key={f}
            className={`library__pill ${filter === f ? 'library__pill--on' : ''}`}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="library__empty">
          <div className="library__empty-illustration">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
              <rect x="20" y="35" width="80" height="55" rx="10" stroke="currentColor" strokeWidth="1.5" opacity="0.15"/>
              <path d="M20 50 L60 50 L65 42 L100 42 L100 50" stroke="currentColor" strokeWidth="1.5" opacity="0.2"/>
              <line x1="42" y1="65" x2="78" y2="65" stroke="currentColor" strokeWidth="1.5" opacity="0.1" strokeLinecap="round"/>
              <line x1="48" y1="75" x2="72" y2="75" stroke="currentColor" strokeWidth="1.5" opacity="0.07" strokeLinecap="round"/>
            </svg>
          </div>
          <h3>{filter === 'all' ? 'Library is empty' : `No ${filter}s yet`}</h3>
          <p>Snap a receipt, document, or contact to save it here</p>
          <Button variant="secondary" size="small" onClick={() => navigate('/')}>
            Take a snap
          </Button>
        </div>
      ) : (
        <div className="library__list">
          {filtered.map((item) => {
            const Icon = TYPE_ICONS[item.type] || FileText;
            const isExpanded = expandedId === item.id;

            return (
              <div key={item.id} className="library__card-wrap">
                <button
                  className={`library__row ${isExpanded ? 'library__row--expanded' : ''}`}
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  aria-expanded={isExpanded}
                  aria-label={getTitle(item)}
                >
                  <div className="library__row-icon" data-type={item.type}>
                    <Icon size={18} strokeWidth={1.5} />
                  </div>
                  <div className="library__row-body">
                    <span className="library__row-title">{getTitle(item)}</span>
                    <div className="library__row-meta">
                      <Badge type={item.type} size="mini" />
                      {getSubtitle(item) && (
                        <span className="library__row-subtitle">{getSubtitle(item)}</span>
                      )}
                      <span className="library__row-time">{formatTime(item.timestamp)}</span>
                    </div>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`library__row-chevron ${isExpanded ? 'library__row-chevron--up' : ''}`}
                  />
                </button>
                {isExpanded && renderExpanded(item)}
              </div>
            );
          })}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
