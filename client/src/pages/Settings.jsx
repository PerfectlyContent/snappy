import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Calendar, Check,
  Shield, Trash2, Info, ExternalLink
} from 'lucide-react';
import Button from '../components/Common/Button';
import Toast from '../components/Common/Toast';
import ConfirmModal from '../components/Common/ConfirmModal';
import './Settings.css';

export default function Settings() {
  const { user, authenticated, provider, login, logout, calendarConnected, connectCalendar } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  function handleClearLibrary() {
    try {
      const tx = indexedDB.open('snappy_library');
      tx.onsuccess = (e) => {
        const db = e.target.result;
        const store = db.transaction('items', 'readwrite').objectStore('items');
        store.clear();
        setToast({ message: 'Library cleared', type: 'success' });
      };
    } catch {
      setToast({ message: 'Could not clear library', type: 'error' });
    }
    setConfirmAction(null);
  }

  function handleClearActivity() {
    localStorage.removeItem('snappy_activity');
    localStorage.removeItem('snappy_notes');
    setToast({ message: 'Activity cleared', type: 'success' });
    setConfirmAction(null);
  }

  const services = [
    {
      icon: Calendar,
      label: 'Calendar',
      desc: calendarConnected ? 'Connected' : 'Add events and reminders',
      connected: calendarConnected,
      onConnect: provider === 'google' && !calendarConnected ? connectCalendar : null,
    },
  ];

  return (
    <div className="settings">
      {/* Profile card */}
      {user ? (
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
          <span className="settings__provider-badge">
            {provider === 'apple' ? 'Apple' : 'Google'}
          </span>
        </div>
      ) : (
        <div className="settings__profile settings__profile--guest">
          <div className="settings__avatar">
            <span>?</span>
          </div>
          <div className="settings__profile-text">
            <p className="settings__name">Not signed in</p>
            <p className="settings__email">Sign in to save and sync</p>
          </div>
        </div>
      )}

      {/* Sign in CTA when not authenticated */}
      {!authenticated && (
        <div className="settings__section">
          <Button variant="primary" fullWidth onClick={login}>
            Sign in with Google
          </Button>
          <button className="settings__apple-btn" disabled>
            <span>Sign in with Apple</span>
            <span className="settings__coming-soon">Coming Soon</span>
          </button>
        </div>
      )}

      {/* Connected Services */}
      <div className="settings__section">
        <h2 className="settings__section-label">Connected Services</h2>
        <div className="settings__group">
          {services.map(({ icon: Icon, label, desc, connected, onConnect }) => (
            <div key={label} className={`settings__row ${!connected ? 'settings__row--disconnected' : ''}`}>
              <div className="settings__row-icon">
                <Icon size={18} strokeWidth={1.5} />
              </div>
              <div className="settings__row-text">
                <span className="settings__row-label">{label}</span>
                <span className="settings__row-desc">{desc}</span>
              </div>
              {connected ? (
                <div className="settings__row-check">
                  <Check size={14} strokeWidth={2.5} />
                </div>
              ) : onConnect ? (
                <button className="settings__row-connect" onClick={onConnect}>Connect</button>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Storage & Data */}
      <div className="settings__section">
        <h2 className="settings__section-label">Storage & Data</h2>
        <div className="settings__group">
          <button className="settings__row settings__row--action" onClick={() => setConfirmAction('activity')}>
            <div className="settings__row-icon settings__row-icon--subtle">
              <Trash2 size={18} strokeWidth={1.5} />
            </div>
            <div className="settings__row-text">
              <span className="settings__row-label">Clear Activity</span>
              <span className="settings__row-desc">Remove reminders and activity history</span>
            </div>
          </button>
          <button className="settings__row settings__row--action" onClick={() => setConfirmAction('library')}>
            <div className="settings__row-icon settings__row-icon--subtle">
              <Trash2 size={18} strokeWidth={1.5} />
            </div>
            <div className="settings__row-text">
              <span className="settings__row-label">Clear Library</span>
              <span className="settings__row-desc">Delete all saved items</span>
            </div>
          </button>
        </div>
      </div>

      {/* About */}
      <div className="settings__section">
        <h2 className="settings__section-label">About</h2>
        <div className="settings__group">
          <div className="settings__row">
            <div className="settings__row-icon settings__row-icon--subtle">
              <Info size={18} strokeWidth={1.5} />
            </div>
            <div className="settings__row-text">
              <span className="settings__row-label">Version</span>
              <span className="settings__row-desc">Snappy v1.0</span>
            </div>
          </div>
          <button className="settings__row settings__row--action" onClick={() => navigate('/privacy')}>
            <div className="settings__row-icon settings__row-icon--subtle">
              <Shield size={18} strokeWidth={1.5} />
            </div>
            <div className="settings__row-text">
              <span className="settings__row-label">Privacy Policy</span>
            </div>
            <ExternalLink size={14} className="settings__row-chevron" />
          </button>
          <button className="settings__row settings__row--action" onClick={() => navigate('/terms')}>
            <div className="settings__row-icon settings__row-icon--subtle">
              <Shield size={18} strokeWidth={1.5} />
            </div>
            <div className="settings__row-text">
              <span className="settings__row-label">Terms of Service</span>
            </div>
            <ExternalLink size={14} className="settings__row-chevron" />
          </button>
        </div>
      </div>

      {/* Sign out */}
      {authenticated && (
        <div className="settings__section">
          <Button variant="ghost" fullWidth icon={LogOut} onClick={logout}>
            Sign Out
          </Button>
        </div>
      )}

      {/* Security note */}
      <div className="settings__security-note">
        <Shield size={12} />
        <span>Your data is processed securely and never stored on our servers.</span>
      </div>

      {confirmAction === 'activity' && (
        <ConfirmModal
          title="Clear Activity"
          message="This will permanently remove all your reminders and activity history. This cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleClearActivity}
          onClose={() => setConfirmAction(null)}
        />
      )}

      {confirmAction === 'library' && (
        <ConfirmModal
          title="Clear Library"
          message="This will permanently delete all saved items from your library. This cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleClearLibrary}
          onClose={() => setConfirmAction(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
