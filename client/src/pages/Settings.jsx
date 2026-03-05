import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Calendar, HardDrive, Users, Check,
  ChevronRight, Shield
} from 'lucide-react';
import Button from '../components/Common/Button';
import './Settings.css';

export default function Settings() {
  const { user, authenticated, login, logout } = useAuth();
  const navigate = useNavigate();

  const services = [
    { icon: Calendar, label: 'Calendar', desc: 'Events and reminders' },
    { icon: HardDrive, label: 'Drive', desc: 'Receipts and documents' },
    { icon: Users, label: 'Contacts', desc: 'Business cards' },
  ];

  return (
    <div className="settings">
      <h1 className="settings__heading">Settings</h1>

      {/* Profile */}
      {user && (
        <div className="settings__profile">
          <div className="settings__avatar">
            {user.picture ? (
              <img src={user.picture} alt={user.name} />
            ) : (
              <span>{user.name?.[0]}</span>
            )}
          </div>
          <div className="settings__profile-text">
            <p className="settings__name">{user.name}</p>
            <p className="settings__email">{user.email}</p>
          </div>
        </div>
      )}

      {/* Services */}
      <div className="settings__section">
        <h2 className="settings__section-label">Connected Services</h2>
        <div className="settings__group">
          {services.map(({ icon: Icon, label, desc }) => (
            <div key={label} className={`settings__row ${!authenticated ? 'settings__row--disconnected' : ''}`}>
              <div className="settings__row-icon">
                <Icon size={18} strokeWidth={1.5} />
              </div>
              <div className="settings__row-text">
                <span className="settings__row-label">{label}</span>
                <span className="settings__row-desc">{desc}</span>
              </div>
              {authenticated ? (
                <div className="settings__row-check">
                  <Check size={14} strokeWidth={2.5} />
                </div>
              ) : (
                <ChevronRight size={16} className="settings__row-chevron" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Account action */}
      <div className="settings__cta">
        {authenticated ? (
          <Button variant="ghost" fullWidth icon={LogOut} onClick={logout}>
            Disconnect Account
          </Button>
        ) : (
          <Button variant="primary" fullWidth onClick={login}>
            Connect Google Account
          </Button>
        )}
      </div>

      {/* Footer */}
      <div className="settings__footer">
        <p>Snappy v1.0</p>
        <p>
          <Shield size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '4px' }} />
          Your data is processed securely and never stored on our servers.
        </p>
        <button className="settings__privacy-link" onClick={() => navigate('/privacy')}>
          Privacy Policy
        </button>
        <button className="settings__privacy-link" onClick={() => navigate('/terms')}>
          Terms of Service
        </button>
      </div>
    </div>
  );
}
