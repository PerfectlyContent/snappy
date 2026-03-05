import './Card.css';

export default function Card({ children, className = '', hoverable, padding = 'default', ...props }) {
  return (
    <div
      className={`card card--${padding} ${hoverable ? 'card--hoverable' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
