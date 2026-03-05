import { AlertCircle } from 'lucide-react';
import './Input.css';

export default function Input({ label, error, icon: Icon, ...props }) {
  return (
    <div className={`input-group ${error ? 'input-group--error' : ''}`}>
      {label && <label className="input-group__label">{label}</label>}
      <div className="input-group__wrapper">
        {Icon && <Icon size={18} className="input-group__icon" />}
        <input className={`input-field ${Icon ? 'input-field--icon' : ''}`} {...props} />
      </div>
      {error && (
        <div className="input-group__error-row">
          <AlertCircle size={14} className="input-group__error-icon" />
          <span className="input-group__error">{error}</span>
        </div>
      )}
    </div>
  );
}

export function TextArea({ label, error, ...props }) {
  return (
    <div className={`input-group ${error ? 'input-group--error' : ''}`}>
      {label && <label className="input-group__label">{label}</label>}
      <textarea className="input-field input-field--textarea" {...props} />
      {error && (
        <div className="input-group__error-row">
          <AlertCircle size={14} className="input-group__error-icon" />
          <span className="input-group__error">{error}</span>
        </div>
      )}
    </div>
  );
}
