import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, FileText, User, Receipt, StickyNote, Trash2, Download, Share2, Mail, Copy, X, ChevronDown } from 'lucide-react';
import { getItems, getItem, deleteItem } from '../utils/storage';
import { downloadImage, downloadVCard, buildVCard } from '../utils/export';
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
  const [shareMenuId, setShareMenuId] = useState(null);
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

  function buildShareText(item) {
    const title = getTitle(item);
    const d = item.data || {};
    const lines = [title];
    if (item.type === 'receipt') {
      if (d.total) lines.push(`Total: ${d.total}`);
      if (d.date) lines.push(`Date: ${d.date}`);
    } else if (item.type === 'contact') {
      if (d.email) lines.push(d.email);
      if (d.phone) lines.push(d.phone);
      if (d.company) lines.push(d.company);
    } else if (item.type === 'document') {
      if (d.issuer) lines.push(`From: ${d.issuer}`);
      if (d.date) lines.push(`Date: ${d.date}`);
    }
    return lines.join('\n');
  }

  async function dataUrlToFile(dataUrl, fileName, mimeType) {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], fileName, { type: mimeType });
  }

  async function handleShare(item) {
    const text = buildShareText(item);
    const title = getTitle(item);

    // Try native Web Share API first (works on mobile, some desktop browsers)
    if (navigator.share) {
      try {
        const shareData = { title, text };

        // Attach file if available and browser supports file sharing
        if (navigator.canShare) {
          if (item.type === 'contact') {
            const vcard = buildVCard(item.data);
            const file = new File([vcard], `${(item.data.name || 'contact').replace(/[^a-zA-Z0-9]/g, '_')}.vcf`, { type: 'text/vcard' });
            if (navigator.canShare({ files: [file] })) {
              shareData.files = [file];
            }
          } else if (item.image) {
            const mimeMatch = item.image.match(/^data:(image\/\w+);/);
            const mime = mimeMatch?.[1] || 'image/png';
            const ext = mime.split('/')[1] || 'png';
            const fileName = item.fileName || `snappy-${item.type}.${ext}`;
            const file = await dataUrlToFile(item.image, fileName, mime);
            if (navigator.canShare({ files: [file] })) {
              shareData.files = [file];
            }
          }
        }

        await navigator.share(shareData);
        return;
      } catch (err) {
        // User cancelled or share failed — fall through to menu
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback: show share menu for desktop
    setShareMenuId(shareMenuId === item.id ? null : item.id);
  }

  function handleShareEmail(item) {
    const text = buildShareText(item);
    const title = getTitle(item);
    const mailto = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text)}`;
    window.open(mailto);
    setShareMenuId(null);
  }

  function handleShareWhatsApp(item) {
    const text = buildShareText(item);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setShareMenuId(null);
  }

  async function handleCopyText(item) {
    const text = buildShareText(item);
    try {
      await navigator.clipboard.writeText(text);
      setToast({ message: 'Copied to clipboard', type: 'success' });
    } catch {
      setToast({ message: 'Failed to copy', type: 'error' });
    }
    setShareMenuId(null);
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
          <Button variant="secondary" size="small" icon={Share2} onClick={() => handleShare(item)}>
            Share
          </Button>
          <Button variant="secondary" size="small" icon={Download} onClick={() => handleExport(item)}>
            Export
          </Button>
          <button className="library__delete-btn" onClick={() => handleDelete(item.id)} aria-label="Delete">
            <Trash2 size={16} />
          </button>
        </div>
        {shareMenuId === item.id && (
          <div className="library__share-menu">
            <button className="library__share-option" onClick={() => handleShareEmail(item)}>
              <Mail size={16} />
              <span>Email</span>
            </button>
            <button className="library__share-option" onClick={() => handleShareWhatsApp(item)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.553 4.121 1.523 5.857L.058 23.706l5.991-1.573A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.82c-1.97 0-3.853-.53-5.5-1.5l-.394-.236-4.09 1.073 1.092-3.99-.258-.41A9.8 9.8 0 012.18 12c0-5.422 4.398-9.82 9.82-9.82 5.422 0 9.82 4.398 9.82 9.82 0 5.422-4.398 9.82-9.82 9.82z"/>
              </svg>
              <span>WhatsApp</span>
            </button>
            <button className="library__share-option" onClick={() => handleCopyText(item)}>
              <Copy size={16} />
              <span>Copy text</span>
            </button>
          </div>
        )}
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
