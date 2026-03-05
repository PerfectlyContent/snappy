import './Badge.css';

const TYPE_CONFIG = {
  calendar: { label: 'Calendar', color: 'blue' },
  receipt: { label: 'Receipt', color: 'green' },
  contact: { label: 'Contact', color: 'purple' },
  document: { label: 'Document', color: 'orange' },
  note: { label: 'Note', color: 'yellow' },
};

export default function Badge({ type, size = 'regular' }) {
  const config = TYPE_CONFIG[type] || { label: type, color: 'gray' };

  return (
    <span className={`badge badge--${config.color} badge--${size}`}>
      {config.label}
    </span>
  );
}
