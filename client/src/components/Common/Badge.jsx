import './Badge.css';

const TYPE_CONFIG = {
  calendar: { label: 'Calendar', color: 'blue' },
  receipt: { label: 'Receipt', color: 'green' },
  contact: { label: 'Contact', color: 'purple' },
  document: { label: 'Document', color: 'orange' },
  note: { label: 'Note', color: 'yellow' },
  ticket: { label: 'Ticket', color: 'pink' },
  recipe: { label: 'Recipe', color: 'red' },
  prescription: { label: 'Prescription', color: 'teal' },
  product: { label: 'Product', color: 'indigo' },
  handwriting: { label: 'Handwriting', color: 'amber' },
  screenshot: { label: 'Screenshot', color: 'slate' },
};

export default function Badge({ type, size = 'regular' }) {
  const config = TYPE_CONFIG[type] || { label: type, color: 'gray' };

  return (
    <span className={`badge badge--${config.color} badge--${size}`}>
      {config.label}
    </span>
  );
}
